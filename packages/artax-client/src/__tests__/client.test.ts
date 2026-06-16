import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { mockServer } from '../mocks/server.js';
import { ArtaxClient } from '../client.js';

const client = new ArtaxClient({
  clientId: 'test-id',
  clientSecret: 'test-secret',
});

beforeAll(() => mockServer.listen({ onUnhandledRequest: 'error' }));
afterEach(() => mockServer.resetHandlers());
afterAll(() => mockServer.close());

describe('ArtaxClient integration (MSW)', () => {
  it('checks availability', async () => {
    const result = await client.checkAvailability({
      arrival_date: '2026-08-01',
      departure_date: '2026-08-05',
    });
    expect(result.rooms).toHaveLength(4);
    expect(result.rooms[0]?.room_type_name).toBe('Standard');
  });

  it('lists bookings', async () => {
    const result = await client.listBookings();
    expect(result.bookings.length).toBeGreaterThan(0);
    expect(result.pagination?.current_page).toBe(1);
  });

  it('gets booking by ID', async () => {
    const booking = await client.getBooking(100);
    expect(booking.booking_id).toBe(100);
    expect(booking.status).toBe(2);
  });

  it('creates a booking', async () => {
    const booking = await client.createBooking({
      arrival_date: '2026-09-01',
      departure_date: '2026-09-05',
      guests: [{ name: 'Maria Santos' }],
      rooms: [{ room_type_id: 1, adults: 2 }],
    });
    expect(booking.booking_id).toBeGreaterThan(0);
    expect(booking.status).toBe(1);
  });

  it('gets payment methods', async () => {
    const result = await client.getPaymentMethods();
    expect(result.payment_methods).toHaveLength(4);
    expect(result.payment_methods.some((m) => m.name === 'PIX')).toBe(true);
  });

  it('gets cost centers', async () => {
    const result = await client.getCostCenters();
    expect(result.cost_centers).toHaveLength(3);
  });

  it('throws on non-existent booking', async () => {
    await expect(client.getBooking(99999)).rejects.toThrow();
  });
});
