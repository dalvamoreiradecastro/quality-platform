import { z } from 'zod';

/**
 * Contratos da API. Usados tanto para tipar os clients quanto para
 * validar as respostas em runtime (contract testing do lado do consumidor).
 */
export const BookingDatesSchema = z.object({
  checkin: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  checkout: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export const BookingSchema = z
  .object({
    firstname: z.string(),
    lastname: z.string(),
    totalprice: z.number().int().nonnegative(),
    depositpaid: z.boolean(),
    bookingdates: BookingDatesSchema,
    additionalneeds: z.string().optional(),
  })
  .strict();

export const CreateBookingResponseSchema = z.object({
  bookingid: z.number().int().positive(),
  booking: BookingSchema,
});

export const BookingIdListSchema = z.array(z.object({ bookingid: z.number().int().positive() }));

export const AuthResponseSchema = z.object({ token: z.string().min(1) });

export type Booking = z.infer<typeof BookingSchema>;
export type CreateBookingResponse = z.infer<typeof CreateBookingResponseSchema>;
