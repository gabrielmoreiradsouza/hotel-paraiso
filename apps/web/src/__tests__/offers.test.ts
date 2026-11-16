import { describe, expect, it } from 'vitest';
import type { RawAvailabilityResponse } from '@hotel-paraiso/artax-client';
import { buildOfferGroups, minPriceByGroup } from '../lib/offers';
import { ACCOMMODATIONS, canHost, getAccommodation } from '../lib/accommodations';

function plan(roomName: string, price: number, adults: number, allots = 2) {
  return { room_name: roomName, rateplan_id: 2472, allots, price, capacity: { adults, kids: 1 } };
}

// Formato real devolvido pela Artax em 16/11/2026 (2 adultos, 1 noite).
const twoAdults: RawAvailabilityResponse = {
  rooms: {
    '3572': { '2472': plan('Duplo Solteiro Confort', 145, 2) },
    '6704': { '2472': plan('Casal Confort', 145, 2) },
    '3577': { '2472': plan('Casal Standard', 209, 2) },
    '3578': { '2472': plan('Triplo Familia Standard', 216, 3, 1) },
    '3574': { '2472': plan('Casal Luxo', 165, 2) },
    '6663': { '2472': plan('Duplo Solteiro Luxo', 164, 3, 1) },
    '3580': { '2472': plan('Casal Master', 232, 2) },
    '3581': { '2472': plan('Triplo Familia Master', 235, 3) },
  },
};

const names = (groups: ReturnType<typeof buildOfferGroups>) =>
  Object.fromEntries(groups.map((g) => [g.slug, g.options.map((o) => o.name)]));

describe('buildOfferGroups', () => {
  it('lists every real category as its own option, cheapest first, without auto-picking', () => {
    const groups = buildOfferGroups(twoAdults, [], { adults: 2, child: false });
    expect(groups.map((g) => g.slug)).toEqual(['confort', 'standard', 'luxo', 'master']);
    expect(names(groups)).toEqual({
      confort: ['Casal Confort', 'Duplo Solteiro Confort'],
      standard: ['Casal Standard', 'Triplo Família Standard'],
      luxo: ['Duplo Solteiro Luxo', 'Casal Luxo'],
      master: ['Casal Master', 'Triplo Família Master'],
    });
  });

  it('never sells Duplo Solteiro Luxo to 3 adults even though Artax accepts it at R$ 554', () => {
    const threeAdults: RawAvailabilityResponse = {
      rooms: {
        '6663': { '2472': plan('Duplo Solteiro Luxo', 554, 3, 1) },
        '3581': { '2472': plan('Triplo Familia Master', 255, 3) },
      },
    };
    const groups = buildOfferGroups(threeAdults, [], { adults: 3, child: false });
    expect(names(groups)['luxo']).toEqual([]);
    expect(names(groups)['master']).toEqual(['Triplo Família Master']);
  });

  it('carries the compact-room warning on Individual Confort and hides it when a child comes', () => {
    const oneAdult: RawAvailabilityResponse = {
      rooms: { '3573': { '2472': plan('Individual Confort', 85, 1) } },
    };
    const alone = buildOfferGroups(oneAdult, [], { adults: 1, child: false });
    expect(alone[0]?.options[0]?.warning).toMatch(/Quarto compacto/);

    const withChild = buildOfferGroups(oneAdult, [], { adults: 1, child: true });
    expect(withChild[0]?.options).toEqual([]);
  });

  it('skips categories missing from the catalog and reports them', () => {
    const unknown: string[] = [];
    const data: RawAvailabilityResponse = {
      rooms: { '9999': { '2472': plan('Suíte Nova', 300, 2) } },
    };
    const groups = buildOfferGroups(data, [], { adults: 2, child: false }, (id, name) =>
      unknown.push(`${id}:${name}`)
    );
    expect(groups.every((g) => g.options.length === 0)).toBe(true);
    expect(unknown).toEqual(['9999:Suíte Nova']);
  });

  it('ignores sold-out or zero-priced plans and uses CMS names when given', () => {
    const data: RawAvailabilityResponse = {
      rooms: {
        '3580': { '2472': plan('Casal Master', 232, 2, 0) },
        '3574': { '2472': plan('Casal Luxo', 0, 2) },
      },
    };
    const groups = buildOfferGroups(
      data,
      [{ slug: 'master', name: 'Suíte Master', description: 'Ar e frigobar' }],
      { adults: 2, child: false }
    );
    expect(groups.every((g) => g.options.length === 0)).toBe(true);
    expect(groups.find((g) => g.slug === 'master')?.description).toBe('Ar e frigobar');
  });

  it('reports the cheapest option per group for the "a partir de" price', () => {
    const groups = buildOfferGroups(twoAdults, [], { adults: 2, child: false });
    expect(minPriceByGroup(groups)).toEqual({
      confort: 145,
      standard: 209,
      luxo: 164,
      master: 232,
    });
  });
});

describe('accommodation catalog', () => {
  it('covers the nine Artax categories exactly once', () => {
    const ids = ACCOMMODATIONS.map((a) => a.categoryId).sort();
    expect(ids).toEqual([3572, 3573, 3574, 3577, 3578, 3580, 3581, 6663, 6704]);
  });

  it('matches the hotel list: Confort and Standard have no minibar', () => {
    for (const a of ACCOMMODATIONS) {
      if (a.group === 'confort' || a.group === 'standard') expect(a.minibar).toBe(false);
    }
  });

  it('accepts one child anywhere except Individual Confort', () => {
    const individual = getAccommodation(3573);
    const casalLuxo = getAccommodation(3574);
    expect(individual && canHost(individual, 1, true)).toBe(false);
    expect(casalLuxo && canHost(casalLuxo, 2, true)).toBe(true);
    expect(casalLuxo && canHost(casalLuxo, 3, false)).toBe(false);
  });
});
