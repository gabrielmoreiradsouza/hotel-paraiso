'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { track } from '@hotel-paraiso/tracking';
import { CHILD_MAX_AGE } from '@/lib/accommodations';
import { PAYMENT_POLICY } from '@/lib/booking-policy';
import type { OfferGroup } from '@/lib/offers';
import {
  AccommodationFacts,
  AccommodationPhoto,
  AccommodationWarning,
} from '@/components/Accommodation/Accommodation';
import { CheckoutSheet } from './CheckoutSheet';
import { addDays, nightsBetween, todayBR } from './quickbook-utils';

/**
 * Variante B do teste A/B da home (ADR-0013): preço real já na página.
 *
 * Datas pré-preenchidas (hoje antes das 18h, senão amanhã; 1 noite; 2 hóspedes), cada
 * acomodação real da Artax com seu preço (ADR-0014) e "Reservar" abrindo o checkout por
 * cima da página. 85% do tráfego pago saía antes de digitar datas — aqui ninguém precisa digitar.
 */

function defaultCheckin(): string {
  const hour = Number(
    new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Sao_Paulo',
      hour: 'numeric',
      hourCycle: 'h23',
    }).format(new Date())
  );
  const today = todayBR();
  return hour < 18 ? today : addDays(today, 1);
}

const brl = (value: number) =>
  value.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

