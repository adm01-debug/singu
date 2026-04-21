
# Plano: Filtro "Direção" (Recebido / Enviado) na página de Interações

## Contexto e decisão

A página `/interacoes` já tem um filtro `canais` que cobre exatamente "tipo de interação" — WhatsApp, Ligação, Email, Reunião, Vídeo, Nota, Social. Adicionar um segundo filtro de "tipo" seria redundante. O eixo que ainda não existe e agrega valor real é **direção da interação** (quem iniciou): hoje só aparece como badge "Recebido" no card, sem possibilidade de filtrar.

A `Interaction` tem o campo `initiated_by` com valores `'us' | 'them'`. Vamos transformar isso em um filtro de primeira classe.

## Implementação

### 1. `src/hooks/useInteractionsAdvancedFilter.ts`

- Adicionar `direcao: 'all' | 'inbound' | 'outbound'` ao tipo `AdvancedFilters` (default `'all'`).
- Ler/escrever `?direcao=inbound|outbound` na URL (omitir quando `'all'`, igual aos outros defaults).
- Incluir `'direcao'` em `KEYS` (limpar) e contar em `activeCount` quando ≠ `'all'`.

### 2. `src/pages/interacoes/InteracoesContent.tsx`

- No `advancedFiltered`, adicionar regra:
  ```ts
  if (adv.direcao === 'inbound' && i.initiated_by !== 'them') return false;
  if (adv.direcao === 'outbound' && i.initiated_by !== 'us') return false;
  ```
- Incluir `adv.direcao` nas deps de `useInfiniteList` para resetar paginação ao trocar.

### 3. Novo componente: `src/components/interactions/DirecaoQuickFilter.tsx` (~50 linhas)

- Toggle com 3 opções: **Todas** · **Recebidas** (ícone `ArrowDownLeft`) · **Enviadas** (ícone `ArrowUpRight`).
- Padrão visual idêntico ao seletor de período da Ficha 360 (`inline-flex` com `border` e `bg-card`, botões `h-8` ativos com `bg-primary text-primary-foreground`).
- Props: `{ value: 'all' | 'inbound' | 'outbound'; onChange: (v) => void }`.
- `React.memo`, PT-BR, tokens semânticos.

### 4. `src/components/interactions/AdvancedSearchBar.tsx`

- Importar e montar `<DirecaoQuickFilter value={filters.direcao} onChange={(v) => setFilter('direcao', v)} />` logo após `<CanaisQuickFilter />` (linha 62-65), mantendo a ordem visual lógica: busca → canais → direção → pessoa → empresa → datas.

### 5. `src/components/interactions/ActiveFiltersBar.tsx`

- Quando `filters.direcao !== 'all'`, renderizar um `Badge variant="secondary" closeable` com:
  - Ícone `ArrowDownLeft` (inbound) ou `ArrowUpRight` (outbound)
  - Label "Recebidas" ou "Enviadas"
  - `onClose={() => setFilter('direcao', 'all')}`
- Posicionar logo após o chip de busca, antes dos chips de canais.

### 6. (Opcional) `src/components/interactions/InteracoesPresetsMenu.tsx`

Sem mudanças obrigatórias — presets existentes continuam válidos. Usuário pode salvar novos presets já incluindo direção naturalmente, pois o preset persiste a URL inteira.

## Padrões obrigatórios

- PT-BR
- Tokens semânticos (sem cores fixas)
- Flat (sem shadow)
- `React.memo` no novo componente
- Zero novas queries de rede (filtro é puramente client-side sobre o array já carregado)
- Persistência na URL coerente com os outros filtros (`?direcao=inbound`, omitido quando `all`)
- Zero regressão em paginação progressiva, presets, sort, ActiveFiltersBar ou outras páginas

## Arquivos tocados

**Criado (1):**
- `src/components/interactions/DirecaoQuickFilter.tsx`

**Editados (4):**
- `src/hooks/useInteractionsAdvancedFilter.ts` — campo `direcao`, parsing/escrita URL, activeCount, KEYS
- `src/pages/interacoes/InteracoesContent.tsx` — filtro em `advancedFiltered` + dep de `useInfiniteList`
- `src/components/interactions/AdvancedSearchBar.tsx` — montar toggle ao lado de `CanaisQuickFilter`
- `src/components/interactions/ActiveFiltersBar.tsx` — chip removível para `direcao`

## Critério de fechamento

(a) Novo toggle "Todas / Recebidas / Enviadas" aparece na barra de busca avançada, (b) selecionar uma opção filtra a lista pelo `initiated_by` correspondente e atualiza a URL com `?direcao=inbound|outbound`, (c) "Todas" remove o param, (d) chip removível aparece em `ActiveFiltersBar` com ícone direcional e label PT-BR, (e) "Limpar tudo" zera direção junto com os demais, (f) `activeCount` reflete o filtro de direção, (g) paginação progressiva reseta ao trocar a direção, (h) recarregar com URL pré-preenchida restaura o estado, (i) zero novas queries de rede, (j) zero regressão em presets, sort, canais, ActiveFiltersBar ou outras páginas.
