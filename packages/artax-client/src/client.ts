import { CircuitBreaker } from './utils/circuit-breaker';
import { RateLimiter } from './utils/rate-limiter';
import { ArtaxApiError, withRetry } from './utils/retry';

import type { AvailabilityQuery, AvailabilityResponse } from './schemas/availability';
import { BookingListResponseSchema } from './schemas/booking';
import type { Booking, BookingListResponse, CreateBookingInput } from './schemas/booking';
import type { AddPaymentInput } from './schemas/payment';
import type { CreateOrderInput, UpdateUnitsStatusInput } from './schemas/housekeeping';

/**
 * Validação de resposta, o antídoto para o `as T`.
 *
 * O cast silencioso foi o que permitiu o schema de reservas divergir da API real sem um
 * único erro em meses: o TypeScript acreditava num formato que a Artax nunca enviou.
 *
 * A validação aqui **reporta mas não derruba**: divergência vira log, e o dado bruto
 * segue adiante. É deliberado. Um `.parse()` estrito transformaria qualquer campo que a
 * Artax mudasse — ou qualquer imprecisão remanescente nos nossos schemas — em queda total
 * do motor de reservas. O ganho que importa agora é tornar a divergência *visível*; hoje
 * ela é invisível. Depois de um período com log limpo, trocar para estrito é uma linha.
 *
 * Só endpoints com formato verificado contra a API real recebem schema. Validar contra
 * um schema não conferido recriaria o problema em vez de resolvê-lo.
 */
interface ResponseSchema<T> {
  safeParse(
    data: unknown
  ): { success: true; data: T } | { success: false; error: { issues?: unknown[] } };
}

export interface ArtaxClientConfig {
  baseUrl?: string;
  clientId: string;
  clientSecret: string;
  timeoutMs?: number;
}

export interface RawAvailabilityRoom {
  room_name: string;
  rateplan_id: number;
  allots: number;
  price: number;
  capacity?: { adults: number; kids?: number; children?: number };
}

export interface RawAvailabilityResponse {
  rooms?: Record<string, Record<string, RawAvailabilityRoom>>;
  [key: string]: unknown;
}

export interface RawBooking {
  booking_id?: number;
  status?: number;
  checkin?: string;
  checkout?: string;
  [key: string]: unknown;
}

/**
 * Formato real devolvido por GET /bookings.
 *
 * Difere de `BookingListResponseSchema` (que descreve `arrival_date`/`departure_date` e
 * um objeto `pagination`). O schema nunca foi validado em runtime — `request` apenas faz
 * cast — então a divergência passou despercebida. Este tipo reflete o que a API entrega
 * de fato; reconciliar os dois é trabalho à parte.
 */
export interface RawBookingListResponse {
  bookings?: RawBooking[];
  total_bookings?: number;
  total_pages?: number;
  [key: string]: unknown;
}

