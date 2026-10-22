/** Quarto como devolvido por `/api/availability` (mesmo formato que o /reservar usa). */
export interface QuickRoom {
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
  /** Total da estadia (não a diária). */
  price: number;
  capacity: { adults: number; kids: number };
}

export function todayBR(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

/** Soma dias a uma data YYYY-MM-DD sem passar por fuso (meio-dia UTC). */
export function addDays(isoDate: string, days: number): string {
  const d = new Date(`${isoDate}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function nightsBetween(checkin: string, checkout: string): number {
  if (!checkin || !checkout) return 0;
  const diff = Date.parse(`${checkout}T12:00:00Z`) - Date.parse(`${checkin}T12:00:00Z`);
  return Number.isFinite(diff) ? Math.max(0, Math.round(diff / 86_400_000)) : 0;
}

export function formatBR(isoDate: string): string {
  const [y, m, d] = isoDate.split('-');
  return `${d}/${m}/${y}`;
}

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
