import { http, HttpResponse } from 'msw';
import {
  MOCK_ROOMS,
  MOCK_BOOKINGS,
  MOCK_PAYMENT_METHODS,
  MOCK_COST_CENTERS,
  createMockBooking,
} from './data.js';

const BASE_URL = 'https://artaxnet.com/pms-api/v1';

export const artaxHandlers = [
  // GET /availability
  http.get(`${BASE_URL}/availability`, () => {
    return HttpResponse.json({ rooms: MOCK_ROOMS });
  }),

  // GET /bookings
  http.get(`${BASE_URL}/bookings`, ({ request }) => {
    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const bookings = status
      ? MOCK_BOOKINGS.filter((b) => b.status === Number(status))
      : MOCK_BOOKINGS;

    return HttpResponse.json({
      bookings,
      pagination: {
        current_page: 1,
        total_pages: 1,
        total_items: bookings.length,
        per_page: 20,
      },
    });
  }),

  // GET /bookings/:id
  http.get(`${BASE_URL}/bookings/:id`, ({ params }) => {
    const booking = MOCK_BOOKINGS.find((b) => b.booking_id === Number(params['id']));
    if (!booking) {
      return HttpResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return HttpResponse.json(booking);
  }),

  // POST /bookings
  http.post(`${BASE_URL}/bookings`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    const booking = createMockBooking({
      arrival_date: body['arrival_date'] as string,
      departure_date: body['departure_date'] as string,
      status: 1,
    });
    return HttpResponse.json(booking, { status: 201 });
  }),

  // POST /bookings/:id/payments
  http.post(`${BASE_URL}/bookings/:id/payments`, () => {
    return HttpResponse.json({ success: true });
  }),

  // POST /bookings/:id/checkin
  http.post(`${BASE_URL}/bookings/:id/checkin`, () => {
    return HttpResponse.json({ success: true });
  }),

  // GET /payment-methods
  http.get(`${BASE_URL}/payment-methods`, () => {
    return HttpResponse.json({ payment_methods: MOCK_PAYMENT_METHODS });
  }),

  // GET /cost-centers
  http.get(`${BASE_URL}/cost-centers`, () => {
    return HttpResponse.json({ cost_centers: MOCK_COST_CENTERS });
  }),

  // GET /units
  http.get(`${BASE_URL}/units`, () => {
    return HttpResponse.json({
      units: [
        {
          unit_id: 1,
          unit_name: '101',
          room_type_id: 1,
          room_type_name: 'Standard',
          status: 'clean',
          orders: [],
        },
        {
          unit_id: 2,
          unit_name: '102',
          room_type_id: 1,
          room_type_name: 'Standard',
          status: 'dirty',
          orders: [],
        },
      ],
    });
  }),
];
