

# Plano: Preservar foco no campo de busca ao remover chips em `/interacoes`

## Contexto

Hoje, ao clicar no `X` de um chip no `ActiveFiltersBar` (Busca, Pessoa, Empresa, Canais, Período), o filtro é removido via `setFilter`, que atualiza a URL e re-renderiza a lista. O **foco vai para o `<body>`** (ou some), porque o próprio botão `X` desaparece quando o chip é desmontado.

Consequências:
- Usuário que estava digitando perde o cursor.
- Em listas longas, o navegador pode rolar para o topo.
- Quebra fluxo de "digitar → remover chip → continuar digitando".

## Decisão de escopo

Após remover qualquer chip do `ActiveFiltersBar`, **devolver o foco ao input de busca** (`<input>` da `SearchBar` em `/interacoes`) preservando:
- Posição de scroll da página (sem `scrollIntoView` agressivo).
- Conteúdo digitado no input (não mexer no `value`).
- Posição do cursor: cursor vai para o **final do texto** (comportamento padrão esperado).

Aplica-se a **todos os chips** do `ActiveFiltersBar` (Busca, Direção, Pessoa, Empresa, cada Canal, Período desde, Período até) e ao botão **"Limpar tudo"**. Não se aplica ao botão "Limpar período" (já existente) — também recebe o mesmo tratamento por consistência.

## Estratégia técnica

1. Expor um **ref do input de busca** no `InteracoesContent` (ou no componente que renderiza a `SearchBar`).
2. Passar uma callback `onAfterRemove?: () => void` para o `ActiveFiltersBar`.
3. Cada handler de chip (`onClose` das badges + `onClick` do "Limpar tudo" e "Limpar período") chama `setFilter(...)` e em seguida invoca `onAfterRemove?.()`.
4. `onAfterRemove` no parent faz:
   ```ts
   requestAnimationFrame(() => {
     const el = searchInputRef.current;
     if (!el) return;
     const len = el.value.length;
     el.focus({ preventScroll: true });
     try { el.setSelectionRange(len, len); } catch { /* noop */ }
   });
   ```
   - `preventScroll: true` evita rolagem para o input.
   - `requestAnimationFrame` garante que o foco aconteça **após** o re-render disparado por `setFilter`.
   - `setSelectionRange(len, len)` posiciona cursor ao final.

## Implementação

### 1. `src/components/interactions/ActiveFiltersBar.tsx`
- Adicionar prop `onAfterRemove?: () => void`.
- Criar helper interno `wrap(fn)` que executa `fn()` e depois chama `onAfterRemove?.()`.
- Aplicar `wrap()` em todos os `onClose` e nos `onClick` de "Limpar período" e "Limpar tudo".
- Sem mudanças de UI, sem novas deps.

### 2. `src/pages/interacoes/InteracoesContent.tsx` (ou container que renderiza `SearchBar` + `ActiveFiltersBar`)
- Localizar onde a `SearchBar`/input de busca é renderizado e expor um `ref` (`useRef<HTMLInputElement | null>(null)`).
- Se a `SearchBar` é um componente próprio, garantir que aceita `inputRef` via prop e o repasse ao `<input>`. Se ainda não aceitar, adicionar essa prop opcional.
- Definir `handleAfterRemove`:
  ```ts
  const handleAfterRemove = useCallback(() => {
    requestAnimationFrame(() => {
      const el = searchInputRef.current;
      if (!el) return;
      const len = el.value?.length ?? 0;
      el.focus({ preventScroll: true });
      try { el.setSelectionRange(len, len); } catch { /* noop */ }
    });
  }, []);
  ```
- Passar `onAfterRemove={handleAfterRemove}` ao `<ActiveFiltersBar />`.

### 3. `src/components/interactions/SearchBar.tsx` (se aplicável)
- Adicionar prop opcional `inputRef?: React.Ref<HTMLInputElement>` e encaminhar ao `<input>` (via `ref` direto ou `useImperativeHandle` se necessário). Compatível com uso atual (prop opcional).

## Testes

**Editar/criar** `src/components/interactions/__tests__/ActiveFiltersBar.test.tsx`:
1. Ao clicar no `X` de um chip, `onAfterRemove` é chamado **uma vez** após o respectivo `setFilter`.
2. Clicar em "Limpar tudo" chama `onAfterRemove`.
3. Clicar em "Limpar período" chama `onAfterRemove`.
4. Sem prop `onAfterRemove`: nenhum erro é lançado (graceful no-op).

**Não testar** o `focus` real em jsdom (instável). Cobrimos a invocação da callback; o efeito do `focus({preventScroll})` é trivial.

## Padrões obrigatórios

- PT-BR, flat, zero novas deps.
- Backward-compat: `onAfterRemove` e `inputRef` são opcionais.
- A11y: `preventScroll: true` evita reposicionamento; cursor ao final é o comportamento padrão esperado para inputs de texto.
- ≤400 linhas por arquivo.

## Arquivos tocados

**Editados (2–3):**
- `src/components/interactions/ActiveFiltersBar.tsx` — nova prop `onAfterRemove`, wrap em todos os handlers de remoção.
- `src/pages/interacoes/InteracoesContent.tsx` — `searchInputRef`, `handleAfterRemove`, passa para `ActiveFiltersBar` e `SearchBar`.
- `src/components/interactions/SearchBar.tsx` — adicionar `inputRef` opcional (somente se ainda não aceitar).

**Editado (1) — testes:**
- `src/components/interactions/__tests__/ActiveFiltersBar.test.tsx` — 4 casos cobrindo invocação de `onAfterRemove`.

## Critério de fechamento

(a) Remover qualquer chip do `ActiveFiltersBar` (Busca, Direção, Pessoa, Empresa, Canais, Período desde, Período até) devolve foco ao input de busca; (b) "Limpar tudo" e "Limpar período" também devolvem foco; (c) `focus({ preventScroll: true })` evita rolagem da página; (d) cursor posicionado ao final do texto digitado; (e) sem `onAfterRemove`, comportamento atual preservado (no-op); (f) testes cobrem a invocação da callback em todos os caminhos; (g) PT-BR, flat, zero novas deps.

