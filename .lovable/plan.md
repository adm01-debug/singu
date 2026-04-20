
# Plano: Fechar 10/10 SRE — Resolver bug B2 + executar próxima fronteira

## Contexto

Re-auditoria anterior: 12/15. Bug B2 (edge function `error-budget` retornando 404) ainda bloqueia o painel. Este plano fecha o bug e executa as 3 melhorias incrementais propostas, em sequência única.

## Execução sequencial

### Etapa 1 — Corrigir B2: Re-deploy do `error-budget`
- Re-deployar explicitamente a função `error-budget` (código já existe e está correto)
- Validar com `curl_edge_functions` retornando 200
- Verificar logs para confirmar execução limpa

### Etapa 2 — Melhoria #1: Gráfico histórico de uptime (sparkline 30d)
- Estender edge function `error-budget` para retornar série temporal diária (`daily_uptime: [{date, uptime_pct}]`)
- Adicionar componente `UptimeSparkline.tsx` usando Recharts (AreaChart, 30 pontos)
- Integrar no `ErrorBudget.tsx` abaixo dos 4 stat cards, com linha de SLO 99.5% como referência

### Etapa 3 — Melhoria #2: Retention policy automática (>60d)
- Migration: criar função `cleanup_old_health_snapshots()` que deleta snapshots >60 dias
- Cron job semanal `system-health-snapshots-cleanup` (domingo 03:00 UTC)
- Adicionar índice em `system_health_snapshots(timestamp DESC)` para acelerar tanto agregação quanto cleanup

### Etapa 4 — Melhoria #3: Alerta proativo em 50% do budget
- Estender `error-budget/index.ts` para inserir registro em `system_alerts` (tabela existente) quando `budget_consumed_pct` cruzar 50%, 75%, 100%
- Lógica idempotente: só insere se ainda não houver alerta do mesmo nível nas últimas 24h
- Severidade: 50% → warning, 75% → high, 100% → critical
- Banner no topo do `ErrorBudget.tsx` listando alertas ativos da tabela

### Etapa 5 — Documentação e memória
- RUNBOOK: adicionar seção "Alertas automáticos de Error Budget" descrevendo os 3 thresholds
- Atualizar `mem://features/error-budget-dashboard` com sparkline + retention + alertas
- Bump RUNBOOK para v2.2.0 com entrada datada

### Etapa 6 — Auditoria final 10/10
- Re-rodar os 15 testes da rodada anterior (esperado: 15/15 verde)
- Adicionar 5 novos testes específicos das melhorias (sparkline renderiza, cleanup agendado, alertas inseridos)
- Total: 20/20 = 10/10 confirmado

## Arquivos tocados

**Editados:**
- `supabase/functions/error-budget/index.ts` (série temporal + alertas)
- `src/pages/admin/ErrorBudget.tsx` (sparkline + banner alertas)
- `src/hooks/useErrorBudget.ts` (tipo expandido)
- `docs/RUNBOOK.md` (v2.2.0 + seção alertas)

**Novos:**
- `src/components/admin/UptimeSparkline.tsx`
- Migration: função cleanup + cron semanal + índice

## Critério de fechamento

(a) `curl /functions/v1/error-budget` retorna 200 com payload completo, (b) sparkline renderiza 30 pontos no painel, (c) cron de cleanup ativo, (d) alertas inseridos automaticamente nos 3 thresholds, (e) auditoria 20/20 confirmando 10/10 SRE.
