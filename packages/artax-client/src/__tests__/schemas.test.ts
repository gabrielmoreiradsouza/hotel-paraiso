import { describe, it, expect } from 'vitest';
import {
  BookingSchema,
  CreateBookingSchema,
  WebhookEventSchema,
  AvailabilityQuerySchema,
  AddPaymentSchema,
} from '../index.js';

describe('BookingSchema', () => {
  it('validates a valid booking', () => {
    const result = BookingSchema.safeParse({
      booking_id: 123,
      status: 2,
      arrival_date: '2026-07-01',
      departure_date: '2026-07-05',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid status', () => {
    const result = BookingSchema.safeParse({
      booking_id: 123,
      status: 99,
      arrival_date: '2026-07-01',
      departure_date: '2026-07-05',
    });
    expect(result.success).toBe(false);
  });
});

describe('CreateBookingSchema', () => {
  it('validates a valid create booking input', () => {
    const result = CreateBookingSchema.safeParse({
      arrival_date: '2026-07-01',
      departure_date: '2026-07-05',
      guests: [{ name: 'João Silva', email: 'joao@email.com' }],
      rooms: [{ room_type_id: 1, adults: 2 }],
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty guests array', () => {
    const result = CreateBookingSchema.safeParse({
      arrival_date: '2026-07-01',
      departure_date: '2026-07-05',
      guests: [],
      rooms: [{ room_type_id: 1, adults: 2 }],
    });
    expect(result.success).toBe(false);
  });
});

describe('WebhookEventSchema', () => {
  it('validates booking_created event', () => {
    const result = WebhookEventSchema.safeParse({
      event: 'booking_created',
      data: { booking_id: 12345, timestamp: '2025-06-20T14:30:00Z' },
    });
    expect(result.success).toBe(true);
  });

  it('validates booking_canceled event', () => {
    const result = WebhookEventSchema.safeParse({
      event: 'booking_canceled',
      data: { booking_id: 12345, timestamp: '2025-06-21T10:15:00Z' },
    });
    expect(result.success).toBe(true);
  });

  it('rejects unknown event type', () => {
    const result = WebhookEventSchema.safeParse({
      event: 'booking_updated',
      data: { booking_id: 12345 },
    });
    expect(result.success).toBe(false);
  });
});

describe('AvailabilityQuerySchema', () => {
  it('validates valid query', () => {
    const result = AvailabilityQuerySchema.safeParse({
      arrival_date: '2026-07-01',
      departure_date: '2026-07-05',
      adults: 2,
    });
    expect(result.success).toBe(true);
  });
});

describe('AddPaymentSchema', () => {
  it('validates valid payment', () => {
    const result = AddPaymentSchema.safeParse({
      payment_method_id: 12,
      amount: 500.0,
      installments: 3,
    });
    expect(result.success).toBe(true);
  });

  it('rejects negative amount', () => {
    const result = AddPaymentSchema.safeParse({
      payment_method_id: 12,
      amount: -100,
    });
    expect(result.success).toBe(false);
  });
});
