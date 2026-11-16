import AxeBuilder from '@axe-core/playwright';
import { test, expect } from '../../src/fixtures';
import { STORAGE_STATE } from '../../src/config/paths';
import { a11yBaseline } from './a11y-baseline';

/**
 * Estratégia de baseline: a aplicação já possui violações conhecidas.
 * Em vez de ignorar acessibilidade ou deixar a suíte sempre vermelha,
 * registramos as violações existentes e falhamos apenas em NOVAS violações
 * (regressão). Cada item do baseline deve virar um defeito rastreável.
 */
const pages = [
  { name: 'login', path: '/', authenticated: false },
  { name: 'inventory', path: '/inventory.html', authenticated: true },
  { name: 'cart', path: '/cart.html', authenticated: true },
];

for (const p of pages) {
  test.describe(`a11y: ${p.name}`, () => {
    test.use({ storageState: p.authenticated ? STORAGE_STATE : { cookies: [], origins: [] } });

    test(`has no new WCAG 2.1 AA violations on ${p.name} page`, async ({ page }, testInfo) => {
      await page.goto(p.path);

      const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();

      await testInfo.attach(`axe-${p.name}.json`, {
        body: JSON.stringify(results.violations, null, 2),
        contentType: 'application/json',
      });

      const known = new Set(a11yBaseline[p.name] ?? []);
      const newViolations = results.violations
        .filter((v) => !known.has(v.id))
        .map((v) => `${v.id} [${v.impact}] ${v.help} (${v.nodes.length} nodes)`);

      expect(newViolations, 'New accessibility violations found').toEqual([]);
    });
  });
}
