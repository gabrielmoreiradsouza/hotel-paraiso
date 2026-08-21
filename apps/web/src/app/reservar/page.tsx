'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useRef, Suspense } from 'react';
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

function getTodayBR(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

function BookingContent() {
  const searchParams = useSearchParams();
  const checkinParam = searchParams?.get('checkin') ?? '';
  const checkoutParam = searchParams?.get('checkout') ?? '';
  const guestsParam = searchParams?.get('guests') ?? '2';
  const roomParam = searchParams?.get('room') ?? '';
  const stepParam = searchParams?.get('step') ?? '';

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
  const availAbortRef = useRef<AbortController | null>(null);

  // Abort availability fetch on unmount
  useEffect(() => {
    return () => {
      availAbortRef.current?.abort();
    };
  }, []);

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
        checkin?: string;
        checkout?: string;
        guests?: number;
      };

      // If saved context doesn't match current URL params, reset
      const contextMismatch =
        (checkinParam && state.checkin && state.checkin !== checkinParam) ||
        (checkoutParam && state.checkout && state.checkout !== checkoutParam) ||
        (guestsParam && state.guests != null && state.guests !== Number(guestsParam));

      if (contextMismatch) {
        sessionStorage.removeItem(STORAGE_KEY);
        setStep('search');
        setSelectedRoom(null);
        return;
      }

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
          checkin,
          checkout,
          guests,
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
  const today = getTodayBR();
  const minCheckOut = checkin
    ? new Date(new Date(checkin + 'T12:00:00').getTime() + 86400000).toISOString().slice(0, 10)
    : today;

  async function fetchAvailability() {
    if (!checkin || !checkout) return;
    setLoading(true);
    setSearched(true);
    setApiError(false);

    // Abort any in-flight request
    availAbortRef.current?.abort();
    const controller = new AbortController();
    availAbortRef.current = controller;

    try {
      const params = new URLSearchParams({
        arrival_date: checkin,
        departure_date: checkout,
        adults: String(guests),
        kids: '0',
      });
      const res = await fetch(`/api/availability?${params}`, { signal: controller.signal });
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
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      setApiError(true);
      setRooms([]);
    }
    if (!controller.signal.aborted) setLoading(false);
  }

  useEffect(() => {
    if (checkinParam && checkoutParam) {
      fetchAvailability();
    }
  }, [checkinParam, checkoutParam]);

  // Auto-select room when navigating from room detail page with ?room=slug&step=details
  useEffect(() => {
    if (roomParam && stepParam === 'details' && rooms.length > 0 && !selectedRoom) {
      const match = rooms.find((r) => r.cmsSlug === roomParam);
      if (match) {
        handleSelectRoom(match);
      }
    }
  }, [rooms, roomParam, stepParam]);

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
        adults: guests,
        room_slug: selectedRoom.cmsSlug,
        checkin,
        checkout,
      });

      if (typeof window !== 'undefined' && window.dataLayer) {
        window.dataLayer.push({
          event: 'purchase',
          booking_id: String(data.booking_id),
          room_name: selectedRoom.cmsName,
          room_slug: selectedRoom.cmsSlug,
          checkin,
          checkout,
          nights,
          adults: guests,
          total_price: selectedRoom.price,
          currency: 'BRL',
        });
      }

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
    const formatDateWithDay = (dateStr: string) => {
      const d = new Date(dateStr + 'T12:00:00');
      const day = d.toLocaleDateString('pt-BR');
      const weekday = d.toLocaleDateString('pt-BR', { weekday: 'long' });
      return `${day} (${weekday})`;
    };

    const whatsappText = encodeURIComponent(
      `Olá! Sou ${guestName}, protocolo ${bookingId}. Confirma minha reserva?`
    );

    const nextSteps = [
      `Email de confirmação enviado para ${guestEmail}`,
      ...(guestPhone ? [`O hotel confirmará pelo WhatsApp para ${guestPhone}`] : []),
      'Apresente-se na recepção no check-in a partir das 14h com documento',
      'Cancelamento gratuito até 48h antes do check-in',
    ];

    return (
      <main className="bg-brand-black pt-24 pb-16">
        <div className="mx-auto max-w-2xl px-4">
          {/* Success header */}
          <div className="text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border-2 border-brand-gold bg-brand-gold/15">
              <svg
                className="h-10 w-10 text-brand-gold"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="mt-6 font-display text-3xl font-bold text-white">Reserva confirmada!</h1>
            <p className="mt-3 text-white/70">Sua reserva foi registrada com sucesso.</p>
            {bookingId && (
              <p className="mt-2 text-sm font-semibold text-brand-gold">
                Protocolo: #HP-{bookingId}
              </p>
            )}
          </div>

          {/* Reservation detail card */}
          <div className="mt-8 rounded-xl border border-white/[0.08] bg-white/[0.04] p-6">
            {/* Header row: room photo + name + meta */}
            <div className="flex gap-4">
              <div className="relative h-20 w-[120px] shrink-0 overflow-hidden rounded-lg">
                <Image
                  src={selectedRoom.cmsImage || '/images/rooms/standard.jpg'}
                  alt={selectedRoom.cmsName}
                  fill
                  className="object-cover"
                  unoptimized={selectedRoom.cmsImage.startsWith('http')}
                />
              </div>
              <div>
                <h3 className="font-display text-lg font-bold text-white">
                  {selectedRoom.cmsName}
                </h3>
                <p className="mt-1 text-sm text-white/50">
                  Até {selectedRoom.capacity.adults} adulto
                  {selectedRoom.capacity.adults !== 1 ? 's' : ''}
                  {selectedRoom.capacity.kids > 0
                    ? ` + ${selectedRoom.capacity.kids} crianças`
                    : ''}
                </p>
                {selectedRoom.cmsAmenities.length > 0 && (
                  <p className="mt-0.5 text-xs text-white/40">
                    {selectedRoom.cmsAmenities.slice(0, 4).join(' · ')}
                  </p>
                )}
              </div>
            </div>

            {/* Detail rows */}
            <div className="mt-5 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-white/50">Hóspede</span>
                <span className="font-medium text-white">{guestName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/50">Email</span>
                <span className="font-medium text-white">{guestEmail}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/50">Telefone</span>
                <span className="font-medium text-white">{guestPhone || 'Não informado'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/50">Adultos</span>
                <span className="font-medium text-white">
                  {guests} adulto{guests !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/50">Check-in</span>
                <span className="font-medium text-white">
                  {formatDateWithDay(checkin)} &mdash; 14h
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/50">Check-out</span>
                <span className="font-medium text-white">
                  {formatDateWithDay(checkout)} &mdash; 12h
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/50">Noites</span>
                <span className="font-medium text-white">
                  {nights} noite{nights !== 1 ? 's' : ''}
                </span>
              </div>
              {wantsHydro && (
                <div className="flex justify-between">
                  <span className="text-white/50">Hidromassagem</span>
                  <span className="font-semibold text-brand-gold">Solicitada</span>
                </div>
              )}
              <div className="flex justify-between border-t border-white/[0.08] pt-3">
                <span className="text-base font-bold text-white">Total</span>
                <span className="font-display text-xl font-bold text-brand-gold">
                  R$ {selectedRoom.price.toLocaleString('pt-BR')}
                </span>
              </div>
            </div>
          </div>

          {/* Próximos passos */}
          <div className="mt-6 rounded-xl border border-white/[0.06] bg-white/[0.03] p-5">
            <h3 className="font-display text-base font-bold text-white">Próximos passos</h3>
            <ol className="mt-4 space-y-3">
              {nextSteps.map((text, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-brand-gold/40 bg-brand-gold/10 text-xs font-bold text-brand-gold">
                    {i + 1}
                  </span>
                  <span className="text-sm text-white/60">{text}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* Contact buttons */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <a
              href={`https://wa.me/553138818049?text=${whatsappText}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-500"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                <path d="M12 0C5.373 0 0 5.373 0 12c0 2.125.553 4.12 1.522 5.857L.063 23.488a.5.5 0 00.611.611l5.631-1.459A11.944 11.944 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22a9.94 9.94 0 01-5.39-1.586l-.386-.232-3.342.867.884-3.29-.254-.403A9.96 9.96 0 012 12C2 6.486 6.486 2 12 2s10 4.486 10 10-4.486 10-10 10z" />
              </svg>
              WhatsApp
            </a>
            <a
              href={`mailto:hotelrparaiso@gmail.com?subject=Reserva ${encodeURIComponent(bookingId ?? '')}`}
              className="inline-flex items-center gap-2 rounded-lg border border-white/[0.12] bg-white/[0.04] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/[0.08]"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
                />
              </svg>
              Email
            </a>
          </div>

          {/* Voltar ao início */}
          <div className="mt-8 text-center">
            <Link
              href="/"
              className="text-sm text-white/50 underline underline-offset-4 transition-colors hover:text-white/70"
            >
              Voltar ao início
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // Step 2: Guest details
  if (step === 'details' && selectedRoom) {
    return (
      <main className="bg-brand-black pt-24 pb-16">
        <div className="mx-auto max-w-4xl px-4">
          <nav aria-label="Progresso da reserva" className="mb-8">
            <ol className="flex items-center justify-center gap-4 text-sm">
              <li className="text-white/50">1. Escolha</li>
              <li className="text-white/30" aria-hidden="true">
                →
              </li>
              <li className="font-bold text-brand-gold" aria-current="step">
                2. Seus dados
              </li>
              <li className="text-white/30" aria-hidden="true">
                →
              </li>
              <li className="text-white/50">3. Confirmação</li>
            </ol>
          </nav>

          <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <h1 className="font-display text-2xl font-bold text-white">Complete sua reserva</h1>
              <div className="mt-6 space-y-4">
                <div>
                  <label
                    htmlFor="guest-name"
                    className="mb-1 block text-sm font-medium text-white/70"
                  >
                    Nome completo *
                  </label>
                  <input
                    id="guest-name"
                    type="text"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    onBlur={(e) => saveBookingState({ guestName: e.target.value })}
                    className="w-full rounded-sm bg-white/[0.06] border border-white/[0.12] px-4 py-3 text-sm text-white outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold/30 placeholder:text-white/40"
                    placeholder="João Silva"
                  />
                </div>
                <div>
                  <label
                    htmlFor="guest-email"
                    className="mb-1 block text-sm font-medium text-white/70"
                  >
                    Email *
                  </label>
                  <input
                    id="guest-email"
                    type="email"
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    onBlur={(e) => saveBookingState({ guestEmail: e.target.value })}
                    className="w-full rounded-sm bg-white/[0.06] border border-white/[0.12] px-4 py-3 text-sm text-white outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold/30 placeholder:text-white/40"
                    placeholder="joao@email.com"
                  />
                </div>
                <div>
                  <label
                    htmlFor="guest-phone"
                    className="mb-1 block text-sm font-medium text-white/70"
                  >
                    Telefone *
                  </label>
                  <input
                    id="guest-phone"
                    type="tel"
                    value={guestPhone}
                    onChange={(e) => setGuestPhone(e.target.value)}
                    onBlur={(e) => saveBookingState({ guestPhone: e.target.value })}
                    className="w-full rounded-sm bg-white/[0.06] border border-white/[0.12] px-4 py-3 text-sm text-white outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold/30 placeholder:text-white/40"
                    placeholder="(31) 99999-9999"
                  />
                </div>
              </div>

              {/* Hydromassage upsell — only for Master rooms */}
              {selectedRoom && selectedRoom.cmsName.toLowerCase().includes('master') && (
                <div className="mt-6 rounded-lg bg-white/[0.04] border border-white/[0.08] p-4">
                  <label className="flex cursor-pointer items-start gap-3">
                    <input
                      type="checkbox"
                      checked={wantsHydro}
                      onChange={(e) => {
                        setWantsHydro(e.target.checked);
                        saveBookingState({ wantsHydro: e.target.checked });
                      }}
                      className="mt-1 h-4 w-4 rounded border-white/[0.12] text-brand-gold accent-brand-gold"
                    />
                    <div>
                      <span className="font-semibold text-white">Adicionar hidromassagem</span>
                      <p className="mt-0.5 text-xs text-white/50">
                        R$ 120–150/noite extra. Sujeito a disponibilidade (2 unidades). O hotel
                        confirmará por e-mail.
                      </p>
                    </div>
                  </label>
                </div>
              )}

              {error && (
                <div
                  role="alert"
                  className="mt-6 rounded-sm bg-red-900/20 border border-red-500/30 px-4 py-3 text-sm text-red-400"
                >
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
                  className="rounded-sm border border-white/[0.12] px-6 py-3 text-sm text-white/70 transition-colors hover:bg-white/[0.08]"
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
            <div className="rounded-sm border border-white/[0.08] bg-white/[0.04] p-6">
              <div className="relative aspect-[4/3] overflow-hidden rounded-sm">
                <Image
                  src={selectedRoom.cmsImage || '/images/rooms/standard.jpg'}
                  alt={selectedRoom.cmsName}
                  fill
                  className="object-cover"
                  unoptimized={selectedRoom.cmsImage.startsWith('http')}
                />
              </div>
              <h3 className="mt-4 font-display text-lg font-bold text-white">
                {selectedRoom.cmsName}
              </h3>
              <div className="mt-3 space-y-1 text-sm text-white/70">
                <div>
                  {new Date(checkin + 'T12:00:00').toLocaleDateString('pt-BR')} →{' '}
                  {new Date(checkout + 'T12:00:00').toLocaleDateString('pt-BR')}
                </div>
                <div>
                  {guests} hóspede{guests !== 1 ? 's' : ''}
                </div>
              </div>
              {wantsHydro && (
                <div className="mt-2 text-xs text-brand-gold">
                  + Hidromassagem solicitada (R$ 120–150/noite)
                </div>
              )}
              <div className="mt-4 border-t border-white/[0.08] pt-4">
                <div className="flex justify-between font-bold text-white">
                  <span>Total</span>
                  <span className="font-display text-xl text-brand-gold">
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
    <main className="bg-brand-black pt-24 pb-16">
      <div className="mx-auto max-w-6xl px-4">
        <nav aria-label="Progresso da reserva" className="mb-8">
          <ol className="flex items-center justify-center gap-4 text-sm">
            <li className="font-bold text-brand-gold" aria-current="step">
              1. Escolha
            </li>
            <li className="text-white/30" aria-hidden="true">
              →
            </li>
            <li className="text-white/50">2. Seus dados</li>
            <li className="text-white/30" aria-hidden="true">
              →
            </li>
            <li className="text-white/50">3. Confirmação</li>
          </ol>
        </nav>

        <h1 className="font-display text-3xl font-bold text-white">Quartos disponíveis</h1>

        {/* Search bar */}
        <div className="mt-6 flex flex-wrap items-end gap-4 rounded-sm bg-white/[0.04] border border-white/[0.12] p-4">
          <div className="flex-1">
            <label
              htmlFor="search-checkin"
              className="mb-1 block text-xs font-medium uppercase tracking-wider text-white/70"
            >
              Check-in
            </label>
            <input
              id="search-checkin"
              type="date"
              value={checkin}
              min={today}
              onChange={(e) => setCheckin(e.target.value)}
              className="w-full rounded-sm bg-white/[0.06] border border-white/[0.12] px-3 py-2 text-sm text-white outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold/30 [color-scheme:dark]"
            />
          </div>
          <div className="flex-1">
            <label
              htmlFor="search-checkout"
              className="mb-1 block text-xs font-medium uppercase tracking-wider text-white/70"
            >
              Check-out
            </label>
            <input
              id="search-checkout"
              type="date"
              value={checkout}
              min={minCheckOut}
              onChange={(e) => setCheckout(e.target.value)}
              className="w-full rounded-sm bg-white/[0.06] border border-white/[0.12] px-3 py-2 text-sm text-white outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold/30 [color-scheme:dark]"
            />
          </div>
          <div>
            <label
              htmlFor="search-guests"
              className="mb-1 block text-xs font-medium uppercase tracking-wider text-white/70"
            >
              Hóspedes
            </label>
            <div className="flex items-center gap-3 rounded-sm bg-white/[0.06] border border-white/[0.12] px-3 py-2">
              <button
                type="button"
                aria-label="Diminuir hóspedes"
                onClick={() => setGuests(Math.max(1, guests - 1))}
                className="font-bold text-white/50"
              >
                -
              </button>
              <span id="search-guests" className="w-6 text-center text-sm text-white">
                {guests}
              </span>
              <button
                type="button"
                aria-label="Aumentar hóspedes"
                onClick={() => setGuests(Math.min(10, guests + 1))}
                className="font-bold text-white/50"
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
        <div className="mt-8" aria-live="polite">
          {loading && (
            <div className="py-12 text-center text-white/50">
              Consultando disponibilidade no hotel...
            </div>
          )}

          {!loading && searched && apiError && (
            <div
              role="alert"
              className="rounded-sm bg-red-900/20 border border-red-500/30 py-12 text-center"
            >
              <p className="text-lg text-red-400">Erro ao consultar disponibilidade.</p>
              <p className="mt-2 text-sm text-red-400/70">
                Tente novamente em alguns instantes ou ligue: (31) 3881-8049
              </p>
            </div>
          )}

          {!loading && searched && !apiError && rooms.length === 0 && (
            <div className="rounded-sm border border-white/[0.08] bg-white/[0.04] py-12 text-center">
              <p className="text-lg text-white/70">
                Nenhum quarto disponível para as datas selecionadas.
              </p>
              <p className="mt-2 text-sm text-white/50">
                Tente outras datas ou entre em contato: (31) 3881-8049
              </p>
            </div>
          )}

          {!loading && rooms.length > 0 && (
            <div className="space-y-6">
              {rooms.map((room) => (
                <div
                  key={room.cmsRoomId}
                  className="flex flex-col overflow-hidden rounded-sm border border-white/[0.08] bg-white/[0.04] transition-colors hover:bg-white/[0.06] md:flex-row"
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
                      <h3 className="font-display text-xl font-bold text-white">{room.cmsName}</h3>
                      {room.cmsDescription && (
                        <p className="mt-2 text-sm text-white/70">{room.cmsDescription}</p>
                      )}
                      {room.cmsAmenities.length > 0 && (
                        <p className="mt-2 text-xs text-white/50">
                          {room.cmsAmenities.slice(0, 4).join(' · ')}
                        </p>
                      )}
                      <p className="mt-1 text-sm text-white/50">
                        Até {room.capacity.adults} adultos
                        {room.capacity.kids > 0 ? ` + ${room.capacity.kids} crianças` : ''}
                      </p>
                      <p className="mt-1 text-xs text-emerald-400">
                        {room.allots} disponível{room.allots !== 1 ? 'is' : ''}
                      </p>
                    </div>
                    <div className="mt-4 flex items-end justify-between">
                      <div>
                        <span className="font-display text-2xl font-bold text-white">
                          R$ {room.price.toLocaleString('pt-BR')}
                        </span>
                        <span className="text-sm text-white/50"> / estadia</span>
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
        <main className="flex min-h-screen items-center justify-center bg-brand-black pt-24">
          <p className="text-white/50">Carregando...</p>
        </main>
      }
    >
      <BookingContent />
    </Suspense>
  );
}
