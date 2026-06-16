import { z } from 'zod/v4';

export const WebhookEventSchema = z.discriminatedUnion('event', [
  z.object({
    event: z.literal('booking_created'),
    data: z.object({
      booking_id: z.number(),
      timestamp: z.string(),
    }),
  }),
  z.object({
    event: z.literal('booking_canceled'),
    data: z.object({
      booking_id: z.number(),
      timestamp: z.string(),
    }),
  }),
]);

export type WebhookEvent = z.infer<typeof WebhookEventSchema>;
export type WebhookEventType = WebhookEvent['event'];
