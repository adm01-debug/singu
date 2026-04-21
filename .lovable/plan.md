

# Plano: Sincronização automática dos chips de canal com a busca

## Contexto

Hoje em `/interacoes`, na `AdvancedSearchBar`, o componente `CanaisQuickFilter` provavelmente já aplica mudanças de canal imediatamente ao clicar (via `setFilter('canais', next)`), o que dispara refetch e re-render da tabela a cada chip. O usuário quer:

1. **Modo "Auto-aplicar"** (default ON): chips sincronizam imediatamente com a busca/tabela ao clicar (comportamento atual, com confirmação visual).
2. **Modo "Manual"** (opt-in): chips apenas marcam a seleção localmente; só aplica quando clica num botão "Aplicar" — útil pra escolher 3-4 canais sem ficar refazendo a query a cada clique.
3. **Botão "Aplicar"** aparece apenas no modo manual e quando há diferença entre seleção local e filtros aplicados (badge com contador da diferença).

Preferência do projeto (memória `mem://~user`): execução autônoma, uma única melhoria por vez, sem perguntas. Vou implementar com default = auto-aplicar (zero regressão pra quem já usa hoje), e um toggle discreto pra mudar pro modo manual com persistência em localStorage.

## Decisão de escopo

- **Hook novo**: `useChannelSyncMode` (`src/hooks/useChannelSyncMode.ts`) — persiste `'auto' | 'manual'` em `localStorage` (`channel-sync-mode`), default `'auto'`.
- **`CanaisQuickFilter`**: adicionar estado interno `pendingCanais` (sync com prop quando modo é `auto`); no modo `manual`, clicks só atualizam `pendingCanais` sem chamar `onChange`. Mostra:
  - Pequeno toggle (ícone `<Zap>` ativo / `<MousePointerClick>` manual) ao lado dos chips, com `<Tooltip>` explicando o modo.
  - Botão `Aplicar` aparece só no modo `manual` E quando `pendingCanais !== currentCanais`. Mostra contagem de diferença (ex.: `+2`).
  - Botão `Reverter` (ícone X) ao lado, pra descartar pendentes.
- **Visual**: chips selecionados-mas-não-aplicados ganham estilo `outline` com borda tracejada (`border-dashed`); chips aplicados mantêm `default`. Diferenciação clara sem cor extra.
- **Sem mudanças em**: `setFilter`, `applyAll`, `useInteractionsAdvancedFilter`, `AdvancedSearchBar` (a não ser passar a prop nova se necessário — provavelmente não, fica self-contained no `CanaisQuickFilter`).
- **A11y**: toggle com `aria-label`, botão Aplicar com `aria-live="polite"` no badge de contagem.
- **Backward compat**: default `'auto'` = comportamento idêntico ao atual.

## Implementação

### 1. `src/hooks/useChannelSyncMode.ts` (novo, ~25 linhas)

```ts
type ChannelSyncMode = 'auto' | 'manual';
const KEY = 'channel-sync-mode';

export function useChannelSyncMode() {
  const [mode, setModeState] = useState<ChannelSyncMode>(() => {
    try { return (localStorage.getItem(KEY) as ChannelSyncMode) || 'auto'; }
    catch { return 'auto'; }
  });
  const setMode = useCallback((next: ChannelSyncMode) => {
    setModeState(next);
    try { localStorage.setItem(KEY, next); } catch {}
  }, []);
  const toggle = useCallback(() => setMode(mode === 'auto' ? 'manual' : 'auto'), [mode, setMode]);
  return { mode, setMode, toggle };
}
```

### 2. `src/components/interactions/CanaisQuickFilter.tsx` (refactor)

Ler arquivo atual primeiro. Adicionar:
- `useChannelSyncMode()` interno.
- Estado `pendingCanais` derivado: no modo `auto` espelha `canais` direto; no modo `manual` mantém estado local até `apply()`.
- `useEffect` sincroniza `pendingCanais` com `canais` quando muda externamente (preset aplicado, clear, etc.).
- `toggleCanal(value)`:
  - Modo `auto`: chama `onChange(next)` direto (comportamento atual).
  - Modo `manual`: atualiza `pendingCanais`, não chama `onChange`.
- `apply()`: `onChange(pendingCanais)`.
- `revert()`: `setPendingCanais(canais)`.
- Render dos chips usa `pendingCanais` pra estado visual; chips com diferença em relação a `canais` ganham `border-dashed`.
- UI extra: toggle modo (botão ghost com ícone) + botão Aplicar/Reverter quando aplicável.

### 3. Testes em `src/hooks/__tests__/useChannelSyncMode.test.ts` (novo, ~30 linhas)

- Default é `'auto'` quando `localStorage` vazio.
- `setMode('manual')` persiste.
- `toggle()` alterna `auto` ↔ `manual`.
- Hot reload (renderHook novo) lê do `localStorage`.

### 4. Testes em `src/components/interactions/__tests__/CanaisQuickFilter.test.tsx` (novo, ~60 linhas)

- Modo `auto`: clicar em chip chama `onChange` imediatamente.
- Modo `manual`: clicar em chip NÃO chama `onChange`; aparece botão Aplicar; clicar em Aplicar chama `onChange` com `pendingCanais`.
- Modo `manual`: Reverter restaura `pendingCanais` ao valor da prop.
- Toggle de modo persiste e troca comportamento.
- Mudança externa de `canais` (ex.: clear) sincroniza `pendingCanais`.

## Padrões obrigatórios

- PT-BR
- Tokens semânticos (`border-dashed`, `text-muted-foreground`, etc.), flat
- `localStorage` com try/catch (defensivo, sem deps)
- Backward compat total: default `'auto'` mantém UX atual
- Zero novas deps, zero queries de rede
- Memo onde fizer sentido

## Arquivos tocados

**Criados (3):**
- `src/hooks/useChannelSyncMode.ts`
- `src/hooks/__tests__/useChannelSyncMode.test.ts`
- `src/components/interactions/__tests__/CanaisQuickFilter.test.tsx`

**Editados (1):**
- `src/components/interactions/CanaisQuickFilter.tsx` — adiciona modo + botão Aplicar/Reverter + estado pendente

## Critério de fechamento

(a) `CanaisQuickFilter` tem toggle visível (ícone) que alterna auto/manual; (b) modo `auto` mantém comportamento atual (chip click = filtro aplicado imediatamente); (c) modo `manual` deixa chips em estado "pendente" (visual `border-dashed`) e mostra botão "Aplicar (+N)" + "Reverter"; (d) clicar em Aplicar chama `onChange(pending)` e sincroniza visual; (e) modo persiste em `localStorage` entre sessões; (f) presets/clear externos sincronizam `pendingCanais` automaticamente; (g) testes cobrem ambos modos + persistência; (h) PT-BR, tokens semânticos, flat, sem novas deps, zero regressão em apply preset / sort / outras quick filters.

