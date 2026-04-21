

# Plano: Média móvel na tendência de sentimento

## Diagnóstico

- O `SentimentTrendChart.tsx` plota 4 séries semanais (`% positivo`, `% neutro`, `% negativo`, `% misto`) diretamente dos pontos brutos vindos de `data: SentimentTrendPoint[]`. Semanas com pouco volume causam picos visuais que dificultam ler o rumo geral.
- Já temos `evolutionStats` (atual vs. anterior) e o badge de tendência da janela, mas falta uma camada visual contínua que suavize a curva semana-a-semana.
- Os dados necessários (`positive`, `neutral`, `negative`, `mixed`, `total` por semana) já estão disponíveis localmente — não precisa tocar no hook.

## O que será construído

Sobrepor uma **linha de média móvel ponderada por volume** sobre a série de `% positivo` (a principal), com janela configurável (padrão 3 semanas), para evidenciar o rumo sem competir visualmente com as 4 séries existentes.

### Mudanças em `src/components/interactions/insights/SentimentTrendChart.tsx`

1. Novo `useMemo` `dataWithMA` que enriquece cada ponto com `positivePctMA`:
   - Janela centrada/trailing de 3 semanas (semana atual + 2 anteriores).
   - Cálculo **ponderado por volume**: `sum(positive[i-2..i]) / sum(total[i-2..i]) × 100`.
   - Quando o ponto está nas 2 primeiras semanas, usa janela menor (sem `null`s no meio).
   - Se `total` somado da janela = 0, retorna `null` (Recharts ignora).
2. Nova `<Line>` adicionada **antes** das linhas existentes (para ficar atrás visualmente):
   ```tsx
   <Line yAxisId="sentiment" type="monotone" dataKey="positivePctMA"
         name="Tendência (MM3)" stroke="hsl(var(--success))"
         strokeWidth={3} strokeOpacity={0.45} strokeDasharray="0"
         dot={false} activeDot={false} isAnimationActive={false} />
   ```
3. Toggle simples no header do chart (próximo ao seletor de período): botão `Suavizar` (ghost size sm) com estado local `useState<boolean>(true)`. Quando off, a `<Line>` da MA não renderiza.
4. Tooltip atualizado para incluir, quando MA estiver ativa e o valor existir, uma linha extra: `Tendência (MM3): X%` logo abaixo do `% positivo` bruto, em cinza médio para indicar que é derivado.
5. Sem mudanças em `useInteractionsInsights.ts`, tipos públicos (`SentimentTrendPoint` ganha campo opcional só localmente via tipo derivado interno), stat cards, eixos, ReferenceLines, barras de volume ou faixa de evolução.

## Critérios de aceite

(a) Sobre o chart aparece uma linha verde translúcida (opacidade ~45%, stroke 3px) representando a média móvel ponderada de 3 semanas do `% positivo`; (b) toggle `Suavizar` no header liga/desliga a linha sem afetar as demais séries (padrão: ligado); (c) tooltip mostra `Tendência (MM3): X%` apenas quando ativa e quando há volume na janela; (d) cálculo é ponderado por volume (não média simples), para que semanas de baixo volume não distorçam; (e) primeiros 1-2 pontos usam janela parcial (sem buracos); (f) sem mudanças em hooks, agregação externa, tipos públicos, stat cards, faixa de evolução, badge de direção, eixos ou barras de volume; (g) sem novas dependências, PT-BR, flat, sem `any`, sem `dangerouslySetInnerHTML`; (h) arquivo permanece ≤300 linhas; (i) sem regressão em layout responsivo, legenda, ReferenceLines de Melhor/Pior ou seletor de período.

