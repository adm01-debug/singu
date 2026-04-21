

# Plano: Sincronização correta dos chips de canal com a URL em `/interacoes`

## Contexto

Os chips de canal são renderizados em dois lugares:
- **`CanaisQuickFilter`** (na barra de busca avançada): chips para ativar/desativar canais.
- **`ActiveFiltersBar`** (abaixo da barra): badges fechaveis representando o estado ativo, incluindo os canais selecionados.

A fonte da verdade é `filters.canais` (vindo de `useInteractionsAdvancedFilter`, parseado da URL `?canais=email,call`). Há também um `channelPersistence` em `localStorage` que pode reaplicar canais ao recarregar/limpar.

Suspeitas de inconsistência a investigar e corrigir:
1. **Remover um chip pelo X em `ActiveFiltersBar`** chama `setFilter('canais', canais.filter(...))`. Quando a lista resultante fica vazia, precisa virar `[]` na URL (parâmetro removido), não permanecer com valor antigo.
2. **`CanaisQuickFilter`** pode estar lendo de `localStorage` (via `channelPersistence`) e não da URL como fonte primária — gerando "chip ativo visualmente" enquanto a URL não reflete.
3. **Persistência em `localStorage`** pode reaplicar canais após o usuário remover um chip, criando regressão imediata.
4. **Normalização**: chips devem comparar canais sempre em **lowercase**, sem duplicatas, com whitelist (`whatsapp|call|email|meeting|video_call|note`).

## Decisão de escopo

- **Fonte única da verdade**: a URL (`filters.canais`). `CanaisQuickFilter` recebe `value` e `onChange` via props e NÃO lê `localStorage` internamente.
- **`channelPersistence`** continua existindo, mas só é consultado **uma vez na primeira montagem** quando a URL não tem `?canais=`. Após qualquer interação do usuário (toggle/close), passa a refletir exatamente a URL. Remoção total (`canais=[]`) **limpa** o `localStorage` (já é o comportamento de `writeAppliedCanais([])`).
- **`ActiveFiltersBar`**: ao clicar no X de um chip de canal, chamar `setFilter('canais', next)` onde `next = canais.filter(c => c !== removed)`. Se `next.length === 0`, o setter já remove o param da URL (graças à serialização condicional em `useInteractionsAdvancedFilter`). Verificar e garantir que esse caminho esteja correto.
- **`CanaisQuickFilter`**: derivar `activeSet = new Set(filters.canais)` a cada render. Toggle calcula `next` e chama o callback. Remover qualquer leitura/escrita direta de `localStorage` dentro do componente — fica responsabilidade da página (`InteracoesContent.tsx`) ou do hook.
- **Sincronização do `localStorage`** com a URL: criar um `useEffect` no `InteracoesContent` (ou no próprio hook) que, sempre que `filters.canais` mudar por ação do usuário, chame `writeAppliedCanais(filters.canais)`. Quando a URL é limpa via "Limpar tudo" do `ActiveFiltersBar`, isso já zera o `localStorage`.
- **Normalização**: ao parsear `?canais=`, manter o filtro de whitelist e dedup (`Array.from(new Set(...))`). Confirmar que `parseCanais` em `useInteractionsAdvancedFilter` faz isso; se não, ajustar.
- **Comparação case-insensitive**: garantir que toggle e close comparem com `toLowerCase()` antes de inserir/remover.

## Implementação

### 1. `src/hooks/useInteractionsAdvancedFilter.ts`

- Revisar `parseCanais`: aplicar whitelist (`VALID_CHANNELS`), dedup, lowercase.
- Garantir que `setFilter('canais', [])` remova o param da URL (serialização condicional `if (Array.isArray(v) && v.length > 0)`).
- Confirmar que `applyAll` segue mesma regra.

### 2. `src/components/interactions/CanaisQuickFilter.tsx`

- Remover qualquer leitura de `localStorage` (se existir).
- Props: `value: string[]`, `onChange: (next: string[]) => void`.
- Toggle:
  ```ts
  const toggle = (c: string) => {
    const lower = c.toLowerCase();
    const set = new Set(value.map(v => v.toLowerCase()));
    if (set.has(lower)) set.delete(lower);
    else set.add(lower);
    onChange(Array.from(set));
  };
  ```
