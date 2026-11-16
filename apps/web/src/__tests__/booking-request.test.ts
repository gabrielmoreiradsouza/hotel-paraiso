import { describe, expect, it } from 'vitest';
import { BookingRequestSchema } from '../lib/booking-request';

// Exatamente o que as telas mandam (reservar, CheckoutSheet).
const fromSite = {
  guestName: 'Maria Souza',
  guestEmail: 'maria@exemplo.com',
  guestPhone: '31999999999',
  checkin: '2026-12-02',
  checkout: '2026-12-03',
  categoryId: 3574,
  rateplanId: 2472,
  adults: 2,
  kids: 0,
  totalPrice: 165,
  attribution: { source: 'google', medium: 'cpc', landing_page: '/', first_seen: '2026-11-16' },
  client_id: 'GA1.1.123',
  session_id: '456',
};

const issue = (body: unknown) => BookingRequestSchema.safeParse(body).error?.issues[0]?.message;

describe('BookingRequestSchema', () => {
  it('accepts the body the booking screens send', () => {
    const parsed = BookingRequestSchema.parse(fromSite);
    expect(parsed.attribution?.source).toBe('google');
    expect(parsed.client_id).toBe('GA1.1.123');
  });

  it('accepts a minimal body without the optional fields', () => {
    const { guestPhone, totalPrice, attribution, client_id, session_id, adults, kids, ...minimal } =
      fromSite;
    void guestPhone;
    void totalPrice;
    void attribution;
    void client_id;
    void session_id;
    void adults;
    void kids;
    const parsed = BookingRequestSchema.parse(minimal);
    expect(parsed.adults).toBe(2);
    expect(parsed.kids).toBe(0);
    expect(parsed.attribution).toBeNull();
    expect(parsed.notes).toBeUndefined();
  });

  it('rejects more than one child, impossible dates and non-numeric ids', () => {
    expect(issue({ ...fromSite, kids: 2 })).toBe('Aceitamos até 1 criança por quarto');
    expect(issue({ ...fromSite, checkin: '2026-02-31' })).toBe('Data inválida');
    expect(issue({ ...fromSite, categoryId: '3574' })).toMatch(/Selecione um quarto/);
    expect(issue({ ...fromSite, guestEmail: 'sem-arroba' })).toBe('Email inválido');
    expect(issue({ ...fromSite, guestName: 42 })).toBeDefined();
  });

  it('drops a malformed attribution instead of trusting it', () => {
    expect(
      BookingRequestSchema.parse({ ...fromSite, attribution: { foo: 1 } }).attribution
    ).toBeNull();
  });
});
