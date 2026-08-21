'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';

import {
  trackRoomSelected,
  trackCheckoutStarted,
  trackReservationCreated,
  trackAvailabilityViewed,
} from '@hotel-paraiso/tracking';
import { useSearchParams } from 'next/navigation';

interface AvailableRoom {
  cmsRoomId: number;
  cmsName: string;
  cmsSlug: string;
  cmsImage: string;
  cmsAmenities: string[];
  cmsDescription: string;
  minPrice: number | null;
  category_id: number;
  rateplan_id: number;
  name: string;
  available: boolean;
  allots: number;
  price: number;
  capacity: { adults: number; kids: number };
}

function BookingContent() {
  const searchParams = useSearchParams();
  const checkinParam = searchParams?.get('checkin') ?? '';
  const checkoutParam = searchParams?.get('checkout') ?? '';
  const guestsParam = searchParams?.get('guests') ?? '2';

  const [checkin, setCheckin] = useState(checkinParam);
  const [checkout, setCheckout] = useState(checkoutParam);
  const [guests, setGuests] = useState(Number(guestsParam));
  const [rooms, setRooms] = useState<AvailableRoom[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [apiError, setApiError] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedRoom, setSelectedRoom] = useState<AvailableRoom | null>(null);
  const [step, setStep] = useState<'search' | 'details' | 'confirmed'>('search');

  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [wantsHydro, setWantsHydro] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingId, setBookingId] = useState<string | null>(null);

  const STORAGE_KEY = 'hp_booking_state';

  // Restore state from sessionStorage on mount
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (!saved) return;
      const state = JSON.parse(saved) as {
        step?: 'search' | 'details' | 'confirmed';
        selectedRoom?: AvailableRoom | null;
        guestName?: string;
        guestEmail?: string;
        guestPhone?: string;
        wantsHydro?: boolean;
      };
      if (state.step && state.step !== 'confirmed') setStep(state.step);
      if (state.selectedRoom) setSelectedRoom(state.selectedRoom);
      if (state.guestName) setGuestName(state.guestName);
      if (state.guestEmail) setGuestEmail(state.guestEmail);
      if (state.guestPhone) setGuestPhone(state.guestPhone);
      if (state.wantsHydro) setWantsHydro(state.wantsHydro);
    } catch {
      // ignore corrupt data
    }
  }, []);

  // Save state to sessionStorage
  function saveBookingState(
    overrides?: Partial<{
      step: string;
      selectedRoom: AvailableRoom | null;
      guestName: string;
      guestEmail: string;
      guestPhone: string;
      wantsHydro: boolean;
    }>
  ) {
    try {
      sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          step: overrides?.step ?? step,
          selectedRoom: overrides?.selectedRoom ?? selectedRoom,
          guestName: overrides?.guestName ?? guestName,
          guestEmail: overrides?.guestEmail ?? guestEmail,
          guestPhone: overrides?.guestPhone ?? guestPhone,
          wantsHydro: overrides?.wantsHydro ?? wantsHydro,
        })
      );
    } catch {
      // storage full or unavailable
    }
  }

  function clearBookingState() {
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }

  const nights =
    checkin && checkout
      ? Math.max(
          1,
          Math.ceil(
            (new Date(checkout).getTime() - new Date(checkin).getTime()) / (1000 * 60 * 60 * 24)
          )
        )
      : 0;

  // Fetch availability when dates change
  const today = new Date().toISOString().split('T')[0];
  const minCheckOut = checkin || today;

  async function fetchAvailability() {
    if (!checkin || !checkout) return;
    setLoading(true);
    setSearched(true);
    setApiError(false);
    try {
      const params = new URLSearchParams({
        arrival_date: checkin,
        departure_date: checkout,
        adults: String(guests),
        kids: '0',
      });
      const res = await fetch(`/api/availability?${params}`);
      if (!res.ok) {
        setApiError(true);
        setRooms([]);
        setLoading(false);
        return;
      }
      const data = await res.json();
      const availableRooms = ((data.rooms ?? []) as AvailableRoom[]).filter(
        (room) => room.available
      );
      setRooms(availableRooms);
      trackAvailabilityViewed(availableRooms.length);
    } catch {
      setApiError(true);
      setRooms([]);
    }
    setLoading(false);
  }

  useEffect(() => {
    if (checkinParam && checkoutParam) {
      fetchAvailability();
    }
  }, [checkinParam, checkoutParam]);

  function handleSearch() {
    if (checkout <= checkin) return;
    fetchAvailability();
  }

  function handleSelectRoom(room: AvailableRoom) {
    trackRoomSelected({
      room_slug: room.cmsSlug,
      room_name: room.cmsName,
      price: room.price,
    });
    trackCheckoutStarted({
      room_slug: room.cmsSlug,
      room_name: room.cmsName,
      value: room.price,
      nights,
    });
    setSelectedRoom(room);
    setWantsHydro(false);
    setStep('details');
    saveBookingState({ step: 'details', selectedRoom: room, wantsHydro: false });
    window.scrollTo(0, 0);
  }

  async function handleConfirm() {
    if (!guestName || !guestEmail || !selectedRoom) return;
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guestName,
          guestEmail,
          guestPhone,
          checkin,
          checkout,
          categoryId: selectedRoom.category_id,
          rateplanId: selectedRoom.rateplan_id,
          adults: guests,
          kids: 0,
          totalPrice: selectedRoom.price,
          ...(wantsHydro && { notes: 'Solicita hidromassagem (sujeito a disponibilidade)' }),
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.booking_id) {
        setError(data.error ?? 'Erro ao criar reserva. Tente novamente ou ligue (31) 3881-8049.');
        setIsSubmitting(false);
        return;
      }

      setBookingId(String(data.booking_id));
      trackReservationCreated({
        booking_id: String(data.booking_id),
        room_name: selectedRoom.cmsName,
        value: selectedRoom.price,
        nights,
      });
      setIsSubmitting(false);
      setStep('confirmed');
      clearBookingState();
      window.scrollTo(0, 0);
    } catch {
      setError('Falha na comunicação com o servidor. Tente novamente ou ligue (31) 3881-8049.');
      setIsSubmitting(false);
    }
  }

  // Step 3: Confirmation
  if (step === 'confirmed' && selectedRoom) {
    return (
      <main className="pt-24 pb-16">
        <div className="mx-auto max-w-2xl px-4 text-center">
          <div className="mb-8 text-6xl">✓</div>
          <h1 className="font-display text-3xl font-bold text-brand-black">Reserva confirmada!</h1>
          <p className="mt-4 text-beige-700">
            Sua reserva foi registrada com sucesso no sistema do hotel.
          </p>
          {bookingId && <p className="mt-2 text-sm text-beige-500">Protocolo: {bookingId}</p>}

          <div className="mt-8 rounded-sm border border-beige-200 bg-beige-50 p-6 text-left">
            <h3 className="font-display text-lg font-bold text-brand-black">Resumo</h3>
            <div className="mt-4 space-y-2 text-sm text-beige-800">
              <div className="flex justify-between">
                <span>Quarto</span>
                <span className="font-medium">{selectedRoom.cmsName}</span>
              </div>
              <div className="flex justify-between">
                <span>Check-in</span>
                <span className="font-medium">
                  {new Date(checkin + 'T12:00:00').toLocaleDateString('pt-BR')}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Check-out</span>
                <span className="font-medium">
                  {new Date(checkout + 'T12:00:00').toLocaleDateString('pt-BR')}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Hóspedes</span>
                <span className="font-medium">{guests}</span>
              </div>
              {wantsHydro && (
                <div className="flex justify-between text-gold-700">
                  <span>Hidromassagem</span>
                  <span className="font-medium">Solicitada (sujeito a disp.)</span>
                </div>
              )}
              <div className="flex justify-between border-t border-beige-300 pt-2">
                <span className="font-bold">Total</span>
                <span className="font-display text-lg font-bold text-gold-700">
                  R$ {selectedRoom.price.toLocaleString('pt-BR')}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-8 space-y-3 text-sm text-beige-600">
            <p>Um email de confirmação será enviado para {guestEmail}</p>
            <p>Dúvidas? (31) 3881-8049 ou WhatsApp</p>
          </div>

          <Link
            href="/"
            className="mt-8 inline-block rounded-sm bg-brand-gold px-8 py-3 text-sm font-semibold uppercase tracking-widest text-brand-black transition-colors hover:bg-gold-400"
          >
            Voltar ao início
          </Link>
        </div>
      </main>
    );
  }

  // Step 2: Guest details
  if (step === 'details' && selectedRoom) {
    return (
      <main className="pt-24 pb-16">
        <div className="mx-auto max-w-4xl px-4">
          <nav aria-label="Progresso da reserva" className="mb-8">
            <ol className="flex items-center justify-center gap-4 text-sm">
              <li className="text-beige-400">1. Escolha</li>
              <li className="text-beige-300" aria-hidden="true">
                →
              </li>
              <li className="font-bold text-brand-gold" aria-current="step">
                2. Seus dados
              </li>
              <li className="text-beige-300" aria-hidden="true">
                →
              </li>
              <li className="text-beige-400">3. Confirmação</li>
            </ol>
          </nav>

          <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <h1 className="font-display text-2xl font-bold text-brand-black">
                Complete sua reserva
              </h1>
              <div className="mt-6 space-y-4">
                <div>
                  <label
                    htmlFor="guest-name"
                    className="mb-1 block text-sm font-medium text-beige-700"
                  >
                    Nome completo *
                  </label>
                  <input
                    id="guest-name"
                    type="text"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    onBlur={(e) => saveBookingState({ guestName: e.target.value })}
                    className="w-full rounded-sm border border-beige-300 px-4 py-3 text-sm outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold"
                    placeholder="João Silva"
                  />
                </div>
                <div>
                  <label
                    htmlFor="guest-email"
                    className="mb-1 block text-sm font-medium text-beige-700"
                  >
                    Email *
                  </label>
                  <input
                    id="guest-email"
                    type="email"
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    onBlur={(e) => saveBookingState({ guestEmail: e.target.value })}
                    className="w-full rounded-sm border border-beige-300 px-4 py-3 text-sm outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold"
                    placeholder="joao@email.com"
                  />
                </div>
                <div>
                  <label
                    htmlFor="guest-phone"
                    className="mb-1 block text-sm font-medium text-beige-700"
                  >
                    Telefone *
                  </label>
                  <input
                    id="guest-phone"
                    type="tel"
                    value={guestPhone}
                    onChange={(e) => setGuestPhone(e.target.value)}
                    onBlur={(e) => saveBookingState({ guestPhone: e.target.value })}
                    className="w-full rounded-sm border border-beige-300 px-4 py-3 text-sm outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold"
                    placeholder="(31) 99999-9999"
                  />
                </div>
              </div>

              {/* Hydromassage upsell — only for Master rooms */}
              {selectedRoom && selectedRoom.cmsName.toLowerCase().includes('master') && (
                <div className="mt-6 rounded-lg border-2 border-dashed border-brand-gold/40 bg-gold-50/50 p-4">
                  <label className="flex cursor-pointer items-start gap-3">
                    <input
                      type="checkbox"
                      checked={wantsHydro}
                      onChange={(e) => {
                        setWantsHydro(e.target.checked);
                        saveBookingState({ wantsHydro: e.target.checked });
                      }}
                      className="mt-1 h-4 w-4 rounded border-beige-300 text-brand-gold accent-brand-gold"
                    />
                    <div>
                      <span className="font-semibold text-brand-black">
                        Adicionar hidromassagem
                      </span>
                      <p className="mt-0.5 text-xs text-beige-600">
                        R$ 120–150/noite extra. Sujeito a disponibilidade (2 unidades). O hotel
                        confirmará por e-mail.
                      </p>
                    </div>
                  </label>
                </div>
              )}

              {error && (
                <div className="mt-6 rounded-sm border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}
              <div className="mt-8 flex gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setStep('search');
                    saveBookingState({ step: 'search' });
                  }}
                  className="rounded-sm border border-beige-300 px-6 py-3 text-sm text-beige-700 transition-colors hover:bg-beige-50"
                >
                  ← Voltar
                </button>
                <button
                  type="button"
                  onClick={handleConfirm}
                  disabled={!guestName || !guestEmail || !guestPhone || isSubmitting}
                  className="flex-1 rounded-sm bg-brand-gold px-6 py-3 text-sm font-semibold uppercase tracking-widest text-brand-black transition-colors hover:bg-gold-400 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSubmitting ? 'Enviando...' : 'Confirmar reserva'}
                </button>
              </div>
            </div>
            <div className="rounded-sm border border-beige-200 bg-beige-50 p-6">
              <div className="relative aspect-[4/3] overflow-hidden rounded-sm">
                <Image
                  src={selectedRoom.cmsImage || '/images/rooms/standard.jpg'}
                  alt={selectedRoom.cmsName}
                  fill
                  className="object-cover"
                  unoptimized={selectedRoom.cmsImage.startsWith('http')}
                />
              </div>
              <h3 className="mt-4 font-display text-lg font-bold">{selectedRoom.cmsName}</h3>
              <div className="mt-3 space-y-1 text-sm text-beige-700">
                <div>
                  {new Date(checkin + 'T12:00:00').toLocaleDateString('pt-BR')} →{' '}
                  {new Date(checkout + 'T12:00:00').toLocaleDateString('pt-BR')}
                </div>
                <div>
                  {guests} hóspede{guests !== 1 ? 's' : ''}
                </div>
              </div>
              {wantsHydro && (
                <div className="mt-2 text-xs text-gold-700">
                  + Hidromassagem solicitada (R$ 120–150/noite)
                </div>
              )}
              <div className="mt-4 border-t border-beige-300 pt-4">
                <div className="flex justify-between font-bold">
                  <span>Total</span>
                  <span className="font-display text-xl text-gold-700">
                    R$ {selectedRoom.price.toLocaleString('pt-BR')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // Step 1: Search + Room selection
  return (
    <main className="pt-24 pb-16">
      <div className="mx-auto max-w-6xl px-4">
        <nav aria-label="Progresso da reserva" className="mb-8">
          <ol className="flex items-center justify-center gap-4 text-sm">
            <li className="font-bold text-brand-gold" aria-current="step">
              1. Escolha
            </li>
            <li className="text-beige-300" aria-hidden="true">
              →
            </li>
            <li className="text-beige-400">2. Seus dados</li>
            <li className="text-beige-300" aria-hidden="true">
              →
            </li>
            <li className="text-beige-400">3. Confirmação</li>
          </ol>
        </nav>

        <h1 className="font-display text-3xl font-bold text-brand-black">Quartos disponíveis</h1>

        {/* Search bar */}
        <div className="mt-6 flex flex-wrap items-end gap-4 rounded-sm border border-beige-200 bg-beige-50 p-4">
          <div className="flex-1">
            <label
              htmlFor="search-checkin"
              className="mb-1 block text-xs font-medium uppercase tracking-wider text-beige-700"
            >
              Check-in
            </label>
            <input
              id="search-checkin"
              type="date"
              value={checkin}
              min={today}
              onChange={(e) => setCheckin(e.target.value)}
              className="w-full rounded-sm border border-beige-300 bg-brand-white px-3 py-2 text-sm outline-none focus:border-brand-gold"
            />
          </div>
          <div className="flex-1">
            <label
              htmlFor="search-checkout"
              className="mb-1 block text-xs font-medium uppercase tracking-wider text-beige-700"
            >
              Check-out
            </label>
            <input
              id="search-checkout"
              type="date"
              value={checkout}
              min={minCheckOut}
              onChange={(e) => setCheckout(e.target.value)}
              className="w-full rounded-sm border border-beige-300 bg-brand-white px-3 py-2 text-sm outline-none focus:border-brand-gold"
            />
          </div>
          <div>
            <label
              htmlFor="search-guests"
              className="mb-1 block text-xs font-medium uppercase tracking-wider text-beige-700"
            >
              Hóspedes
            </label>
            <div className="flex items-center gap-3 rounded-sm border border-beige-300 bg-brand-white px-3 py-2">
              <button
                type="button"
                aria-label="Diminuir hóspedes"
                onClick={() => setGuests(Math.max(1, guests - 1))}
                className="font-bold text-beige-600"
              >
                -
              </button>
              <span id="search-guests" className="w-6 text-center text-sm">
                {guests}
              </span>
              <button
                type="button"
                aria-label="Aumentar hóspedes"
                onClick={() => setGuests(Math.min(10, guests + 1))}
                className="font-bold text-beige-600"
              >
                +
              </button>
            </div>
          </div>
          <button
            type="button"
            onClick={handleSearch}
            disabled={!checkin || !checkout || loading}
            className="rounded-sm bg-brand-gold px-6 py-2.5 text-sm font-semibold uppercase tracking-widest text-brand-black transition-colors hover:bg-gold-400 disabled:opacity-50"
          >
            {loading ? 'Buscando...' : 'Buscar'}
          </button>
        </div>

        {/* Results */}
        <div className="mt-8">
          {loading && (
            <div className="py-12 text-center text-beige-500">
              Consultando disponibilidade no hotel...
            </div>
          )}

          {!loading && searched && apiError && (
            <div className="rounded-sm border border-red-300 bg-red-50 py-12 text-center">
              <p className="text-lg text-red-700">Erro ao consultar disponibilidade.</p>
              <p className="mt-2 text-sm text-red-500">
                Tente novamente em alguns instantes ou ligue: (31) 3881-8049
              </p>
            </div>
          )}

          {!loading && searched && !apiError && rooms.length === 0 && (
            <div className="rounded-sm border border-beige-200 bg-beige-50 py-12 text-center">
              <p className="text-lg text-beige-700">
                Nenhum quarto disponível para as datas selecionadas.
              </p>
              <p className="mt-2 text-sm text-beige-500">
                Tente outras datas ou entre em contato: (31) 3881-8049
              </p>
            </div>
          )}

          {!loading && rooms.length > 0 && (
            <div className="space-y-6">
              {rooms.map((room) => (
                <div
                  key={room.cmsRoomId}
                  className="flex flex-col overflow-hidden rounded-sm border border-beige-200 bg-brand-white shadow-sm transition-shadow hover:shadow-md md:flex-row"
                >
                  <div className="relative aspect-[4/3] md:w-80 md:shrink-0">
                    <Image
                      src={room.cmsImage || '/images/rooms/standard.jpg'}
                      alt={room.cmsName}
                      fill
                      className="object-cover"
                      unoptimized={room.cmsImage.startsWith('http')}
                    />
                  </div>
                  <div className="flex flex-1 flex-col justify-between p-6">
                    <div>
                      <h3 className="font-display text-xl font-bold text-brand-black">
                        {room.cmsName}
                      </h3>
                      {room.cmsDescription && (
                        <p className="mt-2 text-sm text-beige-700">{room.cmsDescription}</p>
                      )}
                      {room.cmsAmenities.length > 0 && (
                        <p className="mt-2 text-xs text-beige-600">
                          {room.cmsAmenities.slice(0, 4).join(' · ')}
                        </p>
                      )}
                      <p className="mt-1 text-sm text-beige-600">
                        Até {room.capacity.adults} adultos
                        {room.capacity.kids > 0 ? ` + ${room.capacity.kids} crianças` : ''}
                      </p>
                      <p className="mt-1 text-xs text-green-600">
                        {room.allots} disponível{room.allots !== 1 ? 'is' : ''}
                      </p>
                    </div>
                    <div className="mt-4 flex items-end justify-between">
                      <div>
                        <span className="font-display text-2xl font-bold text-brand-black">
                          A partir de R$ {(room.minPrice ?? room.price).toLocaleString('pt-BR')}
                        </span>
                        <span className="text-sm text-beige-600"> / estadia</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleSelectRoom(room)}
                        className="rounded-sm bg-brand-gold px-6 py-3 text-sm font-semibold uppercase tracking-widest text-brand-black transition-colors hover:bg-gold-400"
                      >
                        Selecionar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

export default function ReservarPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center pt-24">
          <p className="text-beige-600">Carregando...</p>
        </main>
      }
    >
      <BookingContent />
    </Suspense>
  );
}
