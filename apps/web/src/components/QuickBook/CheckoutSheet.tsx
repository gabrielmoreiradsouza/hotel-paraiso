'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  getAbVariant,
  getAttribution,
  getGA4Ids,
  trackCheckoutStarted,
  trackReservationCreated,
  trackRoomSelected,
} from '@hotel-paraiso/tracking';
import {
  EMAIL_RE,
  addDays,
  formatBR,
  nightsBetween,
  todayBR,
  type QuickRoom,
} from './quickbook-utils';

/**
 * Checkout por cima da página (variante B, ADR-0013).
 *
 * Mesmo contrato do /reservar com `/api/bookings` (Idempotency-Key, origem, ids do GA4) —
 * o servidor reconfere preço e disponibilidade na Artax, então nada do que está aqui é
 * confiado. O botão voltar do celular fecha o painel: ao abrir empurramos `#reservar`
 * no histórico e o `popstate` fecha.
 */

const BOOKING_STATE_KEY = 'hp_booking_state';
const HASH = '#reservar';

interface Props {
  room: QuickRoom | null;
  loading: boolean;
  checkin: string;
  checkout: string;
  guests: number;
  onCheckinChange: (value: string) => void;
  onCheckoutChange: (value: string) => void;
  onClosed: () => void;
}

const brl = (value: number) => value.toLocaleString('pt-BR', { maximumFractionDigits: 0 });

const inputClass =
  'w-full rounded-sm border bg-white/[0.06] px-4 py-3 text-sm text-white outline-none placeholder:text-white/40 focus:border-brand-gold focus:ring-1 focus:ring-brand-gold/30';

