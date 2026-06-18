'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { trackSearchPerformed } from '@hotel-paraiso/tracking';

export function BookingWidget() {
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState(2);
  const router = useRouter();

  function handleSearch() {
    trackSearchPerformed({ checkin: checkIn, checkout: checkOut, guests });
    const params = new URLSearchParams();
    if (checkIn) params.set('checkin', checkIn);
    if (checkOut) params.set('checkout', checkOut);
    params.set('guests', String(guests));
    router.push(`/reservar?${params.toString()}`);
  }

  return (
    <section className="sticky top-0 z-40 border-b border-beige-300 bg-brand-white shadow-md">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-4 py-3 sm:flex-row sm:gap-4">
        <div className="flex w-full flex-col sm:w-auto">
          <label className="mb-1 text-xs font-medium uppercase tracking-wider text-beige-700">
            Check-in
          </label>
          <input
            type="date"
            value={checkIn}
            onChange={(e) => setCheckIn(e.target.value)}
            className="rounded-sm border border-beige-300 bg-beige-50 px-4 py-2.5 text-sm text-brand-black outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold"
          />
        </div>

        <div className="flex w-full flex-col sm:w-auto">
          <label className="mb-1 text-xs font-medium uppercase tracking-wider text-beige-700">
            Check-out
          </label>
          <input
            type="date"
            value={checkOut}
            onChange={(e) => setCheckOut(e.target.value)}
            className="rounded-sm border border-beige-300 bg-beige-50 px-4 py-2.5 text-sm text-brand-black outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold"
          />
        </div>

        <div className="flex w-full flex-col sm:w-auto">
          <label className="mb-1 text-xs font-medium uppercase tracking-wider text-beige-700">
            Hóspedes
          </label>
          <div className="flex items-center gap-3 rounded-sm border border-beige-300 bg-beige-50 px-4 py-2.5">
            <button
              type="button"
              onClick={() => setGuests(Math.max(1, guests - 1))}
              className="text-lg font-bold text-beige-600 hover:text-brand-gold"
            >
              -
            </button>
            <span className="w-8 text-center text-sm font-medium">{guests}</span>
            <button
              type="button"
              onClick={() => setGuests(Math.min(10, guests + 1))}
              className="text-lg font-bold text-beige-600 hover:text-brand-gold"
            >
              +
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSearch}
          className="w-full rounded-sm bg-brand-gold px-8 py-3 text-sm font-semibold uppercase tracking-widest text-brand-black transition-colors hover:bg-gold-400 sm:mt-5 sm:w-auto"
        >
          Verificar disponibilidade
        </button>
      </div>
    </section>
  );
}
