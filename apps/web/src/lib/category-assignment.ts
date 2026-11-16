import { BOOKED_CATEGORY_MARKER } from './booking-policy';

/**
 * Confere se a UH alocada pela recepção é da categoria que o hóspede reservou no site
 * (ADR-0014). A reserva leva no comentário "Categoria reservada: <nome>"; a Artax devolve
 * as UHs alocadas como "(21) Casal Confort, (112) Individual Confort".
 */

export interface BookingForCheck {
  booking_id: number | string;
  status?: number | string;
  checkin?: string;
  units?: string | null;
  comment?: string | null;
}

export interface CategoryMismatch {
  bookingId: string;
  checkin: string;
  booked: string;
  assigned: string;
}

/** "Triplo Família", "Triplo Familia", "Casal Standart", "(16) Casal Master (Sem Frigobar)" → mesma chave. */
function normalizeCategory(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\(\d+\)/g, '')
    .replace(/\([^)]*\)/g, '')
    .replace(/standart/gi, 'standard')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

export function readBookedCategory(comment: string | null | undefined): string | null {
  if (!comment) return null;
  const start = comment.indexOf(BOOKED_CATEGORY_MARKER);
  if (start < 0) return null;
  const rest = comment.slice(start + BOOKED_CATEGORY_MARKER.length);
  const name = rest.split(/[(|]/)[0]?.trim();
  return name ? name : null;
}

export function findCategoryMismatches(bookings: readonly BookingForCheck[]): CategoryMismatch[] {
  const mismatches: CategoryMismatch[] = [];
  for (const booking of bookings) {
    const booked = readBookedCategory(booking.comment);
    const units = booking.units?.trim();
    // Sem marcador (reserva de outro canal) ou ainda sem UH alocada: nada a conferir.
    if (!booked || !units) continue;
    const assignedCategories = units.split(/,\s*(?=\()/).map(normalizeCategory);
    if (!assignedCategories.includes(normalizeCategory(booked))) {
      mismatches.push({
        bookingId: String(booking.booking_id),
        checkin: booking.checkin ?? '',
        booked,
        assigned: units,
      });
    }
  }
  return mismatches;
}
