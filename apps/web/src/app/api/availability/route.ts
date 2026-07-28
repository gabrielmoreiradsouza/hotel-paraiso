import { NextResponse } from 'next/server';

const ARTAX_URL = 'https://artaxnet.com/pms-api/v1';
const CLIENT_ID = process.env['ARTAX_CLIENT_ID'] ?? '';
const CLIENT_SECRET = process.env['ARTAX_CLIENT_SECRET'] ?? '';

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

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

  const params = new URLSearchParams({
    arrival_date: arrivalDate,
    departure_date: departureDate,
    adults,
    kids,
  });

  try {
    const response = await fetch(`${ARTAX_URL}/rooms/availability?${params}`, {
      headers: {
        ClientId: CLIENT_ID,
        ClientSecret: CLIENT_SECRET,
        Accept: 'application/json',
        'User-Agent': 'HotelParaiso/1.0',
      },
    });

    const data = await response.json();

    // Transform Artax response to frontend-friendly format
    const artaxRooms = (data.rooms ?? {}) as Record<
      string,
      Record<
        string,
        {
          room_name: string;
          rateplan_id: number;
          allots: number;
          price: number;
          capacity: { adults: number; kids: number };
        }
      >
    >;

    const rooms = Object.entries(artaxRooms).flatMap(([categoryId, plans]) =>
      Object.entries(plans).map(([_planId, info]) => ({
        category_id: Number(categoryId),
        rateplan_id: info.rateplan_id,
        name: info.room_name,
        available: info.allots > 0,
        allots: info.allots,
        price: info.price,
        capacity: info.capacity,
      }))
    );

    return NextResponse.json({ rooms });
  } catch (error) {
    console.error('Availability fetch error:', error);
    return NextResponse.json({ error: 'Erro ao consultar disponibilidade' }, { status: 502 });
  }
}
