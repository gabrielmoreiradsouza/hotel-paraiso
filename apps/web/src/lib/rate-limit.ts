import { getRedis } from './redis';

/**
 * Rate limiting com janela deslizante.
 *
 * A versão anterior tinha dois defeitos sérios:
 *
 * 1. **Vazamento de memória.** O `Map` filtrava timestamps vencidos apenas quando a mesma
 *    chave voltava a ser usada, mas a chave em si nunca era removida. Cada IP inédito
 *    virava uma entrada permanente — sob tráfego pago, milhares de IPs por dia, crescimento
 *    monotônico até o processo morrer. Era o item que de fato derrubaria o site.
 *
 * 2. **Contagem por processo.** Com N réplicas o limite efetivo virava N×, porque cada
 *    instância contava sozinha.
 *
 * O Redis resolve os dois: `INCR` + `EXPIRE` é atômico e a chave desaparece sozinha.
 * Sem Redis, o fallback local mantém a proteção dentro do processo — agora com coleta de
 * lixo de verdade.
 */

interface Bucket {
  timestamps: number[];
  lastSeen: number;
}

const buckets = new Map<string, Bucket>();
const MAX_TRACKED_KEYS = 10_000;
let lastSweep = 0;
const SWEEP_INTERVAL_MS = 60_000;

/** Remove chaves ociosas. Sem isto o Map cresce para sempre. */
function sweep(now: number, windowMs: number): void {
  if (now - lastSweep < SWEEP_INTERVAL_MS) return;
  lastSweep = now;
  for (const [key, bucket] of buckets) {
    if (now - bucket.lastSeen >= windowMs) buckets.delete(key);
  }
}

function isRateLimitedLocal(key: string, maxRequests: number, windowMs: number): boolean {
  const now = Date.now();
  sweep(now, windowMs);

  const bucket = buckets.get(key) ?? { timestamps: [], lastSeen: now };
  bucket.timestamps = bucket.timestamps.filter((t) => now - t < windowMs);
  bucket.lastSeen = now;

  if (bucket.timestamps.length >= maxRequests) {
    buckets.set(key, bucket);
    return true;
  }

  bucket.timestamps.push(now);

  // Teto rígido: se a varredura não deu conta, descarta a chave mais antiga em vez de
  // deixar a memória crescer. Perder precisão é melhor que perder o processo.
  if (!buckets.has(key) && buckets.size >= MAX_TRACKED_KEYS) {
    const oldest = buckets.keys().next();
    if (!oldest.done) buckets.delete(oldest.value);
  }

  buckets.set(key, bucket);
  return false;
}

/**
 * Retorna `true` quando a chave excedeu o limite na janela.
 *
 * Em erro de Redis, cai no contador local em vez de bloquear ou liberar geral: o rate
 * limit é proteção, e proteção indisponível não pode virar indisponibilidade do site.
 */
export async function isRateLimited(
  key: string,
  maxRequests: number,
  windowMs: number
): Promise<boolean> {
  const redis = getRedis();

  if (redis) {
    try {
      const windowSeconds = Math.ceil(windowMs / 1000);
      // Janela fixa por bucket de tempo: barata e atômica, sem race entre réplicas.
      const slot = Math.floor(Date.now() / windowMs);
      const redisKey = `rl:${key}:${slot}`;
      const count = await redis.incr(redisKey);
      if (count === 1) await redis.expire(redisKey, windowSeconds + 1);
      return count > maxRequests;
    } catch (err) {
      console.error('[rate-limit] Redis falhou, usando contador local:', err);
    }
  }

  return isRateLimitedLocal(key, maxRequests, windowMs);
}
