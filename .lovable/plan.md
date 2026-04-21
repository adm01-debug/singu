
# Plano: Busca avançada em /interacoes

## Objetivo

Adicionar uma barra de busca avançada na aba "Lista" de `/interacoes` permitindo filtrar simultaneamente por pessoa, empresa, tipo de interação, período (date range) e palavra-chave no conteúdo/descrição.

## Reutilização

A aba "Timeline" já tem `TimelineFilterBar` (search nome, canais, datas). A aba "Lista" hoje tem filtros básicos. Vamos criar um filtro mais rico só para a Lista, sem mexer na Timeline.

## Arquitetura

```text
/interacoes?tab=lista
 ├─ AdvancedSearchBar (NOVO, sticky no topo)
 │   Linha 1: [busca palavra-chave full-text] [Filtros avançados ▼] [Limpar]
 │   Linha 2 (chips compactos sempre visíveis):
 │     Pessoa ▼  Empresa ▼  Tipo (multi) ▼  De 📅  Até 📅
 │   Resumo: "X interações · 3 filtros ativos"
 └─ Lista filtrada (existente)
```

## Implementação

### 1. Hook `useInteractionsAdvancedFilter`
`src/hooks/useInteractionsAdvancedFilter.ts`
- Estado sincronizado com URL via `useSearchParams` (padrão do projeto):
  - `q` (palavra-chave), `contact`, `company`, `canais` (CSV), `de`, `ate`
- Retorna `{ filters, setFilter, clear, activeCount }`
- `useDebounce` 300ms no `q` para evitar re-render por tecla

### 2. Componente `AdvancedSearchBar`
`src/components/interactions/AdvancedSearchBar.tsx` (≤200 linhas)
- Input de busca com ícone `Search` e clear button
- Popovers compactos para Pessoa e Empresa usando `SearchableSelect` (padrão do projeto, lookup remoto)
- Chips multi-select de tipo (whatsapp, call, email, meeting, video_call, note) — mesmo padrão visual da `TimelineFilterBar`
- Date pickers com shadcn Calendar (`pointer-events-auto`)
- Badge "N filtros ativos" + botão "Limpar tudo"

### 3. Aplicação dos filtros
- Localizar onde a Lista é renderizada em `Interacoes.tsx` (componente da aba "Lista")
- Aplicar os filtros via `useMemo` sobre os dados já carregados (`useInteractionsRpc`):
  - `q`: match em `assunto`, `resumo`, `descricao` (case/accent-insensitive via normalização NFD)
  - `contact`: `contato_id === filter.contact`
  - `company`: `empresa_id === filter.company`
  - `canais`: `canais.includes(channel)` (vazio = todos)
  - `de`/`ate`: `data_interacao` dentro do range (inclusivo)
- `Array.isArray()` antes de iterar (padrão de resiliência)

### 4. Estado vazio e contadores
- Reutiliza `EmptyState` quando filtros não retornam resultados, com botão "Limpar filtros"
- Mostra contador "X de Y interações"

### 5. Padrões obrigatórios
- PT-BR
- Sem `any`, sem `dangerouslySetInnerHTML`
- Tokens semânticos (Nexus Blue), flat design
- `React.memo` na barra
- Persistência URL para deep-link e back/forward

## Arquivos tocados

**Novos (2):**
- `src/hooks/useInteractionsAdvancedFilter.ts`
- `src/components/interactions/AdvancedSearchBar.tsx`

**Editados (1):**
- `src/pages/Interacoes.tsx` — integrar a barra na aba "Lista" e aplicar filtros sobre os dados

## Critério de fechamento

(a) Barra avançada visível e sticky na aba Lista, (b) 5 filtros funcionais (pessoa, empresa, tipo, período, palavra-chave), (c) estado persistido na URL, (d) contador de resultados + filtros ativos, (e) zero regressão na aba Timeline.
