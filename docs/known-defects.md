# Defeitos Conhecidos

## DEF-001: Autenticação inválida retorna HTTP 200

| Campo      | Valor                                                                                             |
| ---------- | ------------------------------------------------------------------------------------------------- |
| Sistema    | Restful Booker API                                                                                |
| Endpoint   | `POST /auth`                                                                                      |
| Severidade | Média                                                                                             |
| Teste      | [tests/api/auth.spec.ts](../tests/api/auth.spec.ts) (`invalid credentials are rejected with 401`) |

**Passos para reproduzir**

```bash
curl -i -X POST https://restful-booker.herokuapp.com/auth \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"wrong-password"}'
```

**Resultado esperado:** `401 Unauthorized`

**Resultado obtido:** `200 OK` com corpo `{"reason":"Bad credentials"}`

**Impacto:** clientes que verificam sucesso pelo status code tratam a falha de login como sucesso. Isso também prejudica monitoramento e alertas baseados em taxa de 4xx.

**Status:** aberto. O teste usa `test.fail()` e vai sinalizar quando o comportamento for corrigido.
