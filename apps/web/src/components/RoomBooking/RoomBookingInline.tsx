'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, Loader2 } from 'lucide-react';
import { CHILD_MAX_AGE } from '@/lib/accommodations';
import type { AccommodationOffer, OfferGroup } from '@/lib/offers';
import { AccommodationFacts, AccommodationWarning } from '@/components/Accommodation/Accommodation';

type CheckResult =
  | { status: 'available'; nights: number; options: AccommodationOffer[] }
  | { status: 'unavailable' };

function getTodayBR(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

export function RoomBookingInline({ roomSlug, roomName }: { roomSlug: string; roomName: string }) {
  const router = useRouter();
  const [checkin, setCheckin] = useState('');
  const [checkout, setCheckout] = useState('');
  const [adults, setAdults] = useState('2');
  const [child, setChild] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CheckResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Abort on unmount
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  const today = getTodayBR();
  const checkinTime = checkin ? new Date(checkin + 'T12:00:00').getTime() : NaN;
  const minCheckout = Number.isFinite(checkinTime)
    ? new Date(checkinTime + 86400000).toISOString().slice(0, 10)
    : today;

  function resetResult() {
    setResult(null);
    setError(null);
  }

  async function handleCheck() {
    if (!checkin || !checkout) {
      setError('Selecione as datas de check-in e check-out.');
      return;
    }
    if (checkout <= checkin) {
      setError('A data de check-out deve ser posterior ao check-in.');
      return;
    }

    setLoading(true);
    resetResult();

    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const params = new URLSearchParams({
        arrival_date: checkin,
        departure_date: checkout,
        adults,
        kids: child ? '1' : '0',
      });
      const res = await fetch(`/api/availability?${params}`, { signal: controller.signal });
      if (!res.ok) {
        setError('Erro ao verificar. Tente novamente.');
        setLoading(false);
        return;
      }

      const data = (await res.json()) as { groups?: OfferGroup[] };
      const options = data.groups?.find((g) => g.slug === roomSlug)?.options ?? [];

      if (options.length > 0) {
        const nights = Math.max(
          1,
          Math.round(
            (Date.parse(`${checkout}T12:00:00Z`) - Date.parse(`${checkin}T12:00:00Z`)) / 86_400_000
          )
        );
        setResult({ status: 'available', nights, options });
      } else {
        setResult({ status: 'unavailable' });
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      console.error('[room-booking] disponibilidade falhou:', err);
      setError('Erro ao verificar. Tente novamente.');
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }

  function bookingQuery(): string {
    return `checkin=${checkin}&checkout=${checkout}&guests=${adults}&kids=${child ? 1 : 0}`;
  }

  function handleReserve(option: AccommodationOffer) {
    router.push(
      `/reservar?room=${encodeURIComponent(roomSlug)}&category=${option.categoryId}&${bookingQuery()}&step=details`
    );
  }

  function handleViewOthers() {
    router.push(`/reservar?${bookingQuery()}`);
  }

  return (
    <div className="mt-8 rounded-xl border border-beige-200 bg-beige-50 p-6">
      <div className="mb-5 flex items-center gap-2">
        <Calendar className="h-5 w-5 text-brand-gold" />
        <h4 className="font-display text-lg font-bold text-brand-black">
          Verificar disponibilidade
        </h4>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label
            htmlFor={`bk-checkin-${roomSlug}`}
            className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-beige-700"
          >
            Check-in
          </label>
          <input
            id={`bk-checkin-${roomSlug}`}
            type="date"
            value={checkin}
            min={today}
            onChange={(e) => {
              setCheckin(e.target.value);
              resetResult();
            }}
            className="w-full rounded-md border border-beige-300 bg-white px-3 py-2.5 text-sm text-brand-black"
          />
        </div>

        <div>
          <label
            htmlFor={`bk-checkout-${roomSlug}`}
            className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-beige-700"
          >
            Check-out
          </label>
          <input
            id={`bk-checkout-${roomSlug}`}
            type="date"
            value={checkout}
            min={minCheckout}
            onChange={(e) => {
              setCheckout(e.target.value);
              resetResult();
            }}
            className="w-full rounded-md border border-beige-300 bg-white px-3 py-2.5 text-sm text-brand-black"
          />
        </div>

        <div>
          <label
            htmlFor={`bk-adults-${roomSlug}`}
            className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-beige-700"
          >
            Adultos
          </label>
          <select
            id={`bk-adults-${roomSlug}`}
            value={adults}
            onChange={(e) => {
              setAdults(e.target.value);
              resetResult();
            }}
            className="w-full rounded-md border border-beige-300 bg-white px-3 py-2.5 text-sm text-brand-black"
          >
            <option value="1">1 adulto</option>
            <option value="2">2 adultos</option>
            <option value="3">3 adultos</option>
          </select>
          <label className="mt-2 flex cursor-pointer items-center gap-2 text-xs text-beige-800">
            <input
              type="checkbox"
              checked={child}
              onChange={(e) => {
                setChild(e.target.checked);
                resetResult();
              }}
              className="h-4 w-4 accent-brand-gold"
            />
            + 1 criança (até {CHILD_MAX_AGE} anos)
          </label>
        </div>
      </div>

      <button
        onClick={handleCheck}
        disabled={loading}
        className="mt-4 w-full rounded-lg bg-brand-gold py-3 text-center text-sm font-semibold uppercase tracking-widest text-brand-black transition-colors hover:bg-gold-400 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:px-8"
      >
        {loading ? (
          <span className="inline-flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Verificando...
          </span>
        ) : (
          'Verificar'
        )}
      </button>

      {error && (
        <div className="mt-5" role="alert">
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="font-semibold text-red-800">{error}</p>
          </div>
        </div>
      )}

      {result?.status === 'available' && (
        <div className="mt-5 space-y-3" aria-live="polite">
          <p className="font-semibold text-emerald-800">
            Disponível para {result.nights} noite{result.nights > 1 ? 's' : ''}. Escolha a
            acomodação:
          </p>
          {result.options.map((option) => (
            <div
              key={option.categoryId}
              className="rounded-lg border border-beige-300 bg-white p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-display font-bold text-brand-black">{option.name}</p>
                  <div className="mt-2">
                    <AccommodationFacts accommodation={option} tone="light" />
                  </div>
                </div>
                <p className="font-display text-lg font-bold text-brand-black">
                  R$ {option.price.toLocaleString('pt-BR')}
                </p>
              </div>
              {option.warning && (
                <div className="mt-3">
                  <AccommodationWarning warning={option.warning} tone="light" />
                </div>
              )}
              <button
                onClick={() => handleReserve(option)}
                className="mt-3 w-full rounded-lg bg-brand-gold py-3 text-center text-sm font-bold uppercase tracking-widest text-brand-black transition-colors hover:bg-gold-400"
              >
                Reservar {option.name}
              </button>
            </div>
          ))}
        </div>
      )}

      {result?.status === 'unavailable' && (
        <div className="mt-5">
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="font-semibold text-red-800">
              {roomName} não está disponível para essas datas e hóspedes.
            </p>
          </div>
          <button
            onClick={handleViewOthers}
            className="mt-4 w-full rounded-lg border border-beige-300 py-3.5 text-center text-sm font-semibold text-beige-800 transition-colors hover:border-beige-400 hover:bg-beige-100"
          >
            Ver outros quartos disponíveis →
          </button>
        </div>
      )}
    </div>
  );
}
