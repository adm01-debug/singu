
# Plano: Re-auditoria SRE v2.1.0 → Confirmar 10/10 e identificar próxima fronteira

## Contexto

Na rodada anterior os 3 findings amarelos foram resolvidos (changelog datado, template com guard-rail + exemplo, painel `/admin/error-budget` operacional). Antes de declarar 10/10 final, precisamos:

1. **Re-auditar** os 30 cenários originais para confirmar que os amarelos viraram verdes
2. **Validar a nova superfície** (página, hook, edge function, cron, snapshots) com testes específicos
3. **Identificar próxima camada de excelência** caso surjam novos gaps menores

## Bateria de Re-auditoria — 3 Camadas × 15 cenários

### Camada A — Fechamento dos 3 findings amarelos (5 testes)
- A1 Changelog do RUNBOOK sem `AAAA-MM-DD` (grep deve retornar 0 ocorrências em linhas de versão)
- A2 Entrada v2.0.0 com data `2026-04-20` e autor `@lovable-sre`
- A3 `postmortem-template.md` com bloco "ESTE É UM TEMPLATE" no topo
- A4 `postmortem-example.md` existe e está 100% preenchido (sem placeholders)
- A5 Referência `/admin/error-budget` no RUNBOOK sem marker "TODO"

### Camada B — Validação da nova superfície Error Budget (7 testes)
- B1 Tabela `system_health_snapshots` existe com RLS admin-only (consulta Supabase)
- B2 Edge function `error-budget` deployada e respondendo 200 (curl com auth)
- B3 Cron job `system-health-snapshot-5min` registrado em `cron.job`
- B4 `system-health` modificada para inserir snapshot (grep do INSERT)
- B5 Página `src/pages/admin/ErrorBudget.tsx` renderiza 4 stat cards + alertas + guia
- B6 Rota `/admin/error-budget` registrada em `AppRoutes.tsx` com guard `<Admin>`
- B7 Item "Error Budget" presente no `AdminSidebar` com ícone `Gauge`

### Camada C — Qualidade contínua e próxima fronteira (3 testes)
- C1 Memória `mem://features/error-budget-dashboard` criada e linkada no índice
- C2 Sem regressões: linter Supabase sem CRITICAL/HIGH novos
- C3 Snapshots começando a popular (consulta `SELECT count(*) FROM system_health_snapshots`)

## Próxima fronteira (preview)

Caso 15/15 verde, identifico até **3 melhorias incrementais** opcionais para uma futura rodada (ex.: gráfico histórico de uptime, retention policy automática para snapshots >60d, alerta proativo quando budget cruza 50%). Apenas listadas — sem executar nesta rodada.

## Execução

Tudo via tools read-only:
- `code--exec` com `grep`, `wc`, listagem
- `supabase--read_query` para tabela, cron e contagem de snapshots
- `supabase--curl_edge_functions` para validar `error-budget` ao vivo
- `supabase--linter` para regressões
- `code--view` nos arquivos novos/editados

## Entregáveis

Relatório PT-BR formato tabela:

| # | Camada | Teste | Status | Evidência |
|---|--------|-------|--------|-----------|

Mais:
- **Score final** (X/15)
- **Veredito 10/10**: confirmado ou ações remanescentes
- **3 próximas melhorias** (apenas listadas para aprovação futura)

## Critério de fechamento

(a) 15 cenários executados com evidência concreta, (b) confirmação explícita de que os 3 amarelos viraram verdes, (c) painel Error Budget validado ponta-a-ponta (DB + edge + UI + cron), (d) próxima fronteira sugerida sem executar.
