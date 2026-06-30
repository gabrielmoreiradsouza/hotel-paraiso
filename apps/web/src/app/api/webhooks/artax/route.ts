import { NextResponse } from 'next/server';
import { createHmac, timingSafeEqual } from 'node:crypto';

const WEBHOOK_SECRET = process.env['ARTAX_WEBHOOK_SECRET'] ?? '';

function verifyAuth(request: Request, payload: string): boolean {
  // If no secret configured, accept all webhooks
  if (!WEBHOOK_SECRET) return true;

  // Method 1: Bearer token in Authorization header (Artax standard)
  const authHeader = request.headers.get('authorization') ?? '';
  if (authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    if (token === WEBHOOK_SECRET) return true;
  }

  // Method 2: HMAC-SHA256 signature in X-Signature header
  const signature = request.headers.get('x-signature') ?? '';
  if (signature) {
    try {
      const expected = createHmac('sha256', WEBHOOK_SECRET).update(payload).digest('hex');
      return timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
    } catch {
      return false;
    }
  }

  return false;
}

export async function POST(request: Request) {
  const rawBody = await request.text();

  // Validate auth
  if (!verifyAuth(request, rawBody)) {
    console.warn('[webhook] Unauthorized request');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
