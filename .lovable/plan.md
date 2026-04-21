

# Plano: Aplicar preset sem recarregar e manter foco na busca

## Contexto

Hoje em `InteracoesPresetsMenu`, ao clicar em um preset, `applyPreset` chama `onApplyPreset(payload)` que escreve nos `searchParams` via `setFilter`. Isso já é client-side (React Router não recarrega a página), mas:

1. Não há garantia explícita de que **todos** os campos do `AdvancedFilters` são resetados antes de aplicar (ex.: se o preset não tem `canais`, o filtro de canais antigo permanece — comportamento "merge" em vez de "replace").
2. Após aplicar, o **popover fecha** mas o foco vai para o trigger do popover (botão "Buscas"), não para o `Input` de busca da `TimelineFilterBar`. O usuário precisa clicar no campo de busca para continuar digitando.
3. Não há feedback visual claro de que a tabela atualizou (a query refetch é silenciosa).

Vamos resolver os três pontos sem recarregar a página.

## Decisão de escopo

- **Replace total dos filtros**: ao aplicar um preset, primeiro limpa todos os campos do `AdvancedFilters` e depois aplica os valores do preset. Garante que filtros antigos não "vazem".
- **Foco automático na busca**: após aplicar, dispara um evento (`focus-interactions-search`) que a `TimelineFilterBar` escuta para chamar `inputRef.current?.focus()` + `select()`. Mecanismo desacoplado (CustomEvent no `window`), sem prop drilling.
- **Feedback sutil**: toast já existe ("Preset aplicado" — ou adicionar se não houver). A tabela já refetch automaticamente via TanStack Query quando os `searchParams` mudam (o hook `useInteractionsAdvancedFilter` retorna `filters` derivado do URL, e a query usa `filters` como key). Não precisa de mudança aqui.
- **Sem recarregar**: `setSearchParams(..., { replace: true })` já é usado — confirmar que continua. Nenhum `window.location` ou `navigate({ replace: true })` em todo o fluxo.

## Implementação

### 1. `useInteractionsAdvancedFilter.ts` — novo método `applyAll`

Adicionar método que substitui **todos** os filtros de uma vez (replace, não merge), em uma única chamada `setSearchParams` (uma navegação só):

```ts
const applyAll = useCallback((next: Partial<AdvancedFilters>) => {
  const sp = new URLSearchParams(searchParams);
  // Limpar todas as chaves conhecidas
  KEYS.forEach(k => sp.delete(k));
  // Aplicar valores do preset
  if (next.q) sp.set('q', next.q);
  if (next.contact) sp.set('contact', next.contact);
  if (next.company) sp.set('company', next.company);
  if (next.canais?.length) sp.set('canais', next.canais.join(','));
  if (next.direcao && next.direcao !== 'all') sp.set('direcao', next.direcao);
  if (next.de) sp.set('de', next.de.toISOString().slice(0, 10));
  if (next.ate) sp.set('ate', next.ate.toISOString().slice(0, 10));
  if (next.sort && next.sort !== 'recent') sp.set('sort', next.sort);
  setSearchParams(sp, { replace: true });
}, [searchParams, setSearchParams]);
```

Retornar no objeto do hook (`{ filters, debouncedQ, setFilter, clear, activeCount, applyAll }`).

### 2. `InteracoesPresetsMenu.tsx` — usar `applyAll` + emitir evento de foco

- Substituir as múltiplas chamadas `onApplyPreset(payload)` (que faz N `setFilter`) por uma única chamada `onApplyAll(adapted)` onde `adapted` é o `Partial<AdvancedFilters>` reconstruído do `preset.filters`.
- Renomear/adicionar prop `onApplyAll: (next: Partial<AdvancedFilters>) => void` (manter `onApplyPreset` como fallback se houver outros consumidores; se for único, refatorar limpo).
- Após aplicar:
  ```ts
  setOpen(false);  // fecha popover
  markAsUsed(preset.id);
  toast.success('Preset aplicado');
  // Foco no campo de busca após o popover fechar
  requestAnimationFrame(() => {
    window.dispatchEvent(new CustomEvent('focus-interactions-search'));
  });
  ```

### 3. `TimelineFilterBar.tsx` — escutar evento e focar `Input`

- Adicionar `useRef<HTMLInputElement>` no `Input` de busca.
- `useEffect` registra listener:
  ```ts
  useEffect(() => {
    const handler = () => {
      inputRef.current?.focus();
      inputRef.current?.select();
    };
    window.addEventListener('focus-interactions-search', handler);
    return () => window.removeEventListener('focus-interactions-search', handler);
  }, []);
  ```
- `<Input ref={inputRef} ... />`.

### 4. `Interacoes.tsx` (página) — passar `applyAll` para o menu

- Pegar `applyAll` do hook `useInteractionsAdvancedFilter`.
- Passar para `<InteracoesPresetsMenu onApplyAll={applyAll} />`.

### 5. Testes em `src/lib/__tests__/use-interactions-advanced-filter-apply-all.test.ts` (novo, ~50 linhas)

- `applyAll({ company: 'Acme' })` quando havia `canais=['email']` antes → `canais` removido, `company` setado.
- `applyAll({})` → todos os filtros conhecidos removidos da URL.
- `applyAll({ direcao: 'all' })` → `direcao` removido (default).
- `applyAll({ sort: 'recent' })` → `sort` removido (default).
- Múltiplas chamadas não acumulam estado antigo.

## Padrões obrigatórios

- PT-BR
- `setSearchParams(..., { replace: true })` — sem reload
- CustomEvent desacoplado (sem prop drilling de ref)
- Backward compat: `onApplyPreset` antigo continua funcionando se outros consumidores usarem
- Tokens semânticos, flat
- Zero novas deps, zero novas queries de rede

## Arquivos tocados

**Editados (4):**
- `src/hooks/useInteractionsAdvancedFilter.ts` — novo método `applyAll`
- `src/components/interactions/InteracoesPresetsMenu.tsx` — usa `applyAll`, emite evento de foco, fecha popover
- `src/components/interactions/TimelineFilterBar.tsx` — `ref` no input + listener do evento
- `src/pages/Interacoes.tsx` (ou onde renderiza o menu) — passa `applyAll` ao menu

**Criado (1):**
- `src/lib/__tests__/use-interactions-advanced-filter-apply-all.test.ts`

## Critério de fechamento

(a) Clicar em um preset substitui completamente os filtros ativos (não faz merge); (b) URL muda via `setSearchParams({ replace: true })` sem recarregar a página; (c) tabela de interações refetch automaticamente via TanStack Query quando os filtros derivados mudam; (d) popover fecha e foco vai automaticamente para o `Input` de busca da `TimelineFilterBar`, com texto selecionado pronto pra digitar; (e) toast "Preset aplicado" em PT-BR; (f) `markAsUsed` continua sendo chamado; (g) zero regressão em salvar/excluir/renomear/atualizar/favoritar/exportar/importar/sugerir nome/ordenação; (h) tokens semânticos, flat, sem novas deps.

