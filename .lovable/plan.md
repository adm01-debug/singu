
Intent Data acabou. Próximo do roadmap 2.x = **2.4 Lead Scoring Comportamental server-side** (hoje só client-side, falta persistência server, decay temporal e triggers de automação).

## Plano: Lead Scoring Server-Side com Decay

### 1. Schema (migration)
- `lead_scores` — `user_id, contact_id, fit_score, engagement_score, intent_score, relationship_score, total_score, grade ('A'|'B'|'C'|'D'), computed_at, decay_applied_at`. Unique(user_id, contact_id).
- `lead_score_history` — snapshots para gráfico de evolução: `id, user_id, contact_id, total_score, grade, breakdown jsonb, recorded_at`. Index (contact_id, recorded_at desc).
- `lead_score_rules` — config por user: `id, user_id, dimension, signal_key, weight, decay_days, active`. Permite tunar pesos sem deploy.
- `lead_score_thresholds` — grades por user: `id, user_id, grade, min_score`. Default A≥80, B≥60, C≥40, D<40.
- RLS por user_id, audit em lead_scores.

### 2. Edge Functions
- **`lead-scorer`**: calcula score de 1 contato ou batch. Lê interactions (engagement), intent_signals (intent), contact attrs (fit), relationship_score field (relationship). Aplica **decay exponencial** por dimensão (ex: engagement signals decaem 5%/dia, intent 3%/dia). Persiste em `lead_scores` + snapshot em `lead_score_history` quando muda grade ou ±10 pontos.
- **`lead-score-cron`**: roda diário, recalcula todos os contatos com atividade nos últimos 60d. Aciona webhook/notificação quando contato muda para grade A.
- Ambas com rate limit, JWT validation, registradas em config.toml.

### 3. Trigger DB
- `trigger_lead_score_recompute` em `intent_signals` AFTER INSERT → marca contato como dirty (insere em `lead_score_recompute_queue`). Cron processa fila.

### 4. Hooks (`src/hooks/useLeadScoring.ts`)
- `useLeadScore(contactId)`, `useTopLeads(grade?, limit)`, `useLeadScoreHistory(contactId)`, `useRecomputeLead(contactId)`, `useRecomputeAllLeads`, `useScoreRules` + `useUpdateRule`, `useScoreThresholds` + `useUpdateThreshold`.

### 5. UI
- **`/lead-scoring`**: hub com 4 KPIs (total leads, distribuição por grade, score médio, mudanças 24h), tabela de top leads ordenada por score com grade badge, gráfico de distribuição (recharts pie).
- **`/lead-scoring/config`**: editor de pesos por dimensão/sinal e thresholds de grade.
- **Widget `LeadScoreCard`**: usado em ContatoDetalhe mostrando score atual + breakdown radar + sparkline histórico.
- Componentes em `src/components/lead-scoring/`: `LeadGradeBadge`, `LeadScoreBreakdown` (radar chart), `LeadScoreSparkline`, `TopLeadsTable`, `ScoreDistributionChart`, `ScoreRulesEditor`.

### 6. Integração
- ABM: `abm-account-scorer` lê `lead_scores` para média de score do buying committee → entra em `engagement` dimension.
- Intent: trigger já mencionado garante recompute on-signal.

### 7. Navegação
- Sidebar: "Lead Scoring" (ícone Gauge) abaixo de Intent Data.
- Rotas `/lead-scoring` e `/lead-scoring/config` em App.tsx.

### 8. Memória
- `mem://features/lead-scoring-server-side` + atualizar índice (substitui o `lead-scoring-system` antigo client-side).

### Não fazer
- Não criar tabelas `products`/`proposals`.
- Não tocar em ABM/Intent/Territory além de leitura cruzada.
- Não remover hook client-side antigo agora — deixa coexistir como fallback offline.
