import { http, HttpResponse } from 'msw';
import {
  MOCK_ROOMS,
  MOCK_BOOKINGS,
  MOCK_PAYMENT_METHODS,
  MOCK_COST_CENTERS,
  createMockBooking,
} from './data';

const BASE_URL = 'https://artaxnet.com/pms-api/v1';

export const artaxHandlers = [
  // GET /rooms/availability (corrected endpoint)
  http.get(`${BASE_URL}/rooms/availability`, () => {
    return HttpResponse.json({ rooms: MOCK_ROOMS });
  }),

  // GET /bookings (list)
  http.get(`${BASE_URL}/bookings`, ({ request }) => {
    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const bookings = status
      ? MOCK_BOOKINGS.filter((b) => b.status === Number(status))
      : MOCK_BOOKINGS;

    // Paginação achatada na raiz — é assim que a Artax devolve, não aninhada.
    return HttpResponse.json({
      bookings,
      current_page: 1,
      total_pages: 1,
      total_bookings: bookings.length,
      next_page: '',
    });
  }),

  // GET /booking/:id (singular, corrected)
  http.get(`${BASE_URL}/booking/:id`, ({ params }) => {
    const booking = MOCK_BOOKINGS.find((b) => b.booking_id === Number(params['id']));
    if (!booking) {
      return HttpResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return HttpResponse.json(booking);
  }),

  // POST /booking/create (corrected endpoint)
  http.post(`${BASE_URL}/booking/create`, async () => {
    const booking = createMockBooking({ status: 1 });
    return HttpResponse.json({ booking_id: booking.booking_id }, { status: 201 });
  }),

  // POST /booking/:id/payments (singular)
  http.post(`${BASE_URL}/booking/:id/payments`, () => {
    return HttpResponse.json({ success: true });
  }),

  // POST /booking/:id/web-check-in (corrected)
  http.post(`${BASE_URL}/booking/:id/web-check-in`, () => {
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

  // GET /housekeeping — formato real (16/11/2026): UHs agrupadas por categoria
  http.get(`${BASE_URL}/housekeeping`, () => {
    return HttpResponse.json({
      current_page: 1,
      total_pages: 1,
      total_items: 1,
      next_page: null,
      prev_page: null,
      data: {
        '3574': {
          room_name: 'Casal Luxo',
          total_dirty: 0,
          total_clean: 1,
          units: [
            { id: 21001, name: '(13) Casal Luxo ', floor: 1, status: 'clean', next_orders: [] },
          ],
        },
      },
    });
  }),
];
