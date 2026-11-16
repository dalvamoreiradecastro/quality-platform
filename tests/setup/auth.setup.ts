import { test as setup, expect } from '@playwright/test';
import { env } from '../../src/config/env';
import { STORAGE_STATE } from '../../src/config/paths';
import { LoginPage } from '../../src/pages/login.page';

/**
 * Faz login uma única vez e salva a sessão.
 * Os testes que precisam de usuário logado reutilizam esse estado,
 * em vez de repetir o fluxo de login em cada teste.
 */
setup('authenticate standard user', async ({ page }) => {
  const login = new LoginPage(page);
  await login.goto();
  await login.login(env.UI_USERNAME, env.UI_PASSWORD);
  await expect(page).toHaveURL(/inventory/);
  await page.context().storageState({ path: STORAGE_STATE });
});
