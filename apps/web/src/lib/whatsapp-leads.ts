import { z } from 'zod';
import { isWhatsAppCode } from '@hotel-paraiso/tracking';
import { withRedis } from './redis';

/**
 * Cliques no WhatsApp com código de rastreio (ADR-0012).
 *
 * Não reaproveita a lista `funnel:events`: ela é capada em 10 mil eventos e expira em 30
 * dias, e um contato de WhatsApp pode virar reserva semanas depois. Aqui cada código tem
 * chave própria (busca direta pelo código citado na conversa) e um índice por data para o
 * relatório.
 *
 * Nada de dado pessoal: o clique não traz telefone nem nome, só origem e contexto.
 *
 * O endpoint é público, então o volume é contido em três camadas: rate limit próprio por IP
 * (na rota), teto diário global aqui e TTL. O hotel recebe dezenas de cliques por mês —
 * o teto diário é duas ordens de grandeza acima disso.
 */

const CLICK_PREFIX = 'wa:click:';
const INDEX_KEY = 'wa:clicks';
const DAILY_PREFIX = 'wa:clicks:day:';
const TTL_SECONDS = 400 * 24 * 3600;
export const MAX_CLICKS_PER_DAY = 1000;

const DATE = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .transform((v) => v.slice(0, max) || undefined)
    .optional()
    .catch(undefined);

const OrigemSchema = z
  .object({
    source: optionalText(100),
    medium: optionalText(100),
    campaign: optionalText(100),
    term: optionalText(200),
    content: optionalText(100),
    gclid: optionalText(200),
  })
  .catch({});

/** Evento `whatsapp_clicked` vindo do browser: só campos conhecidos, todos limitados. */
const ClickEventSchema = z.object({
  wa_code: z
    .string()
    .transform((v) => v.toUpperCase())
    .refine(isWhatsAppCode),
  page_url: z.string().max(2000).optional().catch(undefined),
  room_slug: optionalText(40),
  checkin: DATE.optional().catch(undefined),
  checkout: DATE.optional().catch(undefined),
  guests: z.number().int().min(1).max(20).optional().catch(undefined),
  ab_variant: optionalText(10),
  origem: OrigemSchema.nullable()
    .optional()
    .transform((v) => v ?? {}),
});

const StoredClickSchema = z.object({
  code: z.string(),
  at: z.string(),
  page: z.string(),
  room_slug: z.string().optional(),
  checkin: z.string().optional(),
  checkout: z.string().optional(),
  guests: z.number().optional(),
  ab_variant: z.string().optional(),
  origem: z.object({
    source: z.string().optional(),
    medium: z.string().optional(),
    campaign: z.string().optional(),
    term: z.string().optional(),
    content: z.string().optional(),
    gclid: z.string().optional(),
  }),
});

export type WhatsAppClick = z.infer<typeof StoredClickSchema>;

const localClicks = new Map<string, WhatsAppClick>();

function pathOf(pageUrl: string | undefined): string {
  // Só o caminho: a query pode carregar gclid e dados de formulários de terceiros.
  if (!pageUrl) return '';
  try {
    return new URL(pageUrl).pathname.slice(0, 200);
  } catch {
    return '';
  }
}

export function parseWhatsAppClick(event: unknown): WhatsAppClick | null {
  const parsed = ClickEventSchema.safeParse(event);
  if (!parsed.success) return null;
  const e = parsed.data;
  return {
    code: e.wa_code,
    at: new Date().toISOString(),
    page: pathOf(e.page_url),
    room_slug: e.room_slug,
    checkin: e.checkin,
    checkout: e.checkout,
    guests: e.guests,
    ab_variant: e.ab_variant,
    origem: e.origem,
  };
}

/**
 * SET NX + índice + contador diário numa operação só: se o processo cair no meio, o
 * clique não pode existir sem estar no índice (ficaria invisível ao relatório).
 * Retorno: 1 gravado, 0 código já existente, -1 teto diário atingido.
 */
const RECORD_SCRIPT = `
local day = tonumber(redis.call('GET', KEYS[3]) or '0')
if day >= tonumber(ARGV[4]) then return -1 end
if redis.call('SET', KEYS[1], ARGV[1], 'EX', ARGV[2], 'NX') then
  redis.call('ZADD', KEYS[2], ARGV[3], ARGV[5])
  redis.call('ZREMRANGEBYSCORE', KEYS[2], 0, tonumber(ARGV[3]) - tonumber(ARGV[2]) * 1000)
  redis.call('INCR', KEYS[3])
  redis.call('EXPIRE', KEYS[3], 172800)
  return 1
end
return 0
`;

/** Grava o clique. Código repetido (colisão ou reenvio) não sobrescreve o original. */
export async function recordWhatsAppClick(click: WhatsAppClick): Promise<void> {
  const ts = Date.parse(click.at);
  const day = click.at.slice(0, 10);

  const result = await withRedis(
    async (redis) =>
      Number(
        await redis.eval(
          RECORD_SCRIPT,
          3,
          `${CLICK_PREFIX}${click.code}`,
          INDEX_KEY,
          `${DAILY_PREFIX}${day}`,
          JSON.stringify(click),
          String(TTL_SECONDS),
          String(ts),
          String(MAX_CLICKS_PER_DAY),
          click.code
        )
      ),
    null as number | null
  );

  if (result === 0) console.warn(`[whatsapp-leads] código já existente, ignorado: ${click.code}`);
  if (result === -1) console.warn('[whatsapp-leads] teto diário de cliques atingido');
  if (result !== null) return;

  // Modo degradado (sem Redis): mesmo teto, por processo.
  if (localClicks.size >= MAX_CLICKS_PER_DAY) return;
  if (!localClicks.has(click.code)) localClicks.set(click.code, click);
}

function parseStored(raw: string, code: string): WhatsAppClick | null {
  try {
    const parsed = StoredClickSchema.safeParse(JSON.parse(raw));
    if (parsed.success) return parsed.data;
  } catch {
    // cai no aviso abaixo
  }
  console.warn(`[whatsapp-leads] registro inválido: ${code}`);
  return null;
}

/** UTM usada nos testes de ponta a ponta em produção; não entra em relatório. */
export const TEST_UTM_SOURCE = 'teste-claude';

export function isTestClick(click: WhatsAppClick): boolean {
  return click.origem.source?.toLowerCase() === TEST_UTM_SOURCE;
}

export async function getWhatsAppClicks(codes: string[]): Promise<Record<string, WhatsAppClick>> {
  const result: Record<string, WhatsAppClick> = {};
  if (codes.length === 0) return result;

  await withRedis(async (redis) => {
    const values = await redis.mget(...codes.map((c) => `${CLICK_PREFIX}${c}`));
    values.forEach((raw, i) => {
      const code = codes[i];
      if (!raw || !code) return;
      const click = parseStored(raw, code);
      if (click) result[code] = click;
    });
  }, undefined);

  for (const code of codes) {
    const local = localClicks.get(code);
    if (local && !result[code]) result[code] = local;
  }
  return result;
}

export async function listWhatsAppClicksSince(sinceMs: number): Promise<WhatsAppClick[]> {
  const codes = await withRedis(
    async (redis) => redis.zrangebyscore(INDEX_KEY, sinceMs, '+inf'),
    null as string[] | null
  );

  if (!codes) {
    return [...localClicks.values()].filter((c) => Date.parse(c.at) >= sinceMs);
  }
  return Object.values(await getWhatsAppClicks(codes));
}
