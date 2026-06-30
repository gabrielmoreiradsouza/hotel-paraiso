import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const rawBody = await request.text();

  // Parse payload
  let body: Record<string, unknown>;
  try {
    body = JSON.parse(rawBody);
  } catch {
    // Accept even non-JSON (Artax test might send different format)
    console.log('[webhook] Received non-JSON body:', rawBody.substring(0, 200));
    return NextResponse.json({ ok: true });
  }

  // Log everything we receive for debugging
  const event = (body['event'] as string) ?? 'unknown';
  const bookingId =
    (body['data'] as Record<string, unknown>)?.['booking_id'] ?? body['booking_id'] ?? 'unknown';

  console.log(`[webhook] ${event} — booking_id: ${bookingId}`);
  console.log(`[webhook] Full payload: ${JSON.stringify(body)}`);

  // Return 200 immediately (Artax requires response within 5 seconds)
  return NextResponse.json({ ok: true });
}

// Health check
export async function GET() {
  return NextResponse.json({ status: 'webhook endpoint active' });
}
