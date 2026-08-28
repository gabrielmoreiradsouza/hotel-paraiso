import { NextResponse } from 'next/server';
import { isAdminAuthed } from '@/lib/admin-session';
import { isRateLimited } from '@/lib/rate-limit';
import { trackServerPurchase } from '@/lib/server-tracking';
import { getArtaxClient, isArtaxConfigured } from '@/lib/artax';
import { verifyOffer } from '@/lib/availability';
import { getClientIp } from '@/lib/client-ip';
import { acquire, buildIdempotencyKey, commit, release } from '@/lib/idempotency';

const EVOLUTION_URL = 'https://evolution.moreirads.cloud';
const EVOLUTION_INSTANCE = 'HRP';
const EVOLUTION_TOKEN = process.env['EVOLUTION_API_KEY'] ?? '';
const HOTEL_WHATSAPP = '553138818049';

/**
 * Timeout para as integrações fire-and-forget (WhatsApp, e-mail).
 *
 * Sem `AbortSignal` um fornecedor lento segura a conexão indefinidamente; sob tráfego
 * os requests se acumulam até esgotar o pool e derrubar o processo.
 */
const SIDE_EFFECT_TIMEOUT_MS = 3000;

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
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
    signal: AbortSignal.timeout(SIDE_EFFECT_TIMEOUT_MS),
  }).catch((err) => {
    console.error('Evolution WhatsApp error:', err);
  });
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
    signal: AbortSignal.timeout(SIDE_EFFECT_TIMEOUT_MS),
  }).catch((err) => {
    console.error('Email error:', err);
  });
}

