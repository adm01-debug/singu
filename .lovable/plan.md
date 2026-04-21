

# Plano: Card "Objeções em destaque" na aba Insights

## Diagnóstico

- `useInteractionsInsights` já agrega `objections: ObjectionAggregate[]` (objection, category, count, handled, unhandled, suggestedResponse) a partir de `conversation_analyses`.
- Já existem 2 componentes prontos no projeto: `ObjectionsRanking` (lista completa simples) e `ObjectionsSpotlight` (top 3 com severidade alta/média/baixa, barra de taxa de tratamento, resposta sugerida) — exatamente o que o usuário pede.
- Verificar se `ObjectionsSpotlight` já está renderizado no `InsightsPanel.tsx` da aba `/interacoes`. Se não, é só adicionar.

## O que será construído

Garantir que o card **"Objeções em destaque"** apareça em destaque na aba Insights, usando o `ObjectionsSpotlight` já existente (top 3, severidade colorida, contagem, taxa de tratamento e barra), posicionado **acima** do `ObjectionsRanking` (lista completa) para dar destaque visual.

## Mudanças

### 1. `src/components/interactions/insights/InsightsPanel.tsx`
- Importar `ObjectionsSpotlight` (se ainda não importado).
- Renderizar dentro de uma `Card` própria com header **"Objeções em destaque"** + `CardDescription` curta ("Top 3 com maior risco de bloqueio"), passando `objections={objections}` (já disponível no painel via `useInteractionsInsights`).
- Posicionar logo acima do card existente que contém o `ObjectionsRanking` (mantendo a lista completa abaixo, intacta).
- Não renderizar a `Card` quando `objections.length === 0` (o componente já retorna `null` nesse caso, mas evitamos card vazio no layout).

### 2. Sem alterações em hooks, tipos ou agregação
- `ObjectionAggregate`, `useInteractionsInsights` e `ObjectionsSpotlight` já estão prontos. Zero código novo de lógica.

## Critérios de aceite

(a) Aba Insights de `/interacoes` exibe novo card **"Objeções em destaque"** acima da lista completa de objeções; (b) mostra até 3 objeções priorizadas por `unhandled*2 + count` (regra atual do `ObjectionsSpotlight`); (c) cada item tem ícone de severidade (Crítica/Atenção/Bem tratada), contagem de menções, "X/Y tratadas", taxa percentual e barra colorida; (d) quando há `unhandled > 0` e `suggestedResponse`, mostra bloco de "Resposta sugerida"; (e) quando todas tratadas, mostra confirmação positiva; (f) card oculto quando não há objeções no período (sem placeholder vazio); (g) PT-BR, flat, sem novas dependências, sem mudanças em arquivos fora de `InsightsPanel.tsx`; (h) lista completa (`ObjectionsRanking`) permanece disponível abaixo, sem regressão.

