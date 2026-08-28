import { z } from 'zod/v4';

export const BookingStatus = {
  PRE_BOOKING: 1,
  CONFIRMED: 2,
  CHECKED_IN: 3,
  CHECKED_OUT: 4,
  CANCELLED: 5,
  NO_SHOW: 6,
} as const;

export const BookingStatusSchema = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
  z.literal(5),
  z.literal(6),
]);

/**
 * Hóspede no formato de ENVIO (criação de reserva). Campo `phone`, singular.
 * Não confundir com `BookingGuestSchema`: entrada e saída da Artax não são simétricas.
 */
export const GuestSchema = z.object({
  name: z.string(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  document: z.string().optional(),
});

/**
 * Hóspede no formato de RESPOSTA (GET /bookings). Campo `phones`, array.
 *
 * O array não foi inspecionado por dentro — custaria mais uma chamada da cota da DR-001,
 * então fica `unknown` em vez de palpite. Inventar tipo é como este arquivo divergiu da
 * realidade da primeira vez.
 */
export const BookingGuestSchema = z.object({
  name: z.string(),
  email: z.string().optional(),
  phones: z.array(z.unknown()).optional(),
});

/**
 * Verificado contra a API real em 2026-08-26 (GET /bookings?page=1, 20 reservas).
 *
 * A versão anterior descrevia `arrival_date`/`departure_date`, `rooms` e `total_amount`
 * — campos que a Artax não devolve. Nunca falhou porque o client faz cast em vez de
 * `.parse()`, então o tipo era ficção que o TypeScript aceitava como verdade.
 *
 * `.passthrough()` porque a Artax pode acrescentar campos: campo novo não deve derrubar
 * a validação, só campo obrigatório faltando.
 */
export const BookingSchema = z
  .object({
    booking_id: z.number(),
    status: BookingStatusSchema,
    checkin: z.string(),
    checkout: z.string(),
    holder_guest: BookingGuestSchema.optional(),
    guests: z.array(BookingGuestSchema).optional(),
    provider: z.string().optional(),
    // Observado como string em 20/20 reservas — não é array, apesar do nome no plural.
    units: z.string().optional(),
    comment: z.string().optional(),
    webcheckin_at: z.string().nullable().optional(),
    created: z.string().optional(),
  })
  .passthrough();

/** Paginação vem achatada na raiz — não há objeto `pagination`. */
export const BookingListResponseSchema = z
  .object({
    bookings: z.array(BookingSchema),
    current_page: z.number().optional(),
    total_pages: z.number().optional(),
    total_bookings: z.number().optional(),
    next_page: z.string().optional(),
  })
  .passthrough();

export const CreateBookingSchema = z.object({
  arrival_date: z.string(),
  departure_date: z.string(),
  guests: z.array(GuestSchema).min(1),
  rooms: z.array(
    z.object({
      room_type_id: z.number(),
      rate_plan_id: z.number().optional(),
      adults: z.number().min(1),
      children: z.number().min(0).optional(),
    })
  ),
  notes: z.string().optional(),
});

export type Booking = z.infer<typeof BookingSchema>;
export type BookingListResponse = z.infer<typeof BookingListResponseSchema>;
export type CreateBookingInput = z.infer<typeof CreateBookingSchema>;
export type Guest = z.infer<typeof GuestSchema>;
