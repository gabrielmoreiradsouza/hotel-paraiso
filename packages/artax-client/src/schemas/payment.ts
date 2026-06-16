import { z } from 'zod/v4';

export const PaymentMethodSchema = z.object({
  id: z.number(),
  name: z.string(),
  type: z.enum(['in', 'out']),
});

export const PaymentMethodsResponseSchema = z.object({
  payment_methods: z.array(PaymentMethodSchema),
});

export const CostCenterSchema = z.object({
  id: z.number(),
  name: z.string(),
  code: z.string(),
});

export const CostCentersResponseSchema = z.object({
  cost_centers: z.array(CostCenterSchema),
});

export const AddPaymentSchema = z.object({
  payment_method_id: z.number(),
  amount: z.number().positive(),
  installments: z.number().min(1).max(120).optional(),
  due_date: z.string().optional(),
  cost_center_id: z.number().optional(),
  notes: z.string().optional(),
});

export type PaymentMethod = z.infer<typeof PaymentMethodSchema>;
export type CostCenter = z.infer<typeof CostCenterSchema>;
export type AddPaymentInput = z.infer<typeof AddPaymentSchema>;
