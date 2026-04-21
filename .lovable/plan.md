

# Plano: Favoritos e ordenação de presets salvos em /interacoes

## Contexto

O `InteracoesPresetsMenu` lista presets na ordem de criação (mais novo primeiro). Conforme o usuário acumula 5–10 presets, fica trabalhoso achar os mais usados. Vamos adicionar **favoritar** (estrela toggle) e **ordenação** (Favoritos primeiro / Mais usados / Mais recentes / Alfabética), com persistência em `localStorage` e contagem automática de uso.

## Decisão de escopo

- **Favorito** = flag booleana opcional `isFavorite?: boolean` no `SearchPreset`. Toggle via ícone `<Star>` por linha. Favoritos sempre vão para o topo (qualquer que seja a ordenação secundária).
- **Contagem de uso** = novo campo `usageCount?: number` + `lastUsedAt?: string`, incrementados quando o usuário aplica o preset (clicando na linha). Padrão idêntico ao `useSavedFilters` que já tem `usageCount`.
- **Ordenação** = `<Select>` compacto no header do popover com 4 opções:
  - `Favoritos` (default — favoritos no topo, depois `lastUsedAt` desc, fallback `createdAt` desc)
  - `Mais usados` (`usageCount` desc, fallback `createdAt` desc)
  - `Mais recentes` (`createdAt` desc — comportamento atual)
  - `Alfabética` (A→Z por `name`)
- **Persistência da ordenação** = `localStorage` chave `relateiq-search-presets-sort-{context}` (não polui URL).
- **Backward compat**: presets antigos sem `isFavorite`/`usageCount`/`lastUsedAt` continuam funcionando (tratados como `false` / `0` / `createdAt`).
- **Genérico**: a mudança fica no hook `useSearchPresets` (afeta também o `SearchPresetsMenu` de Contatos/Empresas), mas a UI de favoritar e o seletor de ordenação são adicionados aos **dois menus** (`InteracoesPresetsMenu` e `SearchPresetsMenu`) na mesma entrega — escopo coerente.
- **Export/import já existente**: `searchPresetTransport` passa a incluir `isFavorite` no bundle exportável (campo opcional, ignorado por bundles antigos).

## Implementação

### 1. Estender `useSearchPresets` (`src/hooks/useSearchPresets.ts`)

```ts
export interface SearchPreset {
  id: string;
  name: string;
  filters: Record<string, string[]>;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  searchTerm?: string;
  createdAt: string;
  isFavorite?: boolean;       // novo
  usageCount?: number;        // novo
  lastUsedAt?: string;        // novo
}

export type PresetSortMode = 'favoritos' | 'mais-usados' | 'recentes' | 'alfabetica';
```

Novos métodos:
- `toggleFavorite(id: string): void` — flip `isFavorite`.
- `markAsUsed(id: string): void` — `usageCount = (usageCount ?? 0) + 1`, `lastUsedAt = now`.
- `sortMode: PresetSortMode` + `setSortMode(mode)` — persistido em `localStorage` chave `${storageKey}-sort`.
- `sortedPresets: SearchPreset[]` — derivado via `useMemo` aplicando a ordenação ativa, com favoritos sempre no topo (exceto modo `alfabetica`, onde favoritos vão no topo do bloco A→Z; e `recentes`, idem).

Lógica de ordenação:
```ts
function comparePresets(a, b, mode) {
  // Favoritos sempre primeiro (em todos os modos exceto alfabetica pura)
  if ((a.isFavorite ?? false) !== (b.isFavorite ?? false)) {
    return a.isFavorite ? -1 : 1;
  }
  switch (mode) {
    case 'mais-usados': return (b.usageCount ?? 0) - (a.usageCount ?? 0) || dateDesc(b.createdAt, a.createdAt);
    case 'recentes':    return dateDesc(b.createdAt, a.createdAt);
    case 'alfabetica':  return a.name.localeCompare(b.name, 'pt-BR');
    case 'favoritos':
    default:            return dateDesc(b.lastUsedAt ?? b.createdAt, a.lastUsedAt ?? a.createdAt);
  }
}
```

