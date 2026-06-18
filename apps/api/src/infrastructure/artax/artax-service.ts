import { ArtaxClient } from '@hotel-paraiso/artax-client';
import type {
  AvailabilityQuery,
  AvailabilityResponse,
  Booking,
  BookingListResponse,
  CreateBookingInput,
} from '@hotel-paraiso/artax-client';
import { prisma } from '@hotel-paraiso/database';

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

  async createBooking(input: CreateBookingInput): Promise<Booking> {
    const booking = await this.client.createBooking(input);

    // Store locally + event log
    await prisma.$transaction(async (tx) => {
      await tx.booking.create({
        data: {
          id: booking.booking_id,
          status: booking.status,
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

    await prisma.booking.upsert({
      where: { id: booking.booking_id },
      create: {
        id: booking.booking_id,
        status: booking.status,
        arrivalDate: new Date(booking.arrival_date),
        departureDate: new Date(booking.departure_date),
        totalAmount: booking.total_amount ?? null,
        source: 'artax_panel',
        artaxLastSyncAt: new Date(),
      },
      update: {
        status: booking.status,
        totalAmount: booking.total_amount ?? null,
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
