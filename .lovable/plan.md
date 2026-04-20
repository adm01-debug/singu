

# Rodada Q — Polimento Final Rumo ao 10.0/10

A Rodada P entregou **9.6/10**. Para fechar os **0.4 pontos** restantes, executarei 6 ações cirúrgicas focadas nos gaps técnicos remanescentes da auditoria.

## Ações

**Q1. Eliminar `: any` em massa** — varredura `src/**/*.{ts,tsx}` por `: any`, `as any`, `any[]`. Substituir por tipos concretos do `Database` ou `unknown` + narrowing. Meta: ≤10 ocorrências justificadas com `// eslint-disable-next-line` + comentário.

**Q2. ESLint `no-explicit-any: error`** — após Q1, promover regra no `eslint.config.js` de off para `error`, garantindo regressão zero futura.

**Q3. Split `sidebar.tsx` (746→<400)** — quebrar em:
- `sidebar-menu.tsx` (SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarMenuAction, SidebarMenuBadge, SidebarMenuSub*)
- `sidebar-group.tsx` (SidebarGroup, SidebarGroupLabel, SidebarGroupAction, SidebarGroupContent)
- `sidebar-layout.tsx` (Sidebar, SidebarHeader, SidebarFooter, SidebarContent, SidebarInset, SidebarInput, SidebarRail, SidebarSeparator, SidebarTrigger)
- `sidebar.tsx` re-exporta tudo (mantém compat)

**Q4. Optimistic locking nos hooks** — atualizar `useUpdateContact` e `useUpdateCompany` para:
- Aceitar `version` no input
- Adicionar `.eq('version', currentVersion)` no update
- Detectar 0 rows affected → lançar erro "CONCURRENT_EDIT"
- `useActionToast.error("Conflito de edição: recarregue e tente novamente")`

**Q5. Tracing em edge functions críticas** — aplicar `tracedLogger` em:
- `external-data/index.ts` (substituir todos `console.*`)
- `ask-crm/index.ts`
- `incoming-webhook/index.ts`
- `ai-suggest-mapping/index.ts`
- `connection-anomaly-detector/index.ts`

**Q6. Migrar chamadas críticas para `invokeWithTrace`** — substituir `supabase.functions.invoke('ask-crm'|'external-data'|'ai-suggest-mapping', ...)` pelo wrapper `invokeWithTrace` em hooks/componentes principais.

## Entregáveis

- **CHANGELOG v2.7.2** — Rodada Q (gaps fechados)
- **Memória atualizada** `mem://features/ux-rodada-o-auditoria-10-10` → status "10.0/10"
- **Re-scan**: `supabase--linter` + `security--run_security_scan` para validar zero regressão

## Restrições

Português · max 400 linhas/arquivo · zero novo `any` · TanStack Query · sem `useEffect` para fetch · reusar `useActionToast`/`EmptyState`/`RequireAdmin` · split sidebar mantém API pública intacta (re-export).

## Critério final 10.0/10

(a) `tsc --noEmit` limpo, (b) `eslint --max-warnings=0` com `no-explicit-any: error`, (c) linter DB sem CRITICAL/HIGH, (d) security scan limpo, (e) zero regressão visual, (f) todos arquivos ≤400 linhas, (g) tracing E2E funcional nas 5 edge functions críticas, (h) optimistic locking ativo em 3 entidades.

Aprove e executo Q1–Q6 em sequência sem pausas até **10.0/10**.

