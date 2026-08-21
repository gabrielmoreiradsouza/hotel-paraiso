'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, Loader2 } from 'lucide-react';

interface AvailabilityRoom {
  cmsSlug: string;
  name: string;
  available: boolean;
  price: number;
}

interface AvailabilityResponse {
  rooms?: AvailabilityRoom[];
  error?: string;
}

type CheckResult =
  | { status: 'available'; roomName: string; nights: number; total: number }
  | { status: 'unavailable'; roomName: string };

export function RoomBookingInline({
  roomSlug,
  roomName,
  pricePerNight: _pricePerNight,
}: {
  roomSlug: string;
  roomName: string;
  pricePerNight: number;
}) {
  const router = useRouter();
  const [checkin, setCheckin] = useState('');
  const [checkout, setCheckout] = useState('');
  const [adults, setAdults] = useState('2');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CheckResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Minimum date is today
  const today = new Date().toISOString().split('T')[0];
  const minCheckout = checkin
    ? new Date(new Date(checkin + 'T12:00:00').getTime() + 86400000).toISOString().slice(0, 10)
    : today;

  async function handleCheck() {
    if (!checkin || !checkout) {
      setError('Selecione as datas de check-in e check-out.');
      return;
    }

    // Validate checkout > checkin
    if (checkout <= checkin) {
      setError('A data de check-out deve ser posterior ao check-in.');
      return;
    }

    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const params = new URLSearchParams({
        arrival_date: checkin,
        departure_date: checkout,
        adults,
      });
      const res = await fetch(`/api/availability?${params}`);

      if (!res.ok) {
        setError('Erro ao verificar. Tente novamente.');
        setLoading(false);
        return;
      }

      const data: AvailabilityResponse = await res.json();

      const match = data.rooms?.find((r) => r.cmsSlug === roomSlug);

      if (match && match.available) {
        const nights = Math.max(
          1,
          Math.round(
            (new Date(checkout).getTime() - new Date(checkin).getTime()) / (1000 * 60 * 60 * 24)
          )
        );
        // API price is already the total for the stay, not per-night
        setResult({
          status: 'available',
          roomName: match.name,
          nights,
          total: match.price,
        });
      } else {
        setResult({
          status: 'unavailable',
          roomName: roomName,
        });
      }
    } catch {
      setError('Erro ao verificar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  function handleReserve() {
    router.push(
      `/reservar?room=${encodeURIComponent(roomSlug)}&checkin=${checkin}&checkout=${checkout}&guests=${adults}&step=details`
    );
  }

  function handleViewOthers() {
    router.push(`/reservar?checkin=${checkin}&checkout=${checkout}&guests=${adults}`);
  }

  return (
    <div className="mt-8 rounded-xl border border-beige-200 bg-beige-50 p-6">
      {/* Title */}
      <div className="mb-5 flex items-center gap-2">
        <Calendar className="h-5 w-5 text-brand-gold" />
        <h4 className="font-display text-lg font-bold text-brand-black">
          Verificar disponibilidade
        </h4>
      </div>

      {/* Fields row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {/* Check-in */}
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
              setResult(null);
              setError(null);
            }}
            className="w-full rounded-md border border-beige-300 bg-white px-3 py-2.5 text-sm text-brand-black"
          />
        </div>

        {/* Check-out */}
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
              setResult(null);
              setError(null);
            }}
            className="w-full rounded-md border border-beige-300 bg-white px-3 py-2.5 text-sm text-brand-black"
          />
        </div>

        {/* Adults */}
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
              setResult(null);
              setError(null);
            }}
            className="w-full rounded-md border border-beige-300 bg-white px-3 py-2.5 text-sm text-brand-black"
          >
            <option value="1">1 adulto</option>
            <option value="2">2 adultos</option>
            <option value="3">3 adultos</option>
          </select>
        </div>
      </div>

      {/* Check button */}
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

      {/* Error */}
      {error && (
        <div className="mt-5">
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="font-semibold text-red-800">{error}</p>
          </div>
        </div>
      )}

      {/* Result */}
      {result?.status === 'available' && (
        <div className="mt-5">
          <div className="rounded-lg border border-emerald-300 bg-emerald-50 p-4">
            <p className="font-semibold text-emerald-800">
              Disponível! {result.roomName} para {result.nights} noite{result.nights > 1 ? 's' : ''}
            </p>
            <p className="mt-1 text-sm text-emerald-700">
              Total: <span className="font-bold">R$ {result.total.toLocaleString('pt-BR')}</span>
            </p>
          </div>
          <button
            onClick={handleReserve}
            className="mt-4 w-full rounded-lg bg-brand-gold py-3.5 text-center font-bold uppercase tracking-widest text-brand-black transition-colors hover:bg-gold-400"
          >
            Reservar agora — R$ {result.total.toLocaleString('pt-BR')}
          </button>
        </div>
      )}

      {result?.status === 'unavailable' && (
        <div className="mt-5">
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="font-semibold text-red-800">
              {result.roomName} não está disponível para essas datas.
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
