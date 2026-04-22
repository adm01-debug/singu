

# Plano: Contador "Mostrando X de Y" em Últimas Interações

## Objetivo

Exibir no cabeçalho do `UltimasInteracoesCard` um contador "Mostrando X de Y" que reflete em tempo real a quantidade visível vs. total, atualizando conforme o usuário rola ou clica em "Carregar mais".

## Decisão de design

- Posicionar o contador no `CardHeader`, logo à direita do título "Últimas Interações" (antes do botão "Ver todas"), como `Badge` discreto `variant="secondary"`.
- Quando `visible.length === items.length` (tudo carregado), simplificar para "Y" sem o "X de" para reduzir ruído visual.
- Quando `items.length === 0`, esconder o contador.
- Usar `tabular-nums` para evitar "pulo" de largura conforme os números mudam.

## Mudanças

### `src/components/ficha-360/UltimasInteracoesCard.tsx`

1. Desestruturar `visible` e `loadMore` (já feito) do `useInfiniteList` — `visible.length` é a fonte de "X".
2. Adicionar import de `Badge` (`@/components/ui/badge`).
3. No `CardHeader`, ajustar o bloco do título:

```tsx
<div className="flex items-center gap-2">
  <CardTitle className="text-base">Últimas Interações</CardTitle>
  {items.length > 0 && (
    <Badge variant="secondary" className="text-xs font-normal tabular-nums">
      {visible.length < items.length
        ? `Mostrando ${visible.length} de ${items.length}`
        : `${items.length}`}
    </Badge>
  )}
</div>
```

4. O contador atualiza automaticamente porque `visible` vem de `useInfiniteList`, que re-renderiza a cada incremento de `count` (scroll ou clique em "Carregar mais").

## Não faz parte deste plano

- Mexer no `InfiniteScrollSentinel` (ele já mostra "X de Y" inline durante o load — fica como feedback complementar).
- Adicionar contador em outras telas/cards.
- Mudar `useInfiniteList`.

## Critérios de aceite

(a) Badge "Mostrando X de Y" aparece ao lado do título quando há mais itens a carregar; (b) atualiza em tempo real ao rolar ou clicar em "Carregar mais"; (c) quando tudo está carregado, mostra apenas o total ("Y"); (d) quando lista vazia, badge não aparece; (e) usa `tabular-nums` para alinhamento estável; (f) `variant="secondary"` flat, PT-BR, sem emojis; (g) sem nova dependência; (h) arquivo permanece <120 linhas.