export function QuickBook() {
  // Datas calculadas no cliente: a página é estática e "hoje" muda depois do build.
  const [checkin, setCheckin] = useState('');
  const [checkout, setCheckout] = useState('');
  const [guests, setGuests] = useState(2);
  const [child, setChild] = useState(false);
  const [groups, setGroups] = useState<OfferGroup[]>([]);
  /** Parâmetros que geraram `groups` — oferta só vale se bater com a busca atual. */
  const [groupsKey, setGroupsKey] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [sheetCategoryId, setSheetCategoryId] = useState<number | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const firstLoad = useRef(true);

  useEffect(() => {
    const start = defaultCheckin();
    setCheckin(start);
    setCheckout(addDays(start, 1));
  }, []);

  const nights = nightsBetween(checkin, checkout);
  const validDates = Boolean(checkin) && checkin >= todayBR() && nights > 0;
  const queryKey = `${checkin}|${checkout}|${guests}|${child ? 1 : 0}`;
  const fresh = groupsKey === queryKey;

  const fetchRooms = useCallback(async () => {
    if (!validDates) return;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const key = `${checkin}|${checkout}|${guests}|${child ? 1 : 0}`;
    setLoading(true);
    setError(false);
    try {
      const params = new URLSearchParams({
        arrival_date: checkin,
        departure_date: checkout,
        adults: String(guests),
        kids: child ? '1' : '0',
      });
      const res = await fetch(`/api/availability?${params}`, { signal: controller.signal });
      if (!res.ok) throw new Error(`availability HTTP ${res.status}`);
      const data = (await res.json()) as { groups?: OfferGroup[] };
      // Esgotados por último: o primeiro grupo visível tem de ser reservável.
      const list = [...(data.groups ?? [])].sort(
        (a, b) => Number(b.options.length > 0) - Number(a.options.length > 0)
      );
      setGroups(list);
      setGroupsKey(key);
      // Na A este evento só sai após busca ativa; aqui a primeira exibição é automática.
      // `auto` separa as duas coisas no GA4 sem perder a métrica de "viu preço".
      track('availability_viewed', {
        room_count: list.reduce((total, g) => total + g.options.length, 0),
        category: 'macro',
        auto: firstLoad.current,
      });
      firstLoad.current = false;
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      // Falha aqui é clique pago perdido: precisa deixar rastro.
      console.error('[quickbook] disponibilidade falhou:', err);
      setError(true);
    }
    if (!controller.signal.aborted) setLoading(false);
  }, [checkin, checkout, guests, child, validDates]);

  useEffect(() => {
    // Busca mudou: a oferta na tela já não vale. Cancela a busca anterior e marca como
    // carregando já, não só depois do debounce — senão dá para reservar com preço velho.
    abortRef.current?.abort();
    if (validDates) setLoading(true);
    const timer = setTimeout(fetchRooms, 250);
    return () => clearTimeout(timer);
  }, [fetchRooms, validDates]);

  useEffect(() => () => abortRef.current?.abort(), []);

  function changeCheckin(value: string) {
    setCheckin(value);
    if (!checkout || checkout <= value) setCheckout(addDays(value, 1));
  }

  const sheetRoom =
    groups.flatMap((g) => g.options).find((o) => o.categoryId === sheetCategoryId) ?? null;
  const closeSheet = useCallback(() => setSheetCategoryId(null), []);

  return (
    <section id="reservar-agora" className="bg-brand-black px-4 py-12 sm:py-16">
      <div className="mx-auto max-w-6xl">
        <h2 className="font-display text-2xl font-bold text-white sm:text-3xl">
          Preços para as suas datas
        </h2>
        <p className="mt-2 text-sm text-white/60">
          Valores reais com café da manhã. {PAYMENT_POLICY}
        </p>

        <div className="mt-6 grid grid-cols-2 gap-3 rounded-lg border border-white/[0.08] bg-white/[0.04] p-4 sm:grid-cols-[1fr_1fr_auto]">
          <label className="text-xs font-medium text-white/60">
            Check-in
            <input
              type="date"
              value={checkin}
              min={todayBR()}
              onChange={(e) => e.target.value && changeCheckin(e.target.value)}
              className="mt-1 block w-full rounded-sm border border-white/[0.12] bg-white/[0.06] px-3 py-2.5 text-sm text-white outline-none [color-scheme:dark] focus:border-brand-gold"
            />
          </label>
          <label className="text-xs font-medium text-white/60">
            Check-out
            <input
              type="date"
              value={checkout}
              min={checkin ? addDays(checkin, 1) : todayBR()}
              onChange={(e) => e.target.value && setCheckout(e.target.value)}
              className="mt-1 block w-full rounded-sm border border-white/[0.12] bg-white/[0.06] px-3 py-2.5 text-sm text-white outline-none [color-scheme:dark] focus:border-brand-gold"
            />
          </label>
          <div className="col-span-2 sm:col-span-1">
            <label className="text-xs font-medium text-white/60">
              Adultos
              <select
                value={guests}
                onChange={(e) => setGuests(Number(e.target.value))}
                className="mt-1 block w-full rounded-sm border border-white/[0.12] bg-white/[0.06] px-3 py-2.5 text-sm text-white outline-none focus:border-brand-gold sm:w-36"
              >
                {[1, 2, 3].map((n) => (
                  <option key={n} value={n} className="bg-brand-black">
                    {n} {n === 1 ? 'adulto' : 'adultos'}
                  </option>
                ))}
              </select>
            </label>
            <label className="mt-2 flex cursor-pointer items-center gap-2 text-xs text-white/70">
              <input
                type="checkbox"
                checked={child}
                onChange={(e) => setChild(e.target.checked)}
                className="h-4 w-4 accent-brand-gold"
              />
              + 1 criança (até {CHILD_MAX_AGE} anos)
            </label>
          </div>
        </div>

        {error && (
          <div
            role="alert"
            className="mt-6 rounded-sm border border-red-500/30 bg-red-900/20 px-4 py-3 text-sm text-red-400"
          >
            Não conseguimos consultar os preços agora.{' '}
            <button type="button" onClick={fetchRooms} className="underline">
              Tentar de novo
            </button>{' '}
            ou ligue (31) 3881-8049.
          </div>
        )}

        <div className="mt-6 grid gap-4 lg:grid-cols-2" aria-busy={loading}>
          {loading && groups.length === 0
            ? [0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-44 animate-pulse rounded-lg bg-white/[0.04] motion-reduce:animate-none"
                />
              ))
            : groups.map((group) => (
                <article
                  key={group.slug}
                  className={`rounded-lg border border-white/[0.08] bg-white/[0.04] p-3 transition-opacity sm:p-4 ${loading ? 'opacity-60' : ''}`}
                >
                  <h3 className="font-display text-lg font-bold text-white">{group.name}</h3>
                  {group.options.length === 0 || nights === 0 ? (
                    <p className="mt-3 rounded-sm bg-white/[0.06] px-3 py-2.5 text-center text-sm text-white/60">
                      Esgotado nessas datas
                    </p>
                  ) : (
                    <ul className="mt-3 divide-y divide-white/[0.06]">
                      {group.options.map((option) => (
                        <li key={option.categoryId} className="py-3 first:pt-0 last:pb-0">
                          <div className="flex gap-3">
                            {/* Foto pequena: no celular a decisão é comparar cama e preço. */}
                            <AccommodationPhoto
                              accommodation={option}
                              sizes="96px"
                              className="h-20 w-24 shrink-0 rounded-sm"
                            />
                            <div className="min-w-0 flex-1">
                              <p className="font-semibold text-white">{option.name}</p>
                              <div className="mt-1.5">
                                <AccommodationFacts accommodation={option} />
                              </div>
                              <div className="mt-2 flex items-end justify-between gap-3">
                                <p className="font-display text-xl font-bold text-brand-gold">
                                  R$ {brl(option.price)}
                                  <span className="ml-1 block text-xs font-normal text-white/50 sm:inline">
                                    {nights === 1
                                      ? '1 noite'
                                      : `${nights} noites · R$ ${brl(option.price / nights)}/noite`}
                                  </span>
                                </p>
                                <button
                                  type="button"
                                  onClick={() => setSheetCategoryId(option.categoryId)}
                                  disabled={!fresh}
                                  className="shrink-0 rounded-sm bg-brand-gold px-4 py-2.5 text-sm font-semibold uppercase tracking-widest text-brand-black transition-colors hover:bg-gold-400 disabled:opacity-50"
                                >
                                  Reservar
                                </button>
                              </div>
                            </div>
                          </div>
                          {option.warning && (
                            <div className="mt-2">
                              <AccommodationWarning warning={option.warning} />
                            </div>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </article>
              ))}
        </div>
      </div>

      {sheetCategoryId !== null && (
        <CheckoutSheet
          room={sheetRoom}
          loading={loading || !fresh}
          checkin={checkin}
          checkout={checkout}
          guests={guests}
          child={child}
          onCheckinChange={changeCheckin}
          onCheckoutChange={setCheckout}
          onClosed={closeSheet}
        />
      )}
    </section>
  );
}
