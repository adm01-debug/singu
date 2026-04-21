
# Plano: Chips de filtros ativos e resumo na lista de /interacoes

## Objetivo

Exibir, **logo abaixo da barra de busca** em `/interacoes`, uma faixa com **chips clicáveis dos filtros ativos** (texto, pessoa, empresa, canais, datas) e um **resumo de resultados** (`N de M interações`). Cada chip pode ser removido com 1 clique, sem abrir a busca avançada.

## Reutilização

- `useInteractionsAdvancedFilter` — `filters`, `setFilter`, `clear`, `activeCount` já expostos
- `Badge` (closeable + onClose) já existente em `src/components/ui/badge.tsx`
- Labels de canal já mapeados em `CanaisQuickFilter`
- Contagem `sortedForView.length` / `filteredAndSorted.length` já disponíveis em `InteracoesContent`

Sem novo hook, sem novo fetch.

## Arquitetura

```text
InteracoesContent
 ├─ AdvancedSearchBar (existente)
 ├─ [NOVO] ActiveFiltersBar
 │     ├─ Resumo: "Mostrando N de M" (+ "filtrado de T total" se houver filtros)
 │     └─ Chips removíveis:
 │         • Busca: "kickoff"  ✕   → setFilter('q', '')
 │         • Pessoa: "<nome>"  ✕   → setFilter('contact', '')
 │         • Empresa: "<nome>" ✕   → setFilter('company', '')
 │         • Canal: WhatsApp   ✕   → remove do array canais
 │         • De: 01/03/25      ✕   → setFilter('de', undefined)
 │         • Até: 31/03/25     ✕   → setFilter('ate', undefined)
 │         • [Limpar tudo] (só se 2+ filtros)
 └─ Lista (existente)
```

Quando `activeCount === 0`, mostra apenas o resumo simples ("M interações").

## Implementação

### 1. Novo `src/components/interactions/ActiveFiltersBar.tsx` (≤140 linhas)

- Props:
  ```ts
  {
    filters: AdvancedFilters;
    setFilter: <K extends keyof AdvancedFilters>(key: K, value: AdvancedFilters[K]) => void;
    clear: () => void;
    activeCount: number;
    totalCount: number;     // total bruto carregado
    visibleCount: number;   // após filtros e ordenação
  }
  ```
- Mapa de labels canal idêntico ao `CanaisQuickFilter` (whatsapp/call/email/meeting/video_call/note)
- Chips usam `Badge variant="secondary" closeable onClose={...}`, ícone à esquerda quando aplicável (Search, User, Building2, Calendar e ícone do canal)
- Datas formatadas via `format(d, 'dd MMM yy', { locale: ptBR })`
- Botão "Limpar tudo" (`Button variant="ghost" size="xs"`) aparece se `activeCount >= 2`
- Resumo à esquerda em `text-xs text-muted-foreground`:
  - Sem filtros: `"M interações"` (ou `"Nenhuma interação"`)
  - Com filtros: `"Mostrando N de M"` quando N < M; `"M resultados"` quando N === M
- `React.memo`
- PT-BR, sem `any`, `Array.isArray()` defensivo em `canais`, tokens semânticos, flat

### 2. Integração em `src/pages/interacoes/InteracoesContent.tsx`

- Importar `ActiveFiltersBar`
- Renderizar **logo após** `<AdvancedSearchBar />` e **antes** da lista
- Passar `totalCount={interactions.length}` (lista bruta antes do filtro) e `visibleCount={sortedForView.length}`

### 3. Edge cases

- Datas inválidas tratadas pelo `format` apenas se `instanceof Date`
- Chip de canal desconhecido mostra o próprio valor capitalizado
- Quando `q` é só espaços, não cria chip
- A11y: cada chip com `aria-label="Remover filtro <descrição>"` no botão de fechar (já provido por `Badge closeable`)

## Arquivos tocados

**Novos (1):**
- `src/components/interactions/ActiveFiltersBar.tsx`

**Editados (1):**
- `src/pages/interacoes/InteracoesContent.tsx` — montar o componente abaixo da busca

## Critério de fechamento

(a) Faixa visível em `/interacoes` abaixo da busca com resumo `N de M`, (b) cada filtro ativo (q, contact, company, cada canal, de, até) aparece como chip removível independente, (c) clique no "✕" do chip remove apenas aquele filtro e atualiza URL imediatamente, (d) botão "Limpar tudo" aparece com 2+ filtros, (e) sem filtros mostra apenas contagem total, (f) zero novas queries de rede, (g) zero regressão em ordenação, presets ou paginação.
