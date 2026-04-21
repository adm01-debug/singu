

# Plano: Persistir e restaurar a profundidade do infinite scroll

## Diagnóstico

Filtros e ordenação **já estão persistidos** em URL via `useInteractionsAdvancedFilter`:
- `q`, `contact`, `company`, `canais`, `direcao`, `de`, `ate`, `sort`, `view`, `density`, `perPage`, `page` — todos viajam na URL via `setSearchParams(..., { replace: true })` e são restaurados no mount.
- Hidratação cross-session já existe via `localStorage` para `density`, `view`, `sort` e `perPage` (URL ganha sobre cache).

**Lacuna real**: o `useInfiniteList` (usado em `UltimasInteracoesCard` da Ficha 360° e no `UnifiedTimelineView`) reseta `count` para `pageSize` em todo mount/troca de deps. Após F5 o usuário cai com apenas o primeiro lote, mesmo já tendo rolado várias páginas.

Observação: na rota `/interacoes` modo lista, **não há infinite scroll** hoje — usa `PaginationBar` (`page` + `perPage`), e ambos já estão na URL. Se o usuário quer mudar isso para infinite scroll, é outra tarefa (não escopada aqui). O foco é **restaurar a profundidade onde infinite scroll já existe**.

## Decisão de escopo

Adicionar persistência opcional (opt-in) à profundidade revelada pelo `useInfiniteList`, com chave de cache fornecida pelo consumidor. URL fica intocada (chave seria poluição: muda a cada scroll); cache em `sessionStorage` (escopo aba — recarregar restaura, fechar aba zera, evita "fantasma" entre abas/sessões diferentes).

Regras:
- Prop nova `persistKey?: string` em `useInfiniteList`. Sem prop → comportamento atual (zero regressão).
- Com `persistKey`, no mount lê `sessionStorage[persistKey]` e usa como `count` inicial (clamp em `[pageSize, items.length]`).
- A cada mudança de `count`, grava em `sessionStorage` (debounced 200ms via `setTimeout` simples, sem nova dep).
- Reset de deps (filtros mudam) **limpa** a chave também — evita restaurar profundidade de uma combinação de filtros antiga.
- Try/catch em todo acesso a `sessionStorage`.

Onde aplicar:
- `UltimasInteracoesCard`: `persistKey={\`ficha-ultimas-${contactId}\`}`. Restaura profundidade ao reabrir a Ficha.
- `UnifiedTimelineView`: `persistKey={\`timeline-${groupBy}\`}`. Restaura quantos grupos já foram expandidos por scroll.

Não tocar em `/interacoes` (modo lista usa paginação clássica, não infinite scroll).

## Implementação

### 1. `src/hooks/useInfiniteList.ts`

Adicionar:
```ts
interface Options { persistKey?: string }
export function useInfiniteList<T>(
  items: T[], pageSize = 50, deps: ReadonlyArray<unknown> = [], options: Options = {}
): UseInfiniteListResult<T> {
  const { persistKey } = options;
  const safeItems = Array.isArray(items) ? items : [];

  const initial = (() => {
    if (!persistKey) return pageSize;
    try {
      const raw = sessionStorage.getItem(persistKey);
      const n = parseInt(raw ?? '', 10);
      if (Number.isFinite(n) && n >= pageSize) return n;
    } catch { /* noop */ }
    return pageSize;
  })();

  const [count, setCount] = useState(initial);

  // Reset em mudança de deps + limpa cache (evita profundidade fantasma).
  useEffect(() => {
    setCount(pageSize);
    if (persistKey) { try { sessionStorage.removeItem(persistKey); } catch { /* noop */ } }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageSize, ...deps]);

  // Persistência debounced.
  const writeTimerRef = useRef<number | null>(null);
  useEffect(() => {
    if (!persistKey) return;
    if (writeTimerRef.current != null) window.clearTimeout(writeTimerRef.current);
    writeTimerRef.current = window.setTimeout(() => {
      try { sessionStorage.setItem(persistKey, String(count)); } catch { /* noop */ }
    }, 200);
    return () => {
      if (writeTimerRef.current != null) window.clearTimeout(writeTimerRef.current);
    };
  }, [count, persistKey]);
  // ... resto inalterado (loadMore, IntersectionObserver, slice).
}
```

Backward-compat total: assinatura aceita 4º parâmetro opcional; chamadas atuais `useInfiniteList(items, 15, [items])` seguem funcionando.

### 2. `src/components/ficha-360/UltimasInteracoesCard.tsx`

```ts
const { visible, hasMore, sentinelRef } = useInfiniteList(
  items, 15, [items, contactId], { persistKey: contactId ? `ficha-ultimas-${contactId}` : undefined }
);
```

### 3. `src/components/interactions/UnifiedTimelineView.tsx`

Como o `UnifiedTimelineView` não usa `useInfiniteList` diretamente (renderiza todos os grupos via `.map`), **não há mudança aqui**. Documentado para evitar dúvida.

## Testes

**Editar** `src/hooks/__tests__/useInfiniteList.test.ts` (criar se não existir):
1. Sem `persistKey` → `sessionStorage` nunca é tocado; comportamento idêntico ao atual.
2. Com `persistKey` e cache `'30'`, `pageSize=10`, `items.length=100` → `visible.length === 30` no mount.
3. Cache inválido (`'foo'`) ou menor que `pageSize` → ignora, usa `pageSize`.
4. Após `loadMore()`, `sessionStorage.setItem` é chamado com nova contagem (após o debounce de 200ms).
5. Mudança em `deps` zera `count` para `pageSize` E remove a chave do `sessionStorage`.
6. `sessionStorage` indisponível (mock que joga) não quebra o hook.

## Padrões obrigatórios

- PT-BR nos comentários e mensagens.
- Backward-compat total: 4º parâmetro opcional, sem afetar chamadas existentes.
- Zero novas deps.
- ≤400 linhas por arquivo (`useInfiniteList` atual ~40 linhas, sobra muito).
- `try/catch` em todo acesso a `sessionStorage` (SSR-safe / modo privado).
- URL **não** muda — profundidade não polui histórico nem links compartilháveis.

## Arquivos tocados

**Editado (2):**
- `src/hooks/useInfiniteList.ts` — nova opção `persistKey`, hidratação no mount, persistência debounced, limpeza no reset.
- `src/components/ficha-360/UltimasInteracoesCard.tsx` — passa `persistKey` baseado em `contactId`.

**Novo/editado (1) — testes:**
- `src/hooks/__tests__/useInfiniteList.test.ts` — 6 casos cobrindo opt-in, hidratação, cache inválido, persistência, reset por deps e ambiente sem storage.

## Critério de fechamento

(a) Filtros (`q`, `contact`, `company`, `canais`, `direcao`, `de`, `ate`) e ordenação (`sort`) continuam fixos na URL e restaurados no F5 — comportamento já existente, validado; (b) na Ficha 360°, ao recarregar a página, a lista de "Últimas Interações" reabre com a mesma quantidade de itens já revelados antes (até `items.length`); (c) trocar de contato ou aplicar novos filtros zera a profundidade e limpa o cache da chave; (d) `sessionStorage` indisponível não quebra o hook; (e) chamadas atuais sem `persistKey` mantêm comportamento idêntico; (f) URL fica limpa (sem param de profundidade); (g) testes cobrem todos os caminhos; (h) PT-BR, flat, zero novas deps, ≤400 linhas.

