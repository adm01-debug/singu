
## Plano: Motor de Execução de Sequências (2.3) — já está em produção

Verifiquei o estado atual: o motor solicitado **já foi implementado na sessão anterior** (commit em `supabase/migrations/20260416224850_*.sql` + edge functions + UI). O que falta é o **cabeamento final + auto-enrollment**, que esta sessão vai entregar.

### O que já existe (não tocar)
- Tabelas `sequence_events`, `sequence_send_log` + colunas de branching em `sequence_steps` (`condition_type`, `branch_on_yes_step`, `branch_on_no_step`)
- Edge Function `sequence-processor` (motor que avança steps + branching + pause-on-reply)
- Edge Function `sequence-track` (pixel + redirect)
- pg_cron rodando a cada 5min
- Hooks `useSequenceEvents`, `useSequenceMetrics`, `useSequenceProcessor` + `SequenceMetricsCard` na UI

### O que FALTA fechar (escopo desta entrega)

**1. Verificação do envio de email real**
- Conferir se `sequence-processor` invoca `send-transactional-email` corretamente, com `idempotencyKey = enrollment_id + step_order`, `templateData` injetando token de tracking no HTML
- Se `send-transactional-email` ainda não estiver scaffolded, chamar `email_domain--scaffold_transactional_email` (pré-requisito: `email_domain--setup_email_infra`)
- Criar template `sequence-step` em `_shared/transactional-email-templates/` que aceita `subject`, `htmlBody` e `trackingToken` como props e injeta pixel `<img src=".../sequence-track?a=open&t={token}">` + reescreve links via `sequence-track?a=click&t={token}&u={url}`

**2. Editor de branching na UI**
- Adicionar selects no `SequenceStepEditor` (ou criar) para `condition_type` (always | if_opened | if_clicked | if_not_opened) e `condition_wait_hours`
- Para steps condicionais, mostrar dropdowns "Se SIM → step X" / "Se NÃO → step Y"

**3. Auto-enrollment via Automações**
- Criar template em `AutomationTemplates`: trigger "lead criado" → action "inscrever em sequência X"
- Implementar handler no executor de automações que chama `supabase.from('sequence_enrollments').insert(...)`
- Adicionar UI no detalhe da sequência: botão "Inscrever automaticamente leads que..." com filtro (tag, score mínimo, território)

**4. Pause-on-reply automático real**
- Hoje o `sequence-processor` lê `replied_at` do enrollment, mas ninguém grava esse campo
- Criar trigger no banco: quando uma `interaction` do tipo `email_received` ou `whatsapp_received` é inserida para um contato com enrollment ativo → setar `replied_at = now()` no enrollment correspondente
- Mesmo para `meetings.created` quando `pause_on_meeting = true`

**5. Página de métricas por sequência**
- Drawer "Detalhes" em `/sequencias` com gráfico de funil (Sent → Opened → Clicked → Replied) por step
- Lista de eventos recentes (`sequence_events`) e log de envios (`sequence_send_log`) com status

### Arquivos a tocar
- `supabase/functions/sequence-processor/index.ts` — confirmar invocação de send-transactional-email
- `supabase/functions/_shared/transactional-email-templates/sequence-step.tsx` — novo template
- `supabase/functions/_shared/transactional-email-templates/registry.ts` — registrar
- `supabase/migrations/<new>.sql` — trigger de pause-on-reply
- `src/components/sequences/SequenceStepEditor.tsx` — campos de branching
- `src/components/sequences/SequenceDetailDrawer.tsx` — funil + eventos
- `src/components/automations/AutomationTemplates.tsx` — template de auto-enrollment
- `src/lib/automationExecutor.ts` (ou hook equivalente) — handler `enroll_in_sequence`
- `src/pages/Sequencias.tsx` — abrir drawer ao clicar em card

### Pré-requisitos a validar antes de codar
- Status do email domain (`email_domain--check_email_domain_status`) — se não houver, dialog de setup primeiro
- Existência de `send-transactional-email` no projeto

### Não fazer
- Não recriar `sequence_events`, `sequence_send_log`, `sequence-track`, `sequence-processor`, `useSequenceEvents`, `useSequenceMetrics`, `useSequenceProcessor`, `SequenceMetricsCard` (já existem)
- Não tocar em `sales_team_members`, `lead_routing_rules` (módulo 2.2 está pronto)
- Não criar novas Edge Functions de envio — usar `send-transactional-email` exclusivamente

Aprovar para executar.
