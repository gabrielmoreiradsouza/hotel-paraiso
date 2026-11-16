import { NextResponse } from 'next/server';
import { BookingRequestSchema } from '@/lib/booking-request';
import { isAdminAuthed } from '@/lib/admin-session';
import { isRateLimited } from '@/lib/rate-limit';
import { trackServerPurchase } from '@/lib/server-tracking';
import { getArtaxClient, isArtaxConfigured } from '@/lib/artax';
import { verifyOffer } from '@/lib/availability';
import { getClientIp } from '@/lib/client-ip';
import { acquire, buildIdempotencyKey, commit, release } from '@/lib/idempotency';
import { storeAttribution, listAttributions } from '@/lib/attribution-store';
import { formatAttributionLabel, readAbVariant, type Attribution } from '@hotel-paraiso/tracking';
import {
  CHILD_MAX_AGE,
  canHost,
  describeAccommodation,
  getAccommodation,
  type Accommodation,
} from '@/lib/accommodations';
import {
  BOOKED_CATEGORY_MARKER,
  CANCELLATION_POLICY,
  CHECKIN_TIME,
  CHECKOUT_TIME,
  PAYMENT_POLICY,
} from '@/lib/booking-policy';

interface StayDetails {
  guestName: string;
  bookingId: string;
  checkin: string;
  checkout: string;
  accommodation: Accommodation;
  adults: number;
  child: boolean;
  total: number;
  notes?: string | undefined;
}

function guestsLabel(adults: number, child: boolean): string {
  const adultsText = `${adults} adulto${adults === 1 ? '' : 's'}`;
  return child ? `${adultsText} + 1 criança (até ${CHILD_MAX_AGE} anos)` : adultsText;
}

const brl = (value: number) => value.toLocaleString('pt-BR', { maximumFractionDigits: 2 });

const EVOLUTION_URL = (
  process.env['EVOLUTION_API_URL']?.trim() || 'https://evo.moreirads.cloud'
).replace(/\/+$/, '');
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
  })
    .then((res) => {
      // fetch só rejeita em erro de transporte — 401/404/5xx precisam ser logados aqui
      if (!res.ok) console.error('Evolution WhatsApp error: HTTP', res.status);
    })
    .catch((err) => {
      console.error('Evolution WhatsApp error:', err);
    });
}

