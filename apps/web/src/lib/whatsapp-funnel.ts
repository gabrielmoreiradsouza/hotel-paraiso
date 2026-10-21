import type { WaMessage } from './evolution-messages';
import type { WhatsAppClick } from './whatsapp-leads';

/**
 * Funil do WhatsApp do site (ADR-0012) — função pura, sem I/O.
 *
 * clique no botão → conversa com código → "provável site" → oferta enviada → reserva.
 *
 * - Código: a mensagem do hóspede traz "Código: S-XXXX" (texto pré-preenchido do botão).
 * - Provável site: número novo, sem código, que escreveu até 30 min depois de um clique
 *   cujo código nunca apareceu — a pessoa apagou o texto. Cada clique explica no máximo
 *   uma conversa.
 * - Oferta: o hotel respondeu com valor, tarifa, disponibilidade ou link.
 * - Reserva: reserva na Artax com o mesmo telefone (últimos 8 dígitos, imune ao 9º dígito
 *   que o WhatsApp às vezes omite) ou com o código na observação, criada até 14 dias
 *   depois do primeiro contato.
 */

export type Origem = 'hrp_regional' | 'hrp_local' | 'google_organico' | 'direto' | 'outros';
export const ORIGENS: Origem[] = [
  'hrp_regional',
  'hrp_local',
  'google_organico',
  'direto',
  'outros',
];

const CODE_IN_MESSAGE = /C[óo]digo:\s*S-([A-HJ-NP-Z2-9]{4})/i;
const OFFER =
  /R\$\s*\d|\btarifa|\bdi[áa]ria|dispon(?:[íi]ve|ibilidade)|\bvalor(es)?\b|https?:\/\//i;
export const PROBABLE_WINDOW_MS = 30 * 60_000;
export const BOOKING_WINDOW_MS = 14 * 86_400_000;

export function origemDe(origem: WhatsAppClick['origem'] | undefined): Origem {
  if (!origem) return 'direto';
  if (origem.campaign === 'hrp_regional') return 'hrp_regional';
  if (origem.campaign === 'hrp_local') return 'hrp_local';
  if (origem.source === 'google' && origem.medium === 'organic') return 'google_organico';
  if (!origem.source || origem.source === '(direct)') return 'direto';
  return 'outros';
}

export function codeInMessage(text: string): string | null {
  return CODE_IN_MESSAGE.exec(text)?.[1]?.toUpperCase() ?? null;
}

export function isOffer(text: string): boolean {
  return OFFER.test(text);
}

const last8 = (digits: string) => digits.replace(/\D/g, '').slice(-8);

export interface FunnelBooking {
  booking_id: number;
  createdAt: number;
  /** Dígitos dos telefones do titular/hóspedes. */
  phones: string[];
  codes: string[];
  value: number | null;
}

export interface Conversation {
  kind: 'codigo' | 'provavel';
  code: string | null;
  origem: Origem;
  ab_variant: string;
  phone_last4: string | null;
  first_inbound_at: string;
  first_response_min: number | null;
  offer_sent: boolean;
  booking_id: number | null;
  booking_value: number | null;
  click_found: boolean;
}

export interface FunnelRow {
  cliques: number;
  conversas_codigo: number;
  provaveis_site: number;
  ofertas: number;
  reservas: number;
  valor: number;
}

export interface FunnelResult {
  por_origem: Record<Origem, FunnelRow>;
  por_variante: Record<string, FunnelRow>;
  total: FunnelRow;
  tempo_medio_primeira_resposta_min: number | null;
  sem_resposta: number;
  conversas: Conversation[];
}

export interface ChatSummary {
  chat: string;
  phone: string | null;
  firstInbound: WaMessage;
  code: string | null;
  firstResponseAt: number | null;
  offerSent: boolean;
}

/**
 * Quebra cada chat em conversas. Cada mensagem recebida com código abre uma conversa nova
 * (o mesmo número pode voltar pelo site semanas depois, por outra campanha); respostas e
 * ofertas só contam dentro do trecho daquela conversa. Chat sem código vira uma conversa
 * só, a partir da primeira mensagem recebida.
 */
export function summarizeChats(messages: WaMessage[]): ChatSummary[] {
  const byChat = new Map<string, WaMessage[]>();
  for (const m of messages) {
    const list = byChat.get(m.chat) ?? [];
    list.push(m);
    byChat.set(m.chat, list);
  }

  const summaries: ChatSummary[] = [];
  for (const [chat, list] of byChat) {
    list.sort((a, b) => a.at - b.at);
    const phone = list.find((m) => m.phone)?.phone ?? null;
    const starts = list
      .map((m, i) => ({ m, i, code: m.fromMe ? null : codeInMessage(m.text) }))
      .filter((s) => s.code !== null);

    if (starts.length === 0) {
      const i = list.findIndex((m) => !m.fromMe);
      const first = list[i];
      if (first) summaries.push(summarize(chat, phone, first, null, list.slice(i + 1)));
      continue;
    }

    starts.forEach((start, n) => {
      const end = starts[n + 1]?.i ?? list.length;
      summaries.push(summarize(chat, phone, start.m, start.code, list.slice(start.i + 1, end)));
    });
  }
  return summaries;
}

function summarize(
  chat: string,
  phone: string | null,
  firstInbound: WaMessage,
  code: string | null,
  rest: WaMessage[]
): ChatSummary {
  const replies = rest.filter((m) => m.fromMe);
  return {
    chat,
    phone,
    firstInbound,
    code,
    firstResponseAt: replies[0]?.at ?? null,
    offerSent: replies.some((m) => isOffer(m.text)),
  };
}

