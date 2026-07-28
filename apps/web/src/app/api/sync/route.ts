import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createHmac } from 'node:crypto';

const ARTAX_URL = 'https://artaxnet.com/pms-api/v1';
const CLIENT_ID = process.env['ARTAX_CLIENT_ID'] ?? '';
const CLIENT_SECRET = process.env['ARTAX_CLIENT_SECRET'] ?? '';

async function isAdminAuthed(): Promise<boolean> {
  const adminPassword = process.env['ADMIN_PASSWORD'];
  if (!adminPassword) return false;
  const cookieStore = await cookies();
  const session = cookieStore.get('admin_session')?.value;
  if (!session) return false;
  const expected = createHmac('sha256', adminPassword).update('admin').digest('hex');
  return session === expected;
}

/**
 * GET /api/sync — Fetches latest bookings from Artax and returns summary
 * Used for manual reconciliation. Protected by admin auth.
 */
export async function GET() {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!CLIENT_ID || !CLIENT_SECRET) {
    return NextResponse.json({ error: 'Artax not configured' }, { status: 503 });
  }

  try {
    // Fetch latest bookings from Artax
    const response = await fetch(`${ARTAX_URL}/bookings?page=1`, {
      headers: {
        ClientId: CLIENT_ID,
        ClientSecret: CLIENT_SECRET,
        Accept: 'application/json',
        'User-Agent': 'HotelParaiso/1.0',
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Artax API error', status: response.status },
        { status: 502 }
      );
    }

    const data = await response.json();
    const bookings = data.bookings ?? [];

    // Count by status
    const statusCounts: Record<string, number> = {};
    const statusLabels: Record<number, string> = {
      1: 'pre_reserva',
      2: 'confirmado',
      3: 'hospedado',
      4: 'checkout',
      5: 'cancelado',
      6: 'no_show',
    };

    for (const b of bookings) {
      const label = statusLabels[b.status as number] ?? `status_${b.status}`;
      statusCounts[label] = (statusCounts[label] ?? 0) + 1;
    }

    // Today's bookings
    const today = new Date().toISOString().slice(0, 10);
    const todayCheckins = bookings.filter((b: { checkin: string }) => b.checkin === today).length;
    const todayCheckouts = bookings.filter(
      (b: { checkout: string }) => b.checkout === today
    ).length;

    return NextResponse.json({
      sync_time: new Date().toISOString(),
      total_bookings: data.total_bookings ?? 0,
      total_pages: data.total_pages ?? 0,
      latest_page: {
        count: bookings.length,
        status_counts: statusCounts,
      },
      today: {
        checkins: todayCheckins,
        checkouts: todayCheckouts,
      },
      status: 'ok',
    });
  } catch (error) {
    console.error('Sync error:', error);
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 });
  }
}
