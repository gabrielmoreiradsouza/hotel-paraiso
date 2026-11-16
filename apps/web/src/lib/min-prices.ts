import { isArtaxConfigured } from './artax';
import { fetchAvailability } from './availability';
import { buildOfferGroups, minPriceByGroup } from './offers';

const CACHE_TTL_MS = 24 * 60 * 60_000;

let cached: { prices: Record<string, number>; at: number } | null = null;
let inflight: Promise<Record<string, number>> | null = null;

function formatDateBR(offset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d);
}

function sampleDates(count: number): Array<[string, string]> {
  const step = Math.floor(30 / count);
  return Array.from({ length: count }, (_, i) => {
    const offset = i * step + 1;
    return [formatDateBR(offset), formatDateBR(offset + 1)] as [string, string];
  });
}

export async function getMinPrices(): Promise<Record<string, number>> {
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
    return cached.prices;
  }

  if (inflight) return inflight;

  if (!isArtaxConfigured) return {};

  inflight = fetchMinPrices().finally(() => {
    inflight = null;
  });
  return inflight;
}

async function fetchMinPrices(): Promise<Record<string, number>> {
  const dates = sampleDates(5);
  const prices: Record<string, number> = {};
  let successCount = 0;

  for (const [arrival, departure] of dates) {
    try {
      const data = await fetchAvailability(arrival, departure, 2, 0);
      // Mesmo catálogo da busca (ADR-0014): o "a partir de" só cita o que dá para reservar.
      const groupMins = minPriceByGroup(buildOfferGroups(data, [], { adults: 2, child: false }));
      successCount++;

      for (const [slug, price] of Object.entries(groupMins)) {
        const current = prices[slug];
        if (current === undefined || price < current) prices[slug] = price;
      }
    } catch (error) {
      console.warn(`[min-prices] falha em ${arrival}:`, error);
    }
  }

  if (Object.keys(prices).length > 0 && successCount >= 2) {
    cached = { prices, at: Date.now() };
  }

  return prices;
}
