import { NextResponse } from 'next/server';
import { getRoomImageUrl, getRooms } from '@/lib/cms';

// Kept as a static require so Next bundles the workspace source without widening
// this app's TypeScript rootDir. The web package does not currently declare the
// workspace dependency and this integration is intentionally scoped to this route.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { ArtaxClient } = require('../../../../../../packages/artax-client/src/client') as {
  ArtaxClient: new (config: { clientId: string; clientSecret: string }) => {
    checkAvailabilityRaw(query: {
      arrival_date: string;
      departure_date: string;
      adults: number;
      children: number;
    }): Promise<RawAvailabilityResponse>;
  };
};

const CLIENT_ID = process.env['ARTAX_CLIENT_ID'] ?? '';
const CLIENT_SECRET = process.env['ARTAX_CLIENT_SECRET'] ?? '';

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

interface RawAvailabilityRoom {
  room_name: string;
  rateplan_id: number;
  allots: number;
  price: number;
  capacity?: { adults: number; kids?: number; children?: number };
}

interface RawAvailabilityResponse {
  rooms?: Record<string, Record<string, RawAvailabilityRoom>>;
}

const artax = new ArtaxClient({ clientId: CLIENT_ID, clientSecret: CLIENT_SECRET });

type ArtaxOption = RawAvailabilityRoom & { categoryId: number };

function selectOption(options: ArtaxOption[], adults: number): ArtaxOption | undefined {
  const target = adults === 1 ? 'individual' : adults === 2 ? 'casal' : 'triplo';
  const fitting = options.filter(
    (option) => option.allots > 0 && (option.capacity?.adults ?? adults) >= adults
  );
  return (
    fitting
      .filter((option) => option.room_name.toLowerCase().includes(target))
      .sort((a, b) => a.price - b.price)[0] ?? fitting.sort((a, b) => a.price - b.price)[0]
  );
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const arrivalDate = searchParams.get('arrival_date');
  const departureDate = searchParams.get('departure_date');
  const adults = searchParams.get('adults') ?? '2';
  const kids = searchParams.get('kids') ?? '0';

  if (!arrivalDate || !departureDate) {
    return NextResponse.json(
      { error: 'arrival_date and departure_date required' },
      { status: 422 }
    );
  }

  // Validate date format
  if (!DATE_REGEX.test(arrivalDate) || !DATE_REGEX.test(departureDate)) {
    return NextResponse.json({ error: 'Formato de data inválido (YYYY-MM-DD)' }, { status: 422 });
  }

  // Validate adults/kids as positive integers
  const adultsNum = Number(adults);
  const kidsNum = Number(kids);
  if (!Number.isInteger(adultsNum) || adultsNum < 1) {
    return NextResponse.json({ error: 'Número de adultos inválido' }, { status: 422 });
  }
  if (!Number.isInteger(kidsNum) || kidsNum < 0) {
    return NextResponse.json({ error: 'Número de crianças inválido' }, { status: 422 });
  }

  if (!CLIENT_ID || !CLIENT_SECRET) {
    return NextResponse.json({ error: 'Artax not configured' }, { status: 503 });
  }

  try {
    const [data, cmsRooms] = await Promise.all([
      artax.checkAvailabilityRaw({
        arrival_date: arrivalDate,
        departure_date: departureDate,
        adults: adultsNum,
        children: kidsNum,
      }),
      getRooms(),
    ]);

    // Transform Artax response to frontend-friendly format
    const byCategory = new Map<number, ArtaxOption[]>();
    for (const [categoryId, plans] of Object.entries(data.rooms ?? {})) {
      byCategory.set(
        Number(categoryId),
        Object.values(plans).map((plan) => ({ ...plan, categoryId: Number(categoryId) }))
      );
    }

    const rooms = cmsRooms.map((cmsRoom) => {
      const categoryIds =
        cmsRoom.artaxCategoryIds?.map((row) => row.categoryId) ??
        (cmsRoom.artaxRoomTypeId ? [cmsRoom.artaxRoomTypeId] : []);
      const options = categoryIds.flatMap((categoryId) => byCategory.get(categoryId) ?? []);
      const availableOptions = options.filter((option) => option.allots > 0);
      const selected = selectOption(options, adultsNum);
      const minPrice = availableOptions.length
        ? Math.min(...availableOptions.map((option) => option.price))
        : null;
      const allots = availableOptions.reduce((total, option) => total + option.allots, 0);

      return {
        cmsRoomId: cmsRoom.id,
        cmsName: cmsRoom.name,
        cmsSlug: cmsRoom.slug,
        cmsImage: getRoomImageUrl(cmsRoom),
        cmsAmenities: cmsRoom.amenities?.map((amenity) => amenity.name) ?? [],
        cmsDescription: cmsRoom.shortDescription ?? '',
        minPrice,
        available: Boolean(selected),
        category_id: selected?.categoryId ?? categoryIds[0] ?? 0,
        rateplan_id: selected?.rateplan_id ?? 0,
        name: cmsRoom.name,
        allots,
        price: selected?.price ?? minPrice ?? 0,
        capacity: {
          adults: selected?.capacity?.adults ?? cmsRoom.capacity?.adults ?? adultsNum,
          kids:
            selected?.capacity?.kids ??
            selected?.capacity?.children ??
            cmsRoom.capacity?.children ??
            0,
        },
      };
    });

    return NextResponse.json({ rooms });
  } catch (error) {
    console.error('Availability fetch error:', error);
    return NextResponse.json({ error: 'Erro ao consultar disponibilidade' }, { status: 502 });
  }
}