Atualizar `importPresets` para preservar `isFavorite` se vier do bundle.

### 2. Atualizar `searchPresetTransport.ts`

- Adicionar `isFavorite?: boolean` ao `ExportablePreset`.
- `parseBundle` aceita o campo opcional (ignora se ausente).
- Round-trip mantém favorito.
- Atualizar testes para cobrir `isFavorite` no round-trip.

### 3. Refatorar `InteracoesPresetsMenu.tsx`

- **Header do popover** (acima da lista): `<Select>` compacto de ordenação (h-7) com as 4 opções, label "Ordenar:".
- **Por linha**:
  - Adicionar `<Star>` à esquerda do nome do preset (sempre visível): cheia (`fill-primary text-primary`) se `isFavorite`, vazia caso contrário. Click `stopPropagation` → `toggleFavorite(preset.id)` + toast "Favorito atualizado".
  - Click na linha (já existe) chama `onApplyPreset` — adicionar chamada a `markAsUsed(preset.id)` antes/depois.
  - Mostrar pequeno indicador "Usado Nx" abaixo do nome se `usageCount >= 3` (ajuda discoverability).
- Iterar sobre `sortedPresets` (não `presets`).

### 4. Refatorar `SearchPresetsMenu.tsx` (Contatos/Empresas)

Mesma adição: `<Star>` por linha + `<Select>` de ordenação + `markAsUsed` no apply. Mantém comportamento, props inalteradas.

### 5. Testes leves

Em `src/lib/__tests__/search-presets-filters.test.ts` (ou novo arquivo `__tests__/use-search-presets-sort.test.ts`):
- `comparePresets` em modo `favoritos`: favorito vem antes de não-favorito.
- `comparePresets` em modo `mais-usados`: ordenação por usageCount desc.
- `comparePresets` em modo `alfabetica`: respeita `pt-BR` (acentos).
- `markAsUsed` incrementa contador e seta `lastUsedAt`.
- Round-trip de bundle preserva `isFavorite`.

## Padrões obrigatórios

- PT-BR
- Tokens semânticos (`fill-primary`, `text-primary`, `text-muted-foreground`)
- Flat (sem shadow/gradient)
- Backward compat: presets antigos sem os novos campos funcionam normalmente
- `React.memo` mantido onde já existe
- Zero novas dependências
- Zero novas queries de rede

## Arquivos tocados

**Editados (5):**
- `src/hooks/useSearchPresets.ts` — campos `isFavorite/usageCount/lastUsedAt`, `toggleFavorite`, `markAsUsed`, `sortMode`, `sortedPresets`
- `src/lib/searchPresetTransport.ts` — `isFavorite` no `ExportablePreset`
- `src/components/interactions/InteracoesPresetsMenu.tsx` — estrela por linha + select de ordenação + `markAsUsed`
- `src/components/search/SearchPresetsMenu.tsx` — mesma adição (Contatos/Empresas)
- `src/lib/__tests__/search-presets-filters.test.ts` — testes de ordenação + favorito + round-trip com `isFavorite`

## Critério de fechamento

(a) Cada preset tem ícone estrela clicável que persiste em `localStorage`; (b) header do popover tem `<Select>` com Favoritos/Mais usados/Mais recentes/Alfabética, default Favoritos; (c) clicar em preset incrementa `usageCount` e atualiza `lastUsedAt`; (d) favoritos sempre aparecem no topo (exceto se o usuário escolher modo puramente alfabético sem favoritos marcados); (e) ordenação selecionada persiste entre sessões; (f) bundles exportados/importados preservam `isFavorite`; (g) zero regressão em salvar/aplicar/remover/importar/exportar; (h) PT-BR, tokens semânticos, flat, sem novas deps.

