
# Plano: Gráfico de tendência do Score de Prontidão (semanal) na Ficha 360

## Contexto

A Ficha 360 já mostra o Score de Prontidão **atual** (0–100) calculado em tempo real por `computeProntidaoScore` a partir de `profile + intelligence` (cadência, recência, sentimento, canal). Falta visualizar a **evolução temporal** para entender se a preparação está melhorando, estável ou piorando.

Existem duas fontes possíveis de série temporal:
1. **`score_history` (tabela)** — já consumida por `useScoreHistory(contactId)` no `ScoreHistoryChart`. Armazena apenas o lead score genérico, não o Score de Prontidão (que é derivado, não persistido).
2. **`useExternalInteractions` agregado por semana** — proxy realista: como o Prontidão é dominado por cadência + recência + sentimento, podemos reconstruir a curva semanal recalculando o score retroativamente em cada semana usando as interações que existiam até aquela semana.

**Decisão**: opção 2 — reconstrução client-side a partir de interações já carregadas em `useFicha360`, **zero novas queries de rede**. Coerente com a memória "client-side fast feedback" e mantém o padrão da feature de pesos personalizáveis (mesma lógica recalcula ao vivo quando o usuário muda pesos).

## Implementação

### 1. Novo helper: `src/lib/prontidaoTrend.ts` (~110 linhas)

Função pura que reconstrói a série semanal:

```ts
export interface ProntidaoTrendPoint {
  weekStart: string;     // ISO yyyy-MM-dd (segunda-feira)
  weekLabel: string;     // "12/05" formato dd/MM
  score: number;         // 0-100
  level: ProntidaoLevel; // frio|morno|quente|pronto
  interactionCount: number;
}

export function computeProntidaoTrend(args: {
  interactions: ExternalInteraction[];
  profile: ProfileLike | null;
  intelligence: IntelligenceLike | null;
  weights?: ProntidaoWeights;
  weeks?: number; // default 8
}): ProntidaoTrendPoint[]
```

Lógica:
- Gera N janelas semanais retroativas (default 8) terminando hoje.
- Para cada semana W: monta um `profile` sintético com `last_contact_at` = última interação ≤ fim de W, `sentiment` = sentimento mais recente até W, mantém `cadence_days` e `intelligence` originais (best_channel/best_time são estáveis).
- Chama `computeProntidaoScore` reaproveitando os mesmos pesos.
- Retorna pontos ordenados cronologicamente. Semanas sem nenhuma interação prévia → `score: null` filtrado fora ou marcado como "sem dados".

### 2. Novo componente: `src/components/ficha-360/ProntidaoTrendChart.tsx` (~150 linhas)

Card flat com:
- **Header**: ícone `TrendingUp` + título "Tendência do Score de Prontidão" + badge de tendência (calculada por slope linear simples nos últimos 4 pontos: ↑ Melhorando / → Estável / ↓ Piorando) com cor semântica.
- **Stat row** (3 mini-stats): Score atual, Variação 4 semanas (`+X pts` / `-X pts`), Pico do período.
- **Gráfico**: `Recharts AreaChart` com `weekLabel` no X, score 0–100 no Y. Gradiente sutil sob a área, linha primary, dots pequenos, tooltip PT-BR mostrando "Semana de DD/MM • Score: X • Nível: {label} • {N} interações".
- **Linhas de referência horizontais** nos thresholds 40 (morno) e 70 (quente) com `strokeDasharray` discreto.
- **Empty state** quando `< 2` pontos com dados: mensagem "Histórico insuficiente. Registre mais interações para ver a evolução."
- **Acessibilidade**: envolto em `AccessibleChart` com tabela sr-only (semana → score).
- `React.memo`, tokens semânticos, flat (sem shadow).

### 3. Integração: `src/pages/Ficha360.tsx`

- Importar `useProntidaoWeightsStore`, `computeProntidaoTrend`, `ProntidaoTrendChart`.
- `const trend = useMemo(() => computeProntidaoTrend({ interactions: recentInteractions, profile, intelligence, weights, weeks: 8 }), [recentInteractions, profile, intelligence, weights])`.
- Montar `<ProntidaoTrendChart data={trend} currentScore={prontidao.score} />` **logo abaixo** do `ProximaAcaoCTA` (ou na coluna direita do cabeçalho, dependendo do layout — colocar abaixo do CTA mantém leitura natural: Score → Por que → Próxima ação → Tendência).
- Garantir que `interactionsLimit` em `useFicha360` cubra ao menos 8 semanas de histórico (atual = 50, suficiente).

## Padrões obrigatórios

- PT-BR
- Tokens semânticos (sem cores fixas; usar `hsl(var(--primary|success|warning|destructive|muted-foreground))`)
- Flat (sem shadow, gradiente sutil só no `<defs>` da área do gráfico)
- `React.memo` no chart
- Zero novas queries de rede (reaproveita `useFicha360.recentInteractions`)
- Reaproveita `computeProntidaoScore` + `ProntidaoWeights` do store → respeita pesos personalizados
- `AccessibleChart` para WCAG 2.1 §1.1.1

## Arquivos tocados

**Criados (2):**
- `src/lib/prontidaoTrend.ts`
- `src/components/ficha-360/ProntidaoTrendChart.tsx`

**Editado (1):**
- `src/pages/Ficha360.tsx` — calcular trend e montar chart abaixo do `ProximaAcaoCTA`

## Critério de fechamento

(a) Novo card "Tendência do Score de Prontidão" aparece na Ficha 360 abaixo do CTA Próxima Ação, (b) gráfico de área com 8 semanas, eixo X com labels dd/MM e Y de 0 a 100, (c) badge de tendência (↑ Melhorando / → Estável / ↓ Piorando) calculada por slope dos últimos 4 pontos, (d) tooltip PT-BR mostrando semana, score, nível e contagem de interações, (e) linhas de referência nos thresholds 40 e 70, (f) mudar pesos no `ProntidaoWeightsEditor` recalcula a curva inteira ao vivo, (g) empty state quando histórico < 2 pontos, (h) tabela sr-only via `AccessibleChart`, (i) zero novas queries de rede, (j) zero regressão no `ScoreProntidaoCard`, `ProximaAcaoCTA` ou no `ScoreHistoryChart` existente.
