import { z } from 'zod/v4';

export const UnitStatusSchema = z.enum(['clean', 'dirty']);

export const UnitSchema = z.object({
  unit_id: z.number(),
  unit_name: z.string(),
  room_type_id: z.number(),
  room_type_name: z.string(),
  status: UnitStatusSchema,
  orders: z
    .array(
      z.object({
        order_id: z.number(),
        scheduled_at: z.string(),
      })
    )
    .optional(),
});

export const UnitsResponseSchema = z.object({
  units: z.array(UnitSchema),
  pagination: z
    .object({
      current_page: z.number(),
      total_pages: z.number(),
      total_items: z.number(),
    })
    .optional(),
});

export const CreateOrderSchema = z.object({
  unit_ids: z.array(z.number()).min(1),
  start_at: z.string(),
  notes: z.string().optional(),
  employee_id: z.number().optional(),
});

export const UpdateUnitsStatusSchema = z.object({
  units: z
    .array(
      z.object({
        unit_id: z.number(),
        status: UnitStatusSchema,
      })
    )
    .min(1)
    .max(100),
});

export type Unit = z.infer<typeof UnitSchema>;
export type CreateOrderInput = z.infer<typeof CreateOrderSchema>;
export type UpdateUnitsStatusInput = z.infer<typeof UpdateUnitsStatusSchema>;