export async function POST(request: Request) {
  const ip = getClientIp(request);
  if (await isRateLimited(`booking:${ip}`, 10, 60_000)) {
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
      /** Aceito no corpo por compatibilidade com o cliente, mas ignorado: o valor de
       *  conversão é sempre derivado da disponibilidade verificada no servidor. */
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

    // Uma reserva só é confirmada se a Artax persistir. Sem isso, não há reserva:
    // responder sucesso aqui geraria e-mail e WhatsApp de confirmação para um quarto
    // que não existe no PMS (overbooking + hóspede chegando com protocolo inválido).
    if (!isArtaxConfigured) {
      console.error('Booking recusado: Artax não configurado');
      return NextResponse.json(
        {
          error: 'Reservas online indisponíveis no momento. Ligue (31) 3881-8049 para reservar.',
        },
        { status: 503 }
      );
    }

    if (!categoryId || !rateplanId) {
      return NextResponse.json(
        { error: 'Selecione um quarto disponível antes de confirmar.' },
        { status: 422 }
      );
    }

    // `categoryId`, `rateplanId`, `adults` e `kids` vêm do corpo do POST — são escolha
    // de quem chama, não fato verificado. Sem reconferir, dá para reservar categoria
    // indisponível, furar a ocupação, ou casar rate plan barato com categoria cara.
    // Sai quase sempre do cache de disponibilidade, então não custa cota da Artax.
    const adultsNum = adults ?? 2;
    const kidsNum = kids ?? 0;

    let offer: Awaited<ReturnType<typeof verifyOffer>>;
    try {
      offer = await verifyOffer({
        checkin,
        checkout,
        categoryId,
        rateplanId,
        adults: adultsNum,
        kids: kidsNum,
      });
    } catch (error) {
      console.error('Falha ao revalidar disponibilidade:', error);
      return NextResponse.json(
        { error: 'Não foi possível confirmar a disponibilidade. Tente novamente.' },
        { status: 502 }
      );
    }

    if (!offer) {
      return NextResponse.json(
        {
          error:
            'O quarto escolhido não está mais disponível para estas datas. Faça uma nova busca.',
        },
        { status: 409 }
      );
    }

    // Idempotência (ADR-0011): a janela perigosa é enquanto a chamada à Artax está em
    // voo — é aí que chega o segundo clique. A chave é tomada antes de criar.
    const idemKey = buildIdempotencyKey(request.headers.get('idempotency-key'), {
      guestEmail,
      checkin,
      checkout,
      categoryId: offer.categoryId,
      rateplanId: offer.rateplanId,
    });

    const state = await acquire(idemKey);

    if (state.status === 'replayed') {
      // Mesma reserva de antes — sem criar nada novo, sem reenviar WhatsApp nem conversão.
      return NextResponse.json(state.result);
    }

    if (state.status === 'in_progress') {
      return NextResponse.json(
        { error: 'Sua reserva já está sendo processada. Aguarde alguns segundos.' },
        { status: 409 }
      );
    }

    try {
      const nameParts = guestName.trim().split(' ');
      const firstName = nameParts[0] ?? '';
      const lastName = nameParts.slice(1).join(' ') || '';

      // DR-001: via ArtaxClient (rate limiter + circuit breaker + timeout de 5s).
      const artaxData = await getArtaxClient().createBookingRaw({
        arrival_date: checkin,
        departure_date: checkout,
        // Da oferta verificada, não do corpo do request.
        rateplan_id: offer.rateplanId,
        comment: notes
          ? `Reserva via site hotelparaiso.moreirads.cloud | ${notes}`
          : 'Reserva via site hotelparaiso.moreirads.cloud',
        guest: {
          first_name: firstName,
          last_name: lastName,
          phone: guestPhone ?? '',
          email: guestEmail,
          type: 'guest',
        },
        room_units: {
          [String(offer.categoryId)]: {
            adults: adultsNum,
            kids: kidsNum,
            guests: [{ first_name: firstName, last_name: lastName }],
          },
        },
      });

      const bid = String(artaxData.booking_id);
      sendConfirmationEmail(guestName, guestEmail, checkin, checkout, bid, notes);
      sendWhatsAppConfirmation(guestName, guestPhone, checkin, checkout, bid, notes);

      // Server-side tracking — GA4 MP + Meta CAPI (fire and forget)
      const ua = request.headers.get('user-agent');
      // Reaproveita o IP já resolvido; 'unknown' não é endereço e não deve ir pro Meta.
      const trackingIp = ip === 'unknown' ? null : ip;
      trackServerPurchase({
        bookingId: bid,
        // Preço da Artax, nunca o `totalPrice` do corpo do request: esse valor alimenta
        // GA4 e Meta, e é o que o Google Ads usa para otimizar campanha. Aceitar o número
        // do cliente deixaria qualquer um envenenar a otimização do seu orçamento.
        value: offer.price,
        guestEmail,
        ...(guestPhone != null && { guestPhone }),
        ...(ua != null && { userAgent: ua }),
        ...(trackingIp != null && { clientIp: trackingIp }),
      });

      const payload = { success: true, booking_id: bid, source: 'artax' };
      // Guarda antes de responder: se o mesmo clique voltar, recebe esta reserva de novo
      // em vez de criar outra.
      await commit(idemKey, payload);
      return NextResponse.json(payload);
    } catch (error) {
      // Loga antes de qualquer recuperação: se o `release` também falhar, o registro do
      // erro original já existe. O detalhe fica no servidor — devolver `error.message` ao
      // cliente expunha o corpo bruto da resposta da Artax a qualquer visitante anônimo.
      console.error('Artax booking failed:', error);
      // Libera a chave para o hóspede poder tentar de novo — um erro transitório da Artax
      // não pode travar a reserva pelos 60s do marcador.
      await release(idemKey);
      return NextResponse.json(
        {
          error: 'Não foi possível completar a reserva. Tente novamente ou ligue (31) 3881-8049.',
        },
        { status: 502 }
      );
    }
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
  const rawPage = Number(searchParams.get('page') ?? '1');
  const page = Number.isInteger(rawPage) && rawPage > 0 ? rawPage : 1;

  if (!isArtaxConfigured) {
    return NextResponse.json({ error: 'Artax not configured' }, { status: 503 });
  }

  try {
    const data = await getArtaxClient().listBookingsRaw({ page });
    return NextResponse.json(data);
  } catch (error) {
    console.error('Bookings list failed:', error);
    return NextResponse.json({ error: 'Erro ao consultar reservas' }, { status: 502 });
  }
}
