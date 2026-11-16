/**
 * Confere se a recepção alocou as reservas do site na categoria que o hóspede escolheu
 * (ADR-0014). Só leitura. Uso: scripts/with-env.sh pnpm exec tsx scripts/check-category-assignment.ts [páginas]
 *
 * DR-001: passa pelo ArtaxClient e espera entre páginas — cada página é 1 chamada à Artax.
 */
import { ArtaxClient } from '../packages/artax-client/src/index';
import {
  findCategoryMismatches,
  type BookingForCheck,
} from '../apps/web/src/lib/category-assignment';

const PAGES = Math.min(Number(process.argv[2] ?? '10') || 10, 25);
const PAUSE_MS = 1500;
const CANCELLED = 5;

async function main() {
  const clientId = process.env['ARTAX_CLIENT_ID'];
  const clientSecret = process.env['ARTAX_CLIENT_SECRET'];
  if (!clientId || !clientSecret) {
    console.error('ARTAX_CLIENT_ID/ARTAX_CLIENT_SECRET ausentes — rode via scripts/with-env.sh');
    process.exit(1);
  }
  const client = new ArtaxClient({ clientId, clientSecret, timeoutMs: 15_000 });

  const bookings: BookingForCheck[] = [];
  for (let page = 1; page <= PAGES; page++) {
    const res = (await client.listBookingsRaw({ page })) as unknown as {
      bookings?: BookingForCheck[];
      total_pages?: number;
    };
    bookings.push(...(res.bookings ?? []).filter((b) => Number(b.status) !== CANCELLED));
    if (!res.total_pages || page >= res.total_pages) break;
    await new Promise((resolve) => setTimeout(resolve, PAUSE_MS));
  }

  const fromSite = bookings.filter((b) => b.comment?.includes('Categoria reservada:'));
  const mismatches = findCategoryMismatches(bookings);

  console.log(`Reservas lidas: ${bookings.length} (do site com categoria: ${fromSite.length})`);
  if (mismatches.length === 0) {
    console.log('Nenhuma reserva do site alocada em categoria diferente da reservada.');
    return;
  }
  console.log(`\n${mismatches.length} reserva(s) em categoria diferente da escolhida:`);
  for (const m of mismatches) {
    console.log(
      `  #${m.bookingId}  check-in ${m.checkin}  reservou "${m.booked}"  →  alocada em ${m.assigned}`
    );
  }
  process.exitCode = 2;
}

main().catch((error) => {
  console.error('Falha na conferência:', error instanceof Error ? error.message : error);
  process.exit(1);
});
