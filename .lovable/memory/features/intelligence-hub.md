---
name: Intelligence Hub
description: Hub Palantir-inspired em /intelligence com 4 abas (Graph, Entity 360, Cross-Reference, Ask) sobre tokens intel-surface (dark cyan, mono fonts, grid bg)
type: feature
---
- Rota `/intelligence` (Intelligence.tsx) usa wrapper `.intel-surface` + `.intel-grid-bg` para tema dark command-center sem afetar resto do CRM.
- Tokens em `index.css`: `--intel-bg/surface-1/2`, `--intel-accent` (cyan 188), `--sev-critical/warn/info/ok`, classes `.intel-mono`, `.intel-eyebrow`, `.intel-card`, `.intel-corner-frame`.
- Componentes em `src/components/intel/`: `MetricMono`, `IntelBadge` (severidades), `EntityCard` (header type+ID mono), `DataGrid` (tabela densa zebra), `SectionFrame` (title bar com count/meta).
- 4 abas em `src/components/intelligence/`:
  - `GraphTab`: KPIs + reusa NetworkVisualization (fallback mobile <768px)
  - `Entity360Tab`: busca contact/company/deal → metadata + timeline + related (via `useEntity360`)
  - `CrossRefTab`: seleciona 2-3 entidades → shared interactions/deals/temporal overlap (via `useCrossReference`)
  - `AskTab`: reusa `useAskCrm` em layout console + suggested queries
- Sidebar: item "Intelligence" (ícone Activity) na seção Análise entre Network e Insights.
- Não cria backend novo; tudo via `queryExternalData` e RPCs/edge functions existentes.
