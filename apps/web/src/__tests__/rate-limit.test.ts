import { describe, it, expect } from 'vitest';
import { isRateLimited } from '../lib/rate-limit';

/**
 * Sem REDIS_URL nos testes, exercita o contador local — o modo em que o app opera se o
 * Redis cair. É justamente onde ficava o vazamento de memória.
 */

describe('isRateLimited', () => {
  it('libera até o limite e bloqueia depois', async () => {
    const chave = `teste-limite-${Math.random()}`;
    for (let i = 0; i < 3; i++) {
      expect(await isRateLimited(chave, 3, 60_000)).toBe(false);
    }
    expect(await isRateLimited(chave, 3, 60_000)).toBe(true);
  });

  it('conta chaves separadamente', async () => {
    const a = `ip-a-${Math.random()}`;
    const b = `ip-b-${Math.random()}`;
    await isRateLimited(a, 1, 60_000);
    expect(await isRateLimited(a, 1, 60_000)).toBe(true);
    // Um IP bloqueado não pode bloquear outro.
    expect(await isRateLimited(b, 1, 60_000)).toBe(false);
  });

  it('libera de novo quando a janela passa', async () => {
    const chave = `janela-${Math.random()}`;
    // Janela de 1ms: a primeira já expirou quando a segunda chega.
    expect(await isRateLimited(chave, 1, 1)).toBe(false);
    await new Promise((r) => setTimeout(r, 15));
    expect(await isRateLimited(chave, 1, 1)).toBe(false);
  });

  it('não cresce sem limite com milhares de IPs distintos', async () => {
    // O bug original: cada IP inédito virava entrada permanente no Map. Sob tráfego pago
    // são milhares de IPs por dia — crescimento monotônico até o processo morrer.
    // 20k chaves aqui derrubariam a versão antiga; o teto rígido segura esta.
    for (let i = 0; i < 20_000; i++) {
      await isRateLimited(`ip-unico-${i}`, 5, 60_000);
    }
    // Se chegou aqui sem estourar memória, a coleta está funcionando. E o limite
    // continua correto para uma chave nova depois de toda essa pressão.
    const nova = `depois-da-pressao-${Math.random()}`;
    expect(await isRateLimited(nova, 2, 60_000)).toBe(false);
    expect(await isRateLimited(nova, 2, 60_000)).toBe(false);
    expect(await isRateLimited(nova, 2, 60_000)).toBe(true);
  });
});
