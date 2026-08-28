import { describe, it, expect } from 'vitest';
import { acquire, buildIdempotencyKey, commit, release } from '../lib/idempotency';

/**
 * Roda sem REDIS_URL, exercitando o fallback em memória de propósito: é exatamente o modo
 * em que o app opera até o Redis ser provisionado no Easypanel. Um fallback nunca testado
 * é uma suposição, não uma proteção.
 */

const payload = {
  guestEmail: 'hospede@exemplo.com',
  checkin: '2026-09-10',
  checkout: '2026-09-12',
  categoryId: 42,
  rateplanId: 7,
};

describe('buildIdempotencyKey', () => {
  it('usa o header quando o cliente envia', () => {
    const a = buildIdempotencyKey('chave-do-cliente', payload);
    const b = buildIdempotencyKey('chave-do-cliente', payload);
    expect(a).toBe(b);
    expect(a).toContain('idem:hdr:');
  });

  it('cai na impressão digital do payload quando não há header', () => {
    const key = buildIdempotencyKey(null, payload);
    expect(key).toContain('idem:fp:');
    // Mesmo clique repetido → mesma chave, mesmo sem header.
    expect(buildIdempotencyKey(null, payload)).toBe(key);
  });

  it('distingue reservas diferentes', () => {
    const outraData = buildIdempotencyKey(null, { ...payload, checkin: '2026-10-01' });
    expect(outraData).not.toBe(buildIdempotencyKey(null, payload));
  });

  it('não vaza o e-mail do hóspede na chave', () => {
    expect(buildIdempotencyKey(null, payload)).not.toContain('hospede@exemplo.com');
  });
});

describe('ciclo de idempotência (modo degradado, sem Redis)', () => {
  it('a primeira tentativa assume a chave', async () => {
    const key = buildIdempotencyKey('primeira', payload);
    expect((await acquire(key)).status).toBe('acquired');
  });

  it('o segundo clique durante a criação recebe in_progress', async () => {
    const key = buildIdempotencyKey('em-voo', payload);
    await acquire(key);
    // Segundo clique chega antes da Artax responder — a janela perigosa.
    expect((await acquire(key)).status).toBe('in_progress');
  });

  it('depois de confirmada, repetição devolve a MESMA reserva', async () => {
    const key = buildIdempotencyKey('confirmada', payload);
    await acquire(key);
    await commit(key, { success: true, booking_id: '12345' });

    const replay = await acquire(key);
    expect(replay.status).toBe('replayed');
    if (replay.status === 'replayed') {
      expect(replay.result).toEqual({ success: true, booking_id: '12345' });
    }
  });

  it('após falha, a chave é liberada para nova tentativa', async () => {
    const key = buildIdempotencyKey('falhou', payload);
    await acquire(key);
    await release(key);
    // Sem o release, o hóspede ficaria travado até o marcador expirar.
    expect((await acquire(key)).status).toBe('acquired');
  });
});
