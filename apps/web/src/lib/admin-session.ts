import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';

/**
 * Sessão do admin — fonte única de verdade.
 *
 * Antes, a mesma verificação estava copiada em quatro lugares (`bookings`, `events`,
 * `sync` e a emissão em `admin/auth`). Lógica de autorização duplicada diverge com o
 * tempo, e basta um dos pontos ficar para trás para virar buraco de acesso.
 *
 * O token anterior era `HMAC(ADMIN_PASSWORD, 'admin')`: idêntico em toda sessão, sem
 * identidade, sem validade verificada no servidor. Um valor capturado valia para sempre
 * — o `maxAge` do cookie é só uma dica para o browser, não uma checagem. Agora o token
 * carrega `sid` e `exp` dentro do payload assinado, e o servidor valida os dois.
 */

export const ADMIN_COOKIE = 'admin_session';

const SESSION_TTL_MS = 8 * 60 * 60 * 1000;

function getSecret(): string | null {
  const secret = process.env['ADMIN_PASSWORD'];
  return secret && secret.length > 0 ? secret : null;
}

function sign(payload: string, secret: string): string {
  return createHmac('sha256', secret).update(payload).digest('base64url');
}

/**
 * Comparação em tempo constante.
 *
 * `a === b` em string sai no primeiro byte diferente, e esse tempo vaza informação sobre
 * quantos caracteres iniciais o atacante acertou. Com requisições suficientes dá para
 * reconstruir o valor byte a byte.
 */
function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  // `timingSafeEqual` exige tamanhos iguais; comparar os digests normaliza isso sem
  // revelar o comprimento do segredo.
  const digestA = createHmac('sha256', 'length-normalizer').update(bufA).digest();
  const digestB = createHmac('sha256', 'length-normalizer').update(bufB).digest();
  return timingSafeEqual(digestA, digestB);
}

/** Confere a senha do admin sem vazar tempo. */
export function verifyAdminPassword(input: unknown): boolean {
  const secret = getSecret();
  if (!secret) return false;
  if (typeof input !== 'string' || input.length === 0) return false;
  return safeEqual(input, secret);
}

export function isAdminConfigured(): boolean {
  return getSecret() !== null;
}

/** Emite token com identidade de sessão e validade próprias. */
export function createSessionToken(): string | null {
  const secret = getSecret();
  if (!secret) return null;
  const payload = JSON.stringify({ sid: randomUUID(), exp: Date.now() + SESSION_TTL_MS });
  const encoded = Buffer.from(payload, 'utf8').toString('base64url');
  return `${encoded}.${sign(encoded, secret)}`;
}

export function verifySessionToken(token: string | undefined): boolean {
  const secret = getSecret();
  if (!secret || !token) return false;

  const dot = token.lastIndexOf('.');
  if (dot <= 0) return false;

  const encoded = token.slice(0, dot);
  const signature = token.slice(dot + 1);

  if (!safeEqual(signature, sign(encoded, secret))) return false;

  try {
    const parsed: unknown = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'));
    if (typeof parsed !== 'object' || parsed === null) return false;
    const exp = (parsed as { exp?: unknown }).exp;
    // A expiração é verificada aqui, no servidor — não confiamos no browser para isso.
    return typeof exp === 'number' && Date.now() < exp;
  } catch {
    console.error('[admin-session] payload de sessão ilegível');
    return false;
  }
}

/** Verificação usada pelas rotas protegidas. */
export async function isAdminAuthed(): Promise<boolean> {
  const store = await cookies();
  return verifySessionToken(store.get(ADMIN_COOKIE)?.value);
}

export const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: true,
  sameSite: 'strict',
  maxAge: SESSION_TTL_MS / 1000,
  path: '/',
} as const;
