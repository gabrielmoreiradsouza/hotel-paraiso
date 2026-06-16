import { CircuitBreaker } from './utils/circuit-breaker.js';
import { RateLimiter } from './utils/rate-limiter.js';
import { ArtaxApiError, withRetry } from './utils/retry.js';

import type { AvailabilityQuery, AvailabilityResponse } from './schemas/availability.js';
import type { Booking, BookingListResponse, CreateBookingInput } from './schemas/booking.js';
import type { AddPaymentInput } from './schemas/payment.js';
import type { CreateOrderInput, UpdateUnitsStatusInput } from './schemas/housekeeping.js';

export interface ArtaxClientConfig {
  baseUrl?: string;
  clientId: string;
  clientSecret: string;
  timeoutMs?: number;
}

export class ArtaxClient {
  private readonly baseUrl: string;
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly timeoutMs: number;
  private readonly circuitBreaker = new CircuitBreaker();
  // Artax limit: 100/60s. We stay at 90 to be safe.
  private readonly rateLimiter = new RateLimiter(90, 60_000);

  constructor(config: ArtaxClientConfig) {
    this.baseUrl = config.baseUrl ?? 'https://artaxnet.com/pms-api/v1';
    this.clientId = config.clientId;
    this.clientSecret = config.clientSecret;
    this.timeoutMs = config.timeoutMs ?? 5000;
  }

  // --- Bookings ---

  async listBookings(params?: {
    page?: number;
    status?: number;
    arrival_from?: string;
    arrival_to?: string;
  }): Promise<BookingListResponse> {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.status) query.set('status', String(params.status));
    if (params?.arrival_from) query.set('arrival_from', params.arrival_from);
    if (params?.arrival_to) query.set('arrival_to', params.arrival_to);
    const qs = query.toString();
    return this.get<BookingListResponse>(`/bookings${qs ? `?${qs}` : ''}`);
  }

  async getBooking(bookingId: number): Promise<Booking> {
    return this.get<Booking>(`/bookings/${bookingId}`);
  }

  async checkAvailability(query: AvailabilityQuery): Promise<AvailabilityResponse> {
    const params = new URLSearchParams({
      arrival_date: query.arrival_date,
      departure_date: query.departure_date,
    });
    if (query.adults) params.set('adults', String(query.adults));
    if (query.children) params.set('children', String(query.children));
    return this.get<AvailabilityResponse>(`/availability?${params.toString()}`);
  }

  async createBooking(input: CreateBookingInput): Promise<Booking> {
    return this.post<Booking>('/bookings', input);
  }

  async webCheckin(
    bookingId: number,
    data: { holder: Record<string, unknown>; guests?: Record<string, unknown>[] }
  ): Promise<unknown> {
    return this.post(`/bookings/${bookingId}/checkin`, data);
  }

  // --- Payments ---

  async addPayments(bookingId: number, payments: AddPaymentInput[]): Promise<unknown> {
    return this.post(`/bookings/${bookingId}/payments`, { payments });
  }

  async getPaymentMethods(type?: 'in' | 'out' | 'both'): Promise<{
    payment_methods: Array<{ id: number; name: string; type: string }>;
  }> {
    const qs = type ? `?type=${type}` : '';
    return this.get(`/payment-methods${qs}`);
  }

  async getCostCenters(): Promise<{
    cost_centers: Array<{ id: number; name: string; code: string }>;
  }> {
    return this.get('/cost-centers');
  }

  // --- Attachments ---

  async attachFile(bookingId: number, data: { url?: string; file?: unknown }): Promise<unknown> {
    return this.post(`/bookings/${bookingId}/attachments`, data);
  }

  // --- Housekeeping ---

  async listUnits(params?: { page?: number }): Promise<unknown> {
    const qs = params?.page ? `?page=${params.page}` : '';
    return this.get(`/units${qs}`);
  }

  async createHousekeepingOrder(input: CreateOrderInput): Promise<unknown> {
    return this.post('/housekeeping/orders', input);
  }

  async closeHousekeepingOrder(orderId: number, data: { notes?: string }): Promise<unknown> {
    return this.post(`/housekeeping/orders/${orderId}/close`, data);
  }

  async updateUnitsStatus(input: UpdateUnitsStatusInput): Promise<unknown> {
    return this.patch('/units/status', input);
  }

  // --- HTTP internals ---

  private async get<T>(path: string): Promise<T> {
    return this.request<T>('GET', path);
  }

  private async post<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>('POST', path, body);
  }

  private async patch<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>('PATCH', path, body);
  }

  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    if (this.circuitBreaker.isOpen) {
      throw new ArtaxApiError(503, 'Circuit breaker is open — Artax API unavailable', {
        circuitState: this.circuitBreaker.currentState,
      });
    }

    await this.rateLimiter.waitIfNeeded();

    return withRetry(async () => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

      try {
        const headers: Record<string, string> = {
          ClientId: this.clientId,
          ClientSecret: this.clientSecret,
          Accept: 'application/json',
        };

        const init: RequestInit = {
          method,
          headers,
          signal: controller.signal,
        };

        if (body) {
          headers['Content-Type'] = 'application/json';
          init.body = JSON.stringify(body);
        }

        const response = await fetch(`${this.baseUrl}${path}`, init);

        if (!response.ok) {
          const errorBody = await response.text().catch(() => '');
          this.circuitBreaker.recordFailure();
          throw new ArtaxApiError(response.status, `Artax API error: ${response.status}`, {
            path,
            method,
            body: errorBody,
          });
        }

        this.circuitBreaker.recordSuccess();
        return (await response.json()) as T;
      } catch (error) {
        if (error instanceof ArtaxApiError) throw error;
        this.circuitBreaker.recordFailure();
        throw new ArtaxApiError(0, `Artax API request failed: ${String(error)}`, {
          path,
          method,
        });
      } finally {
        clearTimeout(timeout);
      }
    });
  }
}
