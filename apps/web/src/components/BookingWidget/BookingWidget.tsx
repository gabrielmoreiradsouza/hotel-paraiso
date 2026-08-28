'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { trackSearchPerformed } from '@hotel-paraiso/tracking';

/**
 * Invisible sentinel — place inside the Hero so IntersectionObserver
 * knows when the widget should switch from "glass" to "docked".
 */
export function BookingSentinel() {
  return (
    <div
      id="booking-sentinel"
      className="pointer-events-none absolute bottom-0 left-0 h-px w-full"
    />
  );
}

function getTodayBR(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

export function BookingWidget() {
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState(2);
  const [docked, setDocked] = useState(false);
  const router = useRouter();
  const heroPillRef = useRef<HTMLDivElement>(null);
  const dockBarRef = useRef<HTMLDivElement>(null);

  // Set inert on the inactive mobile widget to prevent keyboard focus on hidden controls
  const syncInert = useCallback(() => {
    heroPillRef.current?.[docked ? 'setAttribute' : 'removeAttribute']('inert', '');
    dockBarRef.current?.[docked ? 'removeAttribute' : 'setAttribute']('inert', '');
  }, [docked]);

  useEffect(syncInert, [syncInert]);

  const today = getTodayBR();
  const minCheckOut = checkIn || today;
  const isValid = checkIn >= today && checkOut > checkIn;

  // IntersectionObserver on the sentinel
  useEffect(() => {
    const sentinel = document.getElementById('booking-sentinel');
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry) setDocked(!entry.isIntersecting);
      },
      { threshold: 0 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  function handleSearch() {
    if (!isValid) return;
    trackSearchPerformed({ checkin: checkIn, checkout: checkOut, guests });
    const params = new URLSearchParams();
    if (checkIn) params.set('checkin', checkIn);
    if (checkOut) params.set('checkout', checkOut);
    params.set('guests', String(guests));
    router.push(`/reservar?${params.toString()}`);
  }

  /* ── Desktop label classes ── */
  const labelCls = docked
    ? 'mb-1 text-xs font-medium uppercase tracking-wider text-white/45'
    : 'mb-1 text-xs font-medium uppercase tracking-wider text-white/55';

  /* ── Desktop input classes ── */
  const inputCls =
    'rounded-sm border border-white/15 bg-white/10 px-4 py-2.5 text-sm text-white outline-none placeholder:text-white/30 focus:border-brand-gold focus:ring-1 focus:ring-brand-gold [color-scheme:dark]';

  return (
    <>
      {/* ════════════════════════════════════════════════
          DESKTOP — same behavior as before (md+)
          ════════════════════════════════════════════════ */}
      <div
        className={
          docked
            ? 'hidden md:flex fixed top-[54px] left-0 right-0 z-40 bg-brand-black/70 backdrop-blur-2xl border-b border-white/8 transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]'
            : 'hidden md:flex absolute bottom-6 left-1/2 z-20 w-[calc(100%-2rem)] max-w-5xl -translate-x-1/2 bg-brand-black/35 backdrop-blur-xl border border-white/12 rounded-lg transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]'
        }
      >
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-4 py-3 sm:flex-row sm:gap-4">
          <div className="flex w-full flex-col sm:w-auto">
            <label htmlFor="checkin-input" className={labelCls}>
              Check-in
            </label>
            <input
              id="checkin-input"
              type="date"
              value={checkIn}
              min={today}
              onChange={(e) => setCheckIn(e.target.value)}
              className={inputCls}
            />
          </div>

          <div className="flex w-full flex-col sm:w-auto">
            <label htmlFor="checkout-input" className={labelCls}>
              Check-out
            </label>
            <input
              id="checkout-input"
              type="date"
              value={checkOut}
              min={minCheckOut}
              onChange={(e) => setCheckOut(e.target.value)}
              className={inputCls}
            />
          </div>

          <div className="flex w-full flex-col sm:w-auto">
            <label htmlFor="guests-input" className={labelCls}>
              Hóspedes
            </label>
            <div className="flex items-center gap-3 rounded-sm border border-white/15 bg-white/10 px-4 py-2.5">
              <button
                type="button"
                aria-label="Diminuir hóspedes"
                onClick={() => setGuests(Math.max(1, guests - 1))}
                className="text-lg font-bold text-white/60 hover:text-brand-gold"
              >
                −
              </button>
              <span id="guests-input" className="w-8 text-center text-sm font-medium text-white">
                {guests}
              </span>
              <button
                type="button"
                aria-label="Aumentar hóspedes"
                onClick={() => setGuests(Math.min(10, guests + 1))}
                className="text-lg font-bold text-white/60 hover:text-brand-gold"
              >
                +
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSearch}
            disabled={!isValid}
            className="w-full rounded-sm bg-brand-gold px-8 py-3 text-sm font-semibold uppercase tracking-widest text-brand-black transition-colors hover:bg-gold-400 disabled:cursor-not-allowed disabled:opacity-50 sm:mt-5 sm:w-auto"
          >
            Verificar disponibilidade
          </button>
        </div>
      </div>

      {/* ════════════════════════════════════════════════
          MOBILE — Glass pill in hero (visible when !docked)
          ════════════════════════════════════════════════ */}
      <div
        ref={heroPillRef}
        aria-hidden={docked}
        className={`flex md:hidden absolute bottom-5 left-3 right-3 z-20 items-stretch overflow-hidden rounded-lg border border-white/10 bg-brand-black/50 backdrop-blur-2xl transition-all duration-400 ease-[cubic-bezier(0.4,0,0.2,1)] ${
          docked ? 'pointer-events-none translate-y-2 opacity-0' : 'opacity-100'
        }`}
      >
        {/* Entrada */}
        <div className="flex min-w-0 flex-1 flex-col justify-center gap-0.5 border-r border-white/8 px-2.5 py-2">
          <span className="text-[8px] font-medium uppercase tracking-wider text-white/40">
            Entrada
          </span>
          <input
            type="date"
            aria-label="Entrada"
            value={checkIn}
            min={today}
            onChange={(e) => setCheckIn(e.target.value)}
            className="w-full border-none bg-transparent p-0 text-[13px] text-white outline-none [color-scheme:dark]"
          />
        </div>

        {/* Saída */}
        <div className="flex min-w-0 flex-1 flex-col justify-center gap-0.5 border-r border-white/8 px-2.5 py-2">
          <span className="text-[8px] font-medium uppercase tracking-wider text-white/40">
            Saída
          </span>
          <input
            type="date"
            aria-label="Saída"
            value={checkOut}
            min={minCheckOut}
            onChange={(e) => setCheckOut(e.target.value)}
            className="w-full border-none bg-transparent p-0 text-[13px] text-white outline-none [color-scheme:dark]"
          />
        </div>

        {/* Hóspedes */}
        <div className="flex flex-col items-center justify-center gap-0.5 border-r border-white/8 px-3 py-2">
          <span className="text-[8px] font-medium uppercase tracking-wider text-white/40">
            Hóspedes
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              aria-label="Diminuir hóspedes"
              onClick={() => setGuests(Math.max(1, guests - 1))}
              className="min-h-[28px] min-w-[28px] text-sm font-bold text-white/50 active:text-brand-gold"
            >
              −
            </button>
            <span className="min-w-[14px] text-center text-[13px] font-medium text-white">
              {guests}
            </span>
            <button
              type="button"
              aria-label="Aumentar hóspedes"
              onClick={() => setGuests(Math.min(10, guests + 1))}
              className="min-h-[28px] min-w-[28px] text-sm font-bold text-white/50 active:text-brand-gold"
            >
              +
            </button>
          </div>
        </div>

        {/* CTA */}
        <button
          type="button"
          onClick={handleSearch}
          disabled={!isValid}
          className="flex min-h-[44px] items-center rounded-none bg-brand-gold px-4 text-[11px] font-bold uppercase tracking-wider text-brand-black transition-colors active:bg-gold-400 disabled:opacity-50"
        >
          Buscar
        </button>
      </div>

      {/* ════════════════════════════════════════════════
          MOBILE — Docked bar below header (visible when docked)
          ════════════════════════════════════════════════ */}
      <div
        ref={dockBarRef}
        aria-hidden={!docked}
        className={`flex md:hidden fixed top-[54px] left-0 right-0 z-40 items-center gap-1.5 border-b border-brand-gold/10 bg-brand-black/88 px-3 py-1.5 backdrop-blur-2xl transition-all duration-400 ease-[cubic-bezier(0.4,0,0.2,1)] ${
          docked ? 'translate-y-0 opacity-100' : 'pointer-events-none -translate-y-full opacity-0'
        }`}
      >
        {/* Entrada */}
        <div className="flex min-w-0 flex-1 flex-col gap-px">
          <span className="text-[7px] font-medium uppercase tracking-wider text-white/40">
            Entrada
          </span>
          <input
            type="date"
            aria-label="Entrada"
            value={checkIn}
            min={today}
            onChange={(e) => setCheckIn(e.target.value)}
            className="w-full rounded border border-white/10 bg-white/7 px-1 py-1 text-[11px] text-white outline-none focus:border-brand-gold [color-scheme:dark]"
          />
        </div>

        {/* Saída */}
        <div className="flex min-w-0 flex-1 flex-col gap-px">
          <span className="text-[7px] font-medium uppercase tracking-wider text-white/40">
            Saída
          </span>
          <input
            type="date"
            aria-label="Saída"
            value={checkOut}
            min={minCheckOut}
            onChange={(e) => setCheckOut(e.target.value)}
            className="w-full rounded border border-white/10 bg-white/7 px-1 py-1 text-[11px] text-white outline-none focus:border-brand-gold [color-scheme:dark]"
          />
        </div>

        {/* Hóspedes */}
        <div className="flex flex-col items-center gap-px">
          <span className="text-[7px] font-medium uppercase tracking-wider text-white/40">
            Hosp.
          </span>
          <div className="flex items-center rounded border border-white/10 bg-white/7 px-1 py-0.5">
            <button
              type="button"
              aria-label="Diminuir hóspedes"
              onClick={() => setGuests(Math.max(1, guests - 1))}
              className="min-h-[28px] min-w-[28px] text-xs font-bold text-white/50 active:text-brand-gold"
            >
              −
            </button>
            <span className="min-w-[14px] text-center text-[11px] font-medium text-white">
              {guests}
            </span>
            <button
              type="button"
              aria-label="Aumentar hóspedes"
              onClick={() => setGuests(Math.min(10, guests + 1))}
              className="min-h-[28px] min-w-[28px] text-xs font-bold text-white/50 active:text-brand-gold"
            >
              +
            </button>
          </div>
        </div>

        {/* CTA */}
        <button
          type="button"
          onClick={handleSearch}
          disabled={!isValid}
          className="self-stretch rounded bg-brand-gold px-3 text-[10px] font-bold uppercase tracking-wider text-brand-black transition-colors active:bg-gold-400 disabled:opacity-50"
        >
          Buscar
        </button>
      </div>
    </>
  );
}
