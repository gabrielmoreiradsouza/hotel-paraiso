import { NextResponse } from 'next/server';
import { getArtaxClient, isArtaxConfigured } from '@/lib/artax';
import { isAdminAuthed } from '@/lib/admin-session';

/**
 * GET /api/sync — Fetches latest bookings from Artax and returns summary
 * Used for manual reconciliation. Protected by admin auth.
 */
export async function GET() {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!isArtaxConfigured) {
    return NextResponse.json({ error: 'Artax not configured' }, { status: 503 });
  }

  try {
    // DR-001: via ArtaxClient — rate limiter, circuit breaker e timeout compartilhados.
    const data = await getArtaxClient().listBookingsRaw({ page: 1 });
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
      const label =
        b.status !== undefined ? (statusLabels[b.status] ?? `status_${b.status}`) : 'desconhecido';
      statusCounts[label] = (statusCounts[label] ?? 0) + 1;
    }

    // Today's bookings
    const today = new Date().toISOString().slice(0, 10);
    const todayCheckins = bookings.filter((b) => b.checkin === today).length;
    const todayCheckouts = bookings.filter((b) => b.checkout === today).length;

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
