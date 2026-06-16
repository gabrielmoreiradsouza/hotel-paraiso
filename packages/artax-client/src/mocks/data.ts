import type { Booking, RoomAvailability, PaymentMethod, CostCenter } from '../index.js';

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
  return {
    booking_id: bookingIdCounter,
    status: 2,
    arrival_date: '2026-08-01',
    departure_date: '2026-08-05',
    total_amount: 1400,
    guests: [{ name: 'João Silva', email: 'joao@email.com', phone: '+5521999999999' }],
    rooms: [{ room_type_id: 1, room_type_name: 'Standard', adults: 2, children: 0 }],
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
