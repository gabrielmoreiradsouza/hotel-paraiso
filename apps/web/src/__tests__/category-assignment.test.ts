import { describe, expect, it } from 'vitest';
import { findCategoryMismatches, readBookedCategory } from '../lib/category-assignment';

const siteComment = (category: string) =>
  `Reserva via site hotelparaiso.moreirads.cloud | Categoria reservada: ${category} (1 cama de casal, ventilador, sem frigobar) | Hóspedes: 2 adultos`;

describe('readBookedCategory', () => {
  it('reads the category the guest booked from the Artax comment', () => {
    expect(readBookedCategory(siteComment('Casal Confort'))).toBe('Casal Confort');
    expect(readBookedCategory('Reserva pelo WhatsApp')).toBeNull();
    expect(readBookedCategory(null)).toBeNull();
  });
});

describe('findCategoryMismatches', () => {
  it('accepts the same category despite accents, typos and unit labels from Artax', () => {
    const mismatches = findCategoryMismatches([
      { booking_id: 1, units: '(21) Casal Confort', comment: siteComment('Casal Confort') },
      { booking_id: 2, units: '(06) Casal Standart', comment: siteComment('Casal Standard') },
      {
        booking_id: 3,
        units: '(14) Triplo Familia Master',
        comment: siteComment('Triplo Família Master'),
      },
      {
        booking_id: 4,
        units: '(16) Casal Master (Sem Frigobar)',
        comment: siteComment('Casal Master'),
      },
    ]);
    expect(mismatches).toEqual([]);
  });

  it('flags a guest moved to another category by the front desk', () => {
    const mismatches = findCategoryMismatches([
      {
        booking_id: 3210239,
        checkin: '2026-11-27',
        units: '(112) Individual Confort ',
        comment: siteComment('Casal Confort'),
      },
    ]);
    expect(mismatches).toEqual([
      {
        bookingId: '3210239',
        checkin: '2026-11-27',
        booked: 'Casal Confort',
        assigned: '(112) Individual Confort',
      },
    ]);
  });

  it('ignores bookings from other channels and bookings without a unit yet', () => {
    expect(
      findCategoryMismatches([
        { booking_id: 1, units: '(13) Casal Luxo', comment: 'Reserva pelo WhatsApp' },
        { booking_id: 2, units: '', comment: siteComment('Casal Luxo') },
      ])
    ).toEqual([]);
  });
});
