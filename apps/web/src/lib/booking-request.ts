import { z } from 'zod';
import type { Attribution } from '@hotel-paraiso/tracking';

export function isAttribution(value: unknown): value is Attribution {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as { source?: unknown }).source === 'string' &&
    (value as { source: string }).source.length > 0
  );
}

const ISO_DATE = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida')
  .refine((value) => {
    const date = new Date(`${value}T12:00:00Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
  }, 'Data inválida');

/** Borda do POST: tudo do corpo é escolha de quem chama (CODE_STANDARDS — Zod na borda). */
export const BookingRequestSchema = z.object({
  guestName: z.string().trim().min(2, 'Nome inválido').max(200, 'Nome inválido'),
  guestEmail: z
    .string()
    .trim()
    .max(254, 'Email inválido')
    .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Email inválido'),
  guestPhone: z.string().trim().max(40, 'Telefone inválido').optional(),
  checkin: ISO_DATE,
  checkout: ISO_DATE,
  categoryId: z
    .number({ message: 'Selecione um quarto disponível antes de confirmar.' })
    .int()
    .positive(),
  rateplanId: z
    .number({ message: 'Selecione um quarto disponível antes de confirmar.' })
    .int()
    .positive(),
  adults: z
    .number()
    .int('Ocupação inválida')
    .min(1, 'Ocupação inválida')
    .max(10, 'Ocupação inválida')
    .default(2),
  kids: z
    .union([z.literal(0), z.literal(1)], { message: 'Aceitamos até 1 criança por quarto' })
    .default(0),
  totalPrice: z.number().optional(),
  notes: z
    .unknown()
    .optional()
    .transform((value) => (typeof value === 'string' ? value.slice(0, 500) : undefined)),
  attribution: z
    .unknown()
    .optional()
    .transform((value) => (isAttribution(value) ? value : null)),
  client_id: z
    .unknown()
    .optional()
    .transform((value) =>
      typeof value === 'string' && value.length > 0 ? value.slice(0, 100) : null
    ),
  session_id: z
    .unknown()
    .optional()
    .transform((value) =>
      typeof value === 'string' && value.length > 0 ? value.slice(0, 100) : null
    ),
});

export type BookingRequest = z.infer<typeof BookingRequestSchema>;
