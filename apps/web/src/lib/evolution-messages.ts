import { z } from 'zod';

/**
 * Leitura do histórico de mensagens da instância HRP na Evolution API (ADR-0012).
 *
 * Só leitura: o funil do WhatsApp é calculado sob demanda a partir do histórico que a
 * Evolution já guarda, sem webhook novo na instância (compartilhada com o atendimento) e
 * sem persistir conversa nem telefone do nosso lado. O telefone vive só em memória
 * durante o cálculo do relatório.
 *
 * O filtro `messageTimestamp` da API é ignorado na v2.3.7 (verificado 2026-10-21): a
 * listagem vem da mais nova para a mais antiga e paramos na primeira página que já passa
 * do início do período.
 */

const EVOLUTION_URL = (
  process.env['EVOLUTION_API_URL']?.trim() || 'https://evo.moreirads.cloud'
).replace(/\/+$/, '');
const EVOLUTION_INSTANCE = 'HRP';
const EVOLUTION_TOKEN = process.env['EVOLUTION_API_KEY'] ?? '';

const PAGE_SIZE = 500;
const MAX_PAGES = 24;
const TIMEOUT_MS = 20_000;

export const isEvolutionConfigured = Boolean(EVOLUTION_TOKEN);

export interface WaMessage {
  /** Identificador da conversa (LID ou JID). Nunca exibido. */
  chat: string;
  /** Só dígitos, quando a Evolution expõe o número (remoteJidAlt). */
  phone: string | null;
  fromMe: boolean;
  /** epoch ms */
  at: number;
  text: string;
}

const TextHolder = z.object({ text: z.string().optional(), caption: z.string().optional() });

const RecordSchema = z.object({
  key: z
    .object({
      fromMe: z.boolean().optional(),
      remoteJid: z.string().optional(),
      remoteJidAlt: z.string().nullable().optional(),
    })
    .optional(),
  message: z
    .object({
      conversation: z.string().optional(),
      extendedTextMessage: TextHolder.optional().catch(undefined),
      imageMessage: TextHolder.optional().catch(undefined),
      videoMessage: TextHolder.optional().catch(undefined),
      documentMessage: TextHolder.optional().catch(undefined),
    })
    .nullable()
    .optional()
    .catch(null),
  messageTimestamp: z.number().optional(),
});

type RawRecord = z.infer<typeof RecordSchema>;

const PageSchema = z.object({
  messages: z.object({
    pages: z.number().optional(),
    records: z.array(z.unknown()),
  }),
});

interface Page {
  pages: number;
  records: RawRecord[];
}

function textOf(message: RawRecord['message']): string {
  if (!message) return '';
  return (
    message.conversation ??
    message.extendedTextMessage?.text ??
    message.imageMessage?.caption ??
    message.videoMessage?.caption ??
    message.documentMessage?.caption ??
    ''
  );
}

function phoneOf(jid: string | null | undefined): string | null {
  if (!jid || !jid.endsWith('@s.whatsapp.net')) return null;
  const digits = jid.split('@')[0]?.replace(/\D/g, '') ?? '';
  return digits.length >= 10 ? digits : null;
}

export function parseRecord(input: unknown): WaMessage | null {
  const parsed = RecordSchema.safeParse(input);
  if (!parsed.success) return null;
  const record = parsed.data;
  const chat = record.key?.remoteJid;
  // Grupos e status não são atendimento.
  if (!chat || chat.endsWith('@g.us') || chat === 'status@broadcast') return null;
  if (typeof record.messageTimestamp !== 'number') return null;
  return {
    chat,
    phone: phoneOf(record.key?.remoteJidAlt) ?? phoneOf(chat),
    fromMe: Boolean(record.key?.fromMe),
    at: record.messageTimestamp * 1000,
    text: textOf(record.message),
  };
}

async function fetchPage(where: Record<string, unknown>, page: number): Promise<Page> {
  const res = await fetch(`${EVOLUTION_URL}/chat/findMessages/${EVOLUTION_INSTANCE}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: EVOLUTION_TOKEN },
    body: JSON.stringify({ where, page, offset: PAGE_SIZE }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
    cache: 'no-store',
  });
  if (!res.ok) throw new EvolutionError(`findMessages HTTP ${res.status}`);
  const parsed = PageSchema.safeParse(await res.json());
  if (!parsed.success) throw new EvolutionError('findMessages: resposta em formato inesperado');
  const records = parsed.data.messages.records.flatMap((r) => {
    const ok = RecordSchema.safeParse(r);
    return ok.success ? [ok.data] : [];
  });
  return { pages: parsed.data.messages.pages ?? 1, records };
}

export class EvolutionError extends Error {
  override name = 'EvolutionError';
}

/** Mensagens a partir de `sinceMs`, em ordem cronológica. `complete=false` se bateu o teto. */
export async function fetchMessagesSince(
  sinceMs: number
): Promise<{ messages: WaMessage[]; complete: boolean }> {
  const messages: WaMessage[] = [];
  let complete = false;

  for (let page = 1; page <= MAX_PAGES; page++) {
    const { records } = await fetchPage({}, page);
    if (records.length === 0) {
      complete = true;
      break;
    }
    let reachedOlder = false;
    for (const record of records) {
      const parsed = parseRecord(record);
      if (!parsed) continue;
      if (parsed.at < sinceMs) {
        reachedOlder = true;
        continue;
      }
      messages.push(parsed);
    }
    if (reachedOlder || records.length < PAGE_SIZE) {
      complete = true;
      break;
    }
  }

  messages.sort((a, b) => a.at - b.at);
  return { messages, complete };
}

/**
 * A conversa tem mensagem anterior a `beforeMs`? Usado para saber se o número é novo.
 * A listagem vem da mais nova para a mais antiga: basta olhar a última página do chat.
 */
export async function chatHasMessageBefore(chat: string, beforeMs: number): Promise<boolean> {
  const where = { key: { remoteJid: chat } };
  const first = await fetchPage(where, 1);
  const last = first.pages > 1 ? await fetchPage(where, first.pages) : first;
  return last.records.some(
    (r) => typeof r.messageTimestamp === 'number' && r.messageTimestamp * 1000 < beforeMs
  );
}
