import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { isRateLimited } from '@/lib/rate-limit';
import { getClientIp } from '@/lib/client-ip';
import {
  ADMIN_COOKIE,
  SESSION_COOKIE_OPTIONS,
  createSessionToken,
  isAdminConfigured,
  verifyAdminPassword,
} from '@/lib/admin-session';

export async function POST(request: Request) {
  const ip = getClientIp(request);
  if (await isRateLimited(`admin-auth:${ip}`, 5, 60_000)) {
    return NextResponse.json({ error: 'Too many attempts' }, { status: 429 });
  }

  if (!isAdminConfigured()) {
    return NextResponse.json({ error: 'Admin not configured' }, { status: 503 });
  }

  let password: unknown;
  try {
    ({ password } = await request.json());
  } catch {
    console.warn(`[admin-auth] corpo inválido (ip=${ip})`);
    return NextResponse.json({ error: 'Payload inválido' }, { status: 422 });
  }

  if (!verifyAdminPassword(password)) {
    console.warn(`[admin-auth] tentativa de login falhou (ip=${ip})`);
    return NextResponse.json({ error: 'Senha incorreta' }, { status: 401 });
  }

  const token = createSessionToken();
  if (!token) {
    return NextResponse.json({ error: 'Admin not configured' }, { status: 503 });
  }

  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE, token, SESSION_COOKIE_OPTIONS);
  return NextResponse.json({ ok: true });
}
