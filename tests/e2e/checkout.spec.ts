import { test, expect } from '../../src/fixtures';
import { STORAGE_STATE } from '../../src/config/paths';
import { CheckoutPage } from '../../src/pages/checkout.page';
import { buildCustomer } from '../../src/data/booking.factory';

test.use({ storageState: STORAGE_STATE });

test.describe('Shopping & checkout', () => {
  test.beforeEach(async ({ inventoryPage }) => {
    await inventoryPage.goto();
  });

  test('completes a purchase end to end @smoke', async ({ page, inventoryPage, cartPage, checkoutPage }) => {
    await inventoryPage.addToCart('Sauce Labs Backpack');
    await inventoryPage.addToCart('Sauce Labs Bike Light');
    await expect(inventoryPage.cartBadge).toHaveText('2');

    await inventoryPage.openCart();
    await expect(cartPage.items).toHaveCount(2);
    await cartPage.checkout();

    await checkoutPage.fillCustomer(buildCustomer());
    await checkoutPage.finishButton.click();

    await expect(page).toHaveURL(/checkout-complete/);
    await expect(checkoutPage.completeHeader).toHaveText('Thank you for your order!');
  });

  test('order total equals subtotal plus tax', async ({ inventoryPage, cartPage, checkoutPage }) => {
    await inventoryPage.addToCart('Sauce Labs Backpack');
    await inventoryPage.addToCart('Sauce Labs Fleece Jacket');
    await inventoryPage.openCart();
    await cartPage.checkout();
    await checkoutPage.fillCustomer(buildCustomer());

    const subtotal = CheckoutPage.parseAmount(await checkoutPage.subtotal.textContent());
    const tax = CheckoutPage.parseAmount(await checkoutPage.tax.textContent());
    const total = CheckoutPage.parseAmount(await checkoutPage.total.textContent());

    expect(subtotal).toBe(29.99 + 49.99);
    expect(total).toBeCloseTo(subtotal + tax, 2);
  });

  test('requires customer information to continue', async ({ inventoryPage, cartPage, checkoutPage }) => {
    await inventoryPage.addToCart('Sauce Labs Onesie');
    await inventoryPage.openCart();
    await cartPage.checkout();

    await checkoutPage.continueButton.click();

    await expect(checkoutPage.error).toContainText('First Name is required');
  });

  test('sorts products by price, low to high', async ({ inventoryPage }) => {
    await inventoryPage.sortBy('lohi');

    const prices = await inventoryPage.prices();
    expect(prices).toEqual([...prices].sort((a, b) => a - b));
  });
});
