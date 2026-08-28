import { NextResponse } from 'next/server';
import { isRateLimited } from '@/lib/rate-limit';
import { getClientIp } from '@/lib/client-ip';
import { withRedis } from '@/lib/redis';
import { isAdminAuthed } from '@/lib/admin-session';

/**
 * Eventos que representam conversão e NUNCA podem vir do browser.
 *
 * O funil devolvido no GET alimenta decisão de orçamento de campanha. Se o browser pode
 * postar `reservation_created`, qualquer um infla sua taxa de conversão e você passa a
 * decidir investimento em cima de número inventado. Esses eventos só têm origem legítima
 * no servidor, no momento em que a Artax confirma a reserva.
 */
const SERVER_ONLY_EVENTS = new Set(['reservation_created', 'purchase']);

interface TrackingEvent {
  event: string;
  session_id: string;
  device: string;
  page_url: string;
  timestamp_ms: number;
  [key: string]: unknown;
}

/**
 * Store do funil (ADR-0011).
 *
 * Era um array em memória: com mais de uma réplica cada instância via um funil diferente,
 * e todo deploy zerava o histórico. Como esses números embasam decisão de orçamento de
 * campanha, um funil por-instância é pior que nenhum — ele parece confiável.
 *
 * A lista Redis é compartilhada e sobrevive a deploy. Sem Redis, o array local continua
 * valendo em modo degradado.
 */
const EVENTS_KEY = 'funnel:events';
const MAX_EVENTS = 10000;
const EVENTS_TTL_SECONDS = 30 * 24 * 60 * 60;

const localEvents: TrackingEvent[] = [];

async function appendEvent(event: TrackingEvent): Promise<void> {
  const stored = await withRedis(async (redis) => {
    await redis
      .multi()
      .lpush(EVENTS_KEY, JSON.stringify(event))
      .ltrim(EVENTS_KEY, 0, MAX_EVENTS - 1)
      .expire(EVENTS_KEY, EVENTS_TTL_SECONDS)
      .exec();
    return true;
  }, false);

  if (stored) return;

  localEvents.push(event);
  if (localEvents.length > MAX_EVENTS) {
    localEvents.splice(0, localEvents.length - MAX_EVENTS);
  }
}

async function readEvents(): Promise<TrackingEvent[]> {
  const fromRedis = await withRedis(
    async (redis) => redis.lrange(EVENTS_KEY, 0, MAX_EVENTS - 1),
    null as string[] | null
  );

  if (!fromRedis) return localEvents;

  const parsed: TrackingEvent[] = [];
  for (const raw of fromRedis) {
    try {
      parsed.push(JSON.parse(raw) as TrackingEvent);
    } catch {
      // Entrada corrompida não pode derrubar o painel inteiro.
      continue;
    }
  }
  return parsed;
}

export async function POST(request: Request) {
  // 60 eventos/min por IP: folgado para navegação real, apertado para bot.
  const ip = getClientIp(request);
  if (await isRateLimited(`events:${ip}`, 60, 60_000)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  try {
    const event = (await request.json()) as TrackingEvent;
    if (!event.event || typeof event.event !== 'string') {
      return NextResponse.json({ error: 'Missing event name' }, { status: 422 });
    }

    if (SERVER_ONLY_EVENTS.has(event.event)) {
      console.warn(`[events] evento server-only recusado do cliente: ${event.event} (ip=${ip})`);
      return NextResponse.json({ error: 'Server-only event' }, { status: 403 });
    }

    await appendEvent({ ...event, timestamp_ms: Date.now() });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 422 });
  }
}

export async function GET() {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Return funnel stats
  const now = Date.now();
  const events = await readEvents();
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
