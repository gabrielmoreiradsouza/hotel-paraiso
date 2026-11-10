import { describe, it, expect, vi, afterEach } from 'vitest';
import { RateLimiter } from '../utils/rate-limiter';

/** DR-001 — a chave da Artax morre em 102 req/60s; o limitador não pode deixar passar rajada. */

afterEach(() => {
  vi.useRealTimers();
});

describe('RateLimiter', () => {
  it('chamadas simultâneas nunca passam do teto na janela', async () => {
    vi.useFakeTimers();
    const limiter = new RateLimiter(5, 1000);
    const released: number[] = [];
    const calls = Array.from({ length: 12 }, () =>
      limiter.waitIfNeeded().then(() => released.push(Date.now()))
    );

    await vi.advanceTimersByTimeAsync(0);
    expect(released).toHaveLength(5);

    // Antes da correção, todas as que esperavam acordavam juntas aqui.
    await vi.advanceTimersByTimeAsync(1200);
    expect(released.length).toBeLessThanOrEqual(10);

    await vi.advanceTimersByTimeAsync(5000);
    await Promise.all(calls);
    expect(released).toHaveLength(12);

    // Em qualquer janela de 1s, no máximo 5 liberações.
    for (const t of released) {
      expect(released.filter((x) => x >= t && x < t + 1000).length).toBeLessThanOrEqual(5);
    }
  });

  it('libera na hora enquanto há vaga', async () => {
    const limiter = new RateLimiter(3, 60_000);
    await limiter.waitIfNeeded();
    await limiter.waitIfNeeded();
    expect(limiter.inWindow).toBe(2);
  });
});
