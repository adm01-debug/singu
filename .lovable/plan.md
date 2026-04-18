
## Causa raiz
`GlobalSearch.tsx` tem **dois `useEffect` que sincronizam bidirecionalmente** `query ↔ URL ?q=`:
- L126: URL → state (`setQuery(urlQuery)` quando muda `location.search`)
- L127: state → URL (`navigate({search:?q=...}, replace:true)` quando muda `query`)

Em certas condições (ex.: re-render do `AppLayout` por outra razão, codificação de espaços, modo conversacional alterando `convDraft`), os dois entram em loop infinito → "Maximum update depth exceeded" → main thread travada → **cliques do sidebar não disparam handlers**.

## Correção (cirúrgica, 1 arquivo)
**`src/components/search/GlobalSearch.tsx`**:

1. **Remover sincronização state→URL automática** (L127). A URL `?q=` só é útil para deep-link de entrada, não para refletir cada tecla digitada (que já causa re-render local + chamadas de busca).
2. **Manter L126 simplificado**: só ler `?q=` no momento em que o palette **abre** (`open` muda de false→true), não em toda mudança de `location.search`. Trocar deps para `[open]` apenas e ler `location.search` via ref.
3. Se o usuário quiser persistir `?q=` na URL ao fechar, fazemos isso no `onOpenChange(false)` — sem efeito reativo.

Resultado: zero loop, sidebar volta a responder, e deep-link `?q=` continua funcionando para abrir com texto pré-preenchido.

## Validação
- Recarregar `/revops`, clicar em qualquer item do sidebar → navega normalmente.
- Console limpo (sem "Maximum update depth").
- Abrir ⌘K com `?q=teste` na URL → input já preenchido com "teste".

Sem migration, sem nova dependência, ≤10 linhas alteradas.