- Visual ativo: `value.includes(c.toLowerCase())`.

### 3. `src/components/interactions/ActiveFiltersBar.tsx`

- Já chama `setFilter('canais', canais.filter(x => x !== c))`. Validar que `c` está em lowercase no momento da remoção (vem do array já normalizado pelo parser, então deve estar OK — apenas adicionar comentário inline).
- Sem mudança funcional aqui se o parser já normaliza; só garantia.

### 4. `src/pages/interacoes/InteracoesContent.tsx`

- Encontrar onde `CanaisQuickFilter` é renderizado e passar `value={filters.canais}` e `onChange={(next) => setFilter('canais', next)}`.
- Adicionar `useEffect` que sincroniza `filters.canais` → `writeAppliedCanais(filters.canais)`. Ao montar com URL vazia, ler `readAppliedCanais()` uma única vez (guardado em `useRef` para evitar loops) e aplicar via `setFilter('canais', stored)` se não for nulo.

### 5. Testes

**Editar** `src/lib/__tests__/use-interactions-advanced-filter-apply-all.test.ts` (ou criar novo teste focado):
1. `setFilter('canais', [])` remove o param `canais` da URL.
2. `setFilter('canais', ['email','EMAIL','whatsapp'])` é normalizado para `['email','whatsapp']` (dedup + lowercase).
3. URL `?canais=email,garbage,call` produz `['email','call']` (whitelist filtra inválidos).
4. Remover último canal via `ActiveFiltersBar` (simulando `setFilter('canais', [])`) limpa a URL.

**Criar** `src/components/interactions/__tests__/CanaisQuickFilter.test.tsx`:
1. Renderiza chip ativo quando `value` contém o canal.
2. Click em chip ativo chama `onChange` sem aquele canal.
3. Click em chip inativo chama `onChange` com aquele canal adicionado.
4. Não lê `localStorage` (mock e verificar que não foi chamado).

**Editar** `src/lib/__tests__/channelPersistence.test.ts`: garantir que cobertura atual continua válida (não muda comportamento do helper, só seu uso).

## Padrões obrigatórios

- PT-BR, tokens semânticos HSL, flat (sem shadows/gradients), zero novas deps.
- Backward compat: URL `?canais=email,call` continua funcionando idêntica.
- Fonte única da verdade: URL. `localStorage` é cache opcional de "última seleção", não fonte.
- A11y: chips mantêm `aria-pressed` e labels existentes.

## Arquivos tocados

**Editados (4):**
- `src/hooks/useInteractionsAdvancedFilter.ts` — confirmar/ajustar normalização e serialização condicional de `canais`.
- `src/components/interactions/CanaisQuickFilter.tsx` — remover leitura de `localStorage`, toggle baseado em props.
- `src/components/interactions/ActiveFiltersBar.tsx` — comentário/ajuste pontual se necessário (sem mudança funcional esperada).
- `src/pages/interacoes/InteracoesContent.tsx` — wiring `value`/`onChange`, sincronização one-shot com `localStorage` via `useEffect`+`useRef`.

**Editados/criados (2 testes):**
- `src/lib/__tests__/use-interactions-advanced-filter-apply-all.test.ts` — 4 novos casos de normalização e remoção.
- `src/components/interactions/__tests__/CanaisQuickFilter.test.tsx` — novo, cobre toggle e ausência de acesso a `localStorage`.

## Critério de fechamento

(a) Chips de canal em `/interacoes` refletem exatamente o que está em `?canais=`; (b) clicar X em um chip de canal no `ActiveFiltersBar` remove esse canal e, se for o último, remove o param da URL inteiro; (c) `CanaisQuickFilter` não lê `localStorage` — usa `value` via props; (d) `localStorage` é atualizado **depois** de cada mudança e só consultado uma vez na montagem inicial quando a URL está vazia; (e) parser normaliza canais com whitelist + lowercase + dedup; (f) testes cobrem normalização, remoção, toggle e ausência de leitura indevida de `localStorage`; (g) PT-BR, flat, zero novas deps.

