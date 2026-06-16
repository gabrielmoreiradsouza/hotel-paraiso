import { z } from 'zod/v4';

export const AvailabilityQuerySchema = z.object({
  arrival_date: z.string(),
  departure_date: z.string(),
  adults: z.number().min(1).optional(),
  children: z.number().min(0).optional(),
});

export const RoomAvailabilitySchema = z.object({
  room_type_id: z.number(),
  room_type_name: z.string(),
  available: z.boolean(),
  price: z.number().optional(),
  rate_plan_id: z.number().optional(),
  rate_plan_name: z.string().optional(),
  capacity: z
    .object({
      adults: z.number(),
      children: z.number().optional(),
    })
    .optional(),
});

export const AvailabilityResponseSchema = z.object({
  rooms: z.array(RoomAvailabilitySchema),
});

export type AvailabilityQuery = z.infer<typeof AvailabilityQuerySchema>;
export type RoomAvailability = z.infer<typeof RoomAvailabilitySchema>;
export type AvailabilityResponse = z.infer<typeof AvailabilityResponseSchema>;
