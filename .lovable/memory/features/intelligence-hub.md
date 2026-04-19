---
name: Intelligence Hub
description: Hub Palantir-inspired em /intelligence com 4 abas (Graph, Entity 360, Cross-Reference, Ask), tokens .intel-*, status bar, atalhos ⌘K, export CSV e heatmap temporal.
type: feature
---

# Intelligence Hub (`/intelligence`)

Módulo "command center" inspirado em Palantir, **additive** sobre Nexus Blue.

## Tokens (`src/index.css`)
- Wrapper `.intel-surface` (opt-in) + `.intel-grid-bg`
- Variáveis: `--intel-bg/surface-1/2`, `--intel-border`, `--intel-accent` (cyan 188 95% 55%)
- Severidade: `--sev-critical/warn/info/ok`
- Helpers: `.intel-mono`, `.intel-card`, `.intel-card-hover`, `.intel-corner-frame`, `.intel-skip-link`
- `@keyframes intel-shimmer` (skeletons); foco visível cyan em `:focus-visible`

## Componentes (`src/components/intel/`)
- `EntityCard`, `MetricMono`, `IntelBadge`, `DataGrid`, `SectionFrame`
- `IntelSkeleton` — shimmer cyan com label "LOADING…"
- `IntelErrorState` — bloco de erro com botão "Retentar"
- `IntelStatusBar` — barra fixa rodapé: online, queries em curso (TanStack `useIsFetching/useIsMutating`), last refresh
- `TemporalHeatmap` — heatmap GitHub-like 7×N com legenda

## Hooks (`src/hooks/`)
- `useEntity360(type, id)` — agrega metadata + timeline (interactions + people_intelligence_events) + related (relatives, company, deals, contacts).
- `useCrossReference({ entityIds, entityType })` — interseções de interactions/deals + bucketização temporal por dia.

## Tabs (`src/components/intelligence/`)
- **GraphTab**: filtros (período 7/30/90D, tipo, score min via Slider) persistidos em URL; NetworkVisualization apenas ≥768px.
- **Entity360Tab**: busca → drill-in com breadcrumb + Voltar; clique em related navega entre entidades.
- **CrossRefTab**: 2-3 entidades; heatmap temporal + insight de pico + export CSV.
- **AskTab**: ⌘K para focar input, histórico em localStorage (10), comandos `/clear`, `/export`, `/help`.

## Acessibilidade
- Skip link, `aria-pressed`, `aria-label` em botões icon-only
- `role="status"` + `aria-live="polite"` em IntelStatusBar e console Ask
- Animação de tabs via framer-motion (`AnimatePresence`)

## Exportação
- `src/lib/intelExport.ts` — `downloadCsv<T>(rows, filename)` com escape RFC 4180 + BOM UTF-8

## Constraints
- Português obrigatório; sem novos backends; TanStack Query exclusivo
- Sem mexer em CRM/Pipeline/ABM; reusa `NetworkVisualization`, `useInstantKpis`, `useAskCrm`, `external-data` proxy
