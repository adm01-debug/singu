

# Plano: Volume semanal de interações no chart de sentimento

## Diagnóstico

- `SentimentTrendChart.tsx` já recebe `data` com `total` por semana (somatório de positive/neutral/negative/mixed) — usado hoje só no stat card "Conversas" e em `mixedStats`.
- Não há indicação visual semana-a-semana de quanto volume sustenta cada ponto. Uma semana com 1 interação positiva e outra com 50 aparecem com peso visual idêntico.
- Recharts suporta `ComposedChart` com eixo Y secundário — encaixa sem mudar shape de dados.

## O que será construído

Adicionar **barras de volume total por semana** ao fundo do chart existente, em eixo Y secundário, mantendo as 4 linhas de sentimento em primeiro plano.

### Mudanças em `src/components/interactions/insights/SentimentTrendChart.tsx`

1. Trocar `<LineChart>` por `<ComposedChart>` (mesma família Recharts, drop-in).
2. Adicionar `<YAxis yAxisId="volume" orientation="right" />` com `tick` discreto em `text-muted-foreground`, domínio `[0, 'dataMax']`, ticks compactos.
3. Manter o `<YAxis>` atual como `yAxisId="sentiment"` (default à esquerda, % positivo) e marcar todas as `<Line>` existentes com `yAxisId="sentiment"`.
4. Inserir **antes das linhas** (para ficar no fundo):
   ```tsx
   <Bar yAxisId="volume" dataKey="total" name="Volume" 
        fill="hsl(var(--muted-foreground))" fillOpacity={0.18}
        radius={[2, 2, 0, 0]} barSize={18} />
   ```
5. Atualizar o tooltip custom para listar "Volume: N interações" no topo (antes das linhas de sentimento), usando o mesmo dataset já disponível no payload.
6. Garantir que `ReferenceLine` de Melhor/Pior continue ancorado em `yAxisId="sentiment"`.
7. Sem mudanças em hooks, agregação, tipos, stat cards (Melhor/Pior/Conversas/Mistos) ou outros componentes.

## Critérios de aceite

(a) O chart de sentimento exibe barras cinza-translúcidas (opacidade ~18%) atrás das linhas, com altura proporcional ao total de interações da semana, em eixo Y secundário à direita; (b) as 4 linhas de sentimento continuam plotadas no eixo esquerdo (% positivo) com comportamento atual preservado, incluindo destaque da linha "Misto"; (c) tooltip lista "Volume: N interações" como primeira linha, seguido das linhas de sentimento existentes (omitindo as com `count === 0`); (d) `ReferenceLine` de Melhor/Pior continua funcionando no eixo de sentimento; (e) sem mudanças em `useInteractionsInsights.ts`, tipos públicos, stat cards do header ou outros componentes; (f) sem novas dependências, PT-BR, flat, sem `any`, sem `dangerouslySetInnerHTML`; (g) arquivo permanece ≤300 linhas; (h) sem regressão em layout responsivo, legenda, badge de direção ou seletor de período.

