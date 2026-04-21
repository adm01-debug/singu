
# Plano: Tooltip rico no SentimentTrendChart

## Objetivo

Substituir o tooltip padrão do Recharts no `SentimentTrendChart` por um tooltip customizado que mostra, ao passar o mouse sobre uma semana, um resumo claro e organizado: total de conversas, contagem por sentimento (positivo, neutro, negativo, misto) com swatches coloridos e percentuais, e o `% positivo` da semana em destaque.

## Status atual

O `SentimentTrendChart` já recebe `data: SentimentTrendPoint[]` com todos os campos necessários (`positive`, `neutral`, `negative`, `mixed`, `total`, `positivePct`) e usa o `<Tooltip>` padrão do Recharts apenas com `labelFormatter`. O tooltip mostra as séries empilhadas em ordem de eixo, mistura escalas (count vs %) e não dá leitura imediata do contexto da semana.

## Implementação

### 1. Componente `WeeklySentimentTooltip` (inline no arquivo, ≤60 linhas)

Tooltip custom recebe `active`, `payload`, `label` (props padrão do Recharts) e renderiza só quando `active && payload?.[0]?.payload`. Lê o `SentimentTrendPoint` direto de `payload[0].payload` (evita depender da ordem das séries).

Layout (flat, tokens semânticos, sem shadow):

```
┌─────────────────────────────────────┐
│ Semana de 14 abr                    │  ← header (text-xs font-semibold)
│ 23 conversas · 65% positivo         │  ← subhead (text-[10px] muted)
├─────────────────────────────────────┤
│ ● Positivo            15  (65%)     │
│ ● Neutro               5  (22%)     │
│ ● Negativo             2   (9%)     │
│ ● Misto                1   (4%)     │  ← oculta se 0
└─────────────────────────────────────┘
```

- Cada linha: swatch 8px com `CHART_COLORS[key]`, label, contagem alinhada à direita, % entre parênteses
- `% positivo` no header em cor `text-success` quando ≥60%, `text-destructive` quando ≤30%, `text-muted-foreground` no meio
- Linhas com count `0` são omitidas para reduzir ruído
- Container: `rounded-md border border-border bg-popover px-3 py-2 text-xs min-w-[200px]`

### 2. Plug no `<Tooltip>`

Substituir o `Tooltip` atual pelo custom:

```tsx
<Tooltip content={<WeeklySentimentTooltip />} cursor={{ fill: "hsl(var(--muted))", opacity: 0.3 }} />
```

Remove `contentStyle` e `labelFormatter` (agora dentro do componente custom).

### 3. Edge cases

- `total === 0`: mostra apenas header "Semana de DD mês · sem conversas"
- `positivePct` ausente → fallback `Math.round((positive/total)*100)` defensivo
- Payload vazio/inativo → retorna `null`
- Type-safe: tipa props como `TooltipProps<number, string>` do `recharts`, sem `any`

### 4. Padrões obrigatórios

- PT-BR
- Sem `any`, sem `dangerouslySetInnerHTML`
- Tokens semânticos (`success`, `destructive`, `muted-foreground`, `popover`, `border`)
- Flat (sem shadow, sem gradient)
- Zero novas queries
- Mantém `React.memo` no chart

## Arquivos tocados

**Editado (1):**
- `src/components/interactions/insights/SentimentTrendChart.tsx` — adiciona `WeeklySentimentTooltip` interno e pluga em `<Tooltip content={…}/>`

## Critério de fechamento

(a) Hover sobre qualquer semana mostra tooltip custom com header "Semana de DD mês · N conversas · X% positivo", (b) lista de sentimentos com swatch colorido, contagem e % de cada um, omitindo linhas com count 0, (c) % positivo do header colorido conforme faixa (verde ≥60, vermelho ≤30, neutro), (d) semana sem conversas mostra mensagem reduzida, (e) zero novas queries, (f) zero regressão em barras, linhas, ReferenceLines, header de evolução ou mini-stats.
