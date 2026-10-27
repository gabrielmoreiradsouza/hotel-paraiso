import { BookingStatus } from '@hotel-paraiso/artax-client';
import { extractWhatsAppCodes } from '@hotel-paraiso/tracking';
import { getArtaxClient } from './artax';
import {
  EvolutionError,
  chatHasMessageBefore,
  fetchMessagesSince,
  isEvolutionConfigured,
} from './evolution-messages';
import { listAttributions } from './attribution-store';
import { withRedis } from './redis';
import {
  PROBABLE_WINDOW_MS,
  analyzeFunnel,
  codeInMessage,
  summarizeChats,
  type FunnelBooking,
  type FunnelResult,
} from './whatsapp-funnel';
import { getWhatsAppClicks, isTestClick, listWhatsAppClicksSince } from './whatsapp-leads';

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

export const CANAL_PLATAFORMA = 'Plataforma (hotelparaiso.moreirads.cloud)';
export const CANAL_MOTOR_ARTAX = 'Site (motor Artax)';

export interface CanalRow {
  reservas: number;
  /** Só para plataforma e motor Artax — os demais canais não pagam chamada de detalhe. */
  valor: number | null;
}

export interface WhatsAppReport extends FunnelResult {
  periodo: { de: string; ate: string; dias: number };
  /** Todas as reservas da Artax criadas no período (não canceladas), por canal. */
  reservas_por_canal: Record<string, CanalRow>;
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

type ArtaxScanned = FunnelBooking & { provider: string };

async function scanArtaxBookings(
  sinceMs: number
): Promise<{ bookings: ArtaxScanned[]; complete: boolean }> {
  const client = getArtaxClient();
  const bookings: ArtaxScanned[] = [];

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
        provider: typeof row['provider'] === 'string' && row['provider'] ? row['provider'] : '?',
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
  const cacheKey = `wa:report:v4:${days}`;
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

  const [allClicks, evo, artax] = await Promise.all([
    listWhatsAppClicksSince(sinceMs),
    fetchMessagesSince(sinceMs),
    scanArtaxBookings(sinceMs),
  ]);
  const clicks = allClicks.filter((c) => !isTestClick(c));

  // Códigos citados podem ser de cliques anteriores ao período.
  const citedCodes = [
    ...new Set(
      evo.messages
        .filter((m) => !m.fromMe)
        .map((m) => codeInMessage(m.text))
        .filter((c): c is string => c !== null)
    ),
  ];
  const allClicksByCode = await getWhatsAppClicks(citedCodes);

  // Clique de teste sai junto com a conversa que o citou: só tirar o código faria o chat
  // reaparecer como "provável site".
  const testCodes = new Set(
    Object.values(allClicksByCode)
      .filter(isTestClick)
      .map((c) => c.code)
  );
  const testChats = new Set(
    evo.messages
      .filter((m) => !m.fromMe && testCodes.has(codeInMessage(m.text) ?? ''))
      .map((m) => m.chat)
  );
  const messages = evo.messages.filter((m) => !testChats.has(m.chat));
  const clicksByCode = Object.fromEntries(
    Object.entries(allClicksByCode).filter(([code]) => !testCodes.has(code))
  );

  // "Número novo": só checa os chats que poderiam virar "provável site".
  const clickTimes = clicks.map((c) => Date.parse(c.at));
  const candidates = summarizeChats(messages).filter(
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

  const input = { clicks, clicksByCode, messages, knownChats };
  const firstPass = analyzeFunnel({ ...input, bookings: artax.bookings });

  // Valor só das reservas que casaram — poupa a cota da Artax.
  const matchedIds = firstPass.conversas
    .map((c) => c.booking_id)
    .filter((id): id is number => id !== null);

  // Canal: reserva criada pela plataforma tem a origem gravada no Redis (attr:{id});
  // "Site" na Artax é o motor da própria Artax (Google Hotéis / perfil do Google).
  const attrs = await listAttributions(artax.bookings.map((b) => String(b.booking_id)));
  const canalDe = (b: ArtaxScanned) =>
    attrs[String(b.booking_id)]
      ? CANAL_PLATAFORMA
      : b.provider === 'Site'
        ? CANAL_MOTOR_ARTAX
        : b.provider;
  const comValor = (b: ArtaxScanned) => {
    const canal = canalDe(b);
    return canal === CANAL_PLATAFORMA || canal === CANAL_MOTOR_ARTAX;
  };

  const detailIds = [
    ...new Set([...matchedIds, ...artax.bookings.filter(comValor).map((b) => b.booking_id)]),
  ];
  const values = new Map<number, number | null>();
  for (const id of detailIds.slice(0, MAX_DETAILS)) values.set(id, await bookingValue(id));
  const bookings = artax.bookings.map((b) => ({ ...b, value: values.get(b.booking_id) ?? null }));

  const reservas_por_canal: Record<string, CanalRow> = {};
  for (const b of bookings) {
    const canal = canalDe(b);
    const row = (reservas_por_canal[canal] ??= { reservas: 0, valor: comValor(b) ? 0 : null });
    row.reservas++;
    if (row.valor !== null) row.valor += b.value ?? 0;
  }

  const result = analyzeFunnel({ ...input, bookings });
  const report: WhatsAppReport = {
    periodo: { de: new Date(sinceMs).toISOString(), ate: new Date(now).toISOString(), dias: days },
    ...result,
    reservas_por_canal,
    completo: {
      evolution: evo.complete,
      artax: artax.complete,
      valores: detailIds.length <= MAX_DETAILS,
    },
    gerado_em: new Date(now).toISOString(),
  };

  await withRedis(async (redis) => {
    await redis.set(cacheKey, JSON.stringify(report), 'EX', CACHE_TTL_SECONDS);
  }, undefined);

  return report;
}
