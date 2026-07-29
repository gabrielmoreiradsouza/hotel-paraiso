import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createHmac } from 'node:crypto';
import { isRateLimited } from '@/lib/rate-limit';
import { trackServerPurchase } from '@/lib/server-tracking';

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

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

async function isAdminAuthed(): Promise<boolean> {
  const adminPassword = process.env['ADMIN_PASSWORD'];
  if (!adminPassword) return false;
  const cookieStore = await cookies();
  const session = cookieStore.get('admin_session')?.value;
  if (!session) return false;
  const expected = createHmac('sha256', adminPassword).update('admin').digest('hex');
  return session === expected;
}

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
        <h1>Olá, ${escapeHtml(guestName)}!</h1>
        <p>Sua reserva foi registrada com sucesso.</p>
        <p><strong>Protocolo:</strong> ${escapeHtml(bookingId)}</p>
        <p><strong>Check-in:</strong> ${escapeHtml(checkin)}</p>
        <p><strong>Check-out:</strong> ${escapeHtml(checkout)}</p>
        <p>Para dúvidas, ligue (31) 3881-8049 ou fale pelo WhatsApp.</p>
        <p>Atenciosamente,<br>Hotel e Restaurante Paraíso</p>
      `,
    }),
  }).catch((err) => console.error('Email error:', err));
}

export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for') ?? 'unknown';
  if (isRateLimited(`booking:${ip}`, 10, 60_000)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

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
      totalPrice?: number;
    };

    if (!guestName || !guestEmail || !checkin || !checkout) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 422 });
    }

    // Validate name length
    if (guestName.length < 2 || guestName.length > 200) {
      return NextResponse.json({ error: 'Nome inválido' }, { status: 422 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(guestEmail)) {
      return NextResponse.json({ error: 'Email inválido' }, { status: 422 });
    }

    // Validate dates
    const today = new Date().toISOString().slice(0, 10);
    if (checkin < today) {
      return NextResponse.json(
        { error: 'Data de check-in não pode ser no passado' },
        { status: 422 }
      );
    }
    if (checkout <= checkin) {
      return NextResponse.json({ error: 'Check-out deve ser após check-in' }, { status: 422 });
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

        // Server-side tracking — GA4 MP + Meta CAPI (fire and forget)
        const ua = request.headers.get('user-agent');
        const ip = request.headers.get('x-forwarded-for');
        trackServerPurchase({
          bookingId: bid,
          value: body.totalPrice ?? 0,
          guestEmail,
          ...(guestPhone != null && { guestPhone }),
          ...(ua != null && { userAgent: ua }),
          ...(ip != null && { clientIp: ip }),
        });

        return NextResponse.json({ success: true, booking_id: bid, source: 'artax' });
      }

      const errorText = await artaxResponse.text();
      console.error('Artax booking failed:', errorText);
      return NextResponse.json(
        {
          error: 'Não foi possível completar a reserva. Tente novamente ou ligue (31) 3881-8049.',
          details: errorText,
        },
        { status: 422 }
      );
    }

    // Fallback: accept locally + send email (only when Artax not configured)
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
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

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
