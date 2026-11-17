import path from 'node:path';

export const PACT_CONSUMER = 'hotel-web';
export const PACT_PROVIDER = 'booking-api';
export const PACT_DIR = path.resolve('pacts');
export const PACT_FILE = path.join(PACT_DIR, `${PACT_CONSUMER}-${PACT_PROVIDER}.json`);

/** Provider states: o vocabulário compartilhado entre consumidor e provedor. */
export const STATES = {
  bookingExists: 'a booking exists',
  bookingDoesNotExist: 'no booking exists with id 999999999',
  validCredentials: 'valid admin credentials exist',
} as const;
