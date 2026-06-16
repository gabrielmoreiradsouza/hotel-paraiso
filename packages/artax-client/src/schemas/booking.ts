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

export const GuestSchema = z.object({
  name: z.string(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  document: z.string().optional(),
});

export const BookingSchema = z.object({
  booking_id: z.number(),
  status: BookingStatusSchema,
  arrival_date: z.string(),
  departure_date: z.string(),
  total_amount: z.number().optional(),
  guests: z.array(GuestSchema).optional(),
  rooms: z
    .array(
      z.object({
        room_type_id: z.number(),
        room_type_name: z.string().optional(),
        rate_plan_id: z.number().optional(),
        adults: z.number().optional(),
        children: z.number().optional(),
      })
    )
    .optional(),
});

export const BookingListResponseSchema = z.object({
  bookings: z.array(BookingSchema),
  pagination: z
    .object({
      current_page: z.number(),
      total_pages: z.number(),
      total_items: z.number(),
      per_page: z.number(),
    })
    .optional(),
});

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
