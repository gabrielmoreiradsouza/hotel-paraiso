import { describe, it, expect } from 'vitest';
import { createHmac } from 'node:crypto';
import { verifyWebhookSignature } from '../utils/webhook-verifier.js';

describe('verifyWebhookSignature', () => {
  const secret = 'test-webhook-secret';
  const payload = '{"event":"booking_created","data":{"booking_id":123}}';

  it('returns true for valid signature', () => {
    const signature = createHmac('sha256', secret).update(payload).digest('hex');
    expect(verifyWebhookSignature(payload, signature, secret)).toBe(true);
  });

  it('returns false for invalid signature', () => {
    expect(verifyWebhookSignature(payload, 'invalid-signature', secret)).toBe(false);
  });

  it('returns false for wrong secret', () => {
    const signature = createHmac('sha256', 'wrong-secret').update(payload).digest('hex');
    expect(verifyWebhookSignature(payload, signature, secret)).toBe(false);
  });

  it('returns false for tampered payload', () => {
    const signature = createHmac('sha256', secret).update(payload).digest('hex');
    const tampered = '{"event":"booking_canceled","data":{"booking_id":123}}';
    expect(verifyWebhookSignature(tampered, signature, secret)).toBe(false);
  });
});
