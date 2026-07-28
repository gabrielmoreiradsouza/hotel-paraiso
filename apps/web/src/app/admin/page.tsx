'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

// ─── Types ───────────────────────────────────────────────────────────────────

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

interface FunnelStats {
  page_views: number;
  searches: number;
  availability_views: number;
  room_selections: number;
  checkout_starts: number;
  reservations: number;
  whatsapp_clicks: number;
}

interface AnalyticsData {
  total_events: number;
  last_24h: FunnelStats;
  last_7d: FunnelStats;
  unique_sessions_24h: number;
  unique_sessions_7d: number;
  devices: { mobile: number; desktop: number; tablet: number };
}

const STATUS_LABELS: Record<number, { label: string; color: string }> = {
  1: { label: 'Pre Reserva', color: 'bg-yellow-100 text-yellow-800' },
  2: { label: 'Confirmado', color: 'bg-green-100 text-green-800' },
  3: { label: 'Hospedado', color: 'bg-blue-100 text-blue-800' },
  4: { label: 'Check-out', color: 'bg-gray-100 text-gray-800' },
  5: { label: 'Cancelado', color: 'bg-red-100 text-red-800' },
  6: { label: 'No Show', color: 'bg-orange-100 text-orange-800' },
};

// ─── Reservas Tab ────────────────────────────────────────────────────────────

