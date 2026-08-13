'use client';

import { useState, useEffect, useRef } from 'react';
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

export function BookingWidget() {
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState(2);
  const [docked, setDocked] = useState(false);
  const router = useRouter();
  const widgetRef = useRef<HTMLDivElement>(null);

  const today = new Date().toISOString().slice(0, 10);
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

  /* ── Label classes ── */
  const labelCls = docked
    ? 'mb-1 text-xs font-medium uppercase tracking-wider text-white/45'
    : 'mb-1 text-xs font-medium uppercase tracking-wider text-white/55';

  /* ── Input classes ── */
  const inputCls =
    'rounded-sm border border-white/15 bg-white/10 px-4 py-2.5 text-sm text-white outline-none placeholder:text-white/30 focus:border-brand-gold focus:ring-1 focus:ring-brand-gold [color-scheme:dark]';

  /* ── Outer wrapper ── */
  const wrapperCls = docked
    ? 'fixed top-[54px] left-0 right-0 z-40 bg-brand-black/70 backdrop-blur-2xl border-b border-white/8 transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]'
    : 'absolute bottom-6 left-1/2 z-20 w-[calc(100%-2rem)] max-w-5xl -translate-x-1/2 bg-brand-black/35 backdrop-blur-xl border border-white/12 rounded-lg transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]';

  return (
    <div ref={widgetRef} className={wrapperCls}>
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-4 py-3 sm:flex-row sm:gap-4">
        {/* Check-in */}
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

        {/* Check-out */}
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

        {/* Guests */}
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
              -
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

        {/* CTA */}
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
  );
}
