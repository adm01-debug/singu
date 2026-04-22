

# Plano: Contador "X de Y" por tipo de interação no topo

## Objetivo

Mostrar, no topo da seção "Últimas Interações", um resumo compacto **por canal** no formato `X de Y` — onde `X` = quantos passam pelos filtros ativos (período + canais + busca) e `Y` = total no período (ignorando canais e busca). Permite avaliar de relance quantos itens de cada tipo estão sendo filtrados.

## Status atual

- `useFicha360ChannelCounts(contactId, days)` já calcula contagens por canal no período, **ignorando** filtro de canais — isso vira o `Y` (denominador).
- Falta o `X` (numerador): contagens dentro do mesmo período + canais + `q` aplicados (a lista renderizada).
- Os chips ativos em `FiltrosAtivosChips` já mostram um total agregado (`shownCount` de `totalCount`), mas não detalham por canal.

## Mudanças

### 1. `src/hooks/useFicha360ChannelCounts.ts` — exportar duas contagens

Estender o hook para retornar **dois mapas**:
- `totals: Record<string, number>` — Y por canal (período only, como hoje).
- `filtered: Record<string, number>` — X por canal (período + canais + q aplicados).

Implementação: receber `q?: string` e `channels?: string[]` opcionais. Reaproveita a query principal já existente (`useExternalInteractions(contactId, 200, { days })`) e calcula **ambas as contagens em memória** sobre o mesmo array, aplicando filtros adicionais para `filtered`. Sem nova query, sem custo de rede extra.

Helpers reutilizados: `normalizeForSearch` (já extraído em `src/lib/normalizeText.ts`) para o filtro `q`.

### 2. Novo: `src/components/ficha-360/ContagemPorTipoBar.tsx` (~110 linhas)

Faixa visual compacta no topo do card "Últimas Interações", **acima** dos chips ativos.

Layout:
```
Por tipo: 💬 WhatsApp 8/12 · 📞 Ligação 0/4 · ✉️ Email 7/7 · 👥 Reunião 0/0 · 📝 Nota 1/1
```

Regras visuais:
- Cada item: ícone + label PT-BR + `X/Y` em fonte tabular.
- Quando `Y === 0` (canal sem interações no período): item com `opacity-40`, sem `hover`.
- Quando `X === 0` mas `Y > 0` (canal totalmente filtrado fora): item com `opacity-60` e `text-muted-foreground` — sinaliza "tem dados mas seu filtro escondeu".
- Quando `X === Y && Y > 0`: item com cor padrão sem destaque adicional ("tudo passa").
- Quando `0 < X < Y`: numerador em `text-primary font-medium` para destacar a fração.
- Item com `aria-label="WhatsApp: 8 de 12 interações visíveis"`.

Sem clique nesta primeira versão (mantém escopo: apenas exibir contadores). A interação de toggle por canal continua em `FiltrosAtivosChips` e na `FiltrosInteracoesBar`.

### 3. `src/pages/Ficha360.tsx` — integração

- Chamar `useFicha360ChannelCounts(contactId, days, q, channels)` (assinatura estendida).
- Renderizar `<ContagemPorTipoBar totals={totals} filtered={filtered} isLoading={isLoading} />` no `headerExtra` do `UltimasInteracoesCard`, **acima** de `<FiltrosAtivosChips>`.
- Esconder a faixa quando todos os totais somam 0 (sem dados no período) — evita poluição em contatos sem histórico.

### 4. Loading & a11y

- Skeletons inline (`h-4 w-20`, 5 unidades) enquanto `isLoading=true`.
- Container com `role="group"` + `aria-label="Resumo por tipo de interação"`.
- Texto inicial "Por tipo:" em `text-xs text-muted-foreground` para hierarquia visual.

## Não muda

- `useExternalInteractions`, `countByChannel`, `useFicha360Filters`, `FiltrosAtivosChips`, `FavoritosFiltrosMenu`, atalhos de teclado, deeplink toast.
- Estrutura de query params, RLS, edge functions, tabelas.
- Limite de 200 itens da query de counts (já cobre cenário comum; lista principal segue separada com 50).

## Critérios de aceite

(a) Faixa "Por tipo: WhatsApp 8/12 · Ligação 0/4 · Email 7/7 · …" aparece no topo do card "Últimas Interações", acima dos chips ativos; (b) `Y` (denominador) ignora `channels` e `q`; (c) `X` (numerador) reflete os filtros ativos atuais (período + canais + busca); (d) canais com `Y=0` ficam discretos (`opacity-40`), canais com `X=0 && Y>0` em opacidade média; (e) numerador destacado quando há filtragem parcial; (f) faixa esconde quando não há dados no período; (g) skeletons durante loading; (h) `aria-label` descritivo em cada item; (i) sem nova query/rede, sem nova dependência, sem `any`, PT-BR, flat, novo arquivo <120 linhas.

