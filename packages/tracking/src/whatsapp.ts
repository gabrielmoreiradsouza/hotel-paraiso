/**
 * Código de rastreio do WhatsApp (ADR-0012).
 *
 * O clique em wa.me não devolve nada ao site: a conversa acontece fora dele e a reserva
 * nasce na recepção, digitada na Artax. O elo é o código que o hóspede envia no texto
 * pré-preenchido — lido depois no histórico da Evolution e, se a recepção copiar, na
 * observação da reserva. Por isso curto e impossível de ler errado.
 *
 * Sem 0/O e 1/I/L: 31 símbolos, 4 posições → ~923 mil códigos. Volume do hotel é de
 * dezenas de cliques por mês; colisão é tratada no servidor (SET NX), não aqui.
 * Alfabeto combinado com o time de mídia (regex `[A-HJ-NP-Z2-9]`) — não mudar sem avisar.
 */
export const WHATSAPP_CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
export const WHATSAPP_CODE_LENGTH = 4;
export const WHATSAPP_CODE_PREFIX = 'S-';

const CODE_BODY = `[${WHATSAPP_CODE_ALPHABET}]{${WHATSAPP_CODE_LENGTH}}`;
const CODE_EXACT = new RegExp(`^${CODE_BODY}$`);
// Recepção digita à mão: aceita minúscula, espaço ou sem hífen ("s 7KQ3", "S7KQ3").
const CODE_IN_TEXT = new RegExp(`\\bS[-\\s]?(${CODE_BODY})\\b`, 'gi');

export function generateWhatsAppCode(): string {
  // 32 bits por posição: o viés do módulo por 31 fica desprezível.
  const values = new Uint32Array(WHATSAPP_CODE_LENGTH);
  globalThis.crypto.getRandomValues(values);
  let body = '';
  for (const value of values) {
    body += WHATSAPP_CODE_ALPHABET[value % WHATSAPP_CODE_ALPHABET.length];
  }
  return body;
}

/** Valida o corpo do código (sem prefixo), já normalizado em maiúsculas. */
export function isWhatsAppCode(value: unknown): value is string {
  return typeof value === 'string' && CODE_EXACT.test(value);
}

/** Extrai os códigos (sem prefixo, maiúsculos) de um texto livre, ex.: observação da Artax. */
export function extractWhatsAppCodes(text: string | null | undefined): string[] {
  if (!text) return [];
  const found = new Set<string>();
  for (const match of text.matchAll(CODE_IN_TEXT)) {
    const body = match[1]?.toUpperCase();
    if (body && CODE_EXACT.test(body)) found.add(body);
  }
  return [...found];
}

export interface WhatsAppBookingContext {
  roomName: string;
  /** YYYY-MM-DD */
  checkin: string;
  /** YYYY-MM-DD */
  checkout: string;
  guests: number;
}

function ddmm(isoDate: string): string {
  const [, month, day] = isoDate.split('-');
  return `${day}/${month}`;
}

/**
 * Texto padrão definido com o time de mídia. A origem (Google, campanha) nunca entra no texto
 * que o hóspede vê — fica só no backend, ligada ao código. O código vai sempre no fim.
 */
export function buildWhatsAppMessage(code?: string, booking?: WhatsAppBookingContext): string {
  const intro = booking
    ? `Olá! Vim pelo site do Hotel Paraíso e quero reservar o quarto ${booking.roomName}, ` +
      `de ${ddmm(booking.checkin)} a ${ddmm(booking.checkout)}, para ${booking.guests} ` +
      `${booking.guests === 1 ? 'hóspede' : 'hóspedes'}.`
    : 'Olá! Vim pelo site do Hotel Paraíso e quero fazer uma reserva.';
  return code ? `${intro} Código: ${WHATSAPP_CODE_PREFIX}${code}` : intro;
}
