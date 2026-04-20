

# Rodada R — Fechamento dos Gaps Q1–Q5 (rumo ao 10.0/10)

A Rodada Q fechou apenas Q6 (tracing wrapper). Restam **5 gaps** documentados no roadmap. Executarei agora em sequência atômica.

## Ações

**R1. Tracing nas 5 edge functions críticas (Q5)** — substituir `console.log/warn/error` por `tracedLogger(traceId, fnName)` em:
- `supabase/functions/external-data/index.ts`
- `supabase/functions/ask-crm/index.ts`
- `supabase/functions/incoming-webhook/index.ts`
- `supabase/functions/ai-suggest-mapping/index.ts`
- `supabase/functions/connection-anomaly-detector/index.ts`

Cada uma extrai `traceId` via `extractTraceId(req)` no início e devolve `withTraceResponseHeader` nas respostas.

**R2. Optimistic locking nos hooks (Q4)** — atualizar:
- `useUpdateContact` → aceitar `version`, fazer update com `.eq('version', currentVersion).select()`, detectar array vazio → `throw new Error('CONCURRENT_EDIT')`
- `useUpdateCompany` → idem
- `onError` chama `useActionToast.error("Conflito de edição: outro usuário modificou este registro. Recarregue e tente novamente.")`

Como o acesso é via `external-data` proxy, criar action `update_with_version` no Edge Function que executa o UPDATE versionado e retorna count.

**R3. Eliminar `: any` em massa — Fase 1 (Q1)** — varrer top 20 arquivos com mais ocorrências, substituir por:
- Tipos do `Database['public']['Tables'][...]['Row']` quando aplicável
- `unknown` + type guards quando dinâmico
- Interfaces locais quando estrutura conhecida

Meta desta rodada: reduzir de ~248 para ≤80 ocorrências.

**R4. Split `sidebar.tsx` (Q3)** — quebrar `src/components/ui/sidebar.tsx` (746 linhas) em:
- `sidebar-context.tsx` (Provider, useSidebar hook, constants)
- `sidebar-layout.tsx` (Sidebar, SidebarHeader, SidebarFooter, SidebarContent, SidebarInset, SidebarInput, SidebarRail, SidebarSeparator, SidebarTrigger)
- `sidebar-group.tsx` (SidebarGroup, SidebarGroupLabel, SidebarGroupAction, SidebarGroupContent)
- `sidebar-menu.tsx` (SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarMenuAction, SidebarMenuBadge, SidebarMenuSkeleton, SidebarMenuSub*)
- `sidebar.tsx` → re-exporta tudo (mantém API pública 100% compatível)

Cada arquivo <400 linhas. Zero alteração visual ou comportamental.

**R5. ESLint `no-explicit-any: warn` (Q2 parcial)** — promover de off para `warn` (não `error` ainda, pois R3 não zera 100%). Garante visibilidade de regressões sem quebrar build. Promoção para `error` na Rodada S após R3 atingir zero.

## Entregáveis

- **CHANGELOG v2.7.3** — Rodada R (Q1 fase1, Q2 warn, Q3, Q4, Q5)
- **Memória atualizada** `mem://features/ux-rodada-o-auditoria-10-10` → 9.9/10
- **Re-scan**: `supabase--linter` + `security--run_security_scan`

## Restrições

Português · max 400 linhas/arquivo · TanStack Query · sem `useEffect` para fetch · reusar `useActionToast`/`EmptyState`/`RequireAdmin` · split sidebar mantém imports `from '@/components/ui/sidebar'` funcionando.

## Critério de fechamento

(a) `tsc --noEmit` limpo, (b) eslint sem novos errors, (c) zero CRITICAL/HIGH no linter DB, (d) sidebar visualmente idêntica, (e) tracing E2E logando `traceId` nas 5 edge functions, (f) optimistic locking testável (2 abas → segunda recebe toast de conflito).

Aprove e executo R1–R5 em sequência sem pausas.

