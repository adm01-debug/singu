
Deal Rooms acabou. O usuário fez um gap analysis explícito do roadmap 2.x. Embora 2.4/2.5/2.6 já existam parcial ou totalmente (Lead Scoring server-side, ABM, Intent Data), ele aponta gaps específicos restantes — em especial **2.4 Lead Scoring Comportamental**: integração com sequence_events (open/click/reply alimentando score) e trigger de automação `score_threshold`. Esses dois pontos NÃO estão implementados ainda.

Próxima melhoria: **Behavioral Score Bridge & Threshold Automations** — fechar o gap real do 2.4 trazendo eventos de sequência como sinais de intent ponderados e criando trigger de automação reagindo a faixas de grade.

## Plano: Behavioral Score Bridge & Threshold Automations

### 1. Schema (migration)
- `lead_score_threshold_automations` — `id, user_id, name, trigger_type ('grade_reached'|'grade_dropped'|'score_above'|'score_below'), grade_target ('A'|'B'|'C'|'D' nullable), score_target int nullable, action_type ('notify'|'create_task'|'enroll_sequence'|'webhook'|'tag'), action_config jsonb, cooldown_hours int default 24, active bool, last_fired_at, fired_count int`
- `lead_score_threshold_log` — `id, user_id, contact_id, automation_id, from_grade, to_grade, from_score, to_score, action_result jsonb, fired_at` (auditoria + cooldown)
- Adiciona regras default ao `seed_lead_score_defaults`: `engagement.email_open=2/14d`, `engagement.email_click=5/14d`, `engagement.email_reply=12/30d`, `engagement.sequence_completed=8/30d`
- Trigger `tg_sequence_events_to_intent`: AFTER INSERT em `sequence_events` mapeia event_type → cria `intent_signal` correspondente (open→email_open, click→email_click, reply→email_reply) e enfileira recompute
- RLS por user_id em ambas

### 2. Edge Function
- **`lead-score-threshold-runner`** (cron + on-recompute): após cada execução do `lead-scorer`, compara delta de grade/score e dispara automações elegíveis respeitando cooldown. Ações:
  - `notify` → cria registro em `notifications`
  - `create_task` → insere em `tasks` (assigned_to + due_date relativo)
  - `enroll_sequence` → insere em `sequence_enrollments`
  - `webhook` → POST para URL configurada
  - `tag` → adiciona tag ao contato
  - Registra resultado em `lead_score_threshold_log`
- Estende `lead-scorer` para invocar runner ao detectar mudança de grade

### 3. Hooks `src/hooks/useScoreAutomations.ts`
- `useScoreAutomations`, `useUpsertAutomation`, `useToggleAutomation`, `useDeleteAutomation`
- `useAutomationLog(automationId?, days)`

### 4. UI
**`/lead-scoring/automations`** (nova subpágina):
- Lista de automações com toggle ativo, último disparo, contador de execuções
- Botão "Nova automação" → wizard 3 passos: Trigger (grade/score) → Ação → Cooldown+nome
- Templates pré-prontos: "Lead virou A → notificar AE", "Caiu de A para C → criar tarefa de win-back", "Alcançou 80 → entrar em sequência VIP"
- Tab "Histórico" mostra log de disparos

**Componentes** em `src/components/lead-scoring/`:
- `AutomationCard`, `AutomationWizard`, `AutomationTemplatesGrid`, `AutomationLogTable`
- `ScoreSourceBreakdown` (atualizado mostrando origem dos sinais — email_open/click/reply ao lado de page_view, etc.)

### 5. Integração
- Link "Automações" na página `/lead-scoring` (header + tab)
- ContatoDetalhe `LeadScoreCard`: timeline de sinais agora inclui eventos de sequência
- Sequences: ao gravar event, trigger preenche `intent_signals` (sem código aplicativo extra)

### 6. Navegação
- Rota `/lead-scoring/automations` em App.tsx
- Tab "Automações" no header de `/lead-scoring`

### 7. Memória
- Atualizar `mem://features/lead-scoring-server-side` com seção "Behavioral Bridge + Threshold Automations"
- Novo `mem://features/lead-score-threshold-automations`

### Não fazer
- Não criar tabelas products/proposals
- Não substituir o trigger existente `tg_intent_signals_enqueue_score` — coexiste
- Não tocar em ABM/Intent além de leitura
- Sem integração com Bombora/G2/Clearbit (pago, fora de escopo)
