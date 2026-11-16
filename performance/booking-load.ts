/**
 * Teste de performance da Booking API com k6 (suporte nativo a TypeScript no k6 >= 1.0).
 *
 * Perfis:
 *   k6 run performance/booking-load.ts                    -> load (padrão)
 *   k6 run --env PROFILE=smoke performance/booking-load.ts
 *   k6 run --env PROFILE=stress performance/booking-load.ts
 *
 * Atenção: o alvo padrão é uma API pública compartilhada, então só o perfil smoke deve rodar contra ela.
 * Load e stress rodam contra a instância local (docker-compose.yml):
 *   npm run test:perf:local
 *   npm run test:stress:local
 */
import http from 'k6/http';
import { check, group, sleep } from 'k6';
import type { Options } from 'k6/options';

const BASE_URL = __ENV.API_BASE_URL || 'https://restful-booker.herokuapp.com';
const PROFILE = (__ENV.PROFILE || 'load') as 'smoke' | 'load' | 'stress';

const profiles: Record<typeof PROFILE, Options['stages']> = {
  smoke: [{ duration: '30s', target: 2 }],
  load: [
    { duration: '30s', target: 10 },
    { duration: '1m', target: 10 },
    { duration: '15s', target: 0 },
  ],
  stress: [
    { duration: '1m', target: 20 },
    { duration: '2m', target: 40 },
    { duration: '30s', target: 0 },
  ],
};

export const options: Options = {
  stages: profiles[PROFILE],
  thresholds: {
    http_req_failed: ['rate<0.01'],
    'http_req_duration{name:list}': ['p(95)<1500'],
    'http_req_duration{name:create}': ['p(95)<1500'],
    'http_req_duration{name:get}': ['p(95)<1000'],
    checks: ['rate>0.99'],
  },
};

const headers = { 'Content-Type': 'application/json', Accept: 'application/json' };

export default function () {
  group('browse bookings', () => {
    const res = http.get(`${BASE_URL}/booking`, { headers, tags: { name: 'list' } });
    check(res, { 'list: status 200': (r) => r.status === 200 });
  });

  group('create and read booking', () => {
    const payload = JSON.stringify({
      firstname: `perf${__VU}`,
      lastname: `iter${__ITER}`,
      totalprice: 150,
      depositpaid: true,
      bookingdates: { checkin: '2026-12-01', checkout: '2026-12-05' },
      additionalneeds: 'Breakfast',
    });

    const created = http.post(`${BASE_URL}/booking`, payload, { headers, tags: { name: 'create' } });
    const ok = check(created, { 'create: status 200': (r) => r.status === 200 });
    if (!ok) return;

    const id = created.json('bookingid');
    const res = http.get(`${BASE_URL}/booking/${id}`, { headers, tags: { name: 'get' } });
    check(res, { 'get: status 200': (r) => r.status === 200 });
  });

  sleep(1);
}
