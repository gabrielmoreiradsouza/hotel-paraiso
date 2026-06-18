export type TrackingEvent = {
  name: string;
  params: Record<string, unknown>;
};

type DataLayerEvent = {
  event: string;
  [key: string]: unknown;
};

declare global {
  interface Window {
    dataLayer?: DataLayerEvent[];
  }
}

function getDevice(): 'mobile' | 'tablet' | 'desktop' {
  if (typeof window === 'undefined') return 'desktop';
  const w = window.innerWidth;
  if (w < 768) return 'mobile';
  if (w < 1024) return 'tablet';
  return 'desktop';
}

function getSessionId(): string {
  if (typeof window === 'undefined') return '';
  let sid = sessionStorage.getItem('hp_session_id');
  if (!sid) {
    sid = `s_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    sessionStorage.setItem('hp_session_id', sid);
  }
  return sid;
}

function getUtmParams(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const params = new URLSearchParams(window.location.search);
  const utm: Record<string, string> = {};
  for (const key of [
    'utm_source',
    'utm_medium',
    'utm_campaign',
    'utm_term',
    'utm_content',
    'gclid',
    'fbclid',
  ]) {
    const val = params.get(key);
    if (val) utm[key] = val;
  }
  return utm;
}

export function track(eventName: string, payload: Record<string, unknown> = {}) {
  if (typeof window === 'undefined') return;

  const event: DataLayerEvent = {
    event: eventName,
    session_id: getSessionId(),
    device: getDevice(),
    page_url: window.location.href,
    timestamp_ms: Date.now(),
    ...getUtmParams(),
    ...payload,
  };

  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(event);
}

// === Canonical events ===

export function trackPageView(pageTitle?: string) {
  track('page_view', {
    page_title: pageTitle ?? (typeof document !== 'undefined' ? document.title : ''),
  });
}

export function trackSearchPerformed(params: {
  checkin: string;
  checkout: string;
  guests: number;
}) {
  track('search_performed', { ...params, category: 'macro' });
}

export function trackAvailabilityViewed(roomCount: number) {
  track('availability_viewed', { room_count: roomCount, category: 'macro' });
}

export function trackRoomSelected(params: { room_slug: string; room_name: string; price: number }) {
  track('room_selected', { ...params, category: 'macro', currency: 'BRL' });
}

export function trackCheckoutStarted(params: {
  room_slug: string;
  room_name: string;
  value: number;
  nights: number;
}) {
  track('checkout_started', { ...params, category: 'macro', currency: 'BRL' });
}

export function trackReservationCreated(params: {
  booking_id: string;
  room_name: string;
  value: number;
  nights: number;
}) {
  track('reservation_created', { ...params, category: 'macro', currency: 'BRL' });
}

export function trackGalleryOpened() {
  track('gallery_opened', { category: 'micro' });
}

export function trackDatesChanged(checkin: string, checkout: string) {
  track('dates_changed', { checkin, checkout, category: 'micro' });
}

export function trackGuestsChanged(guests: number) {
  track('guests_changed', { guests, category: 'micro' });
}
