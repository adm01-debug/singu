
Lead Scoring server-side acabou. Próximo grande gap do roadmap = **Win/Loss Intelligence** — análise estruturada de deals ganhos/perdidos com motivos categorizados, padrões via IA e dashboard executivo. Hoje só existe `pipeline_kanban` com `deal_status`, sem captura estruturada de razão, sem competidor e sem análise.

## Plano: Win/Loss Intelligence

### 1. Schema (migration)
- `win_loss_records` — `id, user_id, deal_id, outcome ('won'|'lost'|'no_decision'), primary_reason_id, secondary_reasons text[], competitor_id (nullable), deal_value, sales_cycle_days, decision_maker_contact_id, notes, lessons_learned text, recorded_at, created_at`
- `win_loss_reasons` — `id, user_id, category ('price'|'product'|'timing'|'relationship'|'competition'|'budget'|'authority'|'need'|'other'), label, outcome_type ('won'|'lost'|'both'), active, sort_order` — seeded por usuário via função
- `competitors` — `id, user_id, name, website, strengths text[], weaknesses text[], typical_price_range, win_rate_against numeric, notes, active`
- `win_loss_insights` — `id, user_id, period_start, period_end, insight_type ('pattern'|'recommendation'|'alert'), title, description, severity, supporting_data jsonb, generated_at` (cache de IA)
- RLS por user_id, audit em win_loss_records, função `seed_win_loss_defaults(_user_id)` cria razões padrão

### 2. Edge Functions
- **`win-loss-analyzer`**: lê win_loss_records últimos 90/180d → calcula win rate, avg deal size por outcome, top motivos perda/ganho, win rate por competidor → invoca Lovable AI (gemini-3-flash-preview) com tool calling para gerar 3-5 insights estruturados → persiste em `win_loss_insights`. Rate limit + JWT
- **`win-loss-record-deal`**: chamado quando deal vai para `closed_won`/`closed_lost` no pipeline → cria placeholder em `win_loss_records` para vendedor preencher. Trigger DB opcional

### 3. Hooks `src/hooks/useWinLoss.ts`
- `useWinLossRecords(filters)`, `useWinLossRecord(dealId)`, `useCreateWinLossRecord`, `useUpdateWinLossRecord`
- `useWinLossReasons(outcome?)`, `useCreateReason`, `useUpdateReason`
- `useCompetitors`, `useCreateCompetitor`, `useUpdateCompetitor`
- `useWinLossMetrics(period)` — win rate, motivos top, competidor-rate
- `useWinLossInsights`, `useGenerateInsights`

### 4. UI

**`/win-loss`** (hub):
- 4 KPIs: Win Rate, Avg Deal Size Won, Top Loss Reason, Active Competitors
- Aba "Records" com tabela filtrada por outcome/período/competidor
- Aba "Insights" com cards de IA (pattern/recommendation/alert) + botão "Gerar"
- Gráficos: barra de motivos por outcome, donut de win rate por competidor

**`/win-loss/setup`**: editor de razões (CRUD) e competidores

**Widget `WinLossCaptureDialog`**: aparece quando deal muda para fechado no PipelineKanban — formulário compacto: outcome, motivo primário (select), motivos secundários (multi), competidor, lições aprendidas

**Componentes** em `src/components/win-loss/`:
- `WinRateCard`, `LossReasonsChart` (recharts horizontal bar), `CompetitorWinRateChart` (donut)
- `WinLossRecordsTable`, `WinLossInsightCard`, `CompetitorCard`
- `ReasonsEditor`, `CompetitorEditor`, `WinLossCaptureDialog`

### 5. Integração
- `PipelineKanban`: ao arrastar card para `closed_won`/`closed_lost` abre `WinLossCaptureDialog`
- `EmpresaDetalhe` aba comercial: card resumindo win rate histórico da conta
- Lead Scoring: motivos de perda recorrentes podem entrar como sinal negativo de fit (futuro)

### 6. Navegação
- Sidebar: "Win/Loss" (ícone TrendingUp ou Target) abaixo de Lead Scoring
- Rotas `/win-loss` e `/win-loss/setup` em App.tsx

### 7. Memória
- `mem://features/win-loss-intelligence` + atualizar índice

### Não fazer
- Não criar tabelas products/proposals
- Não tocar em pipeline_stages além de listener
- Análise de sentiment de notas via IA fica fora (futuro)
