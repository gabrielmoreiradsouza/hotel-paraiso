import { NextResponse, type NextRequest } from 'next/server';
import {
  AB_COOKIE,
  AB_MAX_AGE_SECONDS,
  isAbVariant,
  type AbVariant,
} from '@hotel-paraiso/tracking';

/**
 * Teste A/B da página inicial (ADR-0013).
 *
 * Sorteio 50/50 por visitante na primeira visita, guardado em cookie por 30 dias. A
 * variante B é servida por rewrite para `/variante-b` — a URL continua `/` (anúncios,
 * UTMs e gclid intactos) e as duas páginas seguem estáticas, sem cookie no render e sem
 * piscar conteúdo no cliente.
 *
 * Fica na raiz de `apps/web` (não em `src/`): como existe `pages/_error.tsx` na raiz, é
 * ali que o Next procura o middleware — em `src/` ele é ignorado em silêncio.
 *
 * Robôs de busca sempre veem a A e não recebem cookie: indexação estável e fora da conta
 * do teste.
 */

const BOT_UA =
  /bot|crawl|spider|slurp|facebookexternalhit|whatsapp|preview|lighthouse|headless|pagespeed/i;

function draw(): AbVariant {
  const [byte = 0] = crypto.getRandomValues(new Uint8Array(1));
  return byte < 128 ? 'A' : 'B';
}

export function middleware(request: NextRequest) {
  const ua = request.headers.get('user-agent') ?? '';
  if (BOT_UA.test(ua)) return NextResponse.next();

  const current = request.cookies.get(AB_COOKIE)?.value;
  const variant = isAbVariant(current) ? current : draw();

  const response =
    variant === 'B'
      ? NextResponse.rewrite(new URL('/variante-b', request.url))
      : NextResponse.next();

  if (current !== variant) {
    response.cookies.set(AB_COOKIE, variant, {
      maxAge: AB_MAX_AGE_SECONDS,
      path: '/',
      sameSite: 'lax',
      secure: request.nextUrl.protocol === 'https:',
    });
  }
  return response;
}

export const config = {
  matcher: ['/'],
};
