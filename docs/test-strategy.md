# Estratégia de Testes

## 1. Objetivo

Dar confiança para liberar mudanças nos dois sistemas sob teste, com feedback rápido no PR e cobertura proporcional ao risco de cada funcionalidade.

## 2. Análise de risco

| Funcionalidade                        | Impacto | Probabilidade de falha | Risco    | Cobertura principal                |
| ------------------------------------- | ------- | ---------------------- | -------- | ---------------------------------- |
| Checkout / finalização de compra      | Alto    | Média                  | **Alto** | E2E + cálculo de totais            |
| Autenticação (UI e API)               | Alto    | Média                  | **Alto** | API + E2E (casos negativos)        |
| CRUD de reservas                      | Alto    | Média                  | **Alto** | API + contrato                     |
| Ordenação de produtos                 | Médio   | Baixa                  | Médio    | E2E                                |
| Acessibilidade das páginas principais | Médio   | Alta                   | Médio    | axe-core com baseline              |
| Performance da API de reservas        | Médio   | Média                  | Médio    | k6 (smoke no CI, load sob demanda) |

## 3. Distribuição por camada

```
         ▲   E2E (poucos, fluxos críticos de negócio)
        ▲▲▲  Contrato (integração consumidor ↔ provedor, sem subir tudo junto)
       ▲▲▲▲▲ API (maior volume: regras, schemas, casos negativos)
```

- **API** concentra a maior parte da cobertura: é rápida, estável e testa as regras de negócio diretamente.
- **Contrato (Pact)** garante a integração entre consumidor e provedor sem precisar de um ambiente com os dois sistemas rodando. Ele substitui boa parte dos testes de integração lentos e frágeis.
  - A validação de schema (Zod) diz "a resposta tem este formato".
  - O Pact diz "este consumidor depende exatamente destes campos". É isso que permite saber se uma mudança no provedor quebra alguém.
- **E2E** cobre só jornadas de ponta a ponta que o usuário realmente faz e que nenhuma outra camada valida (integração da UI).
- **Variações de dados** (ex.: diferentes credenciais inválidas) são parametrizadas em vez de duplicadas.

## 4. O que **não** automatizamos (e por quê)

| Item                                                       | Motivo                                                                                           |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Usuários `problem_user` / `glitch_user` em todos os fluxos | São bugs propositais da aplicação. Cobertos por exploração, não por regressão                    |
| Layout pixel a pixel                                       | Custo de manutenção alto sem ganho de confiança equivalente. Avaliar regressão visual no roadmap |
| Load/stress test contra APIs públicas                      | Não é ético sobrecarregar um serviço compartilhado. Carga roda só no ambiente local (Docker)     |

## 5. Dados de teste

- Cada teste **cria os próprios dados** (factories com Faker) e não depende de registros existentes.
- Isso permite execução **totalmente paralela** e elimina uma das principais fontes de flakiness.

## 6. Critérios de qualidade (quality gates)

Um PR só é considerado verde quando passa por:

1. Lint e typecheck sem erros
2. 100% dos testes de API e E2E passando (com até 2 retries no CI, monitorados)
3. Nenhuma **nova** violação de acessibilidade WCAG 2.1 AA
4. k6 smoke: `p95 < 1.5s` e taxa de erro `< 1%`

## 7. Gestão de flakiness

- `retries: 2` só no CI. Um teste que passa no retry aparece como **flaky** no relatório e deve ser investigado, não ignorado.
- Traces, vídeos e screenshots são retidos em falhas para diagnóstico sem precisar reproduzir localmente.
- Espera explícita só via asserções do Playwright (auto-wait). `waitForTimeout` é proibido.

## 8. Defeitos

Defeitos encontrados são registrados em [known-defects.md](known-defects.md) e, quando possível, viram testes com `test.fail()`. Assim, a suíte avisa quando o comportamento mudar.
