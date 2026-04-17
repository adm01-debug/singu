
Continuando a sequência. Melhoria #1 entregue (badges + Validar tudo + People Intel timeline). Agora #2.

## Melhoria #2: Auto-validação on insert + revalidação periódica

### Schema (migração)
- Trigger `trg_auto_validate_contact_email` em `contacts` (AFTER INSERT/UPDATE de `email`): enfileira em nova tabela `validation_queue` (id, kind enum 'email'|'phone', value, contact_id, user_id, status enum 'pending'|'processing'|'done'|'error', attempts, last_error, created_at, processed_at) com RLS própria.
- Trigger análogo `trg_auto_validate_contact_phone` para `phone`.
- Triggers idênticos em `contact_emails` e `contact_phones` (tabelas relacionais externas espelhadas localmente, se existirem; se não, somente `contacts`).
- Índices em `(status, created_at)` e `(contact_id)`.

### Edge function `validation-queue-worker`
- Padrão Deno.serve + JWT service-role + rate-limit + Zod
- Pega lote de até 50 itens `pending` ordenados por `created_at`, marca `processing`, despacha para `email-verifier` ou `phone-validator` conforme `kind`, grava resultado, marca `done`/`error` (até 3 tentativas, backoff via `attempts`).

### pg_cron
- Job 1: `*/5 * * * *` (5min) → invoca `validation-queue-worker` para drenar fila.
- Job 2: `0 4 * * *` (04:00 UTC) → re-enfileira emails com `verified_at < now() - 30d`.
- Job 3: `30 4 * * *` (04:30 UTC) → re-enfileira phones com `validated_at < now() - 90d`.
- Habilitar `pg_cron` + `pg_net` se ainda não estiverem.

### UI mínima
- Em `/enrichment`, novo card "Fila de validação" mostrando `pending` / `processing` / `done` / `error` das últimas 24h via hook `useValidationQueueStats` (TanStack Query, refetch 30s).
- Botão admin "Processar fila agora" (só `useIsAdmin`) que invoca o worker manualmente.

### Hooks
- `useValidationQueueStats()` — agregação por status.
- `useTriggerQueueWorker()` — mutation admin.

### Validação E2E
- Criar contato com email novo via UI → conferir entry `pending` em `validation_queue` (SQL).
- Aguardar 5min ou clicar "Processar fila agora" → conferir status muda para `done` e `email_verifications` recebe registro.
- Editar email do contato → nova entry enfileirada.
- Forçar `verified_at` antigo via SQL e rodar job manualmente → conferir reverificação.
- Confirmar cron jobs ativos via `cron.job` table.

### Restrições
- ≤400 linhas/arquivo, sem `any`, sem `useEffect` para fetch, PT-BR.
- Não tocar em ABM/Lead Scoring/Intent.
- Reutilizar edge functions `email-verifier` e `phone-validator` já existentes (sem recriar).

Após #2 validada, sigo automaticamente para #3 (botão "Usar este email" no EmailFinder que cria/atualiza email no contato).
