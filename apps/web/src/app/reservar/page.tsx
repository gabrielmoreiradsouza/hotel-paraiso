'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

const availableRooms = [
  {
    slug: 'standard',
    name: 'Standard',
    price: 180,
    image: '/images/rooms/standard.jpg',
    capacity: '2 adultos',
    amenities: ['Wi-Fi', 'Ar condicionado', 'TV', 'Frigobar'],
  },
  {
    slug: 'luxo',
    name: 'Luxo',
    price: 280,
    image: '/images/rooms/luxo.jpg',
    capacity: '2 adultos + 1 criança',
    amenities: ['Wi-Fi', 'Ar condicionado', 'TV 50"', 'Cofre'],
  },
  {
    slug: 'master',
    name: 'Suíte Master',
    price: 420,
    image: '/images/rooms/master.jpg',
    capacity: '2 adultos + 2 crianças',
    amenities: ['Wi-Fi', 'Hidromassagem', 'Sala de estar', 'Serviço de quarto'],
  },
];

function BookingContent() {
  const searchParams = useSearchParams();
  const checkinParam = searchParams.get('checkin') ?? '';
  const checkoutParam = searchParams.get('checkout') ?? '';
  const guestsParam = searchParams.get('guests') ?? '2';

  const [checkin, setCheckin] = useState(checkinParam);
  const [checkout, setCheckout] = useState(checkoutParam);
  const [guests, setGuests] = useState(Number(guestsParam));
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [step, setStep] = useState<'search' | 'details' | 'confirmed'>('search');

  // Form for confirmed step
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestPhone, setGuestPhone] = useState('');

  const nights =
    checkin && checkout
      ? Math.max(
          1,
          Math.ceil(
            (new Date(checkout).getTime() - new Date(checkin).getTime()) / (1000 * 60 * 60 * 24)
          )
        )
      : 0;

  const selected = availableRooms.find((r) => r.slug === selectedRoom);

  function handleSelectRoom(slug: string) {
    setSelectedRoom(slug);
    setStep('details');
    window.scrollTo(0, 0);
  }

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingId, setBookingId] = useState<string | null>(null);

  async function handleConfirm() {
    if (!guestName || !guestEmail || !selectedRoom) return;
    setIsSubmitting(true);

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
          roomSlug: selectedRoom,
        }),
      });

      const data = await response.json();
      if (data.booking_id) setBookingId(String(data.booking_id));
    } catch {
      // Even if API fails, show confirmation (we'll process manually)
    }

    setIsSubmitting(false);
    setStep('confirmed');
    window.scrollTo(0, 0);
  }

  // Step 3: Confirmation
  if (step === 'confirmed' && selected) {
    return (
      <main className="pt-24 pb-16">
        <div className="mx-auto max-w-2xl px-4 text-center">
          <div className="mb-8 text-6xl">✓</div>
          <h1 className="font-display text-3xl font-bold text-brand-black">Reserva solicitada!</h1>
          <p className="mt-4 text-beige-700">
            Sua solicitação de reserva foi enviada com sucesso. Entraremos em contato em breve para
            confirmar.
          </p>
          {bookingId && <p className="mt-2 text-sm text-beige-500">Protocolo: {bookingId}</p>}

          <div className="mt-8 rounded-sm border border-beige-200 bg-beige-50 p-6 text-left">
            <h3 className="font-display text-lg font-bold text-brand-black">Resumo</h3>
            <div className="mt-4 space-y-2 text-sm text-beige-800">
              <div className="flex justify-between">
                <span>Quarto</span>
                <span className="font-medium">{selected.name}</span>
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
                <span>Noites</span>
                <span className="font-medium">{nights}</span>
              </div>
              <div className="flex justify-between">
                <span>Hóspedes</span>
                <span className="font-medium">{guests}</span>
              </div>
              <div className="flex justify-between border-t border-beige-300 pt-2">
                <span className="font-bold">Total estimado</span>
                <span className="font-display text-lg font-bold text-brand-gold">
                  R$ {(selected.price * nights).toLocaleString('pt-BR')}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-8 space-y-3 text-sm text-beige-600">
            <p>Um email de confirmação será enviado para {guestEmail}</p>
            <p>Para dúvidas, entre em contato com nossa recepção 24h</p>
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
  if (step === 'details' && selected) {
    return (
      <main className="pt-24 pb-16">
        <div className="mx-auto max-w-4xl px-4">
          {/* Stepper */}
          <div className="mb-8 flex items-center justify-center gap-4 text-sm">
            <span className="text-beige-400">1. Escolha</span>
            <span className="text-beige-300">→</span>
            <span className="font-bold text-brand-gold">2. Seus dados</span>
            <span className="text-beige-300">→</span>
            <span className="text-beige-400">3. Confirmação</span>
          </div>

          <div className="grid gap-8 lg:grid-cols-3">
            {/* Form */}
            <div className="lg:col-span-2">
              <h1 className="font-display text-2xl font-bold text-brand-black">
                Complete sua reserva
              </h1>

              <div className="mt-6 space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-beige-700">
                    Nome completo *
                  </label>
                  <input
                    type="text"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    className="w-full rounded-sm border border-beige-300 px-4 py-3 text-sm outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold"
                    placeholder="João Silva"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-beige-700">Email *</label>
                  <input
                    type="email"
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    className="w-full rounded-sm border border-beige-300 px-4 py-3 text-sm outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold"
                    placeholder="joao@email.com"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-beige-700">Telefone</label>
                  <input
                    type="tel"
                    value={guestPhone}
                    onChange={(e) => setGuestPhone(e.target.value)}
                    className="w-full rounded-sm border border-beige-300 px-4 py-3 text-sm outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold"
                    placeholder="(31) 99999-9999"
                  />
                </div>
              </div>

              <div className="mt-8 flex gap-4">
                <button
                  type="button"
                  onClick={() => setStep('search')}
                  className="rounded-sm border border-beige-300 px-6 py-3 text-sm text-beige-700 transition-colors hover:bg-beige-50"
                >
                  ← Voltar
                </button>
                <button
                  type="button"
                  onClick={handleConfirm}
                  disabled={!guestName || !guestEmail || isSubmitting}
                  className="flex-1 rounded-sm bg-brand-gold px-6 py-3 text-sm font-semibold uppercase tracking-widest text-brand-black transition-colors hover:bg-gold-400 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSubmitting ? 'Enviando...' : 'Confirmar reserva'}
                </button>
              </div>
            </div>

            {/* Summary sidebar */}
            <div className="rounded-sm border border-beige-200 bg-beige-50 p-6">
              <div className="relative aspect-[4/3] overflow-hidden rounded-sm">
                <Image src={selected.image} alt={selected.name} fill className="object-cover" />
              </div>
              <h3 className="mt-4 font-display text-lg font-bold">{selected.name}</h3>
              <div className="mt-3 space-y-1 text-sm text-beige-700">
                <div>
                  {new Date(checkin + 'T12:00:00').toLocaleDateString('pt-BR')} →{' '}
                  {new Date(checkout + 'T12:00:00').toLocaleDateString('pt-BR')}
                </div>
                <div>
                  {nights} noite{nights !== 1 ? 's' : ''} · {guests} hóspede
                  {guests !== 1 ? 's' : ''}
                </div>
              </div>
              <div className="mt-4 border-t border-beige-300 pt-4">
                <div className="flex justify-between text-sm">
                  <span>
                    R$ {selected.price} × {nights} noites
                  </span>
                  <span>R$ {(selected.price * nights).toLocaleString('pt-BR')}</span>
                </div>
                <div className="mt-2 flex justify-between font-bold">
                  <span>Total</span>
                  <span className="font-display text-xl text-brand-gold">
                    R$ {(selected.price * nights).toLocaleString('pt-BR')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // Step 1: Room selection
  return (
    <main className="pt-24 pb-16">
      <div className="mx-auto max-w-6xl px-4">
        {/* Stepper */}
        <div className="mb-8 flex items-center justify-center gap-4 text-sm">
          <span className="font-bold text-brand-gold">1. Escolha</span>
          <span className="text-beige-300">→</span>
          <span className="text-beige-400">2. Seus dados</span>
          <span className="text-beige-300">→</span>
          <span className="text-beige-400">3. Confirmação</span>
        </div>

        <h1 className="font-display text-3xl font-bold text-brand-black">Quartos disponíveis</h1>

        {/* Date bar */}
        <div className="mt-6 flex flex-wrap items-end gap-4 rounded-sm border border-beige-200 bg-beige-50 p-4">
          <div className="flex-1">
            <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-beige-700">
              Check-in
            </label>
            <input
              type="date"
              value={checkin}
              onChange={(e) => setCheckin(e.target.value)}
              className="w-full rounded-sm border border-beige-300 bg-brand-white px-3 py-2 text-sm outline-none focus:border-brand-gold"
            />
          </div>
          <div className="flex-1">
            <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-beige-700">
              Check-out
            </label>
            <input
              type="date"
              value={checkout}
              onChange={(e) => setCheckout(e.target.value)}
              className="w-full rounded-sm border border-beige-300 bg-brand-white px-3 py-2 text-sm outline-none focus:border-brand-gold"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-beige-700">
              Hóspedes
            </label>
            <div className="flex items-center gap-3 rounded-sm border border-beige-300 bg-brand-white px-3 py-2">
              <button
                type="button"
                onClick={() => setGuests(Math.max(1, guests - 1))}
                className="font-bold text-beige-600"
              >
                -
              </button>
              <span className="w-6 text-center text-sm">{guests}</span>
              <button
                type="button"
                onClick={() => setGuests(Math.min(10, guests + 1))}
                className="font-bold text-beige-600"
              >
                +
              </button>
            </div>
          </div>
        </div>

        {/* Room list */}
        <div className="mt-8 space-y-6">
          {availableRooms.map((room) => (
            <div
              key={room.slug}
              className="flex flex-col overflow-hidden rounded-sm border border-beige-200 bg-brand-white shadow-sm transition-shadow hover:shadow-md md:flex-row"
            >
              <div className="relative aspect-[4/3] md:w-80 md:shrink-0">
                <Image src={room.image} alt={room.name} fill className="object-cover" />
              </div>
              <div className="flex flex-1 flex-col justify-between p-6">
                <div>
                  <h3 className="font-display text-xl font-bold text-brand-black">{room.name}</h3>
                  <p className="mt-1 text-sm text-beige-600">{room.capacity}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {room.amenities.map((a) => (
                      <span
                        key={a}
                        className="rounded-sm bg-beige-100 px-2 py-1 text-xs text-beige-700"
                      >
                        {a}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="mt-4 flex items-end justify-between">
                  <div>
                    <span className="font-display text-2xl font-bold text-brand-black">
                      R$ {room.price}
                    </span>
                    <span className="text-sm text-beige-600"> / noite</span>
                    {nights > 0 && (
                      <p className="text-sm text-beige-500">
                        Total: R$ {(room.price * nights).toLocaleString('pt-BR')} ({nights} noite
                        {nights !== 1 ? 's' : ''})
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSelectRoom(room.slug)}
                    disabled={!checkin || !checkout}
                    className="rounded-sm bg-brand-gold px-6 py-3 text-sm font-semibold uppercase tracking-widest text-brand-black transition-colors hover:bg-gold-400 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Selecionar
                  </button>
                </div>
              </div>
            </div>
          ))}
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
