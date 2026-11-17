# ADR 003: Contract testing consumer-driven com Pact

**Status:** aceito

## Contexto

Os testes de API validam o formato das respostas com Zod. Isso garante que a API se comporta como _nós_ achamos que deveria, mas não responde à pergunta mais importante numa arquitetura com vários serviços:

> "Se o provedor mudar este campo, qual consumidor quebra?"

Testes E2E respondem a isso só de forma indireta, tarde (depois do deploy em um ambiente integrado), lenta e frágil.

## Decisão

Adotar **contract testing consumer-driven com Pact** (`@pact-foundation/pact`, especificação V3).

- **Consumidor:** `hotel-web` ([src/consumer/hotel-booking.service.ts](../../src/consumer/hotel-booking.service.ts)), código real que consome a API. Os testes do consumidor rodam esse código contra o mock server do Pact e geram o contrato.
- **Provedor:** `booking-api` (Restful Booker). A verificação reproduz cada interação do contrato contra a API real.
- **Matchers por tipo/formato** (`integer`, `string`, `regex` para datas), em vez de valores fixos: o contrato não quebra por dados diferentes, só por mudança de estrutura.
- **Provider states** (`a booking exists`) criam dados reais na verificação. O ID gerado é injetado no contrato com `fromProviderState`, então não existe dependência de um registro fixo.
- **Autenticação:** o contrato usa um token fictício, e um `requestFilter` troca esse token por um token válido na verificação. Credenciais reais nunca entram no contrato.
- O **Playwright Test** é o runner, por consistência com o ADR 001. O projeto `contract-provider` depende de `contract-consumer`, garantindo a ordem gera → verifica.

## Alternativas consideradas

| Alternativa                                | Por que não                                                                               |
| ------------------------------------------ | ----------------------------------------------------------------------------------------- |
| Só validação de schema (Zod/JSON Schema)   | Valida o provedor contra o _nosso_ entendimento, não contra o uso real de cada consumidor |
| Contract testing provider-driven (OpenAPI) | Útil, mas não mostra quais campos cada consumidor de fato usa                             |
| Pact Broker / PactFlow desde o início      | Overhead de infraestrutura para um único par consumidor/provedor. Ficou no roadmap        |

## Consequências

- Mudanças incompatíveis no provedor são detectadas no PR, sem ambiente integrado.
- Como não há broker, o contrato é gerado e verificado no mesmo pipeline e guardado como artefato do CI. Com mais consumidores ou repositórios separados, o próximo passo é um **Pact Broker** com `can-i-deploy`.
- Aqui o provedor é um sistema de terceiros, então uma falha de verificação significa "a API mudou de forma incompatível com o hotel-web". Num cenário real, a verificação rodaria no pipeline do _provedor_.
