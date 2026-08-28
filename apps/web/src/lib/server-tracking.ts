/**
 * Server-side tracking — GA4 Measurement Protocol + Meta CAPI
 * Fires on booking creation to ensure conversion attribution
 * even when client-side trackers are blocked by ad-blockers.
 */

const GA4_MEASUREMENT_ID = process.env['NEXT_PUBLIC_GA4_MEASUREMENT_ID'] ?? '';
const GA4_API_SECRET = process.env['GA4_API_SECRET'] ?? '';
const META_PIXEL_ID = process.env['NEXT_PUBLIC_META_PIXEL_ID'] ?? '';
const META_ACCESS_TOKEN = process.env['META_ACCESS_TOKEN'] ?? '';

/**
 * Tracking nunca pode segurar o request de reserva.
 *
 * Sem `AbortSignal`, GA4 ou Meta lentos empilham conexões até esgotar o pool. A conversão
 * é importante, mas perder uma é infinitamente melhor do que derrubar o motor de reservas.
 */
const TRACKING_TIMEOUT_MS = 3000;

function generateEventId(): string {
  return `srv_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Send purchase event to GA4 Measurement Protocol
 */
export async function trackGA4Purchase(params: {
  bookingId: string;
  value: number;
  guestEmail?: string;
  userAgent?: string;
  clientIp?: string;
}) {
  if (!GA4_MEASUREMENT_ID || !GA4_API_SECRET) return;

  const eventId = generateEventId();

  try {
    await fetch(
      `https://www.google-analytics.com/mp/collect?measurement_id=${GA4_MEASUREMENT_ID}&api_secret=${GA4_API_SECRET}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: `server.${params.bookingId}`,
          events: [
            {
              name: 'purchase',
              params: {
                transaction_id: params.bookingId,
                value: params.value,
                currency: 'BRL',
                event_id: eventId,
              },
            },
          ],
        }),
        signal: AbortSignal.timeout(TRACKING_TIMEOUT_MS),
      }
    );
  } catch (err) {
    console.error('[GA4 MP] Error:', err);
  }
}

/**
 * Send purchase event to Meta Conversions API (CAPI)
 */
export async function trackMetaPurchase(params: {
  bookingId: string;
  value: number;
  guestEmail?: string;
  guestPhone?: string;
  userAgent?: string;
  clientIp?: string;
}) {
  if (!META_PIXEL_ID || !META_ACCESS_TOKEN) return;

  const eventId = generateEventId();

  // Hash PII for advanced matching
  const crypto = await import('node:crypto');
  const hashSha256 = (val: string) =>
    val ? crypto.createHash('sha256').update(val.trim().toLowerCase()).digest('hex') : undefined;

  const userData: Record<string, string | undefined> = {};
  if (params.guestEmail) userData['em'] = hashSha256(params.guestEmail);
  if (params.guestPhone) userData['ph'] = hashSha256(params.guestPhone.replace(/\D/g, ''));
  if (params.clientIp) userData['client_ip_address'] = params.clientIp;
  if (params.userAgent) userData['client_user_agent'] = params.userAgent;

  try {
    await fetch(
      `https://graph.facebook.com/v18.0/${META_PIXEL_ID}/events?access_token=${META_ACCESS_TOKEN}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: [
            {
              event_name: 'Purchase',
              event_time: Math.floor(Date.now() / 1000),
              event_id: eventId,
              event_source_url: 'https://hotelparaiso.moreirads.cloud/reservar',
              action_source: 'website',
              user_data: userData,
              custom_data: {
                value: params.value,
                currency: 'BRL',
                content_type: 'hotel',
                content_ids: [params.bookingId],
              },
            },
          ],
        }),
        signal: AbortSignal.timeout(TRACKING_TIMEOUT_MS),
      }
    );
  } catch (err) {
    console.error('[Meta CAPI] Error:', err);
  }
}

/**
 * Fire both GA4 + Meta server-side tracking for a booking
 */
export function trackServerPurchase(params: {
  bookingId: string;
  value: number;
  guestEmail?: string;
  guestPhone?: string;
  userAgent?: string;
  clientIp?: string;
}) {
  // Fire and forget — não bloqueia a resposta da reserva, mas a falha precisa aparecer:
  // conversão perdida silenciosamente vira decisão de orçamento tomada às cegas.
  trackGA4Purchase(params).catch((err) => {
    console.error('[tracking] GA4 purchase falhou:', err);
  });
  trackMetaPurchase(params).catch((err) => {
    console.error('[tracking] Meta purchase falhou:', err);
  });
}
