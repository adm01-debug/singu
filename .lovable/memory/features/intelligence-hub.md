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
- Status/telemetria: `IntelStatusBar` (hide em pres), `IntelTelemetryPanel` (`?debug=1`), `IntelLatencyBadge` (avg+p95), `IntelDataSourceBadge` (LIVE/CACHE/STALE), `IntelInflightBadge` (⟳N tempo real), `IntelHealthPanel` (`?diag=1`)
- Comando/UX: `IntelCommandPalette` (⌘P), `IntelDensityToggle`, `IntelPresentationToggle`, `KeyboardMapOverlay` (`?`), `ExportFormatMenu` (csv/tsv/json/md)
- Painéis aside: `PinnedEntitiesPanel` (Shift+click → Graph focus), `SavedViewsPanel`, `RecentSnapshotsPanel`
- Análise: `CommonEventsTimeline`, `MetadataDiffPanel` (2-way), `MultiDiffPanel` (até 3 entidades), `EntityNotesPanel` (autosave 500ms)

## Hooks (`src/hooks/`)
- Dados: `useEntity360`, `useCrossReference` (com `interactionsWithMatches`)
- Telemetria: `useIntelTelemetry`, `useIntelTabView`
- Atalhos/navegação: `useIntelHotkeys` (G/E/C/A), `useEntityHistory` (Alt+←/→), `useEntityBookmarks` (★ máx 10)
- Persistência: `useSavedAskViews`, `useIntelDensity`, `useIntelPresentation`, `useIntelSnapshots`, `useGraphLayout` (período+tipo+score), `useEntityNotes` (autosave 500ms, máx 4000 chars)
- Contexto IA: `useContextualSuggestions(entity)`

## Lib (`src/lib/`)
- `intelExport.ts` — `downloadCsv` RFC 4180 + BOM (legacy)
- `intelExportUniversal.ts` — `intelExportUniversal(rows, name, fmt)` suporta `csv|tsv|json|markdown`
- `graphSnapshot.ts` — captura PNG do canvas force-graph
- `intelSnapshot.ts` — `encodeSnapshot/decodeSnapshot` base64+JSON
- `entityDiff.ts` — `computeMetadataDiff` (2-way ordenado)
- `jaccard.ts` — `jaccardIndex(groups)` para OVERLAP_INDEX no CrossRef
- `intelHealth.ts` — `inspectIntelStorage`, `resetIntelState`, `formatBytes`

## Tabs (`src/components/intelligence/`)
- **GraphTab**: filtros URL + `?focusId/focusType`; PNG, SHARE, **LAYOUT (save)**, **RESTORE**
- **Entity360Tab**: ★ PIN; Alt+←/→; **NOTE** (anotações), **DIFF** (2-way), **3DIFF** (multi até 3)
- **CrossRefTab**: 2-3 entidades; metadata comparison; heatmap; CommonEventsTimeline; **OVERLAP_IDX (Jaccard %)**; EXPORT multi-formato + BUNDLE
- **AskTab**: ⌘K, histórico, comandos, typewriter, SAVE; **hotkey R re-executa última**; SUGGESTED_QUERIES dinâmicas; EXPORT multi-formato

## Página (`src/pages/Intelligence.tsx`)
- Header: SNAPSHOT + PRES + DENSITY + ⌘P + sessionId
- Layout 2 colunas + aside (`PinnedEntitiesPanel` + `RecentSnapshotsPanel`)
- `KeyboardMapOverlay` global (`?`)
- `?snap=<base64>` aplica snapshot completo
- `?diag=1` mostra `IntelHealthPanel` (status hooks + storage + RESET_INTEL_STATE)
- `contextEntity` propagado para `AskTab`

## Persistência
- URL: `?tab`, `?debug=1`, `?diag=1`, `?period`, `?etype`, `?minScore`, `?focusId`, `?focusType`, `?snap`
- `localStorage`: `intel-bookmarks-v1`, `intel-saved-views-v1`, `intel-density-v1`, `intel-pres-v1`, `intel-snapshots-v1`, `intel-ask-history`, `intel-graph-layout-v1`, `intel-notes-v1:<entityKey>`
- `sessionStorage`: `intel-telemetry-v1`

## Acessibilidade
- Skip link, `aria-pressed`, `aria-label` em ícones, `role="status"`/`aria-live="polite"` em status bar e console Ask
- Hotkeys ignorados em inputs/textarea/contentEditable
- KeyboardMapOverlay como `role="dialog" aria-modal="true"`, fechável com Esc/click outside

## Constraints
- Português obrigatório; sem novos backends; TanStack Query exclusivo (sem `useEffect` para fetch)
- Sem mexer em CRM/Pipeline/ABM; reusa `NetworkVisualization`, `useInstantKpis`, `useAskCrm`, `external-data` proxy
- Max 400 linhas/arquivo, sem `any`, sem `dangerouslySetInnerHTML`
