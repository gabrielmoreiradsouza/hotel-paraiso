import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  const { locale } = await request.json();
  if (locale !== 'pt' && locale !== 'en') {
    return NextResponse.json({ error: 'Invalid locale' }, { status: 422 });
  }

  const cookieStore = await cookies();
  cookieStore.set('locale', locale, {
    maxAge: 60 * 60 * 24 * 365,
    path: '/',
  });

  return NextResponse.json({ ok: true, locale });
}
