import Redis from 'ioredis';

/**
 * Conexão Redis compartilhada do app web (ADR-0011).
 *
 * Princípio de degradação: Redis é infraestrutura de *proteção*, não de negócio. Se ele
 * cair, o motor de reservas continua funcionando com garantias reduzidas — quem consome
 * este módulo trata `null` como "sem store compartilhado" e usa o fallback local.
 * Recusar toda reserva do hotel porque um cache caiu seria um estrago maior que o bug
 * que o cache previne.
 */

const REDIS_URL = process.env['REDIS_URL'] ?? '';

let client: Redis | null = null;
let disabled = false;

export function getRedis(): Redis | null {
  if (disabled) return null;
  if (!REDIS_URL) {
    disabled = true;
    console.warn('[redis] REDIS_URL ausente — idempotência e funil operam em modo degradado');
    return null;
  }

  if (!client) {
    client = new Redis(REDIS_URL, {
      // Sem retry infinito: uma rota HTTP não pode ficar pendurada esperando reconexão.
      maxRetriesPerRequest: 2,
      connectTimeout: 2000,
      enableOfflineQueue: false,
      lazyConnect: false,
    });

    client.on('error', (err: Error) => {
      // ioredis reconecta sozinho; logamos sem derrubar o processo.
      console.error('[redis] erro de conexão:', err.message);
    });
  }

  return client;
}

/**
 * Executa uma operação Redis tolerando indisponibilidade.
 * Devolve `fallback` se o Redis não existir ou a operação falhar.
 */
export async function withRedis<T>(
  operation: (redis: Redis) => Promise<T>,
  fallback: T
): Promise<T> {
  const redis = getRedis();
  if (!redis) return fallback;
  try {
    return await operation(redis);
  } catch (err) {
    console.error('[redis] operação falhou, seguindo em modo degradado:', err);
    return fallback;
  }
}
