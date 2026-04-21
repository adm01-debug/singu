
# Plano: Exemplos por categoria de sentimento na aba Insights de /interacoes

## Status atual

A aba **Insights** em `/interacoes` já está funcional e usa o pipeline de IA existente (`conversation_analyses`, gerado automaticamente para interações com transcrição ≥80 chars):

- KPIs: conversas analisadas, sentimento dominante, coaching score, objeções não tratadas
- Gráficos: distribuição de sentimento (pizza/bar) e tendência semanal
- Ranking de **temas** com drawer de exemplos clicáveis por tema
- Ranking de **objeções** recorrentes com handled/unhandled

**Lacuna real:** os 4 buckets de sentimento (Positivo / Neutro / Negativo / Misto) **não são clicáveis** — não há como abrir a lista de conversas que compõem aquele bucket. O drawer de exemplos só existe para temas.

Esta entrega fecha essa lacuna reaproveitando o padrão `ThemeExamplesDrawer`.

## Reutilização

- `ThemeExamplesDrawer` — copiar estrutura para `SentimentExamplesDrawer`
- `useInteractionsInsights` — já retorna `list` (todas as `ConversationAnalysis` do período) com `sentiment_overall` e `interaction_id`
- `Sheet`, `Badge`, `Link` para `/contatos/:id/ficha-360` — já em uso

Sem novo fetch agregado, sem novo hook de dados, sem nova RPC.

## Arquitetura

```text
InsightsPanel
 ├─ KPIs (existente)
 ├─ SentimentDistributionChart (existente)
 │     └─ [NOVO] onSelect(bucket) → abre drawer
 ├─ SentimentTrendChart (existente)
 ├─ ThemesRanking + ThemeExamplesDrawer (existente)
 ├─ ObjectionsRanking (existente)
 └─ [NOVO] SentimentExamplesDrawer
       ├─ recebe bucket selecionado + ids das análises desse bucket
       └─ busca interactions(id, title, type, created_at, content, contact_id, sentiment)
            limit 20, order by created_at desc
```

## Implementação

### 1. `useInteractionsInsights.ts` — expor agrupamento por bucket

Já existe `list: ConversationAnalysis[]`. Adicionar derivação memoizada:

```ts
sentimentBuckets: Record<SentimentOverall, string[]> // interaction_ids
```

Construído no mesmo `useMemo` que já calcula `sentimentDistribution`. Zero overhead.

### 2. Novo `src/components/interactions/insights/SentimentExamplesDrawer.tsx` (≤120 linhas)

Espelho de `ThemeExamplesDrawer`, com:

- Props: `bucket: SentimentOverall | null`, `interactionIds: string[]`, `onClose: () => void`
- Título: "Conversas com sentimento {Positivo|Neutro|Negativo|Misto}" + `Badge` colorido pelo bucket
- Subtítulo: `${interactionIds.length} conversas no período`
- `useEffect` busca em `interactions` com `.in('id', interactionIds.slice(0, 20))` (limita payload)
- Cards de exemplo idênticos ao Theme drawer: título, snippet, tipo + data, link "Ficha 360"
- Loading com `Loader2` + cleanup `cancelled`
- Vazio: "Nenhum exemplo disponível"
- Sem `any`, defensivo com `Array.isArray`, PT-BR

### 3. `SentimentDistributionChart.tsx` — tornar buckets clicáveis

- Adicionar prop opcional `onSelectBucket?: (key: SentimentOverall) => void`
- Aplicar `cursor-pointer` e handler de clique nas fatias/barras (Recharts `onClick` no `Cell`/`Bar`)
- Tooltip já existente preservado
- A11y: `role="button"` com `aria-label="Ver conversas com sentimento {label}"` ao redor de cada item legenda também (caso o gráfico tenha legenda lateral)

### 4. `InsightsPanel.tsx` — orquestrar drawer de sentimento

- Novo state: `selectedBucket: SentimentOverall | null`
- Passar `onSelectBucket={setSelectedBucket}` ao `SentimentDistributionChart`
- Renderizar `<SentimentExamplesDrawer bucket={selectedBucket} interactionIds={sentimentBuckets[selectedBucket] ?? []} onClose={() => setSelectedBucket(null)} />` ao final, ao lado do `ThemeExamplesDrawer`

### 5. Edge cases

- Bucket sem conversas: drawer não abre (clique no-op se `count === 0`)
- Mudança de período (`7d/30d/90d`): drawer fecha automaticamente via `useEffect` watch em `period`
- Limite de 20 exemplos para evitar lista gigante; rodapé discreto "Mostrando 20 de N" quando aplicável

### 6. Padrões obrigatórios

- PT-BR
- Sem `any`, sem `dangerouslySetInnerHTML`
- `Array.isArray()` defensivo
- Tokens semânticos (cores de sentimento via `success`/`muted`/`destructive`/`warning`)
- Zero novas queries de rede além da busca pontual ao abrir o drawer
- `React.memo` no novo drawer

## Arquivos tocados

**Novos (1):**
- `src/components/interactions/insights/SentimentExamplesDrawer.tsx`

**Editados (3):**
- `src/hooks/useInteractionsInsights.ts` — adicionar `sentimentBuckets` ao retorno
- `src/components/interactions/insights/SentimentDistributionChart.tsx` — clique por bucket
- `src/components/interactions/insights/InsightsPanel.tsx` — montar drawer e estado

## Critério de fechamento

(a) Buckets de sentimento na aba Insights ficam clicáveis (cursor + a11y), (b) clique abre Sheet com até 20 conversas daquele bucket no período, (c) cada exemplo mostra título, snippet, tipo, data, badge de sentimento e link para Ficha 360, (d) loading e empty states tratados, (e) bucket vazio não abre drawer, (f) trocar período (7/30/90) fecha o drawer, (g) zero novas queries agregadas (só fetch pontual ao abrir), (h) zero regressão em temas, objeções, KPIs ou tendência.
