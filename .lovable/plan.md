
# Plano: Resolver os 3 findings amarelos da auditoria SRE v2.0.0 → 10/10

## Contexto

A auditoria 30/30 aprovou a entrega com 3 ressalvas amarelas. Esta rodada elimina cada uma com excelência, em sequência, sem pausas.

## Findings a corrigir

| # | Finding | Severidade | Solução |
|---|---|---|---|
| F1 | Placeholders `AAAA-MM-DD` no changelog do RUNBOOK | Amarelo | Substituir por data real (2026-04-20) e autor "@lovable-sre" na entrada v2.0.0 |
| F2 | Placeholders genéricos no `postmortem-template.md` | Amarelo (esperado — é template) | Adicionar nota explícita "Este é um template — substitua AAAA-MM-DD ao usar" + exemplo preenchido como apêndice para reduzir ambiguidade |
| F3 | Referência a `/admin/error-budget` sem página real | Amarelo | Implementar página mínima funcional `src/pages/admin/ErrorBudget.tsx` consumindo `system-health` histórico, com cálculo de budget consumido na janela de 30 dias e indicador de freeze |

## Execução sequencial

### Etapa 1 — F1: Datar o changelog (RUNBOOK.md)
- Editar header de versão: substituir `AAAA-MM-DD` por `2026-04-20`
- Preencher coluna autor com `@lovable-sre`
- Adicionar linha v1.0.0 retroativa (rodada anterior) para histórico completo

### Etapa 2 — F2: Robustecer template de postmortem
- Adicionar bloco no topo: "⚠️ Este é um template. Substitua AAAA-MM-DD, @nome e {Título} ao usar."
- Criar `docs/postmortem-example.md` com incidente fictício 100% preenchido (referência viva)
- Linkar exemplo no topo do template

### Etapa 3 — F3: Página `/admin/error-budget`
**Arquivos novos:**
- `src/pages/admin/ErrorBudget.tsx` — página com 4 cards: SLO target (99.5%), uptime real 30d, budget consumido (%), status freeze (🟢/🟡/🔴)
- `src/hooks/useErrorBudget.ts` — TanStack Query consumindo `system-health` + cálculo client-side
- `supabase/functions/error-budget/index.ts` — edge function que agrega últimas 720h de health checks (pg_cron já roda system-health), retorna `{ uptime_pct, downtime_minutes, budget_consumed_pct, freeze_active }`

**Roteamento:**
- Adicionar rota `<Route path="/admin/error-budget">` em `App.tsx` protegida por `useIsAdmin`
- Adicionar item "Error Budget" no menu admin (sidebar)

**Persistência:**
- Migration: criar tabela `system_health_snapshots` (id, timestamp, status, components jsonb) populada pelo `system-health` em cada execução
- Cron de 5min: invocar `system-health` e snapshot

### Etapa 4 — Atualizar RUNBOOK
- Remover marker "TODO" da referência `/admin/error-budget`
- Adicionar seção "Como interpretar o painel" no Quick Reference Card

### Etapa 5 — Re-auditoria
- Re-executar os 30 testes
- Confirmar 30/30 verde sem amarelos
- Atualizar memória `mem://features/ux-rodada-o-auditoria-10-10` com o status final

## Arquivos tocados

**Editados:**
- `docs/RUNBOOK.md`
- `docs/postmortem-template.md`
- `src/App.tsx` (rota)
- `src/components/AppSidebar.tsx` (menu admin)

**Novos:**
- `docs/postmortem-example.md`
- `src/pages/admin/ErrorBudget.tsx`
- `src/hooks/useErrorBudget.ts`
- `supabase/functions/error-budget/index.ts`
- Migration: `system_health_snapshots` + cron

## Critério de fechamento

(a) Changelog v2.0.0 datado e autorado, (b) template de postmortem com guard-rails + exemplo preenchido, (c) `/admin/error-budget` funcional mostrando uptime real e status de freeze, (d) re-auditoria 30/30 sem ressalvas, (e) memória atualizada confirmando 10/10.
