import { BookingStatus } from '@hotel-paraiso/artax-client';
import { extractWhatsAppCodes } from '@hotel-paraiso/tracking';
import { getArtaxClient } from './artax';
import {
  EvolutionError,
  chatHasMessageBefore,
  fetchMessagesSince,
  isEvolutionConfigured,
} from './evolution-messages';
import { withRedis } from './redis';
import {
  PROBABLE_WINDOW_MS,
  analyzeFunnel,
  codeInMessage,
  summarizeChats,
  type FunnelBooking,
  type FunnelResult,
} from './whatsapp-funnel';
import { getWhatsAppClicks, listWhatsAppClicksSince } from './whatsapp-leads';

/**
 * Relatório do funil do WhatsApp do site (ADR-0012).
 *
 * Junta três fontes: cliques com código (Redis), histórico da instância HRP (Evolution) e
 * reservas da Artax. Nada disso é persistido aqui além do cache de 30 min do resultado,
 * que só leva os 4 últimos dígitos do telefone.
 *
 * Cota da Artax (DR-001): listagem da mais nova para a mais antiga, parando no início do
 * período; detalhe (valor) só das reservas que casaram com uma conversa.
 */

const MAX_ARTAX_PAGES = 8;
/** Teto de chamadas de detalhe (valor) por relatório — DR-001. */
const MAX_DETAILS = 25;
const MAX_KNOWN_CHAT_CHECKS = 40;
const CACHE_TTL_SECONDS = 30 * 60;

export interface WhatsAppReport extends FunnelResult {
  periodo: { de: string; ate: string; dias: number };
  completo: { evolution: boolean; artax: boolean; valores: boolean };
  gerado_em: string;
}

/** "2026-10-21 17:47:54" da Artax está no horário de Brasília. */
function parseArtaxDate(value: unknown): number {
  if (typeof value !== 'string') return NaN;
  return Date.parse(`${value.replace(' ', 'T')}-03:00`);
}

function phonesOf(booking: Record<string, unknown>): string[] {
  // Formato interno de `phones` não é documentado: pega qualquer sequência longa de dígitos.
  const raw = JSON.stringify([booking['holder_guest'], booking['guests']]);
  return [...raw.matchAll(/\+?\d[\d\s().-]{8,}\d/g)]
    .map((m) => m[0].replace(/\D/g, ''))
    .filter((d) => d.length >= 10);
}

async function scanArtaxBookings(
  sinceMs: number
): Promise<{ bookings: FunnelBooking[]; complete: boolean }> {
  const client = getArtaxClient();
  const bookings: FunnelBooking[] = [];

  for (let page = 1; page <= MAX_ARTAX_PAGES; page++) {
    const data = await client.listBookingsRaw({ page });
    const rows = (data.bookings ?? []) as Array<Record<string, unknown>>;
    if (rows.length === 0) return { bookings, complete: true };

    let reachedOlder = false;
    for (const row of rows) {
      const createdAt = parseArtaxDate(row['created']);
      if (!Number.isFinite(createdAt)) continue;
      if (createdAt < sinceMs) {
        reachedOlder = true;
        continue;
      }
      if (row['status'] === BookingStatus.CANCELLED) continue;
      bookings.push({
        booking_id: Number(row['booking_id']),
        createdAt,
        phones: phonesOf(row),
        codes: extractWhatsAppCodes(typeof row['comment'] === 'string' ? row['comment'] : ''),
        value: null,
      });
    }

    const totalPages = (data as { total_pages?: number }).total_pages;
    if (reachedOlder || (totalPages !== undefined && page >= totalPages)) {
      return { bookings, complete: true };
    }
  }
  return { bookings, complete: false };
}

async function bookingValue(bookingId: number): Promise<number | null> {
  try {
    const detail = (await getArtaxClient().getBooking(bookingId)) as {
      total_reservation?: unknown;
    };
    const total = Number(detail.total_reservation);
    return Number.isFinite(total) ? total : null;
  } catch (err) {
    console.error(`[whatsapp-report] detalhe da reserva ${bookingId} falhou:`, err);
    return null;
  }
}

