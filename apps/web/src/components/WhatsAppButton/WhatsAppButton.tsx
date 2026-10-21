'use client';

import type { MouseEvent } from 'react';
import {
  buildWhatsAppMessage,
  generateWhatsAppCode,
  getAttribution,
  track,
  type WhatsAppBookingContext,
} from '@hotel-paraiso/tracking';

const PHONE = '553138818049';
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function whatsAppUrl(code?: string, booking?: WhatsAppBookingContext): string {
  const text = buildWhatsAppMessage(code, booking);
  return `https://wa.me/${PHONE}?text=${encodeURIComponent(text)}`;
}

interface BookingSelection {
  slug?: string;
  context?: WhatsAppBookingContext;
}

/** Quarto e datas escolhidos no /reservar, se houver. Lê só a escolha — nada do hóspede. */
function readBookingSelection(): BookingSelection {
  try {
    const raw = sessionStorage.getItem('hp_booking_state');
    if (!raw) return {};
    const state = JSON.parse(raw) as {
      selectedRoom?: { cmsSlug?: string; cmsName?: string; name?: string } | null;
      checkin?: string;
      checkout?: string;
      guests?: number;
    };
    const room = state.selectedRoom;
    // sessionStorage é editável pelo visitante: nome curto, datas em ordem, hóspedes plausíveis.
    const rawName = room?.cmsName || room?.name;
    const roomName = typeof rawName === 'string' ? rawName.trim().slice(0, 40) : '';
    const complete =
      roomName &&
      typeof state.checkin === 'string' &&
      ISO_DATE.test(state.checkin) &&
      typeof state.checkout === 'string' &&
      ISO_DATE.test(state.checkout) &&
      state.checkout > state.checkin &&
      Number.isInteger(state.guests) &&
      (state.guests ?? 0) > 0 &&
      (state.guests ?? 0) <= 20;
    return {
      ...(typeof room?.cmsSlug === 'string' && { slug: room.cmsSlug.slice(0, 40) }),
      ...(complete && {
        context: {
          roomName,
          checkin: state.checkin as string,
          checkout: state.checkout as string,
          guests: state.guests as number,
        },
      }),
    };
  } catch (err) {
    console.debug('[whatsapp] estado da reserva ilegível:', err);
    return {};
  }
}

export function WhatsAppButton() {
  // Código gerado no clique, não no render: no SSR ele divergiria da hidratação, e cada
  // clique precisa de código próprio para ser rastreado até a reserva (ADR-0012).
  function handleClick(e: MouseEvent<HTMLAnchorElement>) {
    const code = generateWhatsAppCode();
    const selection = readBookingSelection();
    e.currentTarget.href = whatsAppUrl(code, selection.context);
    const origem = getAttribution();
    track('whatsapp_clicked', {
      category: 'micro',
      wa_code: code,
      room_slug: selection.slug,
      checkin: selection.context?.checkin,
      checkout: selection.context?.checkout,
      guests: selection.context?.guests,
      origem: origem
        ? {
            source: origem.source,
            medium: origem.medium,
            campaign: origem.campaign,
            term: origem.term,
            content: origem.content,
            gclid: origem.gclid,
          }
        : null,
    });
  }

  return (
    <a
      href={whatsAppUrl()}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
      className="fixed bottom-[calc(68px+env(safe-area-inset-bottom,0px))] right-4 sm:bottom-[calc(16px+env(safe-area-inset-bottom,0px))] sm:right-6 z-50 flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full bg-[#25D366] shadow-lg transition-all hover:scale-110"
      aria-label="Falar no WhatsApp"
    >
      <svg viewBox="0 0 24 24" className="h-6 w-6 sm:h-7 sm:w-7" fill="white">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
      </svg>
    </a>
  );
}
