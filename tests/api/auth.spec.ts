import { test, expect } from '../../src/fixtures';
import { AuthResponseSchema } from '../../src/api/schemas/booking.schema';
import { env } from '../../src/config/env';

test.describe('Auth API', () => {
  test('health check responds @smoke', async ({ bookingClient }) => {
    const res = await bookingClient.ping();
    expect(res.status()).toBe(201);
  });

  test('valid credentials return a token @smoke', async ({ bookingClient }) => {
    const res = await bookingClient.createToken(env.API_USERNAME, env.API_PASSWORD);

    expect(res.status()).toBe(200);
    expect(AuthResponseSchema.safeParse(await res.json()).success).toBe(true);
  });

  test('invalid credentials are rejected with 401', async ({ bookingClient }) => {
    test.info().annotations.push({
      type: 'known-defect',
      description: 'API responde 200 + {"reason":"Bad credentials"} em vez de 401. Ver docs/known-defects.md#DEF-001',
    });
    test.fail(); // documenta o defeito: o teste passa a falhar "de verdade" quando a API for corrigida

    const res = await bookingClient.createToken('admin', 'wrong-password');
    expect(res.status()).toBe(401);
  });
});
