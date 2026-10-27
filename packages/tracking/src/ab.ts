/**
 * Teste A/B da página inicial (ADR-0013).
 *
 * O sorteio acontece no Worker do Cloudflare (`apps/web/edge/ab-home-worker.js`), na primeira
 * visita, e fica no cookie `hp_ab` por 30 dias — a mesma pessoa sempre vê a mesma variante. O cookie não é
 * httpOnly de propósito: o tracking do browser precisa ler a variante para mandá-la em
 * todo evento (GA4, dataLayer e /api/events).
 */
export const AB_COOKIE = 'hp_ab';
export const AB_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;

export type AbVariant = 'A' | 'B';

export function isAbVariant(value: unknown): value is AbVariant {
  return value === 'A' || value === 'B';
}

/** Lê a variante de um header `Cookie` (servidor) ou de `document.cookie` (browser). */
export function readAbVariant(cookieHeader: string | null | undefined): AbVariant | null {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(/(?:^|;\s*)hp_ab=([^;]*)/);
  const value = match?.[1];
  return isAbVariant(value) ? value : null;
}

export function getAbVariant(): AbVariant | null {
  if (typeof document === 'undefined') return null;
  return readAbVariant(document.cookie);
}
