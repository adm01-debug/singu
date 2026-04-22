

# Plano: Botão "Carregar mais" em Últimas Interações

## Objetivo

Adicionar um botão explícito "Carregar mais" em `UltimasInteracoesCard` que revele +15 itens por clique, complementando (sem substituir) o auto-load via `IntersectionObserver` já existente.

## Mudanças

### 1. `src/hooks/useInfiniteList.ts`

Expor `loadMore` no tipo `UseInfiniteListResult<T>` — já existe internamente, basta consumir. Sem alteração no hook (já retorna `loadMore`).

### 2. `src/components/interactions/InfiniteScrollSentinel.tsx`

Adicionar prop opcional `onLoadMore?: () => void`. Quando presente e `hasMore === true`, renderizar botão "Carregar mais (+15)" acima dos skeletons (ou substituindo-os, ver abaixo).

Decisão: manter os skeletons + barra de progresso (feedback de auto-load por scroll) e adicionar o botão **acima** deles. O usuário escolhe: clicar no botão (ação explícita imediata) ou rolar (auto-load).

```tsx
{onLoadMore && (
  <div className="flex justify-center">
    <Button
      variant="outline"
      size="sm"
      onClick={onLoadMore}
      className="h-7 px-3 text-xs gap-1"
      aria-label="Carregar mais interações"
    >
      <ChevronDown className="h-3 w-3" /> Carregar mais
    </Button>
  </div>
)}
```

Sem prop, comportamento atual preservado (retrocompatível).

### 3. `src/components/ficha-360/UltimasInteracoesCard.tsx`

- Desestruturar `loadMore` de `useInfiniteList`.
- Passar `onLoadMore={loadMore}` para `InfiniteScrollSentinel`.

Nada mais muda — `pageSize=15` já é o usado no card, então cada clique soma +15 automaticamente (a lógica `setCount(prev => prev + pageSize)` já existe).

## Não faz parte deste plano

- Mudar o `pageSize` de outras instâncias de `useInfiniteList`.
- Adicionar o botão em outras telas (ex.: `ExternalInteractionsTimeline`) — escopo restrito ao `UltimasInteracoesCard` conforme pedido.
- Trocar `IntersectionObserver` por carregamento puramente manual (auto-load continua ativo).

## Critérios de aceite

(a) Botão "Carregar mais" visível em `UltimasInteracoesCard` enquanto `hasMore === true`; (b) cada clique adiciona +15 itens à lista visível; (c) auto-load por scroll continua funcionando (não regride); (d) botão some quando não há mais itens (mesma condição de `hasMore`); (e) `InfiniteScrollSentinel` ganha prop opcional `onLoadMore`, sem quebra para chamadores atuais; (f) ícone `ChevronDown` + label PT-BR; (g) `aria-label` descritivo; (h) estilo flat consistente (variant `outline`, size `sm`); (i) sem nova dependência, sem mudança em `useInfiniteList.ts`.

