export const ARTAX_API_VERSION = 'v1';

// Client
export { ArtaxClient } from './client.js';
export type { ArtaxClientConfig } from './client.js';

// Schemas - Booking
export {
  BookingStatus,
  BookingStatusSchema,
  BookingSchema,
  BookingListResponseSchema,
  CreateBookingSchema,
  GuestSchema,
} from './schemas/booking.js';
export type { Booking, BookingListResponse, CreateBookingInput, Guest } from './schemas/booking.js';

// Schemas - Availability
export {
  AvailabilityQuerySchema,
  AvailabilityResponseSchema,
  RoomAvailabilitySchema,
} from './schemas/availability.js';
export type {
  AvailabilityQuery,
  AvailabilityResponse,
  RoomAvailability,
} from './schemas/availability.js';

// Schemas - Payment
export {
  PaymentMethodSchema,
  PaymentMethodsResponseSchema,
  CostCenterSchema,
  CostCentersResponseSchema,
  AddPaymentSchema,
} from './schemas/payment.js';
export type { PaymentMethod, CostCenter, AddPaymentInput } from './schemas/payment.js';

// Schemas - Webhook
export { WebhookEventSchema } from './schemas/webhook.js';
export type { WebhookEvent, WebhookEventType } from './schemas/webhook.js';

// Schemas - Housekeeping
export {
  UnitSchema,
  UnitStatusSchema,
  UnitsResponseSchema,
  CreateOrderSchema,
  UpdateUnitsStatusSchema,
} from './schemas/housekeeping.js';
export type { Unit, CreateOrderInput, UpdateUnitsStatusInput } from './schemas/housekeeping.js';

// Utils
export { ArtaxApiError } from './utils/retry.js';
export { CircuitBreaker } from './utils/circuit-breaker.js';
export { verifyWebhookSignature } from './utils/webhook-verifier.js';