export class ArtaxClient {
  private readonly baseUrl: string;
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly timeoutMs: number;
  private readonly circuitBreaker = new CircuitBreaker();
  // DR-001: Artax dá warning em 100 req/60s e DESATIVA a chave permanentemente em 102.
  // O limiter é por processo — apps/web e apps/api compartilham a mesma chave, e cada
  // réplica tem o seu contador. 50 é o teto que a DR-001 exige justamente por isso.
  private readonly rateLimiter = new RateLimiter(50, 60_000);

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
    // Único endpoint com formato verificado contra a API real (2026-08-26), portanto o
    // único que valida. Os demais seguem com cast até serem conferidos do mesmo jeito.
    return this.get<BookingListResponse>(
      `/bookings${qs ? `?${qs}` : ''}`,
      BookingListResponseSchema as unknown as ResponseSchema<BookingListResponse>
    );
  }

  /** Listagem no formato nativo da Artax. Ver `RawBookingListResponse`. */
  async listBookingsRaw(params?: { page?: number }): Promise<RawBookingListResponse> {
    const qs = params?.page ? `?page=${params.page}` : '';
    return this.get<RawBookingListResponse>(`/bookings${qs}`);
  }

  async getBooking(bookingId: number): Promise<Booking> {
    return this.get<Booking>(`/booking/${bookingId}`);
  }

  async checkAvailability(query: AvailabilityQuery): Promise<AvailabilityResponse> {
    return this.checkAvailabilityRaw(query) as unknown as Promise<AvailabilityResponse>;
  }

  /** Returns the native Artax category/rate-plan response used by the booking site. */
  async checkAvailabilityRaw(query: AvailabilityQuery): Promise<RawAvailabilityResponse> {
    const params = new URLSearchParams({
      arrival_date: query.arrival_date,
      departure_date: query.departure_date,
    });
    if (query.adults) params.set('adults', String(query.adults));
    const kids = query.kids ?? query.children;
    if (kids !== undefined) params.set('kids', String(kids));
    return this.get<RawAvailabilityResponse>(`/rooms/availability?${params.toString()}`);
  }

  async createBooking(input: CreateBookingInput): Promise<{ booking_id: number }> {
    // Artax expects: POST /booking/create with specific format
    // room_units keyed by category ID, guest object (not array)
    const artaxPayload: Record<string, unknown> = {
      arrival_date: input.arrival_date,
      departure_date: input.departure_date,
      guest: {
        first_name: input.guests[0]?.name?.split(' ')[0] ?? '',
        last_name: input.guests[0]?.name?.split(' ').slice(1).join(' ') ?? '',
        phone: input.guests[0]?.phone ?? '',
        email: input.guests[0]?.email ?? '',
        type: 'guest',
      },
      room_units: {} as Record<string, unknown>,
    };

    const ratePlanId = input.rooms[0]?.rate_plan_id;
    if (ratePlanId) artaxPayload['rateplan_id'] = ratePlanId;
    if (input.notes) artaxPayload['comment'] = input.notes;

    // Map rooms to Artax format: room_units[category_id] = { adults, kids, guests }
    for (const room of input.rooms) {
      (artaxPayload['room_units'] as Record<string, unknown>)[String(room.room_type_id)] = {
        adults: room.adults,
        kids: room.children ?? 0,
        guests: [
          {
            first_name: input.guests[0]?.name?.split(' ')[0] ?? '',
            last_name: input.guests[0]?.name?.split(' ').slice(1).join(' ') ?? '',
          },
        ],
      };
    }

    return this.post<{ booking_id: number }>('/booking/create', artaxPayload);
  }

  /**
   * Cria reserva enviando o payload já no formato nativo da Artax.
   *
   * Existe para o motor de reservas do site, que monta o payload a partir da resposta de
   * disponibilidade. Passa pelo mesmo pipeline protegido (rate limiter, circuit breaker,
   * timeout) — que é o ponto: nenhuma chamada à Artax pode escapar da DR-001.
   */
  async createBookingRaw(payload: Record<string, unknown>): Promise<{ booking_id: number }> {
    return this.post<{ booking_id: number }>('/booking/create', payload);
  }

  async webCheckin(
    bookingId: number,
    data: { holder: Record<string, unknown>; guests?: Record<string, unknown>[] }
  ): Promise<unknown> {
    return this.post(`/booking/${bookingId}/web-check-in`, data);
  }

  // --- Payments ---

  async addPayments(bookingId: number, payments: AddPaymentInput[]): Promise<unknown> {
    return this.post(`/booking/${bookingId}/payments`, { payments });
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

  private async get<T>(path: string, schema?: ResponseSchema<T>): Promise<T> {
    return this.request<T>('GET', path, undefined, schema);
  }

  private async post<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>('POST', path, body);
  }

  private async patch<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>('PATCH', path, body);
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
    schema?: ResponseSchema<T>
  ): Promise<T> {
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
          'User-Agent': 'HotelParaiso/1.0',
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
        const data = await response.json();

        if (schema) {
          const result = schema.safeParse(data);
          if (!result.success) {
            // Reporta sem derrubar — ver nota sobre `ResponseSchema` acima.
            console.error(
              `[artax] resposta de ${method} ${path} divergiu do schema:`,
              JSON.stringify(result.error.issues?.slice(0, 5))
            );
          } else {
            return result.data;
          }
        }

        return data as T;
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
