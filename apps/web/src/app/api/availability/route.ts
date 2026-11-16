import { NextResponse } from 'next/server';
import { getRooms } from '@/lib/cms';
import { isArtaxConfigured } from '@/lib/artax';
import { fetchAvailability } from '@/lib/availability';
import { buildOfferGroups, type GroupInfo } from '@/lib/offers';
import { isRateLimited } from '@/lib/rate-limit';
import { getClientIp } from '@/lib/client-ip';

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
/** Maior ocupação vendida online (Triplos). Acima disso o site leva ao WhatsApp. */
const MAX_ADULTS = 3;

async function loadGroupInfo(): Promise<GroupInfo[]> {
  try {
    const rooms = await getRooms();
    return rooms.map((room) => ({
      slug: room.slug,
      name: room.name,
      description: room.shortDescription ?? '',
    }));
  } catch (error) {
    // Nomes do grupo têm fallback no catálogo; sem CMS a reserva continua funcionando.
    console.warn('[availability] CMS indisponível, usando nomes padrão:', error);
    return [];
  }
}

export async function GET(request: Request) {
  // Endpoint mais caro e mais exposto do sistema: alvo natural de scraping, e cada miss
  // de cache vira uma chamada à Artax, cuja chave morre permanentemente em 102 req/60s.
  // 30/min por IP é folgado para um visitante e apertado para um raspador.
  const ip = getClientIp(request);
  if (await isRateLimited(`availability:${ip}`, 30, 60_000)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const { searchParams } = new URL(request.url);
  const arrivalDate = searchParams.get('arrival_date');
  const departureDate = searchParams.get('departure_date');
  const adults = Number(searchParams.get('adults') ?? '2');
  // `kids` é 0 ou 1: o hotel aceita uma criança de até 12 anos, sem custo (ADR-0014).
  const kids = Number(searchParams.get('kids') ?? '0');

  if (!arrivalDate || !departureDate) {
    return NextResponse.json(
      { error: 'arrival_date and departure_date required' },
      { status: 422 }
    );
  }
  if (!DATE_REGEX.test(arrivalDate) || !DATE_REGEX.test(departureDate)) {
    return NextResponse.json({ error: 'Formato de data inválido (YYYY-MM-DD)' }, { status: 422 });
  }
  if (!Number.isInteger(adults) || adults < 1) {
    return NextResponse.json({ error: 'Número de adultos inválido' }, { status: 422 });
  }
  if (kids !== 0 && kids !== 1) {
    return NextResponse.json({ error: 'Aceitamos até 1 criança por quarto' }, { status: 422 });
  }

  if (!isArtaxConfigured) {
    return NextResponse.json({ error: 'Artax not configured' }, { status: 503 });
  }

  const child = kids === 1;
  if (adults > MAX_ADULTS) {
    return NextResponse.json({ groups: buildOfferGroups({}, [], { adults, child }) });
  }

  try {
    // A criança não vai à Artax: os quartos "Casal" lá têm ocupação total 2 e recusariam
    // 2 adultos + 1 criança, que o hotel aceita. Ela segue no comentário da reserva.
    const [data, groupInfo] = await Promise.all([
      fetchAvailability(arrivalDate, departureDate, adults, 0),
      loadGroupInfo(),
    ]);

    const groups = buildOfferGroups(data, groupInfo, { adults, child }, (categoryId, roomName) =>
      console.warn(
        `[availability] categoria ${categoryId} (${roomName}) publicada na Artax sem ficha no catálogo — fora do site`
      )
    );

    return NextResponse.json({ groups });
  } catch (error) {
    console.error('Availability fetch error:', error);
    return NextResponse.json({ error: 'Erro ao consultar disponibilidade' }, { status: 502 });
  }
}
