

# Plano: Cores semânticas no % Positivo do tooltip

## Diagnóstico

No `WeeklySentimentTooltip` em `src/components/interactions/insights/SentimentTrendChart.tsx`, o valor `% Positivo` da semana já é calculado e exibido, mas usa cor única (provavelmente `pctClass` derivado de outro contexto ou cor neutra). Falta um esquema **semântico em 3 faixas** para leitura instantânea da saúde da semana.

## O que será construído

Toda a mudança em `src/components/interactions/insights/SentimentTrendChart.tsx`. Sem novos hooks/dependências.

### 1. Helper local `pctPositiveClass(pct: number): string`

Função pura adicionada no topo do arquivo (junto a `formatWeekRange`):
- `pct >= 60` → `"text-success"` (verde)
- `pct <= 30` → `"text-destructive"` (vermelho)
- caso contrário (31–59) → `"text-muted-foreground"` (cinza neutro)

Faixas inclusivas conforme pedido (≥60 e ≤30).

### 2. Aplicação no tooltip

Dentro do `WeeklySentimentTooltip`, substituir a classe atual do número `% Positivo` por `pctPositiveClass(positivePct)` combinada com `font-semibold tabular-nums` via `cn()`.

A linha MM3 (média móvel) **mantém** estilo `text-muted-foreground` atual — a cor semântica aplica-se apenas ao valor da semana corrente, para não competir visualmente.

### 3. Sem alterações em

- Cálculo de `positivePct`, MM3, total, veredito (se já existir), linhas detalhadas, mini-barras, switch "Mostrar zerados", anotações, header com range.
- Hooks de fetch, agregação, séries, eixos, legenda, switch de % positivo no chart, evolução, confiança, IP masking.
- Cores das mini-barras de sentimento e do bullet do veredito.

## Critérios de aceite

(a) Helper `pctPositiveClass(pct)` retorna `text-success` para `pct >= 60`, `text-destructive` para `pct <= 30`, `text-muted-foreground` no intervalo 31–59; (b) o número `% Positivo` no tooltip aplica essa classe via `cn()` mantendo `font-semibold tabular-nums`; (c) MM3 permanece em `text-muted-foreground`; (d) sem mudanças em cálculo de pct, MM3, veredito, linhas detalhadas, mini-barras, switch, anotações, header ou demais funcionalidades; (e) sem novas dependências, PT-BR, flat, sem `any`, sem `dangerouslySetInnerHTML`; (f) arquivo permanece ≤500 linhas.

