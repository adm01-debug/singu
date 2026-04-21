

# Plano: Modo de exibição agrupado em `/interacoes`

## Contexto

Hoje `/interacoes` mostra uma timeline plana paginada. Quero adicionar um **modo agrupado** que junta interações por **pessoa** ou por **empresa**, mantendo busca/sort/filtros funcionando dentro de cada grupo. Já existe `TimelineGroupCard` no diretório (usado pelo `UnifiedTimelineView`) — vou reaproveitar o componente visual mas alimentá-lo com a lista filtrada local (não com o hook `useTimelineByEntity`, que vai a outro endpoint).

## Decisão de escopo

- **Toggle de modo na barra**: 3 chips visuais — `Lista` (atual), `Por pessoa`, `Por empresa`. Persistido em URL como `?view=list|by-contact|by-company` (default `list`, omitido).
- Reset de `page` ao trocar de modo (já garantido pelo `setFilter` que zera page quando key ≠ 'page').
- **Pipeline de dados intacto**: `sortedForView` continua sendo a fonte. No modo agrupado, agrupo o array já filtrado/ordenado por `contact_id` ou `company_id`, preservando a ordem dos itens dentro de cada grupo (sort interno mantido).
- **Ordenação dos grupos**: usa o mesmo `adv.sort`:
  - `recent` → grupos ordenados pela interação mais recente (desc).
  - `oldest` → mais antiga primeiro.
  - `entity` → alfabético por nome do grupo.
  - `relevance` → soma dos scores de relevância dos itens (desc).
- **Paginação** funciona no nível dos **grupos** (não dos itens). `total = groups.length`. `PaginationBar` continua igual; só muda o que conta. Itens dentro do grupo são todos exibidos (accordion já lida com volume).
- **"Sem identificação"**: itens sem `contact_id` (modo pessoa) ou sem `company_id` (modo empresa) caem num grupo final chamado "Sem identificação" exibido por último.
- **Empresa por interação**: hoje a interação tem `company_id` direto OU é inferida pelo contato. Vou usar `interaction.company_id` quando existir; caso vazio, derivar via `contactMap.get(contact_id)?.company_id` se disponível, senão "Sem identificação". *(Se o contato não trouxer `company_id`, fica em "Sem identificação".)*
- **Counts no chip do grupo**: número total de interações no grupo (já vem do `events.length` do `TimelineGroupCard`).
- **Reaproveitar componente**: `TimelineGroupCard` aceita `TimelineGroup` com `{ entity_id, entity_type, entity_name, events, last_event_at }`. Vou montar essa estrutura localmente. Os `events` precisam dos campos `id, type, title, content, created_at` — todos já presentes em `Interaction`.
- **Edição/exclusão**: o `TimelineGroupCard` não tem ações inline (Editar/Excluir). Para não bloquear o fluxo, **modo agrupado é read-only de visualização**. Toast contextual ao primeiro uso explica isso. Para editar, usuário troca para modo Lista. (Decisão simples; alternativa seria enriquecer o card com dropdown — fora do escopo desta única melhoria.)
- **Empty state**: se nenhum grupo, mostra o mesmo `SearchEmptyState` / `EmptyState` já existente.
- **Persistência leve**: `view=by-contact` sobrevive a refresh por estar na URL. Não persisto em localStorage (o usuário já tem precedente: URL ganha).

## Implementação

### 1. `src/hooks/useInteractionsAdvancedFilter.ts`

- Adicionar `view: 'list' | 'by-contact' | 'by-company'` ao `AdvancedFilters`.
- `KEYS` ganha `'view'`.
- Parser `parseView` com whitelist; default `'list'`.
- Em `setFilter`/`applyAll`: serializa só quando `≠ 'list'`.
- `setFilter('view', ...)` zera `page` (já automático pela regra geral).

### 2. Novo componente: `src/components/interactions/ViewModeChips.tsx`

Mesmo padrão visual de `SortChips` (chips agrupados, ícones, `aria-pressed`):
- `List` → Lista
- `User` → Por pessoa
- `Building2` → Por empresa

Props: `value`, `onChange`. Sem atalhos de teclado nesta primeira versão (evita poluir cheatsheet).

### 3. `src/components/interactions/AdvancedSearchBar.tsx`

- Renderizar `<ViewModeChips value={filters.view} onChange={(v) => setFilter('view', v)} />` ao lado dos `SortChips`.

### 4. Novo arquivo: `src/lib/groupInteractions.ts`

