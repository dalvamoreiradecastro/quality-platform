# ADR 001: Playwright como ferramenta única para API e UI

**Status:** aceito

## Contexto

O projeto precisa de testes de API, E2E e acessibilidade. As opções avaliadas foram:

- Playwright para tudo
- Cypress (UI) + Supertest/Axios (API)
- Playwright (UI) + Jest + Axios (API)

## Decisão

Usar **Playwright Test** como runner único para API, E2E e acessibilidade, e **k6** para performance.

## Motivos

- **Um runner, um relatório:** API e UI aparecem no mesmo relatório HTML, com o mesmo modelo de retries, tags e paralelismo.
- **Fixtures compartilhadas:** o mesmo `BookingClient` pode preparar dados via API para um teste de UI, sem uma segunda stack.
- **Multi-browser nativo** (Chromium, Firefox, WebKit) e paralelismo sem custo extra.
- **Traces** com timeline, rede e DOM facilitam o diagnóstico de falhas no CI.
- **k6** fica separado porque teste de carga exige um modelo de execução diferente (VUs, stages, thresholds), que um runner funcional não oferece bem.

## Consequências

- O time precisa conhecer apenas um framework de testes funcionais.
- Para contract testing consumer-driven, será necessário adicionar o Pact (planejado no roadmap). A validação de schema com Zod cobre só o lado do consumidor.
