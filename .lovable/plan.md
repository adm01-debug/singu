
Resta apenas a Etapa 6 da Rodada C: **Mobile responsiveness audit**. Vou executar como melhoria atômica final para fechar a Rodada C em 10/10.

# Rodada C — Etapa 6 (final): Mobile Responsiveness Audit

**Escopo focado nas 4 superfícies de maior fricção em mobile (375px–768px):**

**1. Pipeline (Kanban)** — `src/pages/Pipeline.tsx`
- Adicionar `overflow-x-auto snap-x snap-mandatory` no container das colunas
- Cada coluna com `snap-center min-w-[85vw] sm:min-w-[280px]` em mobile
- Hint visual "← deslize →" no topo em telas <640px
- Header sticky com totais condensados em mobile

**2. Inbox (`/inbox`)** — `src/pages/Inbox.tsx`
- Hoje usa `lg:grid-cols-[380px_1fr]` (ok), mas preview some em <lg
- Adicionar **drawer mobile** (Sheet) que abre ao tocar num item em <lg
- Filtros por canal já têm `overflow-x-auto` ✅
- Reduzir altura da ScrollArea para `calc(100dvh-260px)` (usar `dvh`)

**3. Header / Command Bar** — `src/components/layout/Header.tsx`
- Trigger ⌘K visível em mobile como ícone (atualmente só desktop)
- Botão "Novo X" colapsa em ícone-only em <sm
- Subtitle truncate em mobile

**4. AppSidebar** — confirmar drawer overlay funciona em mobile (já é Sheet via shadcn). Auditoria visual + ajuste de z-index se necessário.

**Bônus rápidos:**
- `KeyboardListHint` já está `hidden md:flex` ✅
- `BulkActionsBar` revisar posicionamento `bottom-4` em mobile (não cobrir nav inferior)
- `DailyBriefingCard` em Index.tsx: stack vertical das métricas em <sm
- `SavedViewsBar`: scroll horizontal das chips em mobile

## Restrições mantidas
Português, max 400 linhas/arquivo, sem `any`, TanStack Query exclusivo, sem `useEffect` para fetch, reusar primitivas (Sheet/ScrollArea já existentes).

## Critério 10/10
(a) compila, (b) console limpo, (c) testado mentalmente em 375px e 768px, (d) sem regressão desktop. Memória atualizada em `mem://features/ux-rodada-c-transformacao.md` marcando Rodada C **completa**.

Aprove e executo a etapa 6 fechando a Rodada C em 10/10.
