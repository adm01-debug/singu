

# Plano: Contagem por canal nos badges de filtro da Ficha 360

## Objetivo

Mostrar a contagem de interações disponíveis em cada canal nos badges da `FiltrosInteracoesBar` (ex.: `WhatsApp 123`), calculada **dentro do período ativo** e **ignorando o filtro de canal atual**, para que o usuário visualize o impacto antes de aplicar.

## Decisão de design

**Contagem "potencial por canal"**: cada badge mostra quantas interações existem naquele canal considerando o período selecionado, **sem** considerar quais canais já estão marcados. Isso responde a pergunta "quantas vou ver se eu marcar este canal?" — útil tanto antes quanto depois de aplicar.

Trade-off considerado: usar `recentInteractions` (já filtrado por canal) faria o número do canal ativo mostrar o total e os outros zerarem, o que confunde. A abordagem escolhida é consistente com padrões de faceted search.

## Arquitetura

### 1. Novo hook: `src/hooks/useFicha360ChannelCounts.ts` (~40 linhas)

Busca a contagem por canal no período ativo, sem filtrar por canal:

```ts
export function useFicha360ChannelCounts(
  contactId: string | undefined,
  days: Ficha360Period,
) {
  const { data } = useExternalInteractions(contactId, 200, { days });
  return useMemo(() => countByChannel(data), [data]);
}
```

- Reutiliza `useExternalInteractions` (sem `channels`) — a queryKey diferente garante cache separado da query filtrada principal.
- Reutiliza `countByChannel` de `src/lib/countByChannel.ts` (já existe).
- `staleTime` herdado (5 min) evita refetch desnecessário ao alternar canais.
- Limite de 200 é suficiente para a UI de contagem; se exceder, mostramos `200+` no badge.

### 2. `FiltrosInteracoesBar.tsx`

- Nova prop opcional `channelCounts?: Record<string, number>` (sem mudança quebradora).
- Cada badge de canal renderiza a contagem ao lado do label:

```tsx
<Badge ...>
  <Icon className="h-3 w-3" />
  <span className="hidden sm:inline">{opt.label}</span>
  {count > 0 && (
    <span className={cn(
      "ml-1 tabular-nums text-[10px]",
      active ? "opacity-90" : "text-muted-foreground"
    )}>
      {count > 200 ? '200+' : count}
    </span>
  )}
</Badge>
```

- Canais com `count === 0` ficam com badge atenuado (`opacity-50`) e não-clicável (mantém clique mas com `title="Sem interações no período"`); evita clique que filtra para vazio.
- Em mobile (sm:hidden), o número aparece junto ao ícone (mantém compacto).

### 3. `Ficha360.tsx`

- Instanciar `useFicha360ChannelCounts(contactId, days)` ao lado do hook de filtros.
- Passar `channelCounts` para `FiltrosInteracoesBar`.

### 4. Loading state

Enquanto a contagem carrega (primeira vez ou troca de período), os badges aparecem **sem número** (não mostra `0` falso). Ao chegar dado, número aparece com `transition-opacity` suave.

## Não faz parte deste plano

- Mostrar contagem em `FiltrosAtivosChips` (chips ativos já indicam seleção; adicionar número lá polui).
- Persistir contagens em cache compartilhado entre seções da Ficha.
- Mexer em `useFicha360Filters.ts`, `useFicha360.ts`, `useExternalInteractions.ts` (apenas consumidos).

## Critérios de aceite

(a) Cada badge de canal em `FiltrosInteracoesBar` exibe a contagem do período ativo (ex.: `WhatsApp 123`); (b) contagem ignora o filtro de canal atual (mostra "potencial"); (c) canais sem interações no período ficam atenuados (`opacity-50`) com tooltip explicativo; (d) contagens > 200 mostram `200+`; (e) números usam `tabular-nums` para alinhamento; (f) loading não mostra `0` falso — número aparece apenas quando dado chega; (g) novo hook `useFicha360ChannelCounts` ≤ 50 linhas, sem `any`; (h) `FiltrosInteracoesBar` ganha prop opcional `channelCounts`, sem quebra; (i) reutiliza `countByChannel` existente; (j) flat, PT-BR, sem emojis.

