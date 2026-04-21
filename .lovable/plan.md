

# Plano: Seletor de densidade (Compacta/Confortável) na lista de interações

## Contexto

Em `/interacoes`, a lista (modo `view=list`) renderiza cada interação em um `Card` com `CardContent p-4`, marcador grande de 40px, badges, conteúdo, tags e bloco de contato com avatar e borda divisória. Para usuários com volume alto, esse layout fica verboso. Já existe densidade global (`useGlobalDensity`) e densidade do Intelligence Hub (`useIntelDensity`), mas a lista de interações não responde a nenhuma delas — o ajuste precisa ser local, persistido por usuário e refletido na URL como os demais controles do módulo (padrão URL-driven já estabelecido em `useInteractionsAdvancedFilter`).

## Decisão de escopo

Adicionar um **toggle local** "Compacta / Confortável" para a lista de interações, com:

1. Persistência via **URL** (`?density=compact|comfortable`) seguindo o padrão dos outros filtros do módulo. Default `comfortable` (não escreve na URL).
2. Visível **apenas no modo `view=list`** (modos agrupados `by-contact`/`by-company` usam `TimelineGroupCard` e ficam fora deste escopo).
3. Ajustes visuais aplicados ao item da lista quando `density=compact`:
   - Card padding `p-4` → `p-2.5`.
   - Marcador 40px → 28px, ícone 16px → 12px, posição `left-2 top-4` → `left-3 top-3`, linha vertical `left-[27px]` → `left-[19px]`.
   - Padding-left do item `pl-16` → `pl-12`.
   - Espaçamento entre itens `space-y-4` → `space-y-2`.
   - Conteúdo: `mb-3/mb-4/mb-3` → `mb-1.5`, `line-clamp-2` → `line-clamp-1`.
   - Bloco do contato: oculta avatar (mantém apenas nome em texto pequeno inline com `pt-2 border-t`), some o cargo.
   - Tags: limita a 3 visíveis + "+N".
   - Badge de tipo: oculta (ícone do marcador já comunica); mantém Sentiment, Follow-up, Recebido.
   - Data: mantém apenas a linha relativa ("há 2h"); oculta data absoluta.
   - Animação: reduz delay `Math.min(index*0.03, 0.3)` → `Math.min(index*0.015, 0.15)` para aliviar percepção em listas densas.

Confortável = layout atual, sem mudanças.

## Implementação

### 1. `src/hooks/useInteractionsAdvancedFilter.ts`
- Adicionar tipo `DensityMode = 'comfortable' | 'compact'`.
- Estender `AdvancedFilters` com `density: DensityMode`.
- Adicionar `'density'` em `KEYS`.
- `parseDensity(v)` retorna `'compact'` se `v === 'compact'`, senão `'comfortable'`.
- Em `setFilter`: caso `'density'`, escreve `compact` ou remove o param.
- Em `applyAll`: persistir `density` se `=== 'compact'`.
- **Não conta** em `activeCount` (é preferência de visualização, não filtro de dados — mesmo padrão de `view`, `sort`, `page`, `perPage`).

### 2. `src/components/interactions/DensityChips.tsx` (novo, pequeno)
- Componente análogo ao `ViewModeChips`: dois botões com ícones `Rows3` (confortável) e `Rows2` (compacta), `aria-pressed`, tooltip PT-BR, `role="group" aria-label="Densidade da lista"`.
- Props: `value: DensityMode`, `onChange: (d: DensityMode) => void`.
- ≤80 linhas, flat, zero novas deps (lucide já tem ícones).

### 3. `src/pages/interacoes/InteracoesContent.tsx`
- Renderizar `<DensityChips>` ao lado direito do `ActiveFiltersBar` ou junto ao `PaginationBar` superior, **só quando `adv.view === 'list'`**. Posição escolhida: numa nova linha discreta abaixo do `ActiveFiltersBar`, alinhada à direita, com `text-xs text-muted-foreground` e gap consistente.
- Derivar `isCompact = adv.density === 'compact'`.
- Aplicar classes condicionais nas linhas existentes (sem extrair componente novo, mantendo o arquivo ≤400 linhas):
  - `space-y-4` ↔ `space-y-2`
  - `left-[27px]` ↔ `left-[19px]`
  - `pl-16` ↔ `pl-12`
  - Marcador, padding do `CardContent`, badge de tipo, avatar do contato, tags+N, etc.
