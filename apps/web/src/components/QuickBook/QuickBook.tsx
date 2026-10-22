'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { track } from '@hotel-paraiso/tracking';
import { CheckoutSheet } from './CheckoutSheet';
import { addDays, nightsBetween, todayBR, type QuickRoom } from './quickbook-utils';

/**
 * Variante B do teste A/B da home (ADR-0013): preço real já na página.
 *
 * Datas pré-preenchidas (hoje antes das 18h, senão amanhã; 1 noite; 2 hóspedes), cards
 * com o preço da Artax para essas datas e "Reservar" abrindo o checkout por cima da
 * página. 85% do tráfego pago saía antes de digitar datas — aqui ninguém precisa digitar.
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
  const [rooms, setRooms] = useState<QuickRoom[]>([]);
  /** Parâmetros que geraram `rooms` — oferta só vale se bater com as datas atuais. */
  const [roomsKey, setRoomsKey] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [sheetSlug, setSheetSlug] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const firstLoad = useRef(true);

  useEffect(() => {
    const start = defaultCheckin();
    setCheckin(start);
    setCheckout(addDays(start, 1));
  }, []);

  const nights = nightsBetween(checkin, checkout);
  const validDates = Boolean(checkin) && checkin >= todayBR() && nights > 0;
  const queryKey = `${checkin}|${checkout}|${guests}`;
  const fresh = roomsKey === queryKey;

  const fetchRooms = useCallback(async () => {
    if (!validDates) return;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const key = `${checkin}|${checkout}|${guests}`;
    setLoading(true);
    setError(false);
    try {
      const params = new URLSearchParams({
        arrival_date: checkin,
        departure_date: checkout,
        adults: String(guests),
        kids: '0',
      });
      const res = await fetch(`/api/availability?${params}`, { signal: controller.signal });
      if (!res.ok) throw new Error(`availability HTTP ${res.status}`);
      const data = (await res.json()) as { rooms?: QuickRoom[] };
      // Esgotados por último: o primeiro card visível tem de ser reservável.
      const list = [...(data.rooms ?? [])].sort(
        (a, b) => Number(b.available) - Number(a.available)
      );
      setRooms(list);
      setRoomsKey(key);
      // Na A este evento só sai após busca ativa; aqui a primeira exibição é automática.
      // `auto` separa as duas coisas no GA4 sem perder a métrica de "viu preço".
      track('availability_viewed', {
        room_count: list.filter((r) => r.available).length,
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
  }, [checkin, checkout, guests, validDates]);

  useEffect(() => {
    // Datas mudaram: a oferta na tela já não vale. Cancela a busca anterior e marca como
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

  const sheetRoom = rooms.find((r) => r.cmsSlug === sheetSlug) ?? null;
  const closeSheet = useCallback(() => setSheetSlug(null), []);

  return (
    <section id="reservar-agora" className="bg-brand-black px-4 py-12 sm:py-16">
      <div className="mx-auto max-w-6xl">
        <h2 className="font-display text-2xl font-bold text-white sm:text-3xl">
          Preços para as suas datas
        </h2>
        <p className="mt-2 text-sm text-white/60">
          Valores reais com café da manhã. Nenhum pagamento agora — você paga no check-in.
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
          <label className="col-span-2 text-xs font-medium text-white/60 sm:col-span-1">
            Hóspedes
            <select
              value={guests}
              onChange={(e) => setGuests(Number(e.target.value))}
              className="mt-1 block w-full rounded-sm border border-white/[0.12] bg-white/[0.06] px-3 py-2.5 text-sm text-white outline-none focus:border-brand-gold sm:w-32"
            >
              {[1, 2, 3].map((n) => (
                <option key={n} value={n} className="bg-brand-black">
                  {n} {n === 1 ? 'hóspede' : 'hóspedes'}
                </option>
              ))}
            </select>
          </label>
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

        <div className="mt-6 grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4" aria-busy={loading}>
          {loading && rooms.length === 0
            ? [0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-36 animate-pulse rounded-lg bg-white/[0.04] motion-reduce:animate-none sm:h-80"
                />
              ))
            : rooms.map((room) => (
                <article
                  key={room.cmsSlug}
                  className={`flex overflow-hidden rounded-lg border border-white/[0.08] bg-white/[0.04] transition-opacity sm:flex-col ${loading ? 'opacity-60' : ''}`}
                >
                  {/* Celular: linha compacta (foto à esquerda) para caberem 3–4 quartos por
                      tela — a decisão aqui é comparar preço, não ver foto grande. */}
                  <div className="relative w-28 shrink-0 sm:aspect-[16/10] sm:w-auto">
                    <Image
                      src={room.cmsImage || '/images/rooms/standard.jpg'}
                      alt={room.cmsName}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 112px, (max-width: 1024px) 50vw, 25vw"
                      unoptimized={room.cmsImage.startsWith('http')}
                    />
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col p-3 sm:p-4">
                    <h3 className="font-display text-base font-bold text-white sm:text-lg">
                      {room.cmsName}
                    </h3>
                    {room.cmsDescription && (
                      <p className="mt-1 hidden text-xs text-white/50 sm:line-clamp-2">
                        {room.cmsDescription}
                      </p>
                    )}
                    <div className="mt-auto pt-2 sm:pt-4">
                      {room.available && nights > 0 ? (
                        <>
                          <p className="font-display text-xl font-bold text-brand-gold">
                            R$ {brl(room.price)}
                            <span className="ml-1 text-xs font-normal text-white/50">
                              {nights === 1
                                ? '1 noite'
                                : `${nights} noites · R$ ${brl(room.price / nights)}/noite`}
                            </span>
                          </p>
                          <p className="text-xs text-white/50">
                            {room.allots === 1 ? '1 disponível' : `${room.allots} disponíveis`}
                          </p>
                          <button
                            type="button"
                            onClick={() => setSheetSlug(room.cmsSlug)}
                            disabled={!fresh}
                            className="mt-2 w-full rounded-sm bg-brand-gold px-4 py-2.5 text-sm font-semibold uppercase tracking-widest text-brand-black transition-colors hover:bg-gold-400 disabled:opacity-50 sm:mt-3 sm:py-3"
                          >
                            Reservar
                          </button>
                        </>
                      ) : (
                        <p className="rounded-sm bg-white/[0.06] px-3 py-2.5 text-center text-sm text-white/60">
                          Esgotado nessas datas
                        </p>
                      )}
                    </div>
                  </div>
                </article>
              ))}
        </div>
      </div>

      {sheetSlug && (
        <CheckoutSheet
          room={sheetRoom}
          loading={loading || !fresh}
          checkin={checkin}
          checkout={checkout}
          guests={guests}
          onCheckinChange={changeCheckin}
          onCheckoutChange={setCheckout}
          onClosed={closeSheet}
        />
      )}
    </section>
  );
}
