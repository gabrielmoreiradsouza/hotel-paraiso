'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Booking {
  booking_id: number;
  status: number;
  checkin: string;
  checkout: string;
  holder_guest?: { name: string; email?: string; phones?: string[] };
  provider?: string;
  units?: string;
  created?: string;
}

const STATUS_LABELS: Record<number, { label: string; color: string }> = {
  1: { label: 'Pré Reserva', color: 'bg-yellow-100 text-yellow-800' },
  2: { label: 'Confirmado', color: 'bg-green-100 text-green-800' },
  3: { label: 'Hospedado', color: 'bg-blue-100 text-blue-800' },
  4: { label: 'Check-out', color: 'bg-gray-100 text-gray-800' },
  5: { label: 'Cancelado', color: 'bg-red-100 text-red-800' },
  6: { label: 'No Show', color: 'bg-orange-100 text-orange-800' },
};

export default function AdminPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalBookings, setTotalBookings] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchBookings() {
      setLoading(true);
      try {
        const res = await fetch(`/api/bookings?page=${page}`);
        if (!res.ok) throw new Error('Falha ao carregar reservas');
        const data = await res.json();
        setBookings(data.bookings ?? []);
        setTotalPages(data.total_pages ?? 1);
        setTotalBookings(data.total_bookings ?? 0);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Erro desconhecido');
      }
      setLoading(false);
    }
    fetchBookings();
  }, [page]);

  // Stats
  const confirmed = bookings.filter((b) => b.status === 2).length;
  const checkedIn = bookings.filter((b) => b.status === 3).length;
  const cancelled = bookings.filter((b) => b.status === 5).length;

  return (
    <main className="min-h-screen bg-beige-50 pt-20 pb-16">
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold text-brand-black">Painel de Reservas</h1>
            <p className="mt-1 text-sm text-beige-600">
              {totalBookings.toLocaleString('pt-BR')} reservas no total — Artax PMS
            </p>
          </div>
          <Link href="/" className="text-sm text-brand-gold transition-colors hover:text-gold-700">
            ← Voltar ao site
          </Link>
        </div>

        {/* Stats cards */}
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-sm border border-beige-200 bg-brand-white p-4">
            <div className="text-2xl font-bold text-brand-black">{bookings.length}</div>
            <div className="text-xs text-beige-600">Nesta página</div>
          </div>
          <div className="rounded-sm border border-beige-200 bg-brand-white p-4">
            <div className="text-2xl font-bold text-green-600">{confirmed}</div>
            <div className="text-xs text-beige-600">Confirmadas</div>
          </div>
          <div className="rounded-sm border border-beige-200 bg-brand-white p-4">
            <div className="text-2xl font-bold text-blue-600">{checkedIn}</div>
            <div className="text-xs text-beige-600">Hospedados</div>
          </div>
          <div className="rounded-sm border border-beige-200 bg-brand-white p-4">
            <div className="text-2xl font-bold text-red-600">{cancelled}</div>
            <div className="text-xs text-beige-600">Canceladas</div>
          </div>
        </div>

        {/* Error */}
        {error && <div className="mt-4 rounded-sm bg-red-50 p-4 text-sm text-red-700">{error}</div>}

        {/* Bookings table */}
        <div className="mt-8 overflow-x-auto rounded-sm border border-beige-200 bg-brand-white">
          {loading ? (
            <div className="p-8 text-center text-beige-500">Carregando reservas...</div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="border-b border-beige-200 bg-beige-50">
                <tr>
                  <th className="px-4 py-3 font-medium text-beige-700">ID</th>
                  <th className="px-4 py-3 font-medium text-beige-700">Hóspede</th>
                  <th className="px-4 py-3 font-medium text-beige-700">Check-in</th>
                  <th className="px-4 py-3 font-medium text-beige-700">Check-out</th>
                  <th className="px-4 py-3 font-medium text-beige-700">Quarto</th>
                  <th className="px-4 py-3 font-medium text-beige-700">Status</th>
                  <th className="px-4 py-3 font-medium text-beige-700">Origem</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b) => {
                  const st = STATUS_LABELS[b.status] ?? {
                    label: `Status ${b.status}`,
                    color: 'bg-gray-100 text-gray-800',
                  };
                  return (
                    <tr key={b.booking_id} className="border-b border-beige-100 hover:bg-beige-50">
                      <td className="px-4 py-3 font-mono text-xs">{b.booking_id}</td>
                      <td className="px-4 py-3">
                        <div className="font-medium">{b.holder_guest?.name ?? '—'}</div>
                        {b.holder_guest?.phones?.[0] && (
                          <div className="text-xs text-beige-500">{b.holder_guest.phones[0]}</div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {new Date(b.checkin + 'T12:00:00').toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-4 py-3">
                        {new Date(b.checkout + 'T12:00:00').toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-4 py-3 text-xs">{b.units ?? '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2 py-1 text-xs font-medium ${st.color}`}>
                          {st.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-beige-500">{b.provider ?? '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        <div className="mt-4 flex items-center justify-between">
          <span className="text-sm text-beige-600">
            Página {page} de {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="rounded-sm border border-beige-300 px-4 py-2 text-sm disabled:opacity-50"
            >
              Anterior
            </button>
            <button
              type="button"
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="rounded-sm border border-beige-300 px-4 py-2 text-sm disabled:opacity-50"
            >
              Próxima
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
