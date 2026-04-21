

# Plano: Padronizar layout do tooltip do SentimentTrendChart

## Diagnóstico

O `WeeklySentimentTooltip` em `src/components/interactions/insights/SentimentTrendChart.tsx` evoluiu em camadas (mini-barras, switch, veredito, cores semânticas, fallback). O resultado é funcional mas visualmente heterogêneo: bullets em formatos diferentes, espaçamentos ad-hoc, mistura de `text-[10px]`/`text-xs`, classes de cor inline em vez de tokens semânticos consistentes, e linhas de sentimento com layout que varia conforme o estado (com/sem mini-barra, com/sem "—").

## O que será construído

Toda a mudança em `src/components/interactions/insights/SentimentTrendChart.tsx`. Sem novos hooks/dependências.

### 1. Constantes de tokens unificadas

No topo do arquivo, consolidar mapas de sentimento existentes em uma única estrutura `SENTIMENT_TOKENS`:

```ts
const SENTIMENT_TOKENS: Record<SentimentKey, {
  label: string;        // PT-BR: "Positivo" | "Neutro" | "Negativo" | "Misto"
  swatch: string;       // bg-success | bg-muted-foreground | bg-destructive | bg-warning
  text: string;         // text-success | text-muted-foreground | text-destructive | text-warning
  bar: string;          // bg-success/70 ... (mini-barra com leve transparência)
}>
```

Remove duplicação entre `SENTIMENT_ROWS`, mapas do veredito e classes inline espalhadas.

### 2. Layout de linha padronizado

Cada linha de sentimento (positivo/neutro/negativo/misto) passa a usar o **mesmo grid** de 3 colunas com `gap-2 text-xs`:

```text
[swatch 8px] [Label .................. ] [count tabular] [pct tabular text-muted]
```

Estrutura:
- **Swatch**: `<span className="h-2 w-2 rounded-sm shrink-0" />` colorido via `SENTIMENT_TOKENS[k].swatch` — formato quadrado uniforme (substitui bullets redondos inconsistentes).
- **Label**: `flex-1 truncate text-foreground` em PT-BR.
- **Count**: `tabular-nums font-medium text-foreground min-w-[1.5rem] text-right`.
- **Percentual**: `tabular-nums text-muted-foreground text-[10px] min-w-[2.5rem] text-right` no formato `{pct}%`.

Mini-barra horizontal **mantida** abaixo da linha como faixa fina (`h-0.5 mt-0.5 rounded-full bg-{color}/70`) com largura proporcional ao `pct` — preserva o feedback visual de proporção sem inflar a altura.

Linhas com `count === 0` continuam respeitando o switch "Mostrar zerados": ocultas por padrão; quando exibidas, swatch/label/count em `opacity-50` e pct mostrado como `0%` (não mais "—") para padronização.

### 3. Tipografia e espaçamento consistentes

- **Header** (range da semana + total): `text-xs font-medium text-foreground` + total em `tabular-nums`.
- **% Positivo + MM3**: container `text-xs` (não mais `text-[10px]`), valor de pct mantém `pctClass()` semântico via `cn()`, MM3 em `text-muted-foreground`.
- **Veredito**: container `text-xs` com swatch quadrado (mesmo componente das linhas) em vez de bullet redondo; texto do sentimento na cor semântica via `SENTIMENT_TOKENS[k].text`; sufixo `({pct}% das conversas)` em `text-muted-foreground text-[10px]`.
- **Switch "Mostrar zerados"**: `text-[10px] text-muted-foreground` mantido.
- **Anotações**: `text-[10px] text-muted-foreground` mantido.
- **Separadores**: todos os blocos separados por `border-t border-border/60 pt-2 mt-2` (mesma espessura, mesma opacidade).

### 4. Container do tooltip

Padronizar wrapper único:
- `rounded-md border border-border bg-popover text-popover-foreground shadow-sm p-3 min-w-[220px] max-w-[280px] pointer-events-auto space-y-2`.
- Remove paddings/margens ad-hoc internos (substituídos por `space-y-2` + separadores explícitos onde necessário).

### 5. Sem alterações em

- Cálculo de `total`, `positivePct`, MM3, veredito (lógica de empate e prioridade), `computePositivePct`, `pctClass`, `formatWeekRange`, fallback defensivo.
- Switch "Mostrar zerados" (estado, `localStorage`, `onCheckedChange`).
- Bloco de anotações (lógica de exibição).
- Hooks de fetch, agregação, séries, eixos, legenda, switch de % positivo no chart, evolução, confiança, IP masking.
- Cores semânticas existentes (apenas centralizadas em `SENTIMENT_TOKENS`).

## Critérios de aceite

(a) Existe `SENTIMENT_TOKENS` no topo do arquivo centralizando label PT-BR, swatch, text e bar para os 4 sentimentos; (b) cada linha de sentimento usa swatch quadrado `h-2 w-2 rounded-sm`, label `flex-1 truncate`, count `tabular-nums font-medium`, percentual `tabular-nums text-muted-foreground text-[10px]`, todos no mesmo grid `gap-2 text-xs`; (c) mini-barra horizontal proporcional preservada como `h-0.5` colorida com `/70`; (d) linhas zeradas (quando exibidas via switch) usam `opacity-50` e pct `0%` em vez de "—"; (e) header, % positivo, MM3, veredito, switch e anotações alinhados em `text-xs`/`text-[10px]` consistentes, todos os números com `tabular-nums`; (f) veredito usa o mesmo swatch quadrado das linhas (não bullet redondo); (g) container do tooltip único: `rounded-md border border-border bg-popover text-popover-foreground shadow-sm p-3 min-w-[220px] max-w-[280px] space-y-2`, separadores `border-t border-border/60` uniformes; (h) PT-BR mantido (Positivo/Neutro/Negativo/Misto); (i) sem mudanças em cálculos, switch, fallback, hooks, séries, eixos, evolução, confiança ou demais funcionalidades; (j) sem novas dependências, sem `any`, sem `dangerouslySetInnerHTML`, flat; (k) arquivo permanece ≤550 linhas.

