---
name: Intelligence Hub
description: Hub Palantir-inspired em /intelligence com 4 abas, hotkeys G/E/C/A, bookmarks, histórico back/forward, snapshot PNG, share link, common events timeline, saved views, latência p95 na status bar e densidade configurável.
type: feature
---

# Intelligence Hub (`/intelligence`)

Módulo "command center" inspirado em Palantir, **additive** sobre Nexus Blue.

## Tokens (`src/index.css`)
- Wrapper `.intel-surface` (opt-in) + `.intel-grid-bg`
- Variáveis: `--intel-bg/surface-1/2`, `--intel-border`, `--intel-accent` (cyan 188 95% 55%)
- Severidade: `--sev-critical/warn/info/ok`
- Helpers: `.intel-mono`, `.intel-card`, `.intel-card-hover`, `.intel-corner-frame`, `.intel-skip-link`
- `@keyframes intel-shimmer`; foco visível cyan em `:focus-visible`
- **Densidade**: classe global `html.intel-density-compact` reduz padding, gap, espaçamento e tamanho de texto dentro de `.intel-surface`

## Componentes (`src/components/intel/`)
- `EntityCard`, `MetricMono`, `IntelBadge`, `DataGrid`, `SectionFrame`
- `IntelSkeleton`, `IntelErrorState`, `IntelEmptyState`
- `IntelStatusBar` — barra fixa rodapé (online, fetching, last refresh, **latência avg + p95**) + `IntelTelemetryPanel` quando `?debug=1`
- `IntelTelemetryPanel` — painel oculto com lista de eventos
- `IntelLatencyBadge` — média e p95 das últimas 20 queries (verde <500ms, amarelo <2s, vermelho ≥2s)
- `IntelCommandPalette` — overlay `cmdk` com `Ctrl/⌘+P`
- `IntelDensityToggle` — toggle COMPACT/COMFORTABLE no header
- `PinnedEntitiesPanel` — sidebar com bookmarks (★) de entidades, abertura com 1 clique
- `SavedViewsPanel` — lista de queries salvas no Ask, reexecuta com 1 clique
- `CommonEventsTimeline` — interseção REAL de interações que envolvem todas as entidades selecionadas
- `GraphLegend`, `TemporalHeatmap`, `TypewriterText`

## Hooks (`src/hooks/`)
- `useEntity360(type, id)` — agrega metadata + timeline + related
- `useCrossReference({ entityIds, entityType })` — interseções + bucketização temporal + `interactionsWithMatches` para timeline comum
- `useIntelTelemetry()` / `useIntelTabView(tab, log)` — telemetria local em `sessionStorage`
- `useIntelHotkeys(setTab)` — atalhos globais G/E/C/A (fora de inputs)
- `useEntityBookmarks()` — bookmarks de entidades em `localStorage` (máx 10), sincronizados via evento `storage`
- `useEntityHistory()` — pilha back/forward de entidades visitadas, atalhos `Alt+←` / `Alt+→`
- `useSavedAskViews()` — pares (nome, query) salvos em `localStorage` (máx 20)
- `useIntelDensity()` — toggle compact/comfortable persistido + classe global `intel-density-compact`

## Lib (`src/lib/`)
- `intelExport.ts` — `downloadCsv<T>(rows, filename)` com escape RFC 4180 + BOM UTF-8
- `graphSnapshot.ts` — `snapshotGraphCanvas(container, filename)` captura PNG do canvas do react-force-graph-2d via `canvas.toDataURL`

## Tabs (`src/components/intelligence/`)
- **GraphTab**: filtros URL; `GraphLegend` sobreposta; **botões "PNG" (snapshot canvas) e "SHARE" (copia URL com filtros)** no header
- **Entity360Tab**: `forwardRef<Entity360Handle>` expõe `open()` para a página; **botão ★ PIN** no header de METADATA; **histórico back/forward com `Alt+←/→`** + indicador `[cursor/total]`; clique em related navega
- **CrossRefTab**: 2-3 entidades; metadata comparison; heatmap; **`CommonEventsTimeline` lista interações que envolvem TODAS as entidades selecionadas** (matchedIds ≥ totalEntities); export CSV
- **AskTab**: ⌘K, histórico, comandos, typewriter, badge "X REG"; **botão SAVE em mensagens do operador → prompt de nome → salva em SAVED_VIEWS**; bridge expõe `run(q)` para reexecutar pelos saved views

## Página (`src/pages/Intelligence.tsx`)
- Layout 2 colunas (lg+): main (tabs) + aside (`PinnedEntitiesPanel`)
- Header: `IntelDensityToggle` + indicador CTRL+P + sessionId
- Tabs com label do hotkey `[G]`, `[E]`, `[C]`, `[A]` e `title` para tooltip
- `openBookmark` salta para `entity` e chama `entityRef.current?.open()` em `requestAnimationFrame`

## Persistência URL/Storage
- `?tab=graph|entity|crossref|ask`, `?debug=1`, `?period`, `?etype`, `?minScore`
- `localStorage`: `intel-bookmarks-v1`, `intel-saved-views-v1`, `intel-density-v1`, `intel-ask-history`
- `sessionStorage`: `intel-telemetry-v1`

## Acessibilidade
- Skip link, `aria-pressed`, `aria-label` em botões icon-only
- `role="status"` + `aria-live="polite"` em IntelStatusBar e console Ask
- Hotkeys ignorados dentro de inputs/textarea/contentEditable
- Animação de tabs via framer-motion

## Constraints
- Português obrigatório; sem novos backends; TanStack Query exclusivo
- Sem mexer em CRM/Pipeline/ABM; reusa `NetworkVisualization`, `useInstantKpis`, `useAskCrm`, `external-data` proxy
- Max 400 linhas/arquivo, sem `any`
