

# Plano: Chips visuais de ordenação em `/interacoes`

## Contexto

Hoje a ordenação é feita via `<SortSelect>` (dropdown). O usuário quer **chips horizontais** clicáveis na mesma barra do `AdvancedSearchBar`, permitindo trocar entre as 4 opções em 1 clique sem abrir menu.

Opções:
- **Mais recentes** (`recent`) — default
- **Mais antigas** (`oldest`)
- **Melhor correspondência** (`relevance`) — só habilitado quando há busca textual
- **Por pessoa/empresa** (`entity`)

## Decisão de escopo

- Novo componente `SortChips` (lado a lado, não substitui o sort da URL — usa o mesmo `setFilter('sort', ...)`).
- Substitui `<SortSelect>` no `AdvancedSearchBar`. O dropdown sai. Mais explícito, alinha com o padrão visual de `CanaisQuickFilter` e `DirecaoQuickFilter` (chips já existentes).
- Chip ativo: `border-primary` + fundo sutil (`bg-primary/10`) + texto `text-foreground`. Inativo: `variant=ghost`, hover discreto.
- Cada chip ganha ícone pequeno (já em `lucide-react`):
  - Recentes → `ArrowDown` (data desc)
  - Antigas → `ArrowUp` (data asc)
  - Relevância → `Sparkles`
  - Pessoa/Empresa → `Users`
- "Melhor correspondência" fica `disabled` + `opacity-50` quando não há `q`. Tooltip explica: "Disponível ao buscar por palavra-chave".
- Clicar no chip já ativo é no-op (não desativa — sempre há um sort vigente).
- **Atalhos de teclado** (consistente com `CanaisQuickFilter`): `Alt+R` (recent), `Alt+O` (oldest), `Alt+M` (melhor correspondência), `Alt+P` (pessoa/empresa). Funcionam mesmo com foco em input (igual aos chips de canal). Toast curto confirmando.
- Responsivo: em viewports estreitos (`<sm`), os chips colapsam para mostrar só o ícone, mantendo `aria-label` com o nome completo.

## Implementação

### 1. Novo componente: `src/components/interactions/SortChips.tsx`

Props: `value: SortKey`, `onChange: (v: SortKey) => void`, `hasQuery: boolean`.

```tsx
const SORT_CONFIG = [
  { key: 'recent', label: 'Mais recentes', icon: ArrowDown, shortcut: 'R' },
  { key: 'oldest', label: 'Mais antigas', icon: ArrowUp, shortcut: 'O' },
  { key: 'relevance', label: 'Melhor correspondência', icon: Sparkles, shortcut: 'M', requiresQuery: true },
  { key: 'entity', label: 'Por pessoa/empresa', icon: Users, shortcut: 'P' },
];
```

- Renderiza dentro de `<TooltipProvider>` cada chip como `<Button variant=...>` com `aria-pressed` e `aria-label`.
- Listener global `keydown` para `Alt+R/O/M/P` (skip se `ctrlKey/metaKey/shiftKey`). Mostra `toast.message` curto (`duration: 1500`).
- Badge `Alt+X` aparece sobreposto ao chip ao segurar `Alt` (mesma UX dos chips de canal).
- Memoizado com `React.memo`.

### 2. `src/components/interactions/AdvancedSearchBar.tsx`

- Trocar import `SortSelect` → `SortChips`.
- Substituir o uso na linha do `SortSelect` (`<SortSelect value={filters.sort} onChange={...} hasQuery={...} />` vira `<SortChips ... />`).
- Sem mudança em props expostas pelo `AdvancedSearchBar` — `setFilter('sort', v)` continua igual.

### 3. `src/hooks/useKeyboardShortcutsEnhanced.ts`

Adicionar 4 atalhos sob nova categoria **"Ordenação"** para aparecerem na cheatsheet (`?`):
- `Alt+R` → Mais recentes
- `Alt+O` → Mais antigas
- `Alt+M` → Melhor correspondência
- `Alt+P` → Por pessoa/empresa

### 4. (Opcional) Manter `SortSelect.tsx` exportado

Não é mais usado em `/interacoes`, mas pode ser referenciado em outros lugares. Faço uma busca rápida — se ninguém mais importa, removo o arquivo. Senão, mantenho intacto.

### 5. Testes

**Novo arquivo**: `src/components/interactions/__tests__/SortChips.test.tsx`

1. Renderiza os 4 chips com texto correto.
2. Chip ativo recebe `aria-pressed="true"` e classe de borda primária.
3. Click em chip inativo chama `onChange` com a key correta.
4. "Melhor correspondência" fica `disabled` quando `hasQuery=false`.
5. `Alt+R` chama `onChange('recent')` (mesmo com input focado).
6. `Alt+M` é ignorado quando `hasQuery=false`.
7. Clicar no chip já ativo NÃO chama `onChange` (no-op).

## Padrões obrigatórios

- PT-BR, tokens semânticos HSL, flat (sem shadows/gradients), zero novas deps.
- Atalhos `Alt+R/O/M/P` não conflitam com globais existentes (`Ctrl+K`, `Ctrl+B`, `?`, `Alt+1-6/0` dos canais).
- Backward compat: URL param `?sort=...` continua funcionando idêntico.
- A11y: `aria-pressed` em cada chip, `aria-label` quando só ícone (mobile), tooltip com atalho.

## Arquivos tocados

**Criados (2):**
- `src/components/interactions/SortChips.tsx`
- `src/components/interactions/__tests__/SortChips.test.tsx`

**Editados (2):**
- `src/components/interactions/AdvancedSearchBar.tsx` — troca `SortSelect` por `SortChips`.
- `src/hooks/useKeyboardShortcutsEnhanced.ts` — registra categoria "Ordenação" para a cheatsheet.

**Possivelmente removido (1):**
- `src/components/interactions/SortSelect.tsx` — se nada mais o referencia.

## Critério de fechamento

(a) Os 4 chips aparecem na barra de `/interacoes` no lugar do dropdown atual; (b) clicar troca a ordenação em 1 clique e atualiza a URL; (c) chip "Melhor correspondência" fica desabilitado sem busca textual com tooltip explicativo; (d) atalhos `Alt+R/O/M/P` funcionam mesmo com foco no input de busca, com toast de confirmação; (e) chip ativo tem destaque visual (`border-primary`); (f) responsivo: só ícone em mobile com `aria-label`; (g) cheatsheet `?` lista os 4 atalhos; (h) testes cobrem render, click, disabled, atalhos e no-op; (i) PT-BR, flat, zero novas deps.

