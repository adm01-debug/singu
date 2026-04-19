---
name: Intelligence Hub
description: Hub Palantir-inspired em /intelligence com 4 abas (Graph, Entity 360, Cross-Reference, Ask), tokens .intel-*, command palette Ctrl+P, telemetria local, comparação metadata, typewriter e empty states ricos.
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

## Componentes (`src/components/intel/`)
- `EntityCard`, `MetricMono`, `IntelBadge`, `DataGrid`, `SectionFrame`
- `IntelSkeleton` — shimmer cyan com label "LOADING…"
- `IntelErrorState` — bloco de erro com botão "Retentar"
- `IntelEmptyState` — empty state padrão com ícone + título mono + descrição + CTA opcional
- `IntelStatusBar` — barra fixa rodapé (online, fetching, last refresh) + `IntelTelemetryPanel` quando `?debug=1`
- `IntelTelemetryPanel` — painel oculto com lista de eventos (tab_view, query, export, command, error) + estatísticas
- `IntelCommandPalette` — overlay `cmdk` com `Ctrl/⌘+P` para saltar entre tabs, abrir entidade por UUID-like (`/contatos/:id`, `/empresas/:id`) e disparar comandos do Ask (`/clear`, `/export`, `/help`)
- `GraphLegend` — overlay flutuante no NetworkVisualization com cores por tipo + contagem
- `TemporalHeatmap` — heatmap GitHub-like 7×N com legenda
- `TypewriterText` — efeito typewriter via `requestAnimationFrame`, respeita `prefers-reduced-motion`

## Hooks (`src/hooks/`)
- `useEntity360(type, id)` — agrega metadata + timeline (interactions + people_intelligence_events) + related (relatives, company, deals, contacts)
- `useCrossReference({ entityIds, entityType })` — interseções de interactions/deals + bucketização temporal por dia
- `useIntelTelemetry()` / `useIntelTabView(tab, log)` — telemetria local em `sessionStorage` (chave `intel-telemetry-v1`, máx 100 eventos), espelhada em `console.debug`

## Tabs (`src/components/intelligence/`)
- **GraphTab**: filtros (período 7/30/90D, tipo, score min via Slider) persistidos em URL; NetworkVisualization apenas ≥768px com `GraphLegend` sobreposta
- **Entity360Tab**: busca → drill-in com breadcrumb + Voltar; clique em related navega entre entidades; **botões "copiar ID" e "abrir no CRM"** no header de METADATA; empty states ricos
- **CrossRefTab**: 2-3 entidades; **tabela METADATA_COMPARISON lado a lado** (created_at, updated_at, score, industry, role, email, phone) com diferenças destacadas em cyan; heatmap temporal + insight de pico + export CSV
- **AskTab**: ⌘K para focar input, histórico em `localStorage` (10), comandos `/clear`, `/export`, `/help`; **typewriter na última resposta SYSTEM**, **badge "X REG"** ao lado do timestamp; expõe bridge para a Command Palette via prop `onRegisterBridge`

## Persistência URL
- `Intelligence.tsx` usa `?tab=graph|entity|crossref|ask` via `useSearchParams` (deep-link + refresh sem perder contexto)
- `?debug=1` ativa o `IntelTelemetryPanel` na status bar
- GraphTab: `?period`, `?etype`, `?minScore`

## Acessibilidade
- Skip link, `aria-pressed`, `aria-label` em botões icon-only
- `role="status"` + `aria-live="polite"` em IntelStatusBar e console Ask
- Animação de tabs via framer-motion (`AnimatePresence`)
- TypewriterText respeita `prefers-reduced-motion`

## Exportação
- `src/lib/intelExport.ts` — `downloadCsv<T>(rows, filename)` com escape RFC 4180 + BOM UTF-8

## Constraints
- Português obrigatório; sem novos backends; TanStack Query exclusivo
- Sem mexer em CRM/Pipeline/ABM; reusa `NetworkVisualization`, `useInstantKpis`, `useAskCrm`, `external-data` proxy
