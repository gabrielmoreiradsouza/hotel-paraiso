import { NextResponse } from 'next/server';

const ARTAX_URL = 'https://artaxnet.com/pms-api/v1';
const CLIENT_ID = process.env['ARTAX_CLIENT_ID'] ?? '';
const CLIENT_SECRET = process.env['ARTAX_CLIENT_SECRET'] ?? '';

const artaxHeaders = {
  ClientId: CLIENT_ID,
  ClientSecret: CLIENT_SECRET,
  Accept: 'application/json',
  'Content-Type': 'application/json',
  'User-Agent': 'HotelParaiso/1.0',
};

function sendConfirmationEmail(
  guestName: string,
  guestEmail: string,
  checkin: string,
  checkout: string,
  bookingId: string
) {
  const resendKey = process.env['RESEND_API_KEY'];
  if (!resendKey || !guestEmail) return;

  fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Hotel Paraíso <noreply@moreirads.cloud>',
      to: [guestEmail],
      subject: 'Reserva confirmada — Hotel e Restaurante Paraíso',
      html: `
        <h1>Olá, ${guestName}!</h1>
        <p>Sua reserva foi registrada com sucesso.</p>
        <p><strong>Protocolo:</strong> ${bookingId}</p>
        <p><strong>Check-in:</strong> ${checkin}</p>
        <p><strong>Check-out:</strong> ${checkout}</p>
        <p>Para dúvidas, ligue (31) 3881-8049 ou fale pelo WhatsApp.</p>
        <p>Atenciosamente,<br>Hotel e Restaurante Paraíso</p>
      `,
    }),
  }).catch((err) => console.error('Email error:', err));
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      guestName,
      guestEmail,
      guestPhone,
      checkin,
      checkout,
      categoryId,
      rateplanId,
      adults,
      kids,
    } = body as {
      guestName: string;
      guestEmail: string;
      guestPhone?: string;
      checkin: string;
      checkout: string;
      categoryId?: number;
      rateplanId?: number;
      adults?: number;
      kids?: number;
    };

    if (!guestName || !guestEmail || !checkin || !checkout) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 422 });
    }

    const nameParts = guestName.trim().split(' ');
    const firstName = nameParts[0] ?? '';
    const lastName = nameParts.slice(1).join(' ') || '';

    // Create booking in Artax if credentials + category info available
    if (CLIENT_ID && CLIENT_SECRET && categoryId && rateplanId) {
      const artaxPayload = {
        arrival_date: checkin,
        departure_date: checkout,
        rateplan_id: rateplanId,
        comment: 'Reserva via site hotelparaiso.moreirads.cloud',
        guest: {
          first_name: firstName,
          last_name: lastName,
          phone: guestPhone ?? '',
          email: guestEmail,
          type: 'guest' as const,
        },
        room_units: {
          [String(categoryId)]: {
            adults: adults ?? 2,
            kids: kids ?? 0,
            guests: [{ first_name: firstName, last_name: lastName }],
          },
        },
      };

      const artaxResponse = await fetch(`${ARTAX_URL}/booking/create`, {
        method: 'POST',
        headers: artaxHeaders,
        body: JSON.stringify(artaxPayload),
      });

      if (artaxResponse.ok) {
        const artaxData = (await artaxResponse.json()) as { booking_id: number };
        const bid = String(artaxData.booking_id);
        sendConfirmationEmail(guestName, guestEmail, checkin, checkout, bid);
        return NextResponse.json({ success: true, booking_id: bid, source: 'artax' });
      }

      const errorText = await artaxResponse.text();
      console.error('Artax booking failed:', errorText);
    }

    // Fallback: accept locally + send email
    const localId = `LOCAL-${Date.now()}`;
    sendConfirmationEmail(guestName, guestEmail, checkin, checkout, localId);
    return NextResponse.json({
      success: true,
      booking_id: localId,
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
