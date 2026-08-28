import type { RawAvailabilityRoom, RawAvailabilityResponse } from '@hotel-paraiso/artax-client';
import { getArtaxClient } from './artax';

/**
 * Consulta de disponibilidade com o cache de 5 minutos exigido pela DR-001.
 *
 * Vive fora da rota porque `/api/bookings` também precisa: antes de criar uma reserva é
 * obrigatório reconferir que a categoria, o rate plan e a ocupação que o cliente mandou
 * existem de verdade. Com o cache compartilhado, essa reconferência quase sempre sai de
 * graça — sem ele, cada reserva gastaria mais uma chamada da cota da Artax.
 *
 * O cache é por processo. Não substitui um store compartilhado num cenário multi-réplica,
 * mas corta a esmagadora maioria das repetições (campanha concentra gente nas mesmas datas).
 */

const AVAILABILITY_TTL_MS = 5 * 60_000;
const MAX_CACHE_ENTRIES = 500;

const cache = new Map<string, { at: number; data: RawAvailabilityResponse }>();

function cacheKey(arrival: string, departure: string, adults: number, kids: number): string {
  return `${arrival}|${departure}|${adults}|${kids}`;
}

function readCache(key: string): RawAvailabilityResponse | null {
  const hit = cache.get(key);
  if (!hit) return null;
  if (Date.now() - hit.at >= AVAILABILITY_TTL_MS) {
    cache.delete(key);
    return null;
  }
  return hit.data;
}

function writeCache(key: string, data: RawAvailabilityResponse): void {
  // Varre expirados antes de inserir — o Map não pode crescer sem limite.
  const now = Date.now();
  for (const [k, v] of cache) {
    if (now - v.at >= AVAILABILITY_TTL_MS) cache.delete(k);
  }
  if (cache.size >= MAX_CACHE_ENTRIES) {
    const oldest = cache.keys().next();
    if (!oldest.done) cache.delete(oldest.value);
  }
  cache.set(key, { at: now, data });
}

export async function fetchAvailability(
  arrivalDate: string,
  departureDate: string,
  adults: number,
  kids: number
): Promise<RawAvailabilityResponse> {
  const key = cacheKey(arrivalDate, departureDate, adults, kids);
  const cached = readCache(key);
  if (cached) return cached;

  const data = await getArtaxClient().checkAvailabilityRaw({
    arrival_date: arrivalDate,
    departure_date: departureDate,
    adults,
    kids,
  });
  writeCache(key, data);
  return data;
}

export type ArtaxOption = RawAvailabilityRoom & { categoryId: number };

/** Achata a resposta da Artax (categoria → rate plans) numa lista de opções. */
export function flattenOptions(data: RawAvailabilityResponse): ArtaxOption[] {
  const options: ArtaxOption[] = [];
  for (const [categoryId, plans] of Object.entries(data.rooms ?? {})) {
    for (const plan of Object.values(plans)) {
      options.push({ ...plan, categoryId: Number(categoryId) });
    }
  }
  return options;
}

export interface VerifiedOffer {
  categoryId: number;
  rateplanId: number;
  /** Preço vindo da Artax — nunca do cliente. */
  price: number;
  roomName: string;
}

/**
 * Confirma no servidor que a oferta escolhida pelo cliente existe de fato.
 *
 * `categoryId`, `rateplanId`, `adults` e `kids` chegam no corpo do POST, ou seja são
 * controlados por quem chama. Sem esta conferência dá para reservar uma categoria que
 * não está disponível, furar a ocupação máxima, ou combinar um rate plan barato com uma
 * categoria cara. Devolve `null` quando a combinação não existe na disponibilidade real.
 */
export async function verifyOffer(params: {
  checkin: string;
  checkout: string;
  categoryId: number;
  rateplanId: number;
  adults: number;
  kids: number;
}): Promise<VerifiedOffer | null> {
  const data = await fetchAvailability(params.checkin, params.checkout, params.adults, params.kids);

  const match = flattenOptions(data).find(
    (option) => option.categoryId === params.categoryId && option.rateplan_id === params.rateplanId
  );

  if (!match) return null;
  if (match.allots <= 0) return null;

  // A capacidade declarada pela Artax manda. Se ela não informa, o filtro de ocupação
  // já foi aplicado na própria consulta (adults/kids vão na query).
  const maxAdults = match.capacity?.adults;
  if (maxAdults !== undefined && params.adults > maxAdults) return null;

  const maxKids = match.capacity?.kids ?? match.capacity?.children;
  if (maxKids !== undefined && params.kids > maxKids) return null;

  return {
    categoryId: match.categoryId,
    rateplanId: match.rateplan_id,
    price: match.price,
    roomName: match.room_name,
  };
}
