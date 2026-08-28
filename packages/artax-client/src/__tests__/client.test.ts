import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
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
    expect(result.current_page).toBe(1);
    expect(result.total_bookings).toBe(result.bookings.length);
  });

  it('reporta divergência de schema sem derrubar a chamada', async () => {
    // Simula a Artax voltando ao formato antigo (arrival_date em vez de checkin) —
    // exatamente o tipo de mudança que passou meses invisível.
    mockServer.use(
      http.get('https://artaxnet.com/pms-api/v1/bookings', () =>
        HttpResponse.json({
          bookings: [{ booking_id: 1, status: 2, arrival_date: '2026-08-01' }],
          current_page: 1,
        })
      )
    );
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const result = await client.listBookings();

    // Divergência vira log visível...
    expect(spy).toHaveBeenCalled();
    expect(String(spy.mock.calls[0]?.[0])).toContain('divergiu do schema');
    // ...mas o dado bruto passa: reportar não pode virar indisponibilidade.
    expect(result.bookings).toHaveLength(1);

    spy.mockRestore();
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
    expect(booking.booking_id).toBeGreaterThan(0);
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
