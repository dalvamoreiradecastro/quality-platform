# Quality Platform

[![CI](https://github.com/dalvamoreiradecastro/quality-platform/actions/workflows/ci.yml/badge.svg)](https://github.com/dalvamoreiradecastro/quality-platform/actions/workflows/ci.yml)
![Playwright](https://img.shields.io/badge/Playwright-2EAD33?logo=playwright&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![k6](https://img.shields.io/badge/k6-7D64FF?logo=k6&logoColor=white)

Uma plataforma de qualidade de ponta a ponta: testes de **API**, **E2E**, **acessibilidade** e **performance**, rodando em **CI** com relatório publicado.

O objetivo não é só mostrar automação. É mostrar **como decido o que testar, em que camada e por quê**. Essas decisões estão em [docs/test-strategy.md](docs/test-strategy.md).

📊 **Relatório da última execução:** `https://dalvamoreiradecastro.github.io/quality-platform/`

---

## Sistemas sob teste

| Camada | Aplicação                                                                | Por quê                                                   |
| ------ | ------------------------------------------------------------------------ | --------------------------------------------------------- |
| API    | [Restful Booker](https://restful-booker.herokuapp.com/apidoc/index.html) | CRUD com autenticação e defeitos conhecidos               |
| UI     | [Sauce Demo](https://www.saucedemo.com)                                  | Fluxo de e-commerce com usuários de comportamento variado |

## O que tem aqui

- **Testes de API** com validação de contrato em runtime ([Zod](https://zod.dev)): o schema tipa o código _e_ valida a resposta.
- **Testes E2E** em Chromium e Firefox, com Page Objects, fixtures customizadas e sessão de login reutilizada (`storageState`).
- **Acessibilidade** (WCAG 2.1 AA) com axe-core e uma **estratégia de baseline**: só falha com violações _novas_.
- **Ambiente local isolado** com Docker Compose: a API sob teste roda em container, idêntico na máquina e no CI.
- **Performance** com k6: perfis `smoke`, `load` e `stress`, com thresholds de p95 por endpoint e relatório HTML gerado a cada execução.
- **Dados de teste isolados** por teste, gerados com Faker. Isso permite execução 100% paralela.
- **Defeitos documentados como testes** (`test.fail()`): o teste fica vermelho quando o bug for corrigido, lembrando de atualizar a suíte.
- **CI no GitHub Actions**: lint → typecheck → API (ambiente local) + UI em paralelo → load test → relatório consolidado no GitHub Pages, além de regressão diária agendada que também valida o ambiente público.

## Arquitetura

```
quality-platform/
├── src/
│   ├── api/
│   │   ├── clients/        # Clients HTTP finos (só rotas, sem asserções)
│   │   └── schemas/        # Contratos Zod (tipos + validação em runtime)
│   ├── config/             # Variáveis de ambiente validadas
│   ├── data/               # Factories de dados de teste
│   ├── fixtures/           # Fixtures do Playwright (injeção de dependências)
│   └── pages/              # Page Objects
├── tests/
│   ├── api/
│   ├── e2e/
│   ├── a11y/
│   └── setup/              # Login executado uma vez e reutilizado
├── performance/            # Scripts k6
├── docs/                   # Estratégia, defeitos e decisões (ADRs)
├── docker-compose.yml      # Ambiente local (API + k6)
└── .github/workflows/      # Pipeline de CI
```

### Ambientes

```
                ┌───────────────────── docker compose ─────────────────────┐
 Playwright ──► │  restful-booker :3001   ◄──  k6 (profile "perf")         │
                └──────────────────────────────────────────────────────────┘
      │
      └──────►  restful-booker.herokuapp.com (público, só regressão agendada)
      └──────►  saucedemo.com (UI)
```

| Ambiente | Usado em                       | Por quê                                                     |
| -------- | ------------------------------ | ----------------------------------------------------------- |
| Local    | PRs, push na `main`, load test | Determinístico, sem dependência externa, permite carga real |
| Público  | Regressão diária agendada      | Detecta divergências entre ambientes                        |

## Como rodar

Pré-requisitos: Node.js 20+. Para o ambiente local, [Docker](https://docs.docker.com/get-docker/).

```bash
npm install
npx playwright install chromium firefox

npm test                 # tudo (API contra o ambiente público)
npm run test:api         # só API
npm run test:e2e         # E2E (Chromium + Firefox)
npm run test:a11y        # acessibilidade
npm run test:smoke       # apenas testes marcados com @smoke
npm run report           # abre o relatório HTML
```

**Com o ambiente local (Docker):**

```bash
npm run env:up             # sobe a API em http://localhost:3001 e espera ficar saudável
npm run test:api:local     # testes de API contra o container
npm run test:perf:local    # k6 perfil load    -> performance/reports/k6-report.html
npm run test:stress:local  # k6 perfil stress
npm run env:down           # derruba o ambiente
```

O k6 também roda sem Docker, se instalado: `npm run test:perf:smoke`.

As configurações têm valores padrão. Para sobrescrever, copie `.env.example` para `.env`.

## Documentação

- [Estratégia de testes](docs/test-strategy.md)
- [Defeitos conhecidos](docs/known-defects.md)
- [ADR 001: Playwright como ferramenta única para API e UI](docs/adr/001-playwright-for-api-and-ui.md)
- [ADR 002: Ambiente local com Docker Compose](docs/adr/002-local-environment-docker-compose.md)

## Roadmap

- [x] Ambiente local com Docker Compose (permite testes de carga sem afetar APIs públicas)
- [ ] Contract testing consumer-driven com Pact
- [ ] Testes de regressão visual
- [ ] Dashboard de flakiness a partir do histórico do CI
- [ ] Testes de aplicação com LLM (avaliação de respostas, prompt injection)