- Animação: `delay = Math.min(index * (isCompact ? 0.015 : 0.03), isCompact ? 0.15 : 0.3)`.

### 4. Persistência cross-session
- A URL já garante shareability. Para que o usuário não perca a preferência ao voltar sem URL, adicionar uma persistência leve em `localStorage` chave `singu-interactions-density-v1`:
  - Hidratação one-shot no mount do hook (mesmo padrão usado para `canais`): se URL não tem `density` e localStorage tem `compact`, faz `setSearchParams({ density: 'compact' }, { replace: true })`.
  - `useEffect` reativo grava `filters.density` no localStorage.

## Testes

**Editar/criar** `src/components/interactions/__tests__/DensityChips.test.tsx`:
1. Renderiza dois botões com `aria-pressed` correto conforme `value`.
2. Click no botão inativo dispara `onChange` com o valor oposto.
3. Click no botão já ativo NÃO dispara `onChange` (consistente com `ViewModeChips`).

**Editar/criar** `src/hooks/__tests__/useInteractionsAdvancedFilter.density.test.ts` (mínimo):
1. Default: sem `?density`, `filters.density === 'comfortable'`.
2. `?density=compact` → `filters.density === 'compact'`.
3. `?density=foo` → fallback `'comfortable'`.
4. `setFilter('density', 'compact')` adiciona `density=compact` na URL.
5. `setFilter('density', 'comfortable')` remove o param da URL.
6. Mudar `density` reseta `page` para 1 (já garantido por `if (key !== 'page') next.delete('page')`).

## Padrões obrigatórios

- PT-BR, flat, zero novas deps.
- Backward-compat total: URL sem `density` segue funcionando como hoje (confortável).
- Acessibilidade: `aria-pressed`, `aria-label`, foco visível (herda do `Button` shadcn).
- Não conta em `activeCount` (preferência, não filtro de dados).
- ≤400 linhas por arquivo (`InteracoesContent.tsx` está em ~321; cabem os ajustes condicionais; se passar de 400, extrai o item da timeline para `InteractionListItem.tsx`).

## Arquivos tocados

**Novos (1):**
- `src/components/interactions/DensityChips.tsx` — toggle compacta/confortável (PT-BR, lucide).

**Editados (2):**
- `src/hooks/useInteractionsAdvancedFilter.ts` — adicionar `density` URL-driven + hidratação localStorage + persistência reativa.
- `src/pages/interacoes/InteracoesContent.tsx` — renderizar `<DensityChips>` apenas em `view=list`, aplicar classes condicionais nos itens da timeline.

**Possível extração (se passar de 400 linhas):**
- `src/components/interactions/InteractionListItem.tsx` — recebe `interaction`, `contact`, `isCompact`, `onEdit`, `onDelete`. Mantém o JSX hoje inline.

**Testes (2):**
- `src/components/interactions/__tests__/DensityChips.test.tsx` — 3 casos.
- `src/hooks/__tests__/useInteractionsAdvancedFilter.density.test.ts` — 5–6 casos.

## Critério de fechamento

(a) Toggle "Compacta/Confortável" aparece em `/interacoes` apenas no modo `view=list`; (b) clicar alterna densidade, persistindo em URL (`?density=compact`) e em localStorage; (c) modo compacto reduz padding, marcador, espaçamento, oculta avatar/badge/data absoluta e limita tags a 3+N; (d) modo confortável preserva o layout atual (regressão zero); (e) preferência sobrevive a refresh sem URL via hidratação localStorage; (f) trocar densidade não conta em `activeCount` e não afeta `clear()` de filtros (apenas `clear` zera tudo, conforme padrão); (g) testes cobrem hook e componente; (h) PT-BR, flat, zero novas deps, ≤400 linhas por arquivo.

