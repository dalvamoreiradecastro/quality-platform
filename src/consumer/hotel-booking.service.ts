/**
 * Camada de API do "hotel-web", um front-end fictício que consome a Booking API.
 *
 * É o CONSUMIDOR no contract testing: os testes Pact exercitam este código real
 * contra um mock server e geram o contrato (pacts/hotel-web-booking-api.json)
 * com exatamente as chamadas e campos dos quais o hotel-web depende.
 */
export interface StayDates {
  checkin: string;
  checkout: string;
}

export interface Reservation {
  firstname: string;
  lastname: string;
  totalprice: number;
  depositpaid: boolean;
  bookingdates: StayDates;
  additionalneeds?: string;
}

export class HotelBookingService {
  constructor(private readonly baseUrl: string) {}

  private headers(extra: Record<string, string> = {}): Record<string, string> {
    return { Accept: 'application/json', 'Content-Type': 'application/json', ...extra };
  }

  /** Retorna a reserva ou `null` se ela não existir. */
  async getReservation(id: number): Promise<Reservation | null> {
    const res = await fetch(`${this.baseUrl}/booking/${id}`, { headers: { Accept: 'application/json' } });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`Unexpected status ${res.status} fetching booking ${id}`);
    return (await res.json()) as Reservation;
  }

  async createReservation(reservation: Reservation): Promise<{ id: number; reservation: Reservation }> {
    const res = await fetch(`${this.baseUrl}/booking`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify(reservation),
    });
    if (!res.ok) throw new Error(`Unexpected status ${res.status} creating booking`);
    const body = (await res.json()) as { bookingid: number; booking: Reservation };
    return { id: body.bookingid, reservation: body.booking };
  }

  async login(username: string, password: string): Promise<string> {
    const res = await fetch(`${this.baseUrl}/auth`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify({ username, password }),
    });
    const body = (await res.json()) as { token?: string };
    // Não confiamos só no status: a API devolve 200 mesmo com credenciais inválidas (DEF-001)
    if (!body.token) throw new Error('Authentication failed');
    return body.token;
  }

  async cancelReservation(id: number, token: string): Promise<void> {
    const res = await fetch(`${this.baseUrl}/booking/${id}`, {
      method: 'DELETE',
      headers: { Cookie: `token=${token}` },
    });
    if (res.status !== 201) throw new Error(`Unexpected status ${res.status} cancelling booking ${id}`);
  }
}
