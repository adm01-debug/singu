
Status: Rodadas A+B+C+D = 20/20 entregues. Para continuar rumo à perfeição, proponho **Rodada E — Excelência Operacional & Confiabilidade**, focada em 5 melhorias atômicas que elevam o produto de "polido" para "enterprise-grade indestrutível".

# Rodada E — Excelência Operacional & Confiabilidade

**1. Adoção do `useActionToast` em mutations destrutivas reais** — o hook foi criado mas só é útil se aplicado. Wire-up em: exclusão de Contato, exclusão de Empresa, exclusão de Tarefa, completar Tarefa (undo), mover Deal para "Perdido". Cada um implementa rollback real via TanStack Query (snapshot + restore se Undo for clicado dentro de 5s).

**2. Optimistic updates expandidos** — replicar o padrão aplicado em `useMoveDeal` para 4 mutations de alto uso: completar tarefa, favoritar contato, atualizar stage de lead, marcar interação como lida. Padrão `onMutate→snapshot→setQueriesData→onError rollback→onSettled invalidate`.

**3. Error Boundaries granulares por seção** — auditar páginas críticas (Pipeline, Contatos, Empresas, Inbox, Dashboard) e envolver cada seção independente em `<DashboardErrorBoundary>` (já existe). Garante que falha em "WhyScoreDrawer" não derruba o Pipeline inteiro.

**4. Loading states com `Suspense` boundaries** — substituir `if(loading) return <Skeleton/>` por `<Suspense fallback={<Skeleton/>}>` em 3 rotas pesadas (Intelligence, ABM, Analytics). Permite streaming progressivo das seções.

**5. Performance budget enforcement** — script `scripts/check-bundle-size.mjs` que roda em build e falha se chunk principal > 350KB gzip. Documentar em `mem://standards/performance-budget`. Adicionar lazy split em rotas admin pesadas que ainda não foram split (audit-trail, knowledge-export, docs).

## Restrições mantidas
Português, max 400 linhas/arquivo, sem `any`, sem novos backends, TanStack Query exclusivo, sem `useEffect` para fetch, reusar primitivas existentes.

## Critério 10/10 por etapa
(a) compila, (b) console limpo, (c) feature verificável manualmente, (d) sem regressão. Memória final em `mem://features/ux-rodada-e-confiabilidade.md` consolidando 25/25 melhorias.

Aprove e executo as 5 em sequência sem pausas.
