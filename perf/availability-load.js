/* global __ENV, __VU, __ITER */
import http from 'k6/http';
import { check, group } from 'k6';
import { Trend, Rate } from 'k6/metrics';

/**
 * Carga do caminho crítico de tráfego pago: anúncio → home → /reservar → /api/availability
 *
 * SOMENTE LEITURA. Este teste nunca chama POST /api/bookings — esse endpoint cria
 * reserva real na Artax e dispara WhatsApp real pro hotel. Ver perf/README.md.
 */

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

const availabilityLatency = new Trend('availability_latency', true);
const availabilityFail = new Rate('availability_errors');
const upstreamDegraded = new Rate('artax_upstream_degraded');

export const options = {
  scenarios: {
    // Perfil de tráfego pago: rampa até o pico de campanha, sustenta, desce.
    paid_traffic: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 10 }, // aquecimento
        { duration: '1m', target: 30 }, // volume normal de campanha
        { duration: '2m', target: 30 }, // sustenta — aqui vaza memória se vazar
        { duration: '30s', target: 80 }, // pico (post viral / horário nobre)
        { duration: '1m', target: 80 },
        { duration: '30s', target: 0 },
      ],
      gracefulRampDown: '30s',
    },
  },
  thresholds: {
    // SLO: busca de disponibilidade é o gargalo do funil. Se passa de 2s, o usuário abandona.
    availability_latency: ['p(95)<2000', 'p(99)<4000'],
    availability_errors: ['rate<0.01'],
    http_req_failed: ['rate<0.02'],
    'http_req_duration{page:home}': ['p(95)<1500'],
  },
};

function futureDate(offsetDays) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

export default function () {
  // Datas variadas por VU para não bater sempre no mesmo cache da Artax.
  const offset = 20 + ((__VU * 7 + __ITER * 3) % 60);
  const checkin = futureDate(offset);
  const checkout = futureDate(offset + 2);
  const adults = 1 + (__VU % 3);

  group('landing', () => {
    const res = http.get(`${BASE_URL}/`, { tags: { page: 'home' } });
    check(res, { 'home 200': (r) => r.status === 200 });
  });

  group('busca de disponibilidade', () => {
    const url =
      `${BASE_URL}/api/availability` +
      `?arrival_date=${checkin}&departure_date=${checkout}&adults=${adults}&kids=0`;
    const res = http.get(url, { tags: { page: 'availability' } });

    availabilityLatency.add(res.timings.duration);
    availabilityFail.add(res.status !== 200);
    // 502 = a Artax cedeu antes do nosso app. Métrica separada: é o limite do fornecedor.
    upstreamDegraded.add(res.status === 502);

    check(res, {
      'availability 200': (r) => r.status === 200,
      'retorna array de quartos': (r) => {
        if (r.status !== 200) return false;
        try {
          return Array.isArray(r.json('rooms'));
        } catch {
          return false;
        }
      },
      'nao vazou credencial': (r) =>
        !r.body || (!r.body.includes('ClientSecret') && !r.body.includes('ARTAX_CLIENT')),
    });
  });

  group('pagina de reserva', () => {
    const res = http.get(
      `${BASE_URL}/reservar?checkin=${checkin}&checkout=${checkout}&guests=${adults}`,
      { tags: { page: 'reservar' } }
    );
    check(res, { 'reservar 200': (r) => r.status === 200 });
  });
}
