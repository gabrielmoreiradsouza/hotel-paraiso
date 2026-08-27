import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createHmac } from 'node:crypto';
import { isRateLimited } from '@/lib/rate-limit';
import { trackServerPurchase } from '@/lib/server-tracking';

const ARTAX_URL = 'https://artaxnet.com/pms-api/v1';
const CLIENT_ID = process.env['ARTAX_CLIENT_ID'] ?? '';
const CLIENT_SECRET = process.env['ARTAX_CLIENT_SECRET'] ?? '';

const EVOLUTION_URL = 'https://evolution.moreirads.cloud';
const EVOLUTION_INSTANCE = 'HRP';
const EVOLUTION_TOKEN = process.env['EVOLUTION_API_KEY'] ?? '';
const HOTEL_WHATSAPP = '553138818049';

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

function sendEvolutionMessage(phone: string, text: string) {
  if (!EVOLUTION_TOKEN) return;
  const number = phone.replace(/\D/g, '');
  if (!number) return;

  fetch(`${EVOLUTION_URL}/message/sendText/${EVOLUTION_INSTANCE}`, {
    method: 'POST',
    headers: {
      apikey: EVOLUTION_TOKEN,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ number, text }),
  }).catch((err) => console.error('Evolution WhatsApp error:', err));
}

function formatDateBR(dateStr: string): string {
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

function sendWhatsAppConfirmation(
  guestName: string,
  guestPhone: string | undefined,
  checkin: string,
  checkout: string,
  bookingId: string,
  notes?: string
) {
  // Mensagem pro hóspede (se tiver telefone)
  if (guestPhone) {
    const guestMsg = [
      `✅ *Reserva Confirmada — Hotel Paraíso*`,
      ``,
      `Olá, *${guestName}*! Sua reserva foi registrada com sucesso.`,
      ``,
      `📋 *Protocolo:* #HP-${bookingId}`,
      `📅 *Check-in:* ${formatDateBR(checkin)} (a partir das 14h)`,
      `📅 *Check-out:* ${formatDateBR(checkout)} (até 12h)`,
      ...(notes ? [`📝 *Observação:* ${notes}`] : []),
      ``,
      `📍 R. Pe. José Alvarenga, 50, Paraíso — Ponte Nova/MG`,
      `📞 (31) 3881-8049`,
      ``,
      `Cancelamento gratuito até 48h antes do check-in.`,
      ``,
      `Aguardamos você! 🏨`,
    ].join('\n');
    sendEvolutionMessage(guestPhone, guestMsg);
  }

  // Mensagem pro hotel (alerta de nova reserva)
  const hotelMsg = [
    `🔔 *Nova Reserva pelo Site*`,
    ``,
    `👤 *Hóspede:* ${guestName}`,
    ...(guestPhone ? [`📱 *Telefone:* ${guestPhone}`] : []),
    `📋 *Protocolo:* #HP-${bookingId}`,
    `📅 *Check-in:* ${formatDateBR(checkin)}`,
    `📅 *Check-out:* ${formatDateBR(checkout)}`,
    ...(notes ? [`📝 *Obs:* ${notes}`] : []),
    ``,
    `Reserva criada via hotelparaiso.moreirads.cloud`,
  ].join('\n');
  sendEvolutionMessage(HOTEL_WHATSAPP, hotelMsg);
}

function sendConfirmationEmail(
  guestName: string,
  guestEmail: string,
  checkin: string,
  checkout: string,
  bookingId: string,
  notes?: string
) {
  const resendKey = process.env['RESEND_API_KEY'];
  if (!resendKey || !guestEmail) return;

  const notesHtml = notes ? `<p><strong>Observação:</strong> ${escapeHtml(notes)}</p>` : '';

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
        ${notesHtml}
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
      notes: rawNotes,
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
      notes?: unknown;
    };

    // Sanitise notes: must be a string, max 500 chars, or discard
    const notes = typeof rawNotes === 'string' ? rawNotes.slice(0, 500) : undefined;

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

    // Create booking in Artax if credentials + category info available
    if (CLIENT_ID && CLIENT_SECRET && categoryId && rateplanId) {
      try {
        const nameParts = guestName.trim().split(' ');
        const firstName = nameParts[0] ?? '';
        const lastName = nameParts.slice(1).join(' ') || '';
        const artaxPayload = {
          arrival_date: checkin,
          departure_date: checkout,
          rateplan_id: rateplanId,
          comment: notes
            ? `Reserva via site hotelparaiso.moreirads.cloud | ${notes}`
            : 'Reserva via site hotelparaiso.moreirads.cloud',
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
        if (!artaxResponse.ok) {
          throw new Error(`Artax: ${artaxResponse.status} ${await artaxResponse.text()}`);
        }
        const artaxData = (await artaxResponse.json()) as { booking_id: number };
        const bid = String(artaxData.booking_id);
        sendConfirmationEmail(guestName, guestEmail, checkin, checkout, bid, notes);
        sendWhatsAppConfirmation(guestName, guestPhone, checkin, checkout, bid, notes);

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
      } catch (error) {
        console.error('Artax booking failed:', error);
        const details = error instanceof Error ? error.message : undefined;
        return NextResponse.json(
          {
            error: 'Não foi possível completar a reserva. Tente novamente ou ligue (31) 3881-8049.',
            ...(details && { details }),
          },
          { status: 422 }
        );
      }
    }

    // Fallback: accept locally + send email (only when Artax not configured)
    const localId = `LOCAL-${Date.now()}`;
    sendConfirmationEmail(guestName, guestEmail, checkin, checkout, localId, notes);
    sendWhatsAppConfirmation(guestName, guestPhone, checkin, checkout, localId, notes);
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

  const res = await fetch(`${ARTAX_URL}/bookings?page=${page}`, { headers: artaxHeaders });
  const data = await res.json();
  return NextResponse.json(data);
}