function ReservasTab() {
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

  const confirmed = bookings.filter((b) => b.status === 2).length;
  const checkedIn = bookings.filter((b) => b.status === 3).length;
  const cancelled = bookings.filter((b) => b.status === 5).length;

  return (
    <>
      <p className="mt-1 text-sm text-beige-600">
        {totalBookings.toLocaleString('pt-BR')} reservas no total — Artax PMS
      </p>

      {/* Stats cards */}
      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-sm border border-beige-200 bg-brand-white p-4">
          <div className="text-2xl font-bold text-brand-black">{bookings.length}</div>
          <div className="text-xs text-beige-600">Nesta pagina</div>
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
                <th className="px-4 py-3 font-medium text-beige-700">Hospede</th>
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
          Pagina {page} de {totalPages}
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
            Proxima
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Analytics Tab ───────────────────────────────────────────────────────────

function FunnelBar({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <div className="w-36 text-right text-xs text-beige-600 sm:w-44">{label}</div>
      <div className="flex-1">
        <div className="h-7 w-full overflow-hidden rounded-sm bg-beige-100">
          <div
            className="flex h-full items-center bg-brand-gold/80 px-2 text-xs font-medium text-brand-black transition-all duration-500"
            style={{ width: `${Math.max(pct, 2)}%` }}
          >
            {value > 0 ? value.toLocaleString('pt-BR') : ''}
          </div>
        </div>
      </div>
      <div className="w-12 text-right text-xs font-medium text-beige-500">{pct}%</div>
    </div>
  );
}

function AnalyticsTab() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [period, setPeriod] = useState<'24h' | '7d'>('24h');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchAnalytics() {
      setLoading(true);
      try {
        const res = await fetch('/api/events');
        if (!res.ok) throw new Error('Falha ao carregar analytics');
        const json = await res.json();
        setData(json);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Erro desconhecido');
      }
      setLoading(false);
    }
    fetchAnalytics();
  }, []);

  if (loading) {
    return <div className="mt-8 p-8 text-center text-beige-500">Carregando analytics...</div>;
  }

  if (error) {
    return <div className="mt-4 rounded-sm bg-red-50 p-4 text-sm text-red-700">{error}</div>;
  }

  if (!data) return null;

  const stats = period === '24h' ? data.last_24h : data.last_7d;
  const sessions = period === '24h' ? data.unique_sessions_24h : data.unique_sessions_7d;

  const funnelSteps = [
    { label: 'Visualizacoes de pagina', value: stats.page_views },
    { label: 'Buscas realizadas', value: stats.searches },
    { label: 'Disponibilidade vista', value: stats.availability_views },
    { label: 'Quarto selecionado', value: stats.room_selections },
    { label: 'Checkout iniciado', value: stats.checkout_starts },
    { label: 'Reserva criada', value: stats.reservations },
  ];

  const maxFunnel = Math.max(...funnelSteps.map((s) => s.value), 1);
  const totalDevices = data.devices.mobile + data.devices.desktop + data.devices.tablet;

  return (
    <>
      {/* Period selector */}
      <div className="mt-6 flex gap-2">
        <button
          type="button"
          onClick={() => setPeriod('24h')}
          className={`rounded-sm px-4 py-2 text-sm font-medium transition-colors ${
            period === '24h'
              ? 'bg-brand-gold text-brand-black'
              : 'border border-beige-300 text-beige-600 hover:bg-beige-100'
          }`}
        >
          Ultimas 24h
        </button>
        <button
          type="button"
          onClick={() => setPeriod('7d')}
          className={`rounded-sm px-4 py-2 text-sm font-medium transition-colors ${
            period === '7d'
              ? 'bg-brand-gold text-brand-black'
              : 'border border-beige-300 text-beige-600 hover:bg-beige-100'
          }`}
        >
          Ultimos 7 dias
        </button>
      </div>

      {/* Stats cards */}
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-sm border border-beige-200 bg-brand-white p-4">
          <div className="text-2xl font-bold text-brand-black">
            {sessions.toLocaleString('pt-BR')}
          </div>
          <div className="text-xs text-beige-600">Sessoes unicas</div>
        </div>
        <div className="rounded-sm border border-beige-200 bg-brand-white p-4">
          <div className="text-2xl font-bold text-brand-black">
            {stats.page_views.toLocaleString('pt-BR')}
          </div>
          <div className="text-xs text-beige-600">Page views</div>
        </div>
        <div className="rounded-sm border border-beige-200 bg-brand-white p-4">
          <div className="text-2xl font-bold text-green-600">
            {stats.reservations.toLocaleString('pt-BR')}
          </div>
          <div className="text-xs text-beige-600">Reservas</div>
        </div>
        <div className="rounded-sm border border-beige-200 bg-brand-white p-4">
          <div className="text-2xl font-bold text-blue-600">
            {stats.whatsapp_clicks.toLocaleString('pt-BR')}
          </div>
          <div className="text-xs text-beige-600">Cliques WhatsApp</div>
        </div>
      </div>

      {/* Funnel */}
      <div className="mt-8 rounded-sm border border-beige-200 bg-brand-white p-6">
        <h3 className="mb-4 text-sm font-semibold text-brand-black">
          Funil de conversao ({period === '24h' ? 'Ultimas 24h' : 'Ultimos 7 dias'})
        </h3>
        <div className="space-y-3">
          {funnelSteps.map((step) => (
            <FunnelBar key={step.label} label={step.label} value={step.value} max={maxFunnel} />
          ))}
        </div>
        {stats.page_views > 0 && stats.reservations > 0 && (
          <div className="mt-4 border-t border-beige-100 pt-3 text-xs text-beige-600">
            Taxa de conversao geral:{' '}
            <span className="font-semibold text-green-600">
              {((stats.reservations / stats.page_views) * 100).toFixed(2)}%
            </span>
          </div>
        )}
      </div>

      {/* Device split */}
      <div className="mt-6 rounded-sm border border-beige-200 bg-brand-white p-6">
        <h3 className="mb-4 text-sm font-semibold text-brand-black">
          Dispositivos (ultimos 7 dias)
        </h3>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-brand-black">
              {data.devices.mobile.toLocaleString('pt-BR')}
            </div>
            <div className="text-xs text-beige-600">
              Mobile{' '}
              {totalDevices > 0
                ? `(${Math.round((data.devices.mobile / totalDevices) * 100)}%)`
                : ''}
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-brand-black">
              {data.devices.desktop.toLocaleString('pt-BR')}
            </div>
            <div className="text-xs text-beige-600">
              Desktop{' '}
              {totalDevices > 0
                ? `(${Math.round((data.devices.desktop / totalDevices) * 100)}%)`
                : ''}
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-brand-black">
              {data.devices.tablet.toLocaleString('pt-BR')}
            </div>
            <div className="text-xs text-beige-600">
              Tablet{' '}
              {totalDevices > 0
                ? `(${Math.round((data.devices.tablet / totalDevices) * 100)}%)`
                : ''}
            </div>
          </div>
        </div>
      </div>

      {/* Total events info */}
      <div className="mt-4 text-right text-xs text-beige-400">
        {data.total_events.toLocaleString('pt-BR')} eventos armazenados (in-memory)
      </div>
    </>
  );
}

// ─── Main Admin Page ─────────────────────────────────────────────────────────

type Tab = 'reservas' | 'analytics';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<Tab>('reservas');

  return (
    <main className="min-h-screen bg-beige-50 pt-20 pb-16">
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold text-brand-black">Painel Admin</h1>
          </div>
          <Link href="/" className="text-sm text-brand-gold transition-colors hover:text-gold-700">
            ← Voltar ao site
          </Link>
        </div>

        {/* Tabs */}
        <div className="mt-6 flex border-b border-beige-200">
          <button
            type="button"
            onClick={() => setActiveTab('reservas')}
            className={`px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'reservas'
                ? 'border-b-2 border-brand-gold text-brand-black'
                : 'text-beige-500 hover:text-beige-700'
            }`}
          >
            Reservas
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('analytics')}
            className={`px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'analytics'
                ? 'border-b-2 border-brand-gold text-brand-black'
                : 'text-beige-500 hover:text-beige-700'
            }`}
          >
            Analytics
          </button>
        </div>

        {/* Tab content */}
        {activeTab === 'reservas' && <ReservasTab />}
        {activeTab === 'analytics' && <AnalyticsTab />}
      </div>
    </main>
  );
}
