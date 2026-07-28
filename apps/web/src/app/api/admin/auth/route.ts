import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createHmac } from 'node:crypto';
import { isRateLimited } from '@/lib/rate-limit';

export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for') ?? 'unknown';
  if (isRateLimited(`admin-auth:${ip}`, 5, 60_000)) {
    return NextResponse.json({ error: 'Too many attempts' }, { status: 429 });
  }

  const { password } = await request.json();
  const correct = process.env['ADMIN_PASSWORD'];
  if (!correct) {
    return NextResponse.json({ error: 'Admin not configured' }, { status: 503 });
  }

  if (password === correct) {
    const cookieStore = await cookies();
    const sessionValue = createHmac('sha256', correct).update('admin').digest('hex');
    cookieStore.set('admin_session', sessionValue, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 60 * 60 * 8, // 8 hours
      path: '/',
    });
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ error: 'Senha incorreta' }, { status: 401 });
}
