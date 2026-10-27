/* global crypto, URL, fetch, Headers, Response -- runtime de Workers do Cloudflare */
/**
 * Teste A/B da home no edge do Cloudflare (ADR-0013, revisão de 2026-10-27).
 *
 * Rota: `hotelparaiso.moreirads.cloud/` (só a home, caminho exato).
 *
 * Por que no edge: a regra de cache da zona força cache em `/` e apaga o `Set-Cookie` da
 * origem. Com o sorteio no middleware do Next, todo mundo recebia a variante que estivesse
 * no cache e ninguém recebia o cookie — o teste não media nada. Tirar o cache de `/` custa
 * velocidade na página de destino do tráfego pago.
 *
 * Aqui cada variante é uma URL com cache próprio na origem: A = `/`, B = `/variante-b`.
 * O Worker sorteia, busca a URL da variante (passando pelo cache da zona) e devolve o corpo
 * sem mudar a URL do navegador. O cookie é acrescentado depois do cache, então chega.
 *
 * A subrequisição vai sem o cookie `hp_ab`: a origem nunca personaliza `/` por cookie, e
 * a cópia em cache de `/` é sempre a A.
 *
 * Se este Worker sair do ar, `/` serve a A para todos — o fallback seguro.
 */

export const AB_COOKIE = 'hp_ab';
export const AB_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;
export const VARIANT_B_PATH = '/variante-b';

const BOT_UA =
  /bot|crawl|spider|slurp|facebookexternalhit|whatsapp|preview|lighthouse|headless|pagespeed/i;

export function readVariant(cookieHeader) {
  const match = (cookieHeader ?? '').match(/(?:^|;\s*)hp_ab=([^;]*)/);
  const value = match?.[1];
  return value === 'A' || value === 'B' ? value : null;
}

export function draw(random = crypto.getRandomValues(new Uint8Array(1))[0]) {
  return random < 128 ? 'A' : 'B';
}

/** Cookie sem `hp_ab`, ou null quando não sobra nada. */
export function stripAbCookie(cookieHeader) {
  if (!cookieHeader) return null;
  const rest = cookieHeader
    .split(';')
    .map((part) => part.trim())
    .filter((part) => part && !part.startsWith(`${AB_COOKIE}=`));
  return rest.length > 0 ? rest.join('; ') : null;
}

/**
 * Decide o que buscar e se grava cookie. Puro, para testar sem runtime do Cloudflare.
 * `null` = não é caso do teste (repassa a requisição como veio).
 */
export function plan(request, random) {
  const url = new URL(request.url);
  if (url.pathname !== '/') return null;
  if (request.method !== 'GET' && request.method !== 'HEAD') return null;
  if (BOT_UA.test(request.headers.get('user-agent') ?? '')) return null;

  const current = readVariant(request.headers.get('cookie'));
  const variant = current ?? draw(random);
  const target = new URL(url);
  if (variant === 'B') target.pathname = VARIANT_B_PATH;
  return { variant, target: target.toString(), setCookie: current === null };
}

export default {
  async fetch(request) {
    const decision = plan(request);
    if (!decision) return fetch(request);

    const headers = new Headers(request.headers);
    const cookie = stripAbCookie(headers.get('cookie'));
    if (cookie) headers.set('cookie', cookie);
    else headers.delete('cookie');

    const upstream = await fetch(decision.target, {
      method: request.method,
      headers,
      redirect: 'manual',
    });

    const response = new Response(upstream.body, upstream);
    // A resposta agora depende do cookie: nenhum cache depois daqui pode reaproveitá-la.
    response.headers.set('Cache-Control', 'private, no-store');
    response.headers.set('x-ab-variant', decision.variant);
    if (decision.setCookie) {
      response.headers.append(
        'Set-Cookie',
        `${AB_COOKIE}=${decision.variant}; Max-Age=${AB_MAX_AGE_SECONDS}; Path=/; Secure; SameSite=Lax`
      );
    }
    return response;
  },
};