const inflight = new Map<number, Promise<WhatsAppReport>>();

/**
 * Uma geração por vez por período: dois admins abrindo o relatório com cache frio não
 * podem dobrar a leitura da Evolution e da Artax.
 */
export function buildWhatsAppReport(days: number): Promise<WhatsAppReport> {
  const running = inflight.get(days);
  if (running) return running;
  const job = generate(days).finally(() => inflight.delete(days));
  inflight.set(days, job);
  return job;
}

async function generate(days: number): Promise<WhatsAppReport> {
  const cacheKey = `wa:report:v2:${days}`;
  const cached = await withRedis(async (redis) => redis.get(cacheKey), null as string | null);
  if (cached) {
    try {
      return JSON.parse(cached) as WhatsAppReport;
    } catch (err) {
      console.warn('[whatsapp-report] cache ilegível, recalculando:', err);
    }
  }

  if (!isEvolutionConfigured) throw new EvolutionError('EVOLUTION_API_KEY ausente');

  const now = Date.now();
  const sinceMs = now - days * 86_400_000;

  const [clicks, evo, artax] = await Promise.all([
    listWhatsAppClicksSince(sinceMs),
    fetchMessagesSince(sinceMs),
    scanArtaxBookings(sinceMs),
  ]);

  // Códigos citados podem ser de cliques anteriores ao período.
  const citedCodes = [
    ...new Set(
      evo.messages
        .filter((m) => !m.fromMe)
        .map((m) => codeInMessage(m.text))
        .filter((c): c is string => c !== null)
    ),
  ];
  const clicksByCode = await getWhatsAppClicks(citedCodes);

  // "Número novo": só checa os chats que poderiam virar "provável site".
  const clickTimes = clicks.map((c) => Date.parse(c.at));
  const candidates = summarizeChats(evo.messages).filter(
    (c) =>
      !c.code &&
      clickTimes.some((t) => {
        const delta = c.firstInbound.at - t;
        return delta >= 0 && delta <= PROBABLE_WINDOW_MS;
      })
  );
  const knownChats = new Set<string>();
  for (const chat of candidates.slice(0, MAX_KNOWN_CHAT_CHECKS)) {
    try {
      if (await chatHasMessageBefore(chat.chat, sinceMs)) knownChats.add(chat.chat);
    } catch (err) {
      // Na dúvida, não conta como site: melhor subestimar que inflar o funil.
      console.error('[whatsapp-report] histórico do chat indisponível:', err);
      knownChats.add(chat.chat);
    }
  }
  for (const chat of candidates.slice(MAX_KNOWN_CHAT_CHECKS)) knownChats.add(chat.chat);

  const input = { clicks, clicksByCode, messages: evo.messages, knownChats };
  const firstPass = analyzeFunnel({ ...input, bookings: artax.bookings });

  // Valor só das reservas que casaram — poupa a cota da Artax.
  const matchedIds = firstPass.conversas
    .map((c) => c.booking_id)
    .filter((id): id is number => id !== null);
  const values = new Map<number, number | null>();
  for (const id of matchedIds.slice(0, MAX_DETAILS)) values.set(id, await bookingValue(id));
  const bookings = artax.bookings.map((b) => ({ ...b, value: values.get(b.booking_id) ?? null }));

  const result = analyzeFunnel({ ...input, bookings });
  const report: WhatsAppReport = {
    periodo: { de: new Date(sinceMs).toISOString(), ate: new Date(now).toISOString(), dias: days },
    ...result,
    completo: {
      evolution: evo.complete,
      artax: artax.complete,
      valores: matchedIds.length <= MAX_DETAILS,
    },
    gerado_em: new Date(now).toISOString(),
  };

  await withRedis(async (redis) => {
    await redis.set(cacheKey, JSON.stringify(report), 'EX', CACHE_TTL_SECONDS);
  }, undefined);

  return report;
}
