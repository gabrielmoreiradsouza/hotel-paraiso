import type { FastifyInstance } from 'fastify';
import { WebhookEventSchema, verifyWebhookSignature } from '@hotel-paraiso/artax-client';
import { prisma } from '@hotel-paraiso/database';

export async function artaxWebhookRoutes(app: FastifyInstance) {
  app.post('/api/webhooks/artax', async (request, reply) => {
    const signature = request.headers['x-signature'] as string | undefined;
    const webhookSecret = process.env['ARTAX_WEBHOOK_SECRET'] ?? '';
    const rawBody = JSON.stringify(request.body);

    // Validate signature
    if (
      !signature ||
      !webhookSecret ||
      !verifyWebhookSignature(rawBody, signature, webhookSecret)
    ) {
      app.log.warn({ signature: !!signature }, 'invalid webhook signature');

      await prisma.webhookDelivery.create({
        data: {
          source: 'artax',
          eventType: 'unknown',
          payload: request.body as object,
          signatureValid: false,
          status: 'failed',
        },
      });

      return reply.status(401).send({ error: 'Invalid signature' });
    }

    // Parse and validate event
    const parseResult = WebhookEventSchema.safeParse(request.body);
    if (!parseResult.success) {
      app.log.error({ body: request.body }, 'invalid webhook payload');
      return reply.status(422).send({ error: 'Invalid payload' });
    }

    const event = parseResult.data;

    // Store delivery
    await prisma.webhookDelivery.create({
      data: {
        source: 'artax',
        eventType: event.event,
        payload: event as unknown as object,
        signatureValid: true,
        status: 'processed',
        processedAt: new Date(),
      },
    });

    // Log event
    await prisma.eventLog.create({
      data: {
        aggregateType: 'booking',
        aggregateId: String(event.data.booking_id),
        eventType: event.event === 'booking_created' ? 'created' : 'cancelled',
        payload: event as unknown as object,
        triggeredBy: 'webhook',
      },
    });

    app.log.info(
      { event: event.event, bookingId: event.data.booking_id },
      'artax webhook processed'
    );

    return reply.status(200).send({ ok: true });
  });
}
