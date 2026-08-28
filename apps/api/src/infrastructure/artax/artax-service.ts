import { ArtaxClient, BookingStatus } from '@hotel-paraiso/artax-client';
import type {
  AvailabilityQuery,
  AvailabilityResponse,
  Booking,
  BookingListResponse,
  CreateBookingInput,
} from '@hotel-paraiso/artax-client';
import { prisma } from '@hotel-paraiso/database';

/**
 * Converte data da Artax, devolvendo `null` em vez de `Invalid Date`.
 *
 * `new Date(undefined)` não lança — produz um Date inválido que o Prisma aceita e grava.
 * Um erro que se propaga calado é pior que um que estoura; aqui ele estoura.
 */
function parseArtaxDate(value: unknown): Date | null {
  if (typeof value !== 'string' || !value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export class ArtaxService {
  private readonly client: ArtaxClient;

  constructor() {
    const clientId = process.env['ARTAX_CLIENT_ID'] ?? '';
    const clientSecret = process.env['ARTAX_CLIENT_SECRET'] ?? '';

    if (!clientId || !clientSecret) {
      console.warn('ArtaxService: credentials not configured — running in mock mode');
    }

    this.client = new ArtaxClient({
      clientId,
      clientSecret,
    });
  }

  async checkAvailability(query: AvailabilityQuery): Promise<AvailabilityResponse> {
    const result = await this.client.checkAvailability(query);

    // Store snapshot locally
    for (const room of result.rooms) {
      await prisma.availabilitySnapshot.create({
        data: {
          roomId: room.room_type_id,
          date: new Date(query.arrival_date),
          available: room.available,
          price: room.price ?? null,
        },
      });
    }

    return result;
  }

  async listBookings(params?: { page?: number; status?: number }): Promise<BookingListResponse> {
    return this.client.listBookings(params);
  }

  async getBooking(bookingId: number): Promise<Booking> {
    return this.client.getBooking(bookingId);
  }

  /**
   * A Artax devolve apenas `{ booking_id }` ao criar — nunca a reserva completa.
   * O tipo de retorno reflete isso; prometer um `Booking` inteiro fazia o chamador
   * ler campos que nunca chegam.
   */
  async createBooking(input: CreateBookingInput): Promise<{ booking_id: number }> {
    const booking = await this.client.createBooking(input);

    // Store locally + event log
    await prisma.$transaction(async (tx) => {
      await tx.booking.create({
        data: {
          id: booking.booking_id,
          // A criação sempre nasce como pré-reserva na Artax; o status real chega
          // depois, via syncBooking ou webhook. Antes isto lia `booking.status`, que
          // não existe na resposta, e caía no mesmo `1` por acidente em vez de decisão.
          status: BookingStatus.PRE_BOOKING,
          arrivalDate: new Date(input.arrival_date),
          departureDate: new Date(input.departure_date),
          source: 'website',
        },
      });

      await tx.eventLog.create({
        data: {
          aggregateType: 'booking',
          aggregateId: String(booking.booking_id),
          eventType: 'created',
          payload: booking as unknown as object,
          triggeredBy: 'user',
        },
      });
    });

    return booking;
  }

  async syncBooking(bookingId: number): Promise<void> {
    const booking = await this.client.getBooking(bookingId);

    // A Artax devolve `checkin`/`checkout`. O código anterior lia `arrival_date`/
    // `departure_date` — campos que não existem — então gravava `new Date(undefined)`,
    // ou seja Invalid Date, em toda sincronização. Passou despercebido porque o schema
    // afirmava que os campos existiam e nada validava em runtime.
    const arrivalDate = parseArtaxDate(booking.checkin);
    const departureDate = parseArtaxDate(booking.checkout);

    if (!arrivalDate || !departureDate) {
      throw new Error(
        `Reserva ${bookingId}: datas ausentes ou inválidas na resposta da Artax (checkin=${String(booking.checkin)}, checkout=${String(booking.checkout)})`
      );
    }

    // `total_amount` não aparece na listagem. O endpoint singular não foi verificado,
    // então é lido pelo passthrough sem assumir que existe.
    const rawTotal = booking['total_amount'];
    const totalAmount = typeof rawTotal === 'number' ? rawTotal : null;

    await prisma.booking.upsert({
      where: { id: booking.booking_id },
      create: {
        id: booking.booking_id,
        status: booking.status,
        arrivalDate,
        departureDate,
        totalAmount,
        source: 'artax_panel',
        artaxLastSyncAt: new Date(),
      },
      update: {
        status: booking.status,
        totalAmount,
        artaxLastSyncAt: new Date(),
      },
    });
  }

  async getPaymentMethods() {
    return this.client.getPaymentMethods('in');
  }

  async getCostCenters() {
    return this.client.getCostCenters();
  }
}