export function CheckoutSheet({
  room,
  loading,
  checkin,
  checkout,
  guests,
  onCheckinChange,
  onCheckoutChange,
  onClosed,
}: Props) {
  const [visible, setVisible] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [touched, setTouched] = useState({ name: false, email: false, phone: false });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState<{ id: string; room: QuickRoom; total: number } | null>(
    null
  );
  const idempotencyKey = useRef<string | null>(null);
  const submittingRef = useRef(false);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const tracked = useRef(false);
  const onClosedRef = useRef(onClosed);
  const nights = nightsBetween(checkin, checkout);

  useEffect(() => {
    onClosedRef.current = onClosed;
  }, [onClosed]);

  // Abrir (uma vez só): entra no histórico, deixa o fundo inerte (foco não escapa do
  // painel), trava o scroll, anima e foca o título. Fechar devolve o foco a quem abriu.
  useEffect(() => {
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    // Guarda contra StrictMode/remontagem: um único `#reservar` no histórico.
    if (window.location.hash !== HASH) window.history.pushState({ hpSheet: true }, '', HASH);
    const onPop = () => {
      if (window.location.hash !== HASH) onClosedRef.current();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') window.history.back();
    };
    window.addEventListener('popstate', onPop);
    window.addEventListener('keydown', onKey);

    const madeInert = Array.from(document.body.children).filter(
      (el) => el !== rootRef.current && !el.hasAttribute('inert')
    );
    madeInert.forEach((el) => el.setAttribute('inert', ''));
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const frame = requestAnimationFrame(() => setVisible(true));
    titleRef.current?.focus();

    return () => {
      window.removeEventListener('popstate', onPop);
      window.removeEventListener('keydown', onKey);
      madeInert.forEach((el) => el.removeAttribute('inert'));
      document.body.style.overflow = overflow;
      cancelAnimationFrame(frame);
      opener?.focus();
    };
  }, []);

  // Abrir o painel conta como início de reserva (mesmos eventos do /reservar).
  useEffect(() => {
    if (!room || tracked.current) return;
    tracked.current = true;
    trackRoomSelected({ room_slug: room.cmsSlug, room_name: room.cmsName, price: room.price });
    trackCheckoutStarted({
      room_slug: room.cmsSlug,
      room_name: room.cmsName,
      value: room.price,
      nights,
    });
  }, [room, nights]);

  // Mesmo estado do /reservar: o botão do WhatsApp monta a mensagem com quarto e datas.
  useEffect(() => {
    if (!room || confirmed) return;
    try {
      sessionStorage.setItem(
        BOOKING_STATE_KEY,
        JSON.stringify({ step: 'details', selectedRoom: room, checkin, checkout, guests })
      );
    } catch (err) {
      console.debug('[quickbook] sessionStorage indisponível:', err);
    }
  }, [room, checkin, checkout, guests, confirmed]);

  function close() {
    window.history.back();
  }

  const emailOk = EMAIL_RE.test(email.trim());
  const formOk = name.trim() && emailOk && phone.trim();
  const canBook = Boolean(room?.available) && nights > 0 && !loading;

  async function confirm() {
    setTouched({ name: true, email: true, phone: true });
    // Trava síncrona: o estado `submitting` só vale no próximo render, e dois toques
    // rápidos contariam a conversão duas vezes.
    if (submittingRef.current || !formOk || !room || !canBook) return;
    submittingRef.current = true;
    setSubmitting(true);
    setError(null);
    // Idempotência: a chave sobrevive a novas tentativas e só morre com a reserva feita.
    idempotencyKey.current ??= crypto.randomUUID();

    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Idempotency-Key': idempotencyKey.current },
        body: JSON.stringify({
          guestName: name.trim(),
          guestEmail: email.trim(),
          guestPhone: phone.trim(),
          checkin,
          checkout,
          categoryId: room.category_id,
          rateplanId: room.rateplan_id,
          adults: guests,
          kids: 0,
          totalPrice: room.price,
          attribution: getAttribution(),
          ...getGA4Ids(),
        }),
      });
      const data = (await response.json()) as { booking_id?: string | number; error?: string };
      if (!response.ok || !data.booking_id) {
        setError(data.error ?? 'Erro ao criar reserva. Tente novamente ou ligue (31) 3881-8049.');
        submittingRef.current = false;
        setSubmitting(false);
        return;
      }

      idempotencyKey.current = null;
      const id = String(data.booking_id);
      trackReservationCreated({
        booking_id: id,
        room_name: room.cmsName,
        value: room.price,
        nights,
        adults: guests,
        room_slug: room.cmsSlug,
        checkin,
        checkout,
      });
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
        event: 'purchase',
        booking_id: id,
        room_name: room.cmsName,
        room_slug: room.cmsSlug,
        checkin,
        checkout,
        nights,
        adults: guests,
        total_price: room.price,
        currency: 'BRL',
        ab_variant: getAbVariant(),
      });
      try {
        sessionStorage.removeItem(BOOKING_STATE_KEY);
      } catch (err) {
        console.debug('[quickbook] sessionStorage indisponível:', err);
      }
      setConfirmed({ id, room, total: room.price });
    } catch (err) {
      console.error('[quickbook] reserva falhou:', err);
      setError('Falha na comunicação com o servidor. Tente novamente ou ligue (31) 3881-8049.');
    }
    submittingRef.current = false;
    setSubmitting(false);
  }

  // Portal no body: o fundo inteiro pode ficar inerte sem levar o painel junto.
  return createPortal(
    <div ref={rootRef} className="fixed inset-0 z-[60]" role="presentation">
      <div
        aria-hidden="true"
        onClick={close}
        className={`absolute inset-0 bg-black/70 transition-opacity duration-300 motion-reduce:transition-none ${visible ? 'opacity-100' : 'opacity-0'}`}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="checkout-sheet-title"
        className={`absolute inset-0 flex flex-col bg-brand-black transition-transform duration-300 ease-out motion-reduce:transition-none sm:inset-y-0 sm:left-auto sm:right-0 sm:w-full sm:max-w-md sm:border-l sm:border-white/[0.08] ${visible ? 'translate-y-0 sm:translate-x-0' : 'translate-y-full sm:translate-y-0 sm:translate-x-full'}`}
      >
        <header className="flex items-center justify-between border-b border-white/[0.08] px-4 py-3">
          <h2
            id="checkout-sheet-title"
            ref={titleRef}
            tabIndex={-1}
            className="font-display text-lg font-bold text-white outline-none"
          >
            {confirmed ? 'Reserva confirmada' : 'Sua reserva'}
          </h2>
          <button
            type="button"
            onClick={close}
            aria-label="Fechar"
            className="rounded-sm p-2 text-white/70 hover:bg-white/[0.08]"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-4 py-5 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))]">
          {confirmed ? (
            <div>
              <p className="text-sm text-white/70">
                Protocolo <span className="font-semibold text-white">{confirmed.id}</span>
              </p>
              <div className="mt-4 rounded-lg border border-white/[0.08] bg-white/[0.04] p-4 text-sm text-white/80">
                <p className="font-display text-base font-bold text-white">
                  {confirmed.room.cmsName}
                </p>
                <p className="mt-1">
                  {formatBR(checkin)} → {formatBR(checkout)} · {guests}{' '}
                  {guests === 1 ? 'hóspede' : 'hóspedes'}
                </p>
                <p className="mt-2 font-display text-lg font-bold text-brand-gold">
                  R$ {brl(confirmed.total)}
                </p>
              </div>
              <ul className="mt-4 space-y-2 text-sm text-white/70">
                <li>Email de confirmação enviado para {email.trim()}</li>
                <li>O hotel confirmará pelo WhatsApp para {phone.trim()}</li>
                <li>Nenhum pagamento agora — você paga no hotel, no check-in</li>
                <li>Check-in a partir das 14h, com documento</li>
              </ul>
              <button
                type="button"
                onClick={close}
                className="mt-6 w-full rounded-sm border border-white/[0.12] px-6 py-3 text-sm text-white/80 hover:bg-white/[0.08]"
              >
                Fechar
              </button>
            </div>
          ) : (
            <>
              <div className="rounded-lg border border-white/[0.08] bg-white/[0.04] p-4">
                <p className="font-display text-base font-bold text-white">
                  {room?.cmsName ?? 'Quarto'}
                </p>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <label className="text-xs text-white/60">
                    Check-in
                    <input
                      type="date"
                      value={checkin}
                      min={todayBR()}
                      onChange={(e) => e.target.value && onCheckinChange(e.target.value)}
                      className="mt-1 block w-full rounded-sm border border-white/[0.12] bg-white/[0.06] px-2 py-2 text-sm text-white [color-scheme:dark]"
                    />
                  </label>
                  <label className="text-xs text-white/60">
                    Check-out
                    <input
                      type="date"
                      value={checkout}
                      min={checkin ? addDays(checkin, 1) : todayBR()}
                      onChange={(e) => e.target.value && onCheckoutChange(e.target.value)}
                      className="mt-1 block w-full rounded-sm border border-white/[0.12] bg-white/[0.06] px-2 py-2 text-sm text-white [color-scheme:dark]"
                    />
                  </label>
                </div>
                <div className="mt-3 flex items-end justify-between">
                  <p className="text-xs text-white/60">
                    {guests} {guests === 1 ? 'hóspede' : 'hóspedes'} ·{' '}
                    {nights === 1 ? '1 noite' : `${nights} noites`}
                  </p>
                  {loading ? (
                    <p className="text-sm text-white/50">Atualizando…</p>
                  ) : room?.available ? (
                    <p className="font-display text-xl font-bold text-brand-gold">
                      R$ {brl(room.price)}
                    </p>
                  ) : (
                    <p className="text-sm text-red-400">Esgotado nessas datas</p>
                  )}
                </div>
              </div>

              <div className="mt-5 space-y-4">
                <div>
                  <label htmlFor="qb-name" className="mb-1 block text-sm font-medium text-white/70">
                    Nome completo *
                  </label>
                  <input
                    id="qb-name"
                    type="text"
                    name="name"
                    autoComplete="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onBlur={() => setTouched((t) => ({ ...t, name: true }))}
                    className={`${inputClass} ${touched.name && !name.trim() ? 'border-red-500/60' : 'border-white/[0.12]'}`}
                    placeholder="João Silva"
                  />
                  {touched.name && !name.trim() && (
                    <p className="mt-1 text-xs text-red-400">Informe seu nome completo</p>
                  )}
                </div>
                <div>
                  <label
                    htmlFor="qb-email"
                    className="mb-1 block text-sm font-medium text-white/70"
                  >
                    Email *
                  </label>
                  <input
                    id="qb-email"
                    type="email"
                    name="email"
                    autoComplete="email"
                    inputMode="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                    className={`${inputClass} ${touched.email && !emailOk ? 'border-red-500/60' : 'border-white/[0.12]'}`}
                    placeholder="joao@email.com"
                  />
                  {touched.email && !emailOk && (
                    <p className="mt-1 text-xs text-red-400">Informe um email válido</p>
                  )}
                </div>
                <div>
                  <label
                    htmlFor="qb-phone"
                    className="mb-1 block text-sm font-medium text-white/70"
                  >
                    Telefone *
                  </label>
                  <input
                    id="qb-phone"
                    type="tel"
                    name="tel"
                    autoComplete="tel"
                    inputMode="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    onBlur={() => setTouched((t) => ({ ...t, phone: true }))}
                    className={`${inputClass} ${touched.phone && !phone.trim() ? 'border-red-500/60' : 'border-white/[0.12]'}`}
                    placeholder="(31) 99999-9999"
                  />
                  {touched.phone && !phone.trim() && (
                    <p className="mt-1 text-xs text-red-400">Informe seu telefone</p>
                  )}
                </div>
              </div>

              {error && (
                <div
                  role="alert"
                  className="mt-5 rounded-sm border border-red-500/30 bg-red-900/20 px-4 py-3 text-sm text-red-400"
                >
                  {error}
                </div>
              )}

              <p className="mt-5 text-center text-sm text-white/60">
                Nenhum pagamento agora. Você paga no hotel, no check-in.
                <br />
                Cancelamento grátis até 48h antes.
              </p>

              <button
                type="button"
                onClick={confirm}
                disabled={submitting || !canBook}
                className="mt-4 w-full rounded-sm bg-brand-gold px-6 py-3.5 text-sm font-semibold uppercase tracking-widest text-brand-black transition-colors hover:bg-gold-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting ? 'Enviando…' : 'Confirmar reserva'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