function formatDateBR(dateStr: string): string {
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

function sendWhatsAppConfirmation(
  stay: StayDetails,
  guestPhone: string | undefined,
  originLabel?: string | null
) {
  const { accommodation } = stay;
  // Mensagem pro hóspede (se tiver telefone)
  if (guestPhone) {
    const guestMsg = [
      `✅ *Reserva Confirmada — Hotel Paraíso*`,
      ``,
      `Olá, *${stay.guestName}*! Sua reserva foi registrada com sucesso.`,
      ``,
      `📋 *Protocolo:* #HP-${stay.bookingId}`,
      `🛏️ *Acomodação:* ${accommodation.name} — ${describeAccommodation(accommodation)}`,
      `👥 *Hóspedes:* ${guestsLabel(stay.adults, stay.child)}`,
      `📅 *Check-in:* ${formatDateBR(stay.checkin)} (a partir das ${CHECKIN_TIME})`,
      `📅 *Check-out:* ${formatDateBR(stay.checkout)} (até ${CHECKOUT_TIME})`,
      `💰 *Total:* R$ ${brl(stay.total)}`,
      ...(accommodation.warning ? [``, `ℹ️ ${accommodation.warning}`] : []),
      ...(stay.notes ? [`📝 *Observação:* ${stay.notes}`] : []),
      ``,
      `📍 R. Pe. José Alvarenga, 50, Paraíso — Ponte Nova/MG`,
      `📞 (31) 3881-8049`,
      ``,
      `💳 ${PAYMENT_POLICY}`,
      CANCELLATION_POLICY,
      ``,
      `Aguardamos você! 🏨`,
    ].join('\n');
    sendEvolutionMessage(guestPhone, guestMsg);
  }

  // Mensagem pro hotel (alerta de nova reserva)
  const hotelMsg = [
    `🔔 *Nova Reserva pelo Site*`,
    ``,
    `👤 *Hóspede:* ${stay.guestName}`,
    ...(guestPhone ? [`📱 *Telefone:* ${guestPhone}`] : []),
    `📋 *Protocolo:* #HP-${stay.bookingId}`,
    `🛏️ *Acomodação:* ${accommodation.name} (${describeAccommodation(accommodation)})`,
    `👥 *Hóspedes:* ${guestsLabel(stay.adults, stay.child)}`,
    `📅 *Check-in:* ${formatDateBR(stay.checkin)}`,
    `📅 *Check-out:* ${formatDateBR(stay.checkout)}`,
    `💰 *Total:* R$ ${brl(stay.total)} — pagamento no hotel`,
    ...(originLabel ? [`📊 *Origem:* ${originLabel}`] : []),
    ...(stay.notes ? [`📝 *Obs:* ${stay.notes}`] : []),
    ``,
    `⚠️ Alocar em UH de *${accommodation.name}* — foi o que o hóspede escolheu e viu.`,
    `Reserva criada via hotelparaiso.moreirads.cloud`,
  ].join('\n');
  sendEvolutionMessage(HOTEL_WHATSAPP, hotelMsg);
}

function sendConfirmationEmail(stay: StayDetails, guestEmail: string) {
  const resendKey = process.env['RESEND_API_KEY'];
  if (!resendKey || !guestEmail) return;

  const { guestName, bookingId, checkin, checkout, notes, accommodation } = stay;
  const notesHtml = notes ? `<p><strong>Observação:</strong> ${escapeHtml(notes)}</p>` : '';
  const warningHtml = accommodation.warning
    ? `<p><strong>Sobre o quarto:</strong> ${escapeHtml(accommodation.warning)}</p>`
    : '';

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
        <p><strong>Acomodação:</strong> ${escapeHtml(accommodation.name)} — ${escapeHtml(describeAccommodation(accommodation))}</p>
        <p><strong>Hóspedes:</strong> ${escapeHtml(guestsLabel(stay.adults, stay.child))}</p>
        <p><strong>Check-in:</strong> ${escapeHtml(formatDateBR(checkin))} (a partir das ${CHECKIN_TIME})</p>
        <p><strong>Check-out:</strong> ${escapeHtml(formatDateBR(checkout))} (até ${CHECKOUT_TIME})</p>
        <p><strong>Total:</strong> R$ ${escapeHtml(brl(stay.total))}</p>
        ${warningHtml}
        ${notesHtml}
        <p><strong>Pagamento:</strong> ${escapeHtml(PAYMENT_POLICY)}</p>
        <p>${escapeHtml(CANCELLATION_POLICY)}</p>
        <p>📍 R. Pe. José Alvarenga, 50, Paraíso — Ponte Nova/MG</p>
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
    const parsed = BookingRequestSchema.safeParse(
      await request.json().catch((error: unknown) => {
        console.warn('[bookings] corpo não é JSON:', error);
        return null;
      })
    );
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      return NextResponse.json(
        { error: issue?.message ?? 'Dados da reserva inválidos' },
        { status: 422 }
      );
    }
    const {
      guestName,
      guestEmail,
      guestPhone,
      checkin,
      checkout,
      categoryId,
      rateplanId,
      adults: adultsNum,
      kids: kidsNum,
      notes,
      attribution: rawAttribution,
      client_id: ga4ClientId,
      session_id: ga4SessionId,
    } = parsed.data;

    const attribution = rawAttribution;

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

    // `categoryId`, `rateplanId`, `adults` e `kids` vêm do corpo do POST — são escolha
    // de quem chama, não fato verificado. Sem reconferir, dá para reservar categoria
    // indisponível, furar a ocupação, ou casar rate plan barato com categoria cara.
    // Sai quase sempre do cache de disponibilidade, então não custa cota da Artax.
    const child = kidsNum === 1;

    // A ficha do catálogo manda na ocupação (ADR-0014): a Artax aceita 3 no Duplo Solteiro
    // Luxo e não conhece a regra da criança, então a conferência dela não basta.
    const accommodation = getAccommodation(categoryId);
    if (!accommodation || !canHost(accommodation, adultsNum, child)) {
      return NextResponse.json(
        { error: 'Esta acomodação não comporta essa quantidade de hóspedes. Faça uma nova busca.' },
        { status: 409 }
      );
    }

    let offer: Awaited<ReturnType<typeof verifyOffer>>;
    try {
      // A criança não vai à Artax (ocupação total 2 nos quartos "Casal"); segue no comentário.
      offer = await verifyOffer({
        checkin,
        checkout,
        categoryId,
        rateplanId,
        adults: adultsNum,
        kids: 0,
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
      adults: adultsNum,
      kids: kidsNum,
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

      const attrLabel = attribution ? formatAttributionLabel(attribution) : null;
      const commentParts = [
        'Reserva via site hotelparaiso.moreirads.cloud',
        `${BOOKED_CATEGORY_MARKER} ${accommodation.name} (${describeAccommodation(accommodation)})`,
        `Hóspedes: ${guestsLabel(adultsNum, child)}${child ? ' — criança sem custo' : ''}`,
        'Sem cobrança antecipada: pagamento no hotel',
      ];
      if (accommodation.warning) commentParts.push('Hóspede viu o aviso de quarto compacto');
      if (attrLabel) commentParts.push(`Origem: ${attrLabel}`);
      if (notes) commentParts.push(notes);

      // DR-001: via ArtaxClient (rate limiter + circuit breaker + timeout de 5s).
      const artaxData = await getArtaxClient().createBookingRaw({
        arrival_date: checkin,
        departure_date: checkout,
        rateplan_id: offer.rateplanId,
        comment: commentParts.join(' | '),
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
            kids: 0,
            guests: [{ first_name: firstName, last_name: lastName }],
          },
        },
      });

      const bid = String(artaxData.booking_id);
      const stay: StayDetails = {
        guestName,
        bookingId: bid,
        checkin,
        checkout,
        accommodation,
        adults: adultsNum,
        child,
        total: offer.price,
        notes,
      };
      sendConfirmationEmail(stay, guestEmail);
      sendWhatsAppConfirmation(stay, guestPhone, attrLabel);

      // Teste A/B (ADR-0013): variante do cookie `hp_ab` gravada junto com a origem.
      const abVariant = readAbVariant(request.headers.get('cookie'));
      // Sem origem no browser (localStorage bloqueado/limpo), a variante ainda precisa
      // ficar registrada: grava uma origem mínima, marcada como desconhecida.
      const toStore: Attribution | null = attribution
        ? { ...attribution, ...(abVariant && { ab_variant: abVariant }) }
        : abVariant
          ? {
              source: '(desconhecida)',
              medium: '(none)',
              landing_page: '',
              first_seen: new Date().toISOString(),
              ab_variant: abVariant,
            }
          : null;
      if (toStore) {
        storeAttribution(bid, toStore, attrLabel ?? '').catch((err) => {
          console.error('[attribution] store failed:', err);
        });
      }

      // Server-side tracking — GA4 MP + Meta CAPI (fire and forget)
      const ua = request.headers.get('user-agent');
      // Reaproveita o IP já resolvido; 'unknown' não é endereço e não deve ir pro Meta.
      const trackingIp = ip === 'unknown' ? null : ip;
      trackServerPurchase({
        bookingId: bid,
        value: offer.price,
        guestEmail,
        ...(guestPhone != null && { guestPhone }),
        ...(ua != null && { userAgent: ua }),
        ...(trackingIp != null && { clientIp: trackingIp }),
        ...(ga4ClientId != null && { ga4ClientId }),
        ...(ga4SessionId != null && { ga4SessionId }),
        ...(abVariant != null && { abVariant }),
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
    const bookings = (data.bookings ?? []) as Array<{ booking_id: number; [k: string]: unknown }>;
    const ids = bookings.map((b) => String(b.booking_id));
    const attrs = ids.length > 0 ? await listAttributions(ids) : {};
    const enriched = bookings.map((b) => {
      const attr = attrs[String(b.booking_id)];
      return { ...b, attribution_label: attr?.label ?? null };
    });
    return NextResponse.json({ ...data, bookings: enriched });
  } catch (error) {
    console.error('Bookings list failed:', error);
    return NextResponse.json({ error: 'Erro ao consultar reservas' }, { status: 502 });
  }
}
