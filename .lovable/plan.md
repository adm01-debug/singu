
#3 entregue. Próximo: #4 — revalidação manual em massa.

## Melhoria #4: Revalidação em massa em /enrichment

### Escopo
Card "Revalidar em massa" no `/enrichment` que permite ao usuário disparar reverificação de emails/telefones com filtros, alimentando a `validation_queue` (#2).

### UI
Novo `BulkRevalidateCard.tsx` em `src/components/enrichment/`:
- Toggle: alvo (Emails / Telefones / Ambos)
- Filtros:
  - Status atual: valid / invalid / risky / unknown / nunca verificado (multi-select)
  - Idade da última verificação: slider em dias (>7, >30, >90)
  - Limite: 50 / 200 / 500 / 1000 (proteção contra fila enorme)
- Preview: contador "X contatos serão enfileirados" (TanStack Query, refetch on filter change)
- Botão "Enfileirar revalidação" → confirma via AlertDialog → insere em `validation_queue`
- Toast com nº enfileirado + link "Ver fila" que rola até `ValidationQueueCard`

### Backend
Edge function `bulk-revalidate` (Deno.serve + Zod + rate-limit + JWT):
- Body: `{ kind: 'email'|'phone'|'both', statuses: string[], olderThanDays: number, limit: number, dryRun: boolean }`
- Query: junta `contacts` com último `email_verifications`/`phone_validations` via LEFT JOIN, filtra por status/age, aplica limit
- Se `dryRun=true` → retorna apenas count (para preview)
- Senão → INSERT em `validation_queue` (kind, value, contact_id, user_id, status='pending') e retorna count enfileirado
- Worker existente (#2) drena a fila normalmente

### Hooks
- `useBulkRevalidatePreview(filters)` — query, dryRun=true, staleTime 10s
- `useBulkRevalidate()` — mutation que chama edge function e invalida `validation-queue-stats`

### Arquivos
- Novo: `supabase/functions/bulk-revalidate/index.ts`
- Novo: `src/components/enrichment/BulkRevalidateCard.tsx`
- Novo: `src/hooks/useBulkRevalidate.ts`
- Editar: `src/pages/Enrichment.tsx` — montar card abaixo do `ValidationQueueCard`
- Nova memória: `mem://features/bulk-revalidation-flow.md`

### Validação E2E
- Selecionar "Emails / status=invalid / >30d / limite=50" → preview mostra contador
- Clicar "Enfileirar" → toast com nº + entries `pending` em `validation_queue` (SQL)
- Clicar "Processar fila agora" (admin, do #2) → entries viram `done`
- Conferir novos registros em `email_verifications` com `verified_at` recente

### Restrições
≤400 linhas/arquivo, sem `any`, sem `useEffect` para fetch, PT-BR. Reutilizar worker e edge functions existentes.

Após #4 → #5 (dashboard de cobertura de enriquecimento: % contatos com email validado, telefone validado, intel ativa).
