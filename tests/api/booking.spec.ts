import { test, expect } from '../../src/fixtures';
import { BookingIdListSchema, BookingSchema, CreateBookingResponseSchema } from '../../src/api/schemas/booking.schema';
import { buildBooking } from '../../src/data/booking.factory';

test.describe('Booking API', () => {
  test('creates a booking and returns it matching the contract @smoke', async ({ bookingClient }) => {
    const payload = buildBooking();

    const res = await bookingClient.create(payload);

    expect(res.status()).toBe(200);
    const body = CreateBookingResponseSchema.parse(await res.json());
    expect(body.booking).toEqual(payload);
  });

  test('retrieves a created booking by id', async ({ bookingClient }) => {
    const payload = buildBooking();
    const { bookingid } = CreateBookingResponseSchema.parse(await (await bookingClient.create(payload)).json());

    const res = await bookingClient.get(bookingid);

    expect(res.status()).toBe(200);
    expect(BookingSchema.parse(await res.json())).toEqual(payload);
  });

  test('filters bookings by name', async ({ bookingClient }) => {
    const payload = buildBooking();
    const { bookingid } = CreateBookingResponseSchema.parse(await (await bookingClient.create(payload)).json());

    const res = await bookingClient.list({ firstname: payload.firstname, lastname: payload.lastname });

    expect(res.status()).toBe(200);
    const ids = BookingIdListSchema.parse(await res.json()).map((b) => b.bookingid);
    expect(ids).toContain(bookingid);
  });

  test('updates a booking with a valid token', async ({ bookingClient, authToken }) => {
    const { bookingid } = CreateBookingResponseSchema.parse(await (await bookingClient.create(buildBooking())).json());
    const updated = buildBooking({ additionalneeds: 'Dinner' });

    const res = await bookingClient.update(bookingid, updated, authToken);

    expect(res.status()).toBe(200);
    expect(BookingSchema.parse(await res.json())).toEqual(updated);
  });

  test('rejects update without a token', async ({ bookingClient }) => {
    const { bookingid } = CreateBookingResponseSchema.parse(await (await bookingClient.create(buildBooking())).json());

    const res = await bookingClient.update(bookingid, buildBooking(), 'invalid-token');

    expect(res.status()).toBe(403);
  });

  test('deletes a booking and it is no longer retrievable', async ({ bookingClient, authToken }) => {
    const { bookingid } = CreateBookingResponseSchema.parse(await (await bookingClient.create(buildBooking())).json());

    const del = await bookingClient.delete(bookingid, authToken);
    expect(del.status()).toBe(201);

    const get = await bookingClient.get(bookingid);
    expect(get.status()).toBe(404);
  });

  test('returns 404 for a non-existent booking', async ({ bookingClient }) => {
    const res = await bookingClient.get(999_999_999);
    expect(res.status()).toBe(404);
  });
});
