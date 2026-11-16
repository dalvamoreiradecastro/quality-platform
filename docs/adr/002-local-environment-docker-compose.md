# ADR 002: Ambiente local com Docker Compose

**Status:** aceito

## Contexto

Os testes de API rodavam contra a instância pública do Restful Booker. Isso traz três problemas:

1. **Falta de determinismo:** o serviço é compartilhado. Outras pessoas criam, alteram e apagam dados, e o serviço pode ficar lento ou fora do ar. Uma falha no PR pode não ter relação com a mudança.
2. **Teste de carga inviável:** rodar load/stress contra um serviço público é antiético e gera resultados sem significado, porque a latência inclui o tráfego de terceiros.
3. **Paridade:** sem um ambiente reproduzível, "na minha máquina passa" não pode ser verificado.

## Decisão

- Subir a API sob teste em container, via **Docker Compose**, usando a imagem oficial `mwinteringham/restfulbooker`.
- O **mesmo** `docker-compose.yml` é usado localmente e no CI.
- O k6 roda como serviço do Compose, sob o profile `perf`, na mesma rede da API, com versão fixada (`grafana/k6:2.3.0`).
- O `healthcheck` da API + `docker compose up --wait` garantem que os testes só começam com o serviço pronto, sem `sleep` arbitrário.
- **PRs e push na `main`** usam o ambiente local como quality gate.
- O **ambiente público** continua sendo testado na regressão diária agendada, sem bloquear PRs, para detectar divergências entre ambientes.

## Consequências

- Os testes de API no PR passam a falhar só por mudanças no código, não por instabilidade de terceiros.
- O load test pode rodar a cada push, e o relatório HTML do k6 fica disponível como artefato do CI.
- Quem contribui precisa de Docker para reproduzir o ambiente local. Sem Docker, a suíte continua rodando contra o ambiente público (valores padrão em `src/config/env.ts`).
- A UI (Sauce Demo) continua apontando para o ambiente público, porque não existe imagem oficial dela. Se a UI fosse nossa, ela também entraria no Compose.
