import { test as base, expect } from '@playwright/test';
import { BookingClient } from '../api/clients/booking.client';
import { AuthResponseSchema } from '../api/schemas/booking.schema';
import { env } from '../config/env';
import { LoginPage } from '../pages/login.page';
import { InventoryPage } from '../pages/inventory.page';
import { CartPage, CheckoutPage } from '../pages/checkout.page';

type ApiFixtures = {
  bookingClient: BookingClient;
  authToken: string;
};

type UiFixtures = {
  loginPage: LoginPage;
  inventoryPage: InventoryPage;
  cartPage: CartPage;
  checkoutPage: CheckoutPage;
};

/**
 * Ponto único de import para os testes:
 *   import { test, expect } from '../../src/fixtures';
 * Cada teste recebe só o que pede, e o setup fica fora do corpo do teste.
 */
export const test = base.extend<ApiFixtures & UiFixtures>({
  bookingClient: async ({ request }, use) => {
    await use(new BookingClient(request));
  },

  authToken: async ({ bookingClient }, use) => {
    const res = await bookingClient.createToken(env.API_USERNAME, env.API_PASSWORD);
    expect(res.ok()).toBeTruthy();
    const { token } = AuthResponseSchema.parse(await res.json());
    await use(token);
  },

  loginPage: async ({ page }, use) => use(new LoginPage(page)),
  inventoryPage: async ({ page }, use) => use(new InventoryPage(page)),
  cartPage: async ({ page }, use) => use(new CartPage(page)),
  checkoutPage: async ({ page }, use) => use(new CheckoutPage(page)),
});

export { expect };
