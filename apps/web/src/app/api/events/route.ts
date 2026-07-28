import { NextResponse } from 'next/server';

interface TrackingEvent {
  event: string;
  session_id: string;
  device: string;
  page_url: string;
  timestamp_ms: number;
  [key: string]: unknown;
}

// In-memory store (resets on deploy — acceptable for MVP)
const events: TrackingEvent[] = [];
const MAX_EVENTS = 10000;

export async function POST(request: Request) {
  try {
    const event = (await request.json()) as TrackingEvent;
    if (!event.event) {
      return NextResponse.json({ error: 'Missing event name' }, { status: 422 });
    }

    events.push({ ...event, timestamp_ms: Date.now() });

    // Keep only last MAX_EVENTS
    if (events.length > MAX_EVENTS) {
      events.splice(0, events.length - MAX_EVENTS);
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 422 });
  }
}

export async function GET() {
  // Require admin auth (same cookie check as bookings)
  const { cookies: getCookies } = await import('next/headers');
  const { createHmac } = await import('node:crypto');
  const adminPassword = process.env['ADMIN_PASSWORD'];
  if (!adminPassword) return NextResponse.json({ error: 'Not configured' }, { status: 503 });

  const cookieStore = await getCookies();
  const session = cookieStore.get('admin_session')?.value;
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const expected = createHmac('sha256', adminPassword).update('admin').digest('hex');
  if (session !== expected) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Return funnel stats
  const now = Date.now();
  const last24h = events.filter((e) => now - e.timestamp_ms < 86400000);
  const last7d = events.filter((e) => now - e.timestamp_ms < 7 * 86400000);

  function countByEvent(list: TrackingEvent[], name: string) {
    return list.filter((e) => e.event === name).length;
  }

  return NextResponse.json({
    total_events: events.length,
    last_24h: {
      page_views: countByEvent(last24h, 'page_view'),
      searches: countByEvent(last24h, 'search_performed'),
      availability_views: countByEvent(last24h, 'availability_viewed'),
      room_selections: countByEvent(last24h, 'room_selected'),
      checkout_starts: countByEvent(last24h, 'checkout_started'),
      reservations: countByEvent(last24h, 'reservation_created'),
      whatsapp_clicks: countByEvent(last24h, 'whatsapp_clicked'),
    },
    last_7d: {
      page_views: countByEvent(last7d, 'page_view'),
      searches: countByEvent(last7d, 'search_performed'),
      availability_views: countByEvent(last7d, 'availability_viewed'),
      room_selections: countByEvent(last7d, 'room_selected'),
      checkout_starts: countByEvent(last7d, 'checkout_started'),
      reservations: countByEvent(last7d, 'reservation_created'),
      whatsapp_clicks: countByEvent(last7d, 'whatsapp_clicked'),
    },
    unique_sessions_24h: new Set(last24h.map((e) => e.session_id)).size,
    unique_sessions_7d: new Set(last7d.map((e) => e.session_id)).size,
    devices: {
      mobile: last7d.filter((e) => e.device === 'mobile').length,
      desktop: last7d.filter((e) => e.device === 'desktop').length,
      tablet: last7d.filter((e) => e.device === 'tablet').length,
    },
  });
}
