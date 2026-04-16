
O usuário pediu MVP linear do `sequence-processor`. Mas a sessão anterior já entregou MUITO mais que isso: processor com branching, pause-on-reply via trigger DB, métricas, drawer, auto-enrollment template, tracking pixel. O que falta é o **envio real de email** — hoje o processor registra eventos mas não dispara `send-transactional-email` porque o domínio de email nunca foi configurado.

Plano enxuto:

### Estado atual (não tocar)
- `sequence-processor` já existe, roda via pg_cron 5min, avança enrollments, lê `replied_at` (trigger DB já popula isso)
- `sequence_events`, `sequence_send_log` existem
- UI completa em `/sequencias`

### O que esta entrega faz
1. **Configurar domínio de email** (pré-requisito) via dialog `<lov-open-email-setup>`
2. Após domínio OK, rodar `email_domain--setup_email_infra` + `email_domain--scaffold_transactional_email`
3. Criar template React Email `sequence-step.tsx` em `_shared/transactional-email-templates/` que aceita props `{ subject, htmlBody, recipientName }` — registrar em `registry.ts`
4. Verificar/ajustar `sequence-processor/index.ts` para invocar `supabase.functions.invoke('send-transactional-email', { body: { templateName: 'sequence-step', recipientEmail, idempotencyKey: enrollment_id+step_order, templateData: {...} } })` quando `channel === 'email'`
5. Deploy: `send-transactional-email`, `sequence-processor`, `process-email-queue`, `handle-email-unsubscribe`, `handle-email-suppression`

### O que NÃO fazer
- Não criar nova edge function de envio (usar `send-transactional-email`)
- Não tocar em branching (já existe e funciona)
- Não criar tabelas (todas existem)
- Não tocar em UI

### Bloqueador atual
Sem domínio de email configurado o envio real não funciona. O fluxo correto é mostrar setup dialog → após confirmação, executar passos 2-5 autonomamente para cumprir o pedido original ("envia emails via send-transactional-email").

Aprovar para executar.
