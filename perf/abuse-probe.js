/* global __ENV, __VU, __ITER */
import http from 'k6/http';
import { check } from 'k6';
import { Rate } from 'k6/metrics';

/**
 * Sonda de abuso — comprova (ou refuta) os achados da auditoria OWASP sob carga.
 *
 * Não é teste de performance: é prova de conceito defensiva dos vetores encontrados
 * em /api/events e do bypass de rate limit via x-forwarded-for forjado.
 *
 * RODAR SÓ CONTRA STAGING/LOCAL. Contra produção isso polui o funil de analytics real.
 */

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

const rateLimitHeld = new Rate('rate_limit_held');
const eventsAccepted = new Rate('events_accepted_unauthenticated');

export const options = {
  scenarios: {
    // 50 req/s de eventos falsos — simula bot floodando o funil de conversão.
    events_flood: {
      executor: 'constant-arrival-rate',
      rate: 50,
      timeUnit: '1s',
      duration: '30s',
      preAllocatedVUs: 20,
      maxVUs: 60,
      exec: 'floodEvents',
    },
    // Rate limit do admin: 5/min por IP. Com x-forwarded-for forjado, ainda segura?
    spoofed_ip_bruteforce: {
      executor: 'constant-arrival-rate',
      rate: 20,
      timeUnit: '1s',
      duration: '30s',
      preAllocatedVUs: 10,
      maxVUs: 30,
      exec: 'spoofRateLimit',
      startTime: '35s',
    },
  },
  thresholds: {
    // Se o rate limit funcionasse, a esmagadora maioria viraria 429.
    rate_limit_held: ['rate>0.90'],
    events_accepted_unauthenticated: ['rate<0.10'],
  },
};

export function floodEvents() {
  const res = http.post(
    `${BASE_URL}/api/events`,
    JSON.stringify({
      event: 'reservation_created', // envenena justamente a métrica de conversão
      session_id: `bot-${__VU}-${__ITER}`,
      device: 'mobile',
      page_url: '/reservar',
      timestamp_ms: Date.now(),
    }),
    { headers: { 'Content-Type': 'application/json' }, tags: { probe: 'events' } }
  );

  eventsAccepted.add(res.status === 200);
  check(res, { 'evento anonimo rejeitado (esperado: 429/401)': (r) => r.status !== 200 });
}

export function spoofRateLimit() {
  // Cada request finge vir de um IP diferente — o header é lido cru pelo app.
  const fakeIp = `203.0.113.${__VU % 254}`;
  const res = http.post(`${BASE_URL}/api/admin/auth`, JSON.stringify({ password: 'wrong-guess' }), {
    headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': fakeIp },
    tags: { probe: 'auth' },
  });

  rateLimitHeld.add(res.status === 429);
  check(res, { 'brute force barrado (esperado: 429)': (r) => r.status === 429 });
}
