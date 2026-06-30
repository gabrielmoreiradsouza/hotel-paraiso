import { NextResponse } from 'next/server';
import { createHmac, timingSafeEqual } from 'node:crypto';

const WEBHOOK_SECRET = process.env['ARTAX_WEBHOOK_SECRET'] ?? '';

function verifySignature(payload: string, signature: string, secret: string): boolean {
  if (!secret || !signature) return !secret; // If no secret configured, accept all
  try {
    const expected = createHmac('sha256', secret).update(payload).digest('hex');
    return timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get('x-signature') ?? '';

  // Validate signature if secret is configured
  if (WEBHOOK_SECRET && !verifySignature(rawBody, signature, WEBHOOK_SECRET)) {
    console.warn('[webhook] Invalid signature');
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  // Parse payload
  let event: { event: string; data: { booking_id: number; timestamp?: string } };
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 422 });
  }

  // Validate event structure
  if (!event.event || !event.data?.booking_id) {
    return NextResponse.json({ error: 'Invalid event structure' }, { status: 422 });
  }

  // Process event
  console.log(`[webhook] ${event.event} — booking_id: ${event.data.booking_id}`);

  // Return 200 immediately (Artax requires response within 5 seconds)
  return NextResponse.json({
    ok: true,
    received: event.event,
    booking_id: event.data.booking_id,
  });
}

// Health check
export async function GET() {
  return NextResponse.json({ status: 'webhook endpoint active' });
}
