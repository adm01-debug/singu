---
name: Intelligence Hub
description: Hub Palantir-inspired em /intelligence com 4 abas, hotkeys G/E/C/A + ?, bookmarks, histórico back/forward, snapshot PNG/sessão, share link, diff de entidades, common events timeline, saved views, sugestões contextuais, latência p95, data source badge, densidade configurável e modo presentation.
type: feature
---

# Intelligence Hub (`/intelligence`)

Módulo "command center" inspirado em Palantir, **additive** sobre Nexus Blue.

## Tokens (`src/index.css`)
- Wrapper `.intel-surface` (opt-in) + `.intel-grid-bg`; variáveis `--intel-bg/surface-1/2`, `--intel-border`, `--intel-accent` (cyan 188 95% 55%); severidade `--sev-critical/warn/info/ok`
- Helpers: `.intel-mono`, `.intel-card`, `.intel-card-hover`, `.intel-corner-frame`, `.intel-skip-link`
- **Densidade**: `html.intel-density-compact .intel-surface` reduz padding/gap/texto
- **Apresentação**: `html.intel-presentation .intel-surface` aumenta tipografia 115% e oculta `[data-intel-hide-pres="true"]`

## Componentes (`src/components/intel/`)
- Base: `EntityCard`, `MetricMono`, `IntelBadge`, `DataGrid`, `SectionFrame`, `IntelSkeleton`, `IntelErrorState`, `IntelEmptyState`, `GraphLegend`, `TemporalHeatmap`, `TypewriterText`
- Status/telemetria: `IntelStatusBar` (hide em pres), `IntelTelemetryPanel` (`?debug=1`), `IntelLatencyBadge` (avg+p95 últimas 20 queries), `IntelDataSourceBadge` (LIVE/CACHE/STALE)
- Comando/UX: `IntelCommandPalette` (⌘P), `IntelDensityToggle`, `IntelPresentationToggle`, `KeyboardMapOverlay` (`?`)
- Painéis aside: `PinnedEntitiesPanel` (Shift+click → Graph focus), `SavedViewsPanel`, `RecentSnapshotsPanel`
- Análise: `CommonEventsTimeline` (interseção real), `MetadataDiffPanel` (added/removed/changed/equal)

## Hooks (`src/hooks/`)
- Dados: `useEntity360`, `useCrossReference` (com `interactionsWithMatches`)
- Telemetria: `useIntelTelemetry`, `useIntelTabView`
- Atalhos/navegação: `useIntelHotkeys` (G/E/C/A), `useEntityHistory` (Alt+←/→), `useEntityBookmarks` (★ máx 10)
- Persistência: `useSavedAskViews` (máx 20), `useIntelDensity` (compact/comfort), `useIntelPresentation` (PRES), `useIntelSnapshots` (máx 5)
- Contexto IA: `useContextualSuggestions(entity)` para sugestões dinâmicas no AskTab

## Lib (`src/lib/`)
- `intelExport.ts` — `downloadCsv` RFC 4180 + BOM
- `graphSnapshot.ts` — captura PNG do canvas force-graph
- `intelSnapshot.ts` — `encodeSnapshot/decodeSnapshot` base64+JSON, `pushRecentSnapshot`, `buildShareUrl(?snap=)`
- `entityDiff.ts` — `computeMetadataDiff` ordenado por status

## Tabs (`src/components/intelligence/`)
- **GraphTab**: filtros URL + `?focusId/focusType` (vindo do PinnedEntitiesPanel Shift+click); botões PNG e SHARE
- **Entity360Tab**: ref expõe `open()` e `getCurrent()`; ★ PIN; histórico Alt+←/→; **botão DIFF** compara metadata atual com a anterior do stack via `MetadataDiffPanel`
- **CrossRefTab**: 2-3 entidades; metadata comparison; heatmap; `CommonEventsTimeline`; export CSV simples + **EXPORT_BUNDLE** (comparison.csv + common-events.csv com header `_entities`)
- **AskTab**: ⌘K, histórico, comandos, typewriter, SAVE/SAVED_VIEWS; **SUGGESTED_QUERIES dinâmicas** via `useContextualSuggestions(contextEntity)` — fallback genérico

## Página (`src/pages/Intelligence.tsx`)
- Header: SNAPSHOT (camera) + PRES + DENSITY + ⌘P + sessionId (last 3 com `data-intel-hide-pres`)
- Layout 2 colunas: main (tabs) + aside (`PinnedEntitiesPanel` + `RecentSnapshotsPanel`)
- `KeyboardMapOverlay` global (tecla `?`)
- `?snap=<base64>` na URL aplica snapshot completo (tab + filtros + entidade)
- `contextEntity` propagado para `AskTab` ao trocar tabs ou aplicar snapshot

## Persistência
- URL: `?tab`, `?debug=1`, `?period`, `?etype`, `?minScore`, `?focusId`, `?focusType`, `?snap`
- `localStorage`: `intel-bookmarks-v1`, `intel-saved-views-v1`, `intel-density-v1`, `intel-pres-v1`, `intel-snapshots-v1`, `intel-ask-history`
- `sessionStorage`: `intel-telemetry-v1`

## Acessibilidade
- Skip link, `aria-pressed`, `aria-label` em ícones, `role="status"`/`aria-live="polite"` em status bar e console Ask
- Hotkeys ignorados em inputs/textarea/contentEditable
- KeyboardMapOverlay como `role="dialog" aria-modal="true"`, fechável com Esc/click outside

## Constraints
- Português obrigatório; sem novos backends; TanStack Query exclusivo (sem `useEffect` para fetch)
- Sem mexer em CRM/Pipeline/ABM; reusa `NetworkVisualization`, `useInstantKpis`, `useAskCrm`, `external-data` proxy
- Max 400 linhas/arquivo, sem `any`, sem `dangerouslySetInnerHTML`
