import { faker } from '@faker-js/faker';
import type { Booking } from '../api/schemas/booking.schema';

const toISODate = (d: Date): string => d.toISOString().slice(0, 10);

/**
 * Gera dados únicos por teste, o que permite rodar tudo em paralelo
 * sem colisão. Qualquer campo pode ser sobrescrito.
 */
export function buildBooking(overrides: Partial<Booking> = {}): Booking {
  const checkin = faker.date.soon({ days: 30 });
  const checkout = faker.date.soon({ days: 10, refDate: checkin });

  return {
    firstname: faker.person.firstName(),
    lastname: faker.person.lastName(),
    totalprice: faker.number.int({ min: 50, max: 2000 }),
    depositpaid: faker.datatype.boolean(),
    bookingdates: { checkin: toISODate(checkin), checkout: toISODate(checkout) },
    additionalneeds: faker.helpers.arrayElement(['Breakfast', 'Late checkout', 'Parking']),
    ...overrides,
  };
}

export function buildCustomer() {
  return {
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    postalCode: faker.location.zipCode(),
  };
}
