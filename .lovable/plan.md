
Plano: aplicar estética "intelligence platform" Palantir-inspired (A) + adicionar módulo Intelligence Hub (B), respeitando constraints do SINGU (Nexus Blue como base, português, max 400 linhas, sem produtos/propostas).

## Parte A — Repaginação visual "Command Center"

**Tokens (em `src/index.css` + `tailwind.config.ts`)**
- Nova paleta dark-first: `--bg-deep: 222 47% 6%`, `--surface-1: 222 40% 9%`, `--surface-2: 222 35% 12%`, `--border-grid: 222 25% 18%`
- Accent cyan operacional: `--accent-intel: 188 95% 55%` (mantém Nexus Blue `#4D96FF` como primary secundário)
- Severidade: `--sev-critical`, `--sev-warn`, `--sev-info`, `--sev-ok`
- Tipografia: adicionar `JetBrains Mono` para IDs/métricas/coordenadas (heading/body permanecem)
- Grid sutil de fundo opcional (`bg-grid` utility) para áreas de "operação"

**Componentes novos em `src/components/intel/`**
- `EntityCard.tsx` — card denso com header (tipo+ID mono), metadados em chips, footer de ações
- `MetricMono.tsx` — números grandes em mono com label uppercase
- `IntelBadge.tsx` — badges quadrados de severidade
- `DataGrid.tsx` — tabela densa com header sticky, colunas mono, zebra sutil
- `SectionFrame.tsx` — wrapper com title bar + meta info (count, last update)

**Aplicação seletiva (não quebra Nexus existente)**
- Nova classe `.intel-surface` opt-in nas páginas do hub
- Dashboard atual e CRM mantêm visual atual

## Parte B — Módulo Intelligence Hub

**Rota `/intelligence`** com 4 abas, todas reaproveitando dados/RPCs já existentes:

1. **Graph** — grafo de relacionamento contatos↔empresas↔deals
   - Reusa `NetworkVisualization` existente, repaginado com tokens intel
   - Filtros: tipo de entidade, score mínimo, período
   
2. **Entity 360** — busca uma entidade (contato/empresa/deal) e mostra:
   - Painel esquerdo: metadados completos (mono, denso)
   - Centro: timeline cruzada (interações + emails + tasks + intel events)
   - Direita: relacionamentos (familiares, workspace accounts, deals)
   - Reusa `useContactDetails`, `useCompanyData`, `people_intelligence_events`

3. **Cross-Reference** — cruzamento multi-entidade
   - Seleciona 2-3 entidades → mostra interseções (interações comuns, deals compartilhados, padrões temporais)
   - Query agregada via `external-data` proxy

4. **Ask** — chat NL já existente (`ask-crm`) repaginado em layout command-center fullscreen

**Sidebar:** adicionar item "Intelligence" entre "Network" e "BI Avançado"

## Arquivos a criar (~12)
- `src/pages/Intelligence.tsx`
- `src/components/intelligence/{GraphTab,Entity360Tab,CrossRefTab,AskTab}.tsx`
- `src/components/intel/{EntityCard,MetricMono,IntelBadge,DataGrid,SectionFrame}.tsx`
- `src/hooks/useEntity360.ts`, `useCrossReference.ts`

## Arquivos a editar (~4)
- `src/index.css` — tokens intel + utilities
- `tailwind.config.ts` — fonte mono + cores intel
- `src/components/layout/AppSidebar.tsx` — link novo
- `src/App.tsx` — rota nova

## O que NÃO faço
- Não troco a paleta Nexus Blue existente (intel é additive)
- Não toco em CRM/Pipeline/ABM atuais
- Não copio marca/logo Palantir (só linguagem visual genérica de intelligence platform)
- Não crio backend novo — só consome RPCs/edge functions existentes

## Riscos
- Grafo pesado em mobile (406px) → fallback para lista em <768px
- Round 1 (RPCs) ainda aberto — Entity360 depende de `get_instant_kpis` etc. já validadas, ok prosseguir