const emptyRow = (): FunnelRow => ({
  cliques: 0,
  conversas_codigo: 0,
  provaveis_site: 0,
  ofertas: 0,
  reservas: 0,
  valor: 0,
});

export function analyzeFunnel(input: {
  /** Cliques do período (para contagem e "provável site"). */
  clicks: WhatsAppClick[];
  /** Cliques buscados pelo código citado nas conversas (podem ser anteriores ao período). */
  clicksByCode: Record<string, WhatsAppClick>;
  messages: WaMessage[];
  /** Chats sem código que já tinham conversa antes do período — não são "número novo". */
  knownChats: Set<string>;
  bookings: FunnelBooking[];
}): FunnelResult {
  const chats = summarizeChats(input.messages);
  const conversations: Conversation[] = [];
  const usedClicks = new Set<string>();
  const usedBookings = new Set<number>();

  // Mesmo código reenviado (hóspede mandou duas vezes) é uma conversa só.
  const seenCodes = new Set<string>();
  const codedChats = chats
    .filter((c) => c.code)
    .sort((a, b) => a.firstInbound.at - b.firstInbound.at)
    .filter((c) => {
      if (!c.code || seenCodes.has(c.code)) return false;
      seenCodes.add(c.code);
      return true;
    });
  for (const c of codedChats) if (c.code) usedClicks.add(c.code);

  // Cliques cujo código nunca chegou: candidatos a explicar uma conversa sem código.
  const orphanClicks = input.clicks
    .filter((c) => !usedClicks.has(c.code))
    .sort((a, b) => Date.parse(a.at) - Date.parse(b.at));

  const probable: Array<{ chat: ChatSummary; click: WhatsAppClick }> = [];
  const candidates = chats
    .filter((c) => !c.code && !input.knownChats.has(c.chat))
    .sort((a, b) => a.firstInbound.at - b.firstInbound.at);
  for (const chat of candidates) {
    const click = orphanClicks.find((k) => {
      if (usedClicks.has(k.code)) return false;
      const delta = chat.firstInbound.at - Date.parse(k.at);
      return delta >= 0 && delta <= PROBABLE_WINDOW_MS;
    });
    if (!click) continue;
    usedClicks.add(click.code);
    probable.push({ chat, click });
  }

  /** Código na observação vence telefone; entre iguais, a primeira reserva após o contato. */
  function matchBooking(chat: ChatSummary, code: string | null): FunnelBooking | null {
    const phone = chat.phone ? last8(chat.phone) : null;
    const from = chat.firstInbound.at;
    const inWindow = input.bookings
      .filter(
        (b) =>
          !usedBookings.has(b.booking_id) &&
          b.createdAt >= from &&
          b.createdAt <= from + BOOKING_WINDOW_MS
      )
      .sort((a, b) => a.createdAt - b.createdAt);
    const byCode = code ? inWindow.find((b) => b.codes.includes(code)) : undefined;
    if (byCode) return byCode;
    if (!phone || phone.length !== 8) return null;
    return inWindow.find((b) => b.phones.some((p) => last8(p) === phone)) ?? null;
  }

  function toConversation(
    chat: ChatSummary,
    kind: Conversation['kind'],
    click: WhatsAppClick | undefined
  ): Conversation {
    const booking = matchBooking(chat, chat.code);
    if (booking) usedBookings.add(booking.booking_id);
    return {
      kind,
      code: chat.code ? `S-${chat.code}` : null,
      origem: click ? origemDe(click.origem) : 'outros',
      ab_variant: click?.ab_variant ?? 'sem_variante',
      phone_last4: chat.phone ? chat.phone.slice(-4) : null,
      first_inbound_at: new Date(chat.firstInbound.at).toISOString(),
      first_response_min:
        chat.firstResponseAt !== null
          ? Math.round((chat.firstResponseAt - chat.firstInbound.at) / 60_000)
          : null,
      offer_sent: chat.offerSent,
      booking_id: booking?.booking_id ?? null,
      booking_value: booking?.value ?? null,
      click_found: Boolean(click),
    };
  }

  for (const chat of codedChats) {
    const click = chat.code ? input.clicksByCode[chat.code] : undefined;
    conversations.push(toConversation(chat, 'codigo', click));
  }
  for (const { chat, click } of probable) {
    conversations.push(toConversation(chat, 'provavel', click));
  }

  const por_origem = Object.fromEntries(ORIGENS.map((o) => [o, emptyRow()])) as Record<
    Origem,
    FunnelRow
  >;
  const por_variante: Record<string, FunnelRow> = {};
  const total = emptyRow();
  const rowsFor = (origem: Origem, variant: string) => {
    por_variante[variant] ??= emptyRow();
    return [por_origem[origem], por_variante[variant], total] as FunnelRow[];
  };

  for (const click of input.clicks) {
    for (const row of rowsFor(origemDe(click.origem), click.ab_variant ?? 'sem_variante')) {
      row.cliques++;
    }
  }
  for (const c of conversations) {
    for (const row of rowsFor(c.origem, c.ab_variant)) {
      if (c.kind === 'codigo') row.conversas_codigo++;
      else row.provaveis_site++;
      if (c.offer_sent) row.ofertas++;
      if (c.booking_id !== null) {
        row.reservas++;
        row.valor += c.booking_value ?? 0;
      }
    }
  }

  const responses = conversations
    .map((c) => c.first_response_min)
    .filter((m): m is number => m !== null);

  return {
    por_origem,
    por_variante,
    total,
    tempo_medio_primeira_resposta_min: responses.length
      ? Math.round(responses.reduce((s, m) => s + m, 0) / responses.length)
      : null,
    sem_resposta: conversations.filter((c) => c.first_response_min === null).length,
    conversas: conversations,
  };
}
