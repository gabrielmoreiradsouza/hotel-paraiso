import { describe, it, expect } from 'vitest';
import { readAbVariant } from '@hotel-paraiso/tracking';
import { plan, stripAbCookie } from '../../edge/ab-home-worker.js';
import { addDays, nightsBetween } from '../components/QuickBook/quickbook-utils';

/** ADR-0013 — teste A/B da home. */

const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Safari/604.1';

function request(cookie?: string, ua = UA, path = '/') {
  const headers: Record<string, string> = { 'user-agent': ua };
  if (cookie) headers['cookie'] = cookie;
  return new Request(`https://hotelparaiso.moreirads.cloud${path}`, { headers });
}

describe('readAbVariant', () => {
  it('lê só valores válidos do cookie hp_ab', () => {
    expect(readAbVariant('a=1; hp_ab=B; b=2')).toBe('B');
    expect(readAbVariant('hp_ab=A')).toBe('A');
    expect(readAbVariant('hp_ab=C')).toBeNull();
    expect(readAbVariant('xhp_ab=B')).toBeNull();
    expect(readAbVariant(null)).toBeNull();
  });
});

describe('Worker do A/B no edge', () => {
  it('mantém a variante do cookie sem regravar', () => {
    expect(plan(request('hp_ab=B'))).toMatchObject({ variant: 'B', setCookie: false });
    expect(plan(request('hp_ab=B'))?.target).toBe(
      'https://hotelparaiso.moreirads.cloud/variante-b'
    );
    expect(plan(request('hp_ab=A'))).toMatchObject({ variant: 'A', setCookie: false });
    expect(plan(request('hp_ab=A'))?.target).toBe('https://hotelparaiso.moreirads.cloud/');
  });

  it('sorteia na primeira visita e grava o cookie', () => {
    expect(plan(request(), 0)).toMatchObject({ variant: 'A', setCookie: true });
    expect(plan(request(), 255)).toMatchObject({ variant: 'B', setCookie: true });
    // Cookie inválido conta como primeira visita.
    expect(plan(request('hp_ab=C'), 200)).toMatchObject({ variant: 'B', setCookie: true });
  });

  it('preserva UTM e gclid na URL da variante B', () => {
    const res = plan(request('hp_ab=B', UA, '/?utm_source=google&gclid=abc'));
    expect(res?.target).toBe(
      'https://hotelparaiso.moreirads.cloud/variante-b?utm_source=google&gclid=abc'
    );
  });

  it('não mexe em robô, em outras páginas nem em POST', () => {
    expect(plan(request(undefined, 'Mozilla/5.0 (compatible; Googlebot/2.1)'))).toBeNull();
    expect(plan(request(undefined, UA, '/quartos'))).toBeNull();
    expect(
      plan(new Request('https://hotelparaiso.moreirads.cloud/', { method: 'POST' }))
    ).toBeNull();
  });

  it('tira só o hp_ab da subrequisição, para o cache de / ser sempre a A', () => {
    expect(stripAbCookie('a=1; hp_ab=B; b=2')).toBe('a=1; b=2');
    expect(stripAbCookie('hp_ab=B')).toBeNull();
    expect(stripAbCookie(null)).toBeNull();
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
