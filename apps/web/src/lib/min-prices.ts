import { isArtaxConfigured } from './artax';
import { fetchAvailability } from './availability';
import { getRooms } from './cms';
import { flattenOptions } from './availability';

const CACHE_TTL_MS = 24 * 60 * 60_000;

let cached: { prices: Record<string, number>; at: number } | null = null;
let inflight: Promise<Record<string, number>> | null = null;

const SLUG_TO_CATEGORIES: Record<string, number[]> = {
  confort: [3573, 6704, 3572],
  standard: [3577, 3578],
  luxo: [3574, 6663],
  master: [3580, 3581],
};

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

  let cmsRooms: Awaited<ReturnType<typeof getRooms>> | null = null;
  try {
    cmsRooms = await getRooms();
  } catch {
    // fall through to hardcoded mapping
  }

  const slugCats: Record<string, number[]> = {};
  if (cmsRooms && cmsRooms.length > 0) {
    for (const room of cmsRooms) {
      const cats = room.artaxCategoryIds?.map((r) => r.categoryId) ?? [];
      if (cats.length > 0) slugCats[room.slug] = cats;
    }
  }
  const mapping = { ...SLUG_TO_CATEGORIES, ...slugCats };

  for (const [arrival, departure] of dates) {
    try {
      const data = await fetchAvailability(arrival, departure, 2, 0);
      const options = flattenOptions(data);
      successCount++;

      for (const [slug, catIds] of Object.entries(mapping)) {
        const roomOptions = options.filter(
          (o) => catIds.includes(o.categoryId) && o.allots > 0 && o.price > 0
        );
        for (const opt of roomOptions) {
          if (!prices[slug] || opt.price < prices[slug]) {
            prices[slug] = opt.price;
          }
        }
      }
    } catch {
      // skip failed dates
    }
  }

  if (Object.keys(prices).length > 0 && successCount >= 2) {
    cached = { prices, at: Date.now() };
  }

  return prices;
}
