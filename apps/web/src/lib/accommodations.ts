/**
 * Catálogo das acomodações vendidas no site, uma ficha por categoria da Artax (ADR-0014).
 *
 * A Artax decide o que está à venda e por quanto; esta ficha decide como apresentar e
 * quem cabe. As comodidades vêm da lista do hotel (16/11/2026), não do cadastro da Artax,
 * que está errado (Casal Confort aparece com frigobar, Triplo Master sem).
 *
 * Sem dependência de servidor: é importado também pelos componentes de reserva.
 */

export type RoomGroup = 'confort' | 'standard' | 'luxo' | 'master';
export type Climate = 'ar' | 'ventilador';

export interface Accommodation {
  categoryId: number;
  group: RoomGroup;
  name: string;
  bed: string;
  climate: Climate;
  minibar: boolean;
  maxAdults: number;
  acceptsChild: boolean;
  /** Mostrado antes de confirmar, no email, no WhatsApp e no comentário da Artax. */
  warning: string | null;
  /** Vazio quando o hotel ainda não mandou foto — nunca usar foto de outra acomodação. */
  images: string[];
}

export const CHILD_MAX_AGE = 12;

export const COMPACT_ROOM_WARNING =
  'Quarto compacto. Equipado com TV e banheiro privativo, oferece um ambiente confortável e funcional. Por ser voltado para o fundo do hotel, garante maior silêncio e tranquilidade durante a estadia.';

export const ACCOMMODATIONS: readonly Accommodation[] = [
  {
    categoryId: 3573,
    group: 'confort',
    name: 'Individual Confort',
    bed: '1 cama de solteiro',
    climate: 'ventilador',
    minibar: false,
    maxAdults: 1,
    acceptsChild: false,
    warning: COMPACT_ROOM_WARNING,
    images: [],
  },
  {
    categoryId: 6704,
    group: 'confort',
    name: 'Casal Confort',
    bed: '1 cama de casal',
    climate: 'ventilador',
    minibar: false,
    maxAdults: 2,
    acceptsChild: true,
    warning: null,
    images: [],
  },
  {
    categoryId: 3572,
    group: 'confort',
    name: 'Duplo Solteiro Confort',
    bed: '2 camas de solteiro',
    climate: 'ventilador',
    minibar: false,
    maxAdults: 2,
    acceptsChild: true,
    warning: null,
    images: [
      '/images/rooms/confort-3.jpg',
      '/images/rooms/confort-2.jpg',
      '/images/rooms/confort-1.jpg',
    ],
  },
  {
    categoryId: 3577,
    group: 'standard',
    name: 'Casal Standard',
    bed: '1 cama de casal',
    climate: 'ar',
    minibar: false,
    maxAdults: 2,
    acceptsChild: true,
    warning: null,
    images: [],
  },
  {
    categoryId: 3578,
    group: 'standard',
    name: 'Triplo Família Standard',
    bed: 'Camas para até 3 pessoas',
    climate: 'ar',
    minibar: false,
    maxAdults: 3,
    acceptsChild: true,
    warning: null,
    images: [
      '/images/rooms/standard-triplo.jpg',
      '/images/rooms/standard-triplo-2.jpg',
      '/images/rooms/standard-bath.jpg',
    ],
  },
  {
    categoryId: 3574,
    group: 'luxo',
    name: 'Casal Luxo',
    bed: '1 cama de casal',
    climate: 'ventilador',
    minibar: true,
    maxAdults: 2,
    acceptsChild: true,
    warning: null,
    images: [
      '/images/rooms/luxo-casal.jpg',
      '/images/rooms/luxo-2.jpg',
      '/images/rooms/luxo-casal-3.jpg',
      '/images/rooms/luxo-bath.jpg',
    ],
  },
  {
    categoryId: 6663,
    group: 'luxo',
    name: 'Duplo Solteiro Luxo',
    bed: '2 camas de solteiro',
    climate: 'ventilador',
    minibar: true,
    // A Artax aceita 3 e cobra R$ 554 por 3 — o hotel definiu venda para até 2.
    maxAdults: 2,
    acceptsChild: true,
    warning: null,
    images: ['/images/rooms/luxo-triplo-3.jpg', '/images/rooms/luxo-triplo.jpg'],
  },
  {
    categoryId: 3580,
    group: 'master',
    name: 'Casal Master',
    bed: '1 cama de casal',
    climate: 'ar',
    minibar: true,
    maxAdults: 2,
    acceptsChild: true,
    warning: null,
    images: [
      '/images/rooms/master-casal-3.jpg',
      '/images/rooms/master-suite.jpg',
      '/images/rooms/master-casal.jpg',
      '/images/rooms/master-bath.jpg',
    ],
  },
  {
    categoryId: 3581,
    group: 'master',
    name: 'Triplo Família Master',
    bed: '1 cama de casal + 1 cama de solteiro',
    climate: 'ar',
    minibar: true,
    maxAdults: 3,
    acceptsChild: true,
    warning: null,
    images: ['/images/rooms/triplo-master.jpg'],
  },
];

const BY_CATEGORY = new Map(ACCOMMODATIONS.map((a) => [a.categoryId, a]));

export function getAccommodation(categoryId: number): Accommodation | undefined {
  return BY_CATEGORY.get(categoryId);
}

export function canHost(accommodation: Accommodation, adults: number, child: boolean): boolean {
  return adults >= 1 && adults <= accommodation.maxAdults && (!child || accommodation.acceptsChild);
}

export function climateLabel(climate: Climate): string {
  return climate === 'ar' ? 'Ar-condicionado' : 'Ventilador';
}

/** Resumo de uma linha para email, WhatsApp e comentário da Artax. */
export function describeAccommodation(accommodation: Accommodation): string {
  return [
    accommodation.bed,
    climateLabel(accommodation.climate).toLowerCase(),
    accommodation.minibar ? 'com frigobar' : 'sem frigobar',
  ].join(', ');
}

export function isRoomGroup(value: string): value is RoomGroup {
  return value === 'confort' || value === 'standard' || value === 'luxo' || value === 'master';
}

export function accommodationsOf(group: string): Accommodation[] {
  return ACCOMMODATIONS.filter((a) => a.group === group);
}

/**
 * Tira "frigobar" das comodidades de um grupo quando nem toda acomodação dele tem.
 * O CMS de produção ainda lista frigobar no Confort e no Standard, e um hóspede já
 * reclamou disso — a exibição não pode depender de alguém corrigir o banco.
 */
export function cleanGroupAmenities(group: string, amenities: string[]): string[] {
  if (!isRoomGroup(group)) return amenities;
  const everyoneHasMinibar = accommodationsOf(group).every((a) => a.minibar);
  return everyoneHasMinibar ? amenities : amenities.filter((a) => !/frigobar|minibar/i.test(a));
}
