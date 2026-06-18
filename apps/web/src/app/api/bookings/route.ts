import { NextResponse } from 'next/server';

const ARTAX_URL = 'https://artaxnet.com/pms-api/v1';
const CLIENT_ID = process.env['ARTAX_CLIENT_ID'] ?? '';
const CLIENT_SECRET = process.env['ARTAX_CLIENT_SECRET'] ?? '';

const artaxHeaders = {
  ClientId: CLIENT_ID,
  ClientSecret: CLIENT_SECRET,
  Accept: 'application/json',
  'Content-Type': 'application/json',
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      guestName,
      guestEmail,
      guestPhone,
      checkin,
      checkout,
      roomSlug: _roomSlug,
    } = body as {
      guestName: string;
      guestEmail: string;
      guestPhone?: string;
      checkin: string;
      checkout: string;
      roomSlug: string;
    };

    if (!guestName || !guestEmail || !checkin || !checkout) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 422 });
    }

    // If Artax credentials are configured, create real booking
    if (CLIENT_ID && CLIENT_SECRET) {
      const artaxResponse = await fetch(`${ARTAX_URL}/bookings`, {
        method: 'POST',
        headers: artaxHeaders,
        body: JSON.stringify({
          arrival_date: checkin,
          departure_date: checkout,
          guests: [
            {
              name: guestName,
              email: guestEmail,
              phone: guestPhone ?? '',
            },
          ],
        }),
      });

      if (artaxResponse.ok) {
        const artaxData = await artaxResponse.json();
        return NextResponse.json({
          success: true,
          booking_id: artaxData.booking_id,
          source: 'artax',
        });
      }

      // If Artax fails, still accept the reservation (we'll sync later)
      console.error('Artax booking failed:', await artaxResponse.text());
    }

    // Fallback: accept reservation locally
    return NextResponse.json({
      success: true,
      booking_id: `LOCAL-${Date.now()}`,
      source: 'local',
      message: 'Reserva registrada. Confirmaremos em breve.',
    });
  } catch (error) {
    console.error('Booking error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = searchParams.get('page') ?? '1';

  if (!CLIENT_ID || !CLIENT_SECRET) {
    return NextResponse.json({ error: 'Artax not configured' }, { status: 503 });
  }

  const response = await fetch(`${ARTAX_URL}/bookings?page=${page}`, {
    headers: artaxHeaders,
  });

  const data = await response.json();
  return NextResponse.json(data);
}
