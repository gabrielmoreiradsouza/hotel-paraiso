/**
 * Política de reserva do site — fonte única para telas, email e WhatsApp (ADR-0014).
 *
 * O plano Standard da Artax diz "pré-pagamento"; o hotel decidiu reservar pelo site sem
 * cobrar. O prazo de cancelamento segue o da Artax (até 1 dia antes da chegada).
 */

export const PAYMENT_POLICY = 'Nenhum pagamento agora — você paga no hotel, no check-in.';
export const CANCELLATION_POLICY = 'Cancelamento grátis até 1 dia antes da chegada.';
export const CHECKIN_TIME = '14h';
export const CHECKOUT_TIME = '12h';

/** Prefixo no comentário da reserva na Artax, lido por `scripts/check-category-assignment.ts`. */
export const BOOKED_CATEGORY_MARKER = 'Categoria reservada:';
