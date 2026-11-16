import { rmSync } from 'node:fs';
import { test, expect } from '@playwright/test';
import { MatchersV3, PactV3 } from '@pact-foundation/pact';
import { HotelBookingService, type Reservation } from '../../../src/consumer/hotel-booking.service';
import { PACT_CONSUMER, PACT_DIR, PACT_FILE, PACT_PROVIDER, STATES } from '../../../src/config/pact';

const { like, integer, string, boolean, regex, fromProviderState } = MatchersV3;

/**
 * Testes do CONSUMIDOR: o código real do hotel-web conversa com um mock server do Pact.
 * Cada interação descreve só o que o hotel-web usa. Campos que ele ignora não entram no contrato,
 * o que dá ao provedor liberdade para evoluir sem quebrar este consumidor.
 */
const pact = new PactV3({ consumer: PACT_CONSUMER, provider: PACT_PROVIDER, dir: PACT_DIR, logLevel: 'warn' });

const JSON_CONTENT_TYPE = { 'Content-Type': regex('application/json.*', 'application/json; charset=utf-8') };
const ISO_DATE = '^\\d{4}-\\d{2}-\\d{2}$';

const reservation: Reservation = {
  firstname: 'Ana',
  lastname: 'Souza',
  totalprice: 450,
  depositpaid: true,
  bookingdates: { checkin: '2026-12-01', checkout: '2026-12-05' },
  additionalneeds: 'Breakfast',
};

/** Formato esperado de uma reserva: tipos e formatos, não valores exatos. */
const reservationShape = {
  firstname: string('Ana'),
  lastname: string('Souza'),
  totalprice: integer(450),
  depositpaid: boolean(true),
  bookingdates: {
    checkin: regex(ISO_DATE, '2026-12-01'),
    checkout: regex(ISO_DATE, '2026-12-05'),
  },
};

test.describe('hotel-web → booking-api contract', () => {
  // Contrato sempre gerado do zero: interações removidas do código saem do contrato
  test.beforeAll(() => rmSync(PACT_FILE, { force: true }));

  test('fetches an existing reservation', async () => {
    pact
      .given(STATES.bookingExists)
      .uponReceiving('a request for an existing booking')
      .withRequest({
        method: 'GET',
        path: fromProviderState('/booking/${id}', '/booking/1'),
        headers: { Accept: 'application/json' },
      })
      .willRespondWith({ status: 200, headers: JSON_CONTENT_TYPE, body: reservationShape });

    await pact.executeTest(async (mock) => {
      const result = await new HotelBookingService(mock.url).getReservation(1);
      expect(result).toMatchObject({ firstname: 'Ana', bookingdates: { checkin: '2026-12-01' } });
    });
  });

  test('returns null for a reservation that does not exist', async () => {
    pact
      .given(STATES.bookingDoesNotExist)
      .uponReceiving('a request for a non-existent booking')
      .withRequest({ method: 'GET', path: '/booking/999999999', headers: { Accept: 'application/json' } })
      .willRespondWith({ status: 404 });

    await pact.executeTest(async (mock) => {
      expect(await new HotelBookingService(mock.url).getReservation(999999999)).toBeNull();
    });
  });

  test('creates a reservation', async () => {
    pact
      .uponReceiving('a request to create a booking')
      .withRequest({
        method: 'POST',
        path: '/booking',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: reservation,
      })
      .willRespondWith({
        status: 200,
        headers: JSON_CONTENT_TYPE,
        body: { bookingid: integer(1), booking: like(reservationShape) },
      });

    await pact.executeTest(async (mock) => {
      const created = await new HotelBookingService(mock.url).createReservation(reservation);
      expect(created.id).toBe(1);
      expect(created.reservation.lastname).toBe('Souza');
    });
  });

  test('logs in with valid credentials', async () => {
    pact
      .given(STATES.validCredentials)
      .uponReceiving('a request for an auth token with valid credentials')
      .withRequest({
        method: 'POST',
        path: '/auth',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: { username: 'admin', password: 'password123' },
      })
      .willRespondWith({ status: 200, headers: JSON_CONTENT_TYPE, body: { token: string('abc123') } });

    await pact.executeTest(async (mock) => {
      expect(await new HotelBookingService(mock.url).login('admin', 'password123')).toBe('abc123');
    });
  });

  test('cancels a reservation with a token', async () => {
    pact
      .given(STATES.bookingExists)
      .uponReceiving('a request to delete an existing booking')
      .withRequest({
        method: 'DELETE',
        path: fromProviderState('/booking/${id}', '/booking/1'),
        // O provedor injeta um token real na verificação (ver requestFilter no teste do provedor)
        headers: { Cookie: 'token=abc123' },
      })
      .willRespondWith({ status: 201 });

    await pact.executeTest(async (mock) => {
      await expect(new HotelBookingService(mock.url).cancelReservation(1, 'abc123')).resolves.toBeUndefined();
    });
  });
});
