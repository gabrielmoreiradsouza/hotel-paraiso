export const ARTAX_API_VERSION = 'v1';

// Client
export { ArtaxClient } from './client';
export type { ArtaxClientConfig, RawAvailabilityRoom, RawAvailabilityResponse } from './client';

// Schemas - Booking
export {
  BookingStatus,
  BookingStatusSchema,
  BookingSchema,
  BookingListResponseSchema,
  CreateBookingSchema,
  GuestSchema,
} from './schemas/booking';
export type { Booking, BookingListResponse, CreateBookingInput, Guest } from './schemas/booking';

// Schemas - Availability
export {
  AvailabilityQuerySchema,
  AvailabilityResponseSchema,
  RoomAvailabilitySchema,
} from './schemas/availability';
export type {
  AvailabilityQuery,
  AvailabilityResponse,
  RoomAvailability,
} from './schemas/availability';

// Schemas - Payment
export {
  PaymentMethodSchema,
  PaymentMethodsResponseSchema,
  CostCenterSchema,
  CostCentersResponseSchema,
  AddPaymentSchema,
} from './schemas/payment';
export type { PaymentMethod, CostCenter, AddPaymentInput } from './schemas/payment';

// Schemas - Webhook
export { WebhookEventSchema } from './schemas/webhook';
export type { WebhookEvent, WebhookEventType } from './schemas/webhook';

// Schemas - Housekeeping
export {
  UnitSchema,
  UnitStatusSchema,
  UnitsResponseSchema,
  CreateOrderSchema,
  UpdateUnitsStatusSchema,
} from './schemas/housekeeping';
export type { Unit, CreateOrderInput, UpdateUnitsStatusInput } from './schemas/housekeeping';

// Utils
export { ArtaxApiError } from './utils/retry';
export { CircuitBreaker } from './utils/circuit-breaker';
export { verifyWebhookSignature } from './utils/webhook-verifier';
