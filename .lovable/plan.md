

# Plano: Skeletons detalhados por item em "Últimas Interações"

## Objetivo

Substituir os skeletons genéricos (`h-12` retangulares) exibidos durante o auto-load de `UltimasInteracoesCard` por skeletons que **espelham a estrutura real** do item da lista (ícone do canal + título + linha de metadados), tornando a transição visualmente contínua.

## Decisão de design

- O skeleton deve ter o **mesmo layout** do `<li>` real: ícone 7×7 à esquerda, bloco de texto à direita com 2 linhas (título + meta).
- Usado **somente em `density="compact"`** (que é o usado pelo card). O modo `comfortable` mantém o `h-20` atual para não regredir outras telas.
- Implementado como subcomponente local em `InfiniteScrollSentinel.tsx` para manter o card intacto e a lógica de paginação centralizada.

## Mudanças

### 1. `src/components/interactions/InfiniteScrollSentinel.tsx`

**a)** Criar subcomponente `CompactItemSkeleton` (≈15 linhas) que reproduz a estrutura do item da `UltimasInteracoesCard`:

```tsx
function CompactItemSkeleton() {
  return (
    <div className="flex items-start gap-3 px-2 py-2">
      <Skeleton className="mt-0.5 h-7 w-7 rounded-md shrink-0" />
      <div className="flex-1 min-w-0 space-y-1.5">
        <div className="flex items-center gap-2">
          <Skeleton className="h-3.5 flex-1 max-w-[60%] rounded-sm" />
          <Skeleton className="h-1.5 w-1.5 rounded-full shrink-0" />
        </div>
        <Skeleton className="h-3 w-2/5 rounded-sm" />
      </div>
    </div>
  );
}
```

**b)** No bloco `hasMore`, quando `isCompact === true`, renderizar `CompactItemSkeleton` no lugar dos `Skeleton h-12`. Manter a contagem de 2 (já parametrizada em `skeletonCount`).

**c)** Modo `comfortable` permanece com `Skeleton h-20` (sem regressão).

**d)** Variar levemente a largura do título com offset por índice (`max-w-[60%]` no primeiro, `max-w-[45%]` no segundo) para reduzir sensação de repetição mecânica.

### 2. Não muda

- `UltimasInteracoesCard.tsx` — passa `density="compact"` e `onLoadMore`, sem precisar saber do skeleton interno.
- `useInfiniteList.ts` — sem alteração.
- Outros consumidores de `InfiniteScrollSentinel` (modo `comfortable`) — comportamento preservado.
- Barra de progresso, botão "Carregar mais", contador "X de Y" — todos preservados.

### 3. Acessibilidade e performance

- `aria-live="polite"` e `aria-busy="true"` já existem no contêiner — mantêm-se.
- Sem nova animação custom: reutiliza o `variant="shimmer"` do `<Skeleton>` (já no design system).
- Sem nova dependência. Sem mudança de tokens.

## Critérios de aceite

(a) Durante o auto-load/carregamento progressivo no `UltimasInteracoesCard`, os skeletons exibem ícone redondo + 2 linhas de texto (título + meta), espelhando o item real; (b) o card mantém botão "Carregar mais", barra de progresso e contador "X de Y"; (c) o modo `density="comfortable"` continua com skeletons `h-20` (sem regressão para outras telas); (d) larguras das linhas variam por índice para evitar aparência mecânica; (e) `InfiniteScrollSentinel.tsx` permanece <120 linhas, sem `any`, sem nova dependência; (f) reutiliza `Skeleton` do design system com `variant="shimmer"`; (g) flat, PT-BR, sem emojis.

