import { test, expect } from '../../src/fixtures';
import { env } from '../../src/config/env';

// Testes de login começam SEM sessão
test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Login', () => {
  test.beforeEach(async ({ loginPage }) => {
    await loginPage.goto();
  });

  test('standard user logs in successfully @smoke', async ({ page, loginPage, inventoryPage }) => {
    await loginPage.login(env.UI_USERNAME, env.UI_PASSWORD);

    await expect(page).toHaveURL(/inventory/);
    await expect(inventoryPage.title).toHaveText('Products');
  });

  const invalidCases = [
    {
      name: 'locked out user',
      user: 'locked_out_user',
      pass: 'secret_sauce',
      msg: 'Sorry, this user has been locked out.',
    },
    { name: 'wrong password', user: 'standard_user', pass: 'wrong', msg: 'Username and password do not match' },
    { name: 'empty username', user: '', pass: 'secret_sauce', msg: 'Username is required' },
    { name: 'empty password', user: 'standard_user', pass: '', msg: 'Password is required' },
  ];

  for (const c of invalidCases) {
    test(`shows error for ${c.name}`, async ({ page, loginPage }) => {
      await loginPage.login(c.user, c.pass);

      await expect(loginPage.error).toContainText(c.msg);
      await expect(page).not.toHaveURL(/inventory/);
    });
  }

  test('blocks direct access to inventory without session', async ({ page, loginPage }) => {
    await page.goto('/inventory.html');

    await expect(loginPage.error).toContainText("You can only access '/inventory.html' when you are logged in");
  });
});
