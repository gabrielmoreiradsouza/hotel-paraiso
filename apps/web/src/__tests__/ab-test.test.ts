import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';
import { readAbVariant } from '@hotel-paraiso/tracking';
import { middleware } from '../../middleware';
import { addDays, nightsBetween } from '../components/QuickBook/quickbook-utils';

/** ADR-0013 — teste A/B da home. */

const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Safari/604.1';

function request(cookie?: string, ua = UA) {
  const headers: Record<string, string> = { 'user-agent': ua };
  if (cookie) headers['cookie'] = cookie;
  return new NextRequest('https://hotelparaiso.moreirads.cloud/', { headers });
}

const rewriteOf = (res: Response) => res.headers.get('x-middleware-rewrite');

describe('readAbVariant', () => {
  it('lê só valores válidos do cookie hp_ab', () => {
    expect(readAbVariant('a=1; hp_ab=B; b=2')).toBe('B');
    expect(readAbVariant('hp_ab=A')).toBe('A');
    expect(readAbVariant('hp_ab=C')).toBeNull();
    expect(readAbVariant('xhp_ab=B')).toBeNull();
    expect(readAbVariant(null)).toBeNull();
  });
});

describe('middleware do A/B', () => {
  it('mantém a variante do cookie sem regravar', () => {
    const b = middleware(request('hp_ab=B'));
    expect(rewriteOf(b)).toContain('/variante-b');
    expect(b.headers.get('set-cookie')).toBeNull();

    const a = middleware(request('hp_ab=A'));
    expect(rewriteOf(a)).toBeNull();
    expect(a.headers.get('set-cookie')).toBeNull();
  });

  it('sorteia na primeira visita, grava 30 dias e serve a mesma variante sorteada', () => {
    const seen = new Set<string>();
    for (let i = 0; i < 200; i++) {
      const res = middleware(request());
      const cookie = res.headers.get('set-cookie') ?? '';
      const variant = readAbVariant(cookie);
      expect(variant).not.toBeNull();
      expect(cookie).toMatch(/Max-Age=2592000/i);
      expect(Boolean(rewriteOf(res))).toBe(variant === 'B');
      seen.add(variant as string);
    }
    // 200 sorteios 50/50: chance de sair só uma variante é ~1e-60.
    expect(seen).toEqual(new Set(['A', 'B']));
  });

  it('robô de busca sempre vê a A e não recebe cookie', () => {
    const res = middleware(request(undefined, 'Mozilla/5.0 (compatible; Googlebot/2.1)'));
    expect(rewriteOf(res)).toBeNull();
    expect(res.headers.get('set-cookie')).toBeNull();
  });
});

describe('datas da variante B', () => {
  it('soma dias atravessando mês e ano', () => {
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
  });

  it('conta noites e nunca devolve negativo', () => {
    expect(nightsBetween('2026-11-24', '2026-11-26')).toBe(2);
    expect(nightsBetween('2026-11-26', '2026-11-24')).toBe(0);
    expect(nightsBetween('', '2026-11-24')).toBe(0);
  });
});