Helper puro:
```ts
type Mode = 'by-contact' | 'by-company';

export interface LocalTimelineGroup {
  entity_id: string;
  entity_type: 'contact' | 'company';
  entity_name: string;
  events: Array<{ id: string; type: string; title: string; content: string | null; created_at: string }>;
  last_event_at: string;
  first_event_at: string;
}

export function groupInteractions(
  items: Array<EnrichedInteraction>,
  mode: Mode,
  sort: SortKey,
  query: string,
): LocalTimelineGroup[]
```

- Itera mantendo a ordem original (já sorted) → garante que os events dentro do grupo respeitam o sort.
- Calcula `last_event_at` (max created_at) e `first_event_at` (min) por grupo.
- Ordena grupos conforme `sort` descrito acima.
- "Sem identificação" sempre por último.

### 5. `src/pages/interacoes/InteracoesContent.tsx`

- Após `sortedForView`, derivar:
  ```ts
  const isGrouped = adv.view !== 'list';
  const groups = useMemo(
    () => isGrouped ? groupInteractions(sortedForView, adv.view === 'by-contact' ? 'by-contact' : 'by-company', adv.sort, debouncedQ) : [],
    [sortedForView, isGrouped, adv.view, adv.sort, debouncedQ]
  );
  const total = isGrouped ? groups.length : sortedForView.length;
  ```
- `visibleInteractions` ou `visibleGroups` conforme o modo (slice idêntico).
- Renderização condicional: se `isGrouped`, mapeia `<TimelineGroupCard group={g} defaultOpen={i < 3} />`; senão, render atual.
- `ActiveFiltersBar.visibleCount` mostra **interações visíveis** somando `events.length` dos grupos da página atual (continua a UX atual de "X de Y").

### 6. Testes

**Novo**: `src/lib/__tests__/groupInteractions.test.ts`
1. Agrupa por contact_id corretamente.
2. Itens sem chave caem em "Sem identificação" e ficam por último.
3. Sort `recent` ordena grupos pela última interação desc.
4. Sort `entity` ordena grupos por nome alfabético.
5. Mantém a ordem dos eventos dentro do grupo (não reordena).

**Editar**: `src/hooks/__tests__/useInteractionsAdvancedFilter.test.ts`
1. `view` default = `'list'`.
2. `setFilter('view', 'by-contact')` grava na URL e zera `page`.
3. `'list'` não polui a URL.

**Novo**: `src/components/interactions/__tests__/ViewModeChips.test.tsx`
1. Renderiza 3 chips.
2. Chip ativo tem `aria-pressed="true"`.
3. Click chama `onChange` com a key correta.
4. Click no ativo é no-op.

## Padrões obrigatórios

- PT-BR, tokens semânticos HSL, flat (sem shadows), zero novas deps.
- Backward compat: ausência de `?view=` mantém comportamento atual.
- Reuso de `TimelineGroupCard` existente — sem duplicar UI de timeline.
- Pipeline de filtros/sort/busca **não muda** — apenas a apresentação final.

## Arquivos tocados

**Criados (4):**
- `src/components/interactions/ViewModeChips.tsx`
- `src/components/interactions/__tests__/ViewModeChips.test.tsx`
- `src/lib/groupInteractions.ts`
- `src/lib/__tests__/groupInteractions.test.ts`

**Editados (3):**
- `src/hooks/useInteractionsAdvancedFilter.ts` — adiciona `view` ao state/URL.
- `src/components/interactions/AdvancedSearchBar.tsx` — renderiza `ViewModeChips`.
- `src/pages/interacoes/InteracoesContent.tsx` — branching list vs grouped, paginação por grupos.
- `src/hooks/__tests__/useInteractionsAdvancedFilter.test.ts` — testes do `view`.

## Critério de fechamento

(a) Toggle "Lista / Por pessoa / Por empresa" aparece na barra; (b) URL persiste `?view=by-contact|by-company`; (c) busca textual e filtros (canais, datas, direção, contato, empresa) continuam aplicados antes do agrupamento; (d) ordenação dos grupos respeita `adv.sort`; (e) eventos dentro do grupo mantêm ordem do sort; (f) itens sem chave caem em "Sem identificação" no fim; (g) paginação opera em grupos no modo agrupado e em itens no modo lista; (h) trocar de modo zera `page`; (i) `TimelineGroupCard` é reusado sem fork visual; (j) testes cobrem hook, helper e componente; (k) PT-BR, flat, zero novas deps.

