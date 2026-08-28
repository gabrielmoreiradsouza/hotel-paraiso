import type { Booking, RoomAvailability, PaymentMethod, CostCenter } from '../index';

export const MOCK_ROOMS: RoomAvailability[] = [
  {
    room_type_id: 1,
    room_type_name: 'Standard',
    available: true,
    price: 350,
    rate_plan_id: 10,
    rate_plan_name: 'Tarifa Flexível',
    capacity: { adults: 2, children: 1 },
  },
  {
    room_type_id: 2,
    room_type_name: 'Superior',
    available: true,
    price: 520,
    rate_plan_id: 10,
    rate_plan_name: 'Tarifa Flexível',
    capacity: { adults: 2, children: 2 },
  },
  {
    room_type_id: 3,
    room_type_name: 'Suíte Master',
    available: true,
    price: 890,
    rate_plan_id: 10,
    rate_plan_name: 'Tarifa Flexível',
    capacity: { adults: 3, children: 2 },
  },
  {
    room_type_id: 4,
    room_type_name: 'Suíte Presidencial',
    available: false,
    price: 1500,
    rate_plan_id: 11,
    rate_plan_name: 'Tarifa Não Reembolsável',
    capacity: { adults: 4, children: 2 },
  },
];

let bookingIdCounter = 1000;

export function createMockBooking(overrides?: Partial<Booking>): Booking {
  bookingIdCounter++;
  // Espelha o formato real de GET /bookings (verificado em 2026-08-26).
  // Mock que não corresponde à API transforma o CI em teatro: os testes passam
  // contra uma resposta que a Artax nunca envia.
  return {
    booking_id: bookingIdCounter,
    status: 2,
    checkin: '2026-08-01',
    checkout: '2026-08-05',
    holder_guest: {
      name: 'João Silva',
      email: 'joao@email.com',
      phones: ['+5521999999999'],
    },
    guests: [{ name: 'João Silva', email: 'joao@email.com', phones: ['+5521999999999'] }],
    provider: 'site',
    units: 'Standard',
    comment: 'Reserva de teste',
    webcheckin_at: null,
    created: '2026-07-20 10:00:00',
    ...overrides,
  };
}

export const MOCK_BOOKINGS: Booking[] = [
  createMockBooking({ booking_id: 100, status: 2 }),
  createMockBooking({ booking_id: 101, status: 3 }),
  createMockBooking({ booking_id: 102, status: 5 }),
];

export const MOCK_PAYMENT_METHODS: PaymentMethod[] = [
  { id: 5, name: 'Dinheiro', type: 'in' },
  { id: 8, name: 'Cartão de Crédito', type: 'in' },
  { id: 12, name: 'PIX', type: 'in' },
  { id: 15, name: 'Transferência', type: 'in' },
];

export const MOCK_COST_CENTERS: CostCenter[] = [
  { id: 12, name: 'Hospedagem', code: '3421' },
  { id: 15, name: 'Alimentação', code: '3422' },
  { id: 18, name: 'Serviços Extras', code: '3423' },
];
