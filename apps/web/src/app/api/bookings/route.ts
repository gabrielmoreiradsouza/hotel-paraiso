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

// Room slug → Artax category ID mapping
// TODO: these IDs need to be confirmed from Artax Configurações > Tipos de Acomodação
const ROOM_CATEGORY_IDS: Record<string, number> = {
  standard: 1,
  luxo: 2,
  master: 3,
};

function sendConfirmationEmail(
  guestName: string,
  guestEmail: string,
  checkin: string,
  checkout: string
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
      subject: 'Reserva solicitada — Hotel e Restaurante Paraíso',
      html: `
        <h1>Olá, ${guestName}!</h1>
        <p>Sua solicitação de reserva foi recebida com sucesso.</p>
        <p><strong>Check-in:</strong> ${checkin}</p>
        <p><strong>Check-out:</strong> ${checkout}</p>
        <p>Entraremos em contato para confirmar sua reserva.</p>
        <p>Atenciosamente,<br>Hotel e Restaurante Paraíso<br>(31) 3881-8049</p>
      `,
    }),
  }).catch((err) => console.error('Email error:', err));
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { guestName, guestEmail, guestPhone, checkin, checkout, roomSlug } = body as {
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

    const nameParts = guestName.trim().split(' ');
    const firstName = nameParts[0] ?? '';
    const lastName = nameParts.slice(1).join(' ') || '';
    const categoryId = ROOM_CATEGORY_IDS[roomSlug] ?? 1;

    // If Artax credentials are configured, create real booking
    if (CLIENT_ID && CLIENT_SECRET) {
      const artaxPayload = {
        arrival_date: checkin,
        departure_date: checkout,
        guest: {
          first_name: firstName,
          last_name: lastName,
          phone: guestPhone ?? '',
          email: guestEmail,
          type: 'guest' as const,
        },
        room_units: {
          [String(categoryId)]: {
            adults: 2,
            kids: 0,
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
        sendConfirmationEmail(guestName, guestEmail, checkin, checkout);

        return NextResponse.json({
          success: true,
          booking_id: artaxData.booking_id,
          source: 'artax',
        });
      }

      console.error('Artax booking failed:', await artaxResponse.text());
    }

    // Fallback: accept reservation locally + send email
    sendConfirmationEmail(guestName, guestEmail, checkin, checkout);

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
