import type { RawAvailabilityResponse } from '@hotel-paraiso/artax-client';
import {
  ACCOMMODATIONS,
  canHost,
  getAccommodation,
  type Accommodation,
  type RoomGroup,
} from './accommodations';

const CATALOG_ORDER = new Map(ACCOMMODATIONS.map((a, index) => [a.categoryId, index]));
const catalogIndex = (categoryId: number) => CATALOG_ORDER.get(categoryId) ?? Infinity;

/** Uma categoria da Artax à venda para a busca feita, já com a ficha do catálogo. */
export interface AccommodationOffer extends Accommodation {
  rateplanId: number;
  allots: number;
  /** Total da estadia (não a diária), como a Artax devolve. */
  price: number;
}

export interface OfferGroup {
  slug: RoomGroup;
  name: string;
  description: string;
  options: AccommodationOffer[];
}

export interface GroupInfo {
  slug: string;
  name: string;
  description: string;
}

export const GROUP_ORDER: readonly RoomGroup[] = ['confort', 'standard', 'luxo', 'master'];

const DEFAULT_GROUP_NAMES: Record<RoomGroup, string> = {
  confort: 'Confort',
  standard: 'Standard',
  luxo: 'Luxo',
  master: 'Suíte Master',
};

/**
 * Monta as opções por grupo a partir da disponibilidade da Artax (ADR-0014).
 *
 * Sem escolha automática: cada categoria que cabe na ocupação vira uma opção. Categoria
 * sem ficha no catálogo fica de fora e é reportada — nunca se inventa comodidade.
 */
export function buildOfferGroups(
  data: RawAvailabilityResponse,
  groupInfo: readonly GroupInfo[],
  query: { adults: number; child: boolean },
  onUnknownCategory?: (categoryId: number, roomName: string) => void
): OfferGroup[] {
  const byGroup = new Map<RoomGroup, AccommodationOffer[]>();

  for (const [rawCategoryId, plans] of Object.entries(data.rooms ?? {})) {
    const categoryId = Number(rawCategoryId);
    const planList = Object.values(plans);
    const accommodation = getAccommodation(categoryId);
    if (!accommodation) {
      onUnknownCategory?.(categoryId, planList[0]?.room_name ?? '');
      continue;
    }
    if (!canHost(accommodation, query.adults, query.child)) continue;

    const best = planList
      .filter(
        (plan) =>
          plan.allots > 0 &&
          plan.price > 0 &&
          (plan.capacity?.adults ?? query.adults) >= query.adults
      )
      .sort((a, b) => a.price - b.price)[0];
    if (!best) continue;

    const list = byGroup.get(accommodation.group) ?? [];
    list.push({
      ...accommodation,
      rateplanId: best.rateplan_id,
      allots: best.allots,
      price: best.price,
    });
    byGroup.set(accommodation.group, list);
  }

  return GROUP_ORDER.map((slug) => {
    const info = groupInfo.find((g) => g.slug === slug);
    return {
      slug,
      name: info?.name ?? DEFAULT_GROUP_NAMES[slug],
      description: info?.description ?? '',
      options: (byGroup.get(slug) ?? []).sort(
        (a, b) => a.price - b.price || catalogIndex(a.categoryId) - catalogIndex(b.categoryId)
      ),
    };
  });
}

/** Menor preço por grupo, para o "a partir de". */
export function minPriceByGroup(groups: readonly OfferGroup[]): Partial<Record<RoomGroup, number>> {
  const result: Partial<Record<RoomGroup, number>> = {};
  for (const group of groups) {
    const first = group.options[0];
    if (first) result[group.slug] = first.price;
  }
  return result;
}
