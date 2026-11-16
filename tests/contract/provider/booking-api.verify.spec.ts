import { test, expect } from '@playwright/test';
import { Verifier } from '@pact-foundation/pact';
import { env } from '../../../src/config/env';
import { PACT_FILE, PACT_PROVIDER, STATES } from '../../../src/config/pact';
import { buildBooking } from '../../../src/data/booking.factory';

/**
 * Verificação do PROVEDOR: reproduz cada interação do contrato contra a API real
 * (container local no CI, ou ambiente público por padrão) e confere as respostas.
 */
const jsonHeaders = { Accept: 'application/json', 'Content-Type': 'application/json' };

async function createToken(): Promise<string> {
  const res = await fetch(`${env.API_BASE_URL}/auth`, {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify({ username: env.API_USERNAME, password: env.API_PASSWORD }),
  });
  const { token } = (await res.json()) as { token: string };
  return token;
}

type ProxiedRequest = { headers: Record<string, string | string[] | undefined> };

/** O contrato usa um token fictício; na verificação ele é trocado por um token válido do provedor. */
function injectRealToken(token: string) {
  return (req: ProxiedRequest, _res: unknown, next: () => void): void => {
    if (req.headers.cookie) req.headers.cookie = `token=${token}`;
    next();
  };
}

test('booking-api honours the hotel-web contract', async () => {
  test.setTimeout(120_000);
  const token = await createToken();

  const verifier = new Verifier({
    provider: PACT_PROVIDER,
    providerBaseUrl: env.API_BASE_URL,
    pactUrls: [PACT_FILE],
    logLevel: 'warn',

    // Cada provider state prepara dados reais e devolve os valores injetados no contrato
    stateHandlers: {
      [STATES.bookingExists]: async () => {
        const res = await fetch(`${env.API_BASE_URL}/booking`, {
          method: 'POST',
          headers: jsonHeaders,
          body: JSON.stringify(buildBooking()),
        });
        const { bookingid } = (await res.json()) as { bookingid: number };
        return { id: bookingid };
      },
      [STATES.bookingDoesNotExist]: async () => undefined,
      [STATES.validCredentials]: async () => undefined,
    },

    requestFilter: injectRealToken(token),
  });

  await expect(verifier.verifyProvider()).resolves.toBeDefined();
});
