
Lead Scoring server-side com decay temporal **já existe e está em produção** — vi `mem://features/lead-scoring-server-side` (decay exponencial, half-life=decay_days, edge functions `lead-scorer` single+batch e `lead-score-cron`, fila via trigger em `intent_signals`, hub `/lead-scoring` + config). Triggers de automação **também existem** — `mem://features/lead-score-threshold-automations` (5 ações, cooldown, log, wizard 3 passos, 4 templates, ponte `sequence_events→intent_signals`). ABM idem (validado E2E ontem com score 52/100 e 4 oportunidades whitespace).

Não há nada para implementar. Plano = validação E2E rápida para confirmar que tudo continua íntegro.

## Plano: Validação E2E do Lead Scoring + Automações

### 1. Verificação de schema e funções
- Confirmar tabelas `lead_scores`, `lead_score_history`, `lead_score_rules`, `lead_score_thresholds`, `lead_score_recompute_queue`, `lead_score_threshold_automations`, `lead_score_threshold_log`
- Confirmar trigger `tg_intent_signals_enqueue_score` ativo em `intent_signals`
- Confirmar trigger `tg_sequence_events_to_intent` ativo em `sequence_events`
- Confirmar função `seed_lead_score_defaults` presente

### 2. Verificação de edge functions deployadas
- `lead-scorer` (single + batch)
- `lead-score-cron`
- `lead-score-threshold-runner`

### 3. Teste funcional E2E (rota `/lead-scoring`)
- Abrir hub `/lead-scoring` e validar KPIs e Top Leads
- Selecionar um contato e disparar "Recalcular" → conferir score, grade e breakdown
- Inserir 1 sinal de intent manual via UI/SQL → validar que entra na fila e o score sobe
- Ir em `/lead-scoring/automations`:
  - Criar automação "Score ≥ 70 → tag hot" a partir do template
  - Forçar recálculo do contato e validar disparo + entrada em `lead_score_threshold_log`
- Verificar logs das 3 edge functions

### 4. Reportar
- Status de cada item
- Se algo falhar, listar o gap (sem corrigir nesta passada — exige novo plano)

### Não fazer
- Não recriar schema, hooks, componentes ou edge functions
- Não criar produtos/propostas
- Não tocar em ABM (já validado)
