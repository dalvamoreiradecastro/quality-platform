import type { APIRequestContext, APIResponse } from '@playwright/test';
import type { Booking } from '../schemas/booking.schema';

/**
 * Client fino sobre o APIRequestContext do Playwright.
 * Retorna o APIResponse cru: as asserções ficam nos testes,
 * o client só conhece rotas e formatos de requisição.
 */
export class BookingClient {
  constructor(private readonly request: APIRequestContext) {}

  ping(): Promise<APIResponse> {
    return this.request.get('/ping');
  }

  createToken(username: string, password: string): Promise<APIResponse> {
    return this.request.post('/auth', { data: { username, password } });
  }

  list(filters?: { firstname?: string; lastname?: string }): Promise<APIResponse> {
    return this.request.get('/booking', { params: filters });
  }

  get(id: number): Promise<APIResponse> {
    return this.request.get(`/booking/${id}`);
  }

  create(booking: Booking): Promise<APIResponse> {
    return this.request.post('/booking', { data: booking });
  }

  update(id: number, booking: Booking, token: string): Promise<APIResponse> {
    return this.request.put(`/booking/${id}`, {
      data: booking,
      headers: { Cookie: `token=${token}` },
    });
  }

  partialUpdate(id: number, patch: Partial<Booking>, token: string): Promise<APIResponse> {
    return this.request.patch(`/booking/${id}`, {
      data: patch,
      headers: { Cookie: `token=${token}` },
    });
  }

  delete(id: number, token?: string): Promise<APIResponse> {
    return this.request.delete(`/booking/${id}`, {
      headers: token ? { Cookie: `token=${token}` } : {},
    });
  }
}
