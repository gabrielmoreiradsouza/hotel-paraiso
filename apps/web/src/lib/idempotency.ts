import { createHash } from 'node:crypto';
import { getRedis } from './redis';

/**
 * Idempotência do POST /api/bookings (ADR-0011).
 *
 * Sem isto, um double-click cria duas reservas reais na Artax, dois WhatsApp para o hotel
 * e duas conversões no Google Ads. Em tráfego pago o double-click não é caso raro — é
 * comportamento comum de quem não vê feedback imediato.
 *
 * O ciclo é de duas fases porque a janela perigosa é *durante* a chamada à Artax, não
 * depois: o segundo clique chega enquanto o primeiro ainda está em voo. Marcar a chave
 * como "em andamento" antes de criar fecha essa janela.
 */

const RESULT_TTL_SECONDS = 24 * 60 * 60;
const PENDING_TTL_SECONDS = 60;
const PENDING_MARKER = '__pending__';

export type IdempotencyState =
  | { status: 'acquired' }
  | { status: 'in_progress' }
  | { status: 'replayed'; result: unknown };

/**
 * Deriva a chave de idempotência.
 *
 * Prefere o header `Idempotency-Key` enviado pelo cliente. Sem ele, cai numa impressão
 * digital do payload: mesmo hóspede, mesmas datas e mesmo quarto num intervalo curto é
 * quase certamente o mesmo clique repetido, não duas reservas legítimas. O fallback é o
 * que garante proteção mesmo para clientes que ainda não mandam o header.
 */
export function buildIdempotencyKey(
  headerValue: string | null,
  payload: {
    guestEmail: string;
    checkin: string;
    checkout: string;
    categoryId: number;
    rateplanId: number;
  }
): string {
  if (headerValue && headerValue.trim()) {
    return `idem:hdr:${createHash('sha256').update(headerValue.trim()).digest('hex').slice(0, 32)}`;
  }
  const fingerprint = [
    payload.guestEmail.toLowerCase(),
    payload.checkin,
    payload.checkout,
    payload.categoryId,
    payload.rateplanId,
  ].join('|');
  return `idem:fp:${createHash('sha256').update(fingerprint).digest('hex').slice(0, 32)}`;
}

// Fallback em memória, usado quando o Redis está indisponível. Protege o double-click
// dentro do mesmo processo — a causa mais comum — mas não entre réplicas.
const localStore = new Map<string, { value: string; expiresAt: number }>();

function localGet(key: string): string | null {
  const hit = localStore.get(key);
  if (!hit) return null;
  if (Date.now() >= hit.expiresAt) {
    localStore.delete(key);
    return null;
  }
  return hit.value;
}

function localSetIfAbsent(key: string, value: string, ttlSeconds: number): boolean {
  if (localGet(key) !== null) return false;
  // Varre expirados para o Map não crescer sem limite.
  const now = Date.now();
  for (const [k, v] of localStore) {
    if (now >= v.expiresAt) localStore.delete(k);
  }
  localStore.set(key, { value, expiresAt: now + ttlSeconds * 1000 });
  return true;
}

/**
 * Tenta assumir a chave. Se já estiver tomada, informa se a original ainda está em voo
 * ou se já terminou (e devolve o resultado guardado).
 */
export async function acquire(key: string): Promise<IdempotencyState> {
  const redis = getRedis();

  if (redis) {
    try {
      const ok = await redis.set(key, PENDING_MARKER, 'EX', PENDING_TTL_SECONDS, 'NX');
      if (ok === 'OK') return { status: 'acquired' };

      const existing = await redis.get(key);
      if (existing === null) return { status: 'acquired' };
      if (existing === PENDING_MARKER) return { status: 'in_progress' };
      return { status: 'replayed', result: JSON.parse(existing) };
    } catch (err) {
      console.error('[idempotency] Redis falhou, usando fallback local:', err);
    }
  }

  if (localSetIfAbsent(key, PENDING_MARKER, PENDING_TTL_SECONDS)) {
    return { status: 'acquired' };
  }
  const existing = localGet(key);
  if (existing === null) return { status: 'acquired' };
  if (existing === PENDING_MARKER) return { status: 'in_progress' };
  return { status: 'replayed', result: JSON.parse(existing) };
}

/** Guarda o resultado para que repetições futuras devolvam a MESMA reserva. */
export async function commit(key: string, result: unknown): Promise<void> {
  const serialized = JSON.stringify(result);
  const redis = getRedis();
  if (redis) {
    try {
      await redis.set(key, serialized, 'EX', RESULT_TTL_SECONDS);
      return;
    } catch (err) {
      console.error('[idempotency] commit no Redis falhou:', err);
    }
  }
  localStore.set(key, { value: serialized, expiresAt: Date.now() + RESULT_TTL_SECONDS * 1000 });
}

/**
 * Libera a chave após falha, para que o hóspede possa tentar de novo.
 * Sem isto, um erro transitório da Artax bloquearia a reserva por 60 segundos.
 */
export async function release(key: string): Promise<void> {
  const redis = getRedis();
  if (redis) {
    try {
      await redis.del(key);
      return;
    } catch (err) {
      console.error('[idempotency] release no Redis falhou:', err);
    }
  }
  localStore.delete(key);
}
