

# Plano: Aviso de pesos baixos/soma zero + explicação da normalização

## Estado atual

Sliders aceitam 0–60 por fator. Não há feedback quando o usuário zera todos ou deixa a soma muito baixa. O cálculo já normaliza internamente (divide cada peso pela soma), mas isso é invisível ao usuário. Quando soma = 0, a divisão é indefinida e o score perde significado.

Hoje só existe um `Badge "Total: X%"` neutro nos dois pontos de edição (`ProntidaoWeightsEditor` no popover e `ProntidaoDefaultsSection` em Configurações).

## Objetivo

Mostrar um `Alert` contextual em ambos os editores quando:
- **Soma = 0**: estado crítico — score fica indefinido, sistema cai em fallback (pesos de fábrica). Tom de aviso (variant `destructive`).
- **Soma muito baixa (1–30)**: estado de atenção — pesos serão normalizados (ex.: 5/10/10/5 vira 16,7%/33,3%/33,3%/16,7%), mas a granularidade fica grosseira. Tom informativo.
- **Soma "saudável" (>30)**: nenhuma mensagem; só um micro-hint permanente de uma linha explicando "Os pesos são normalizados automaticamente — o que importa é a proporção entre eles, não a soma chegar a 100%."

## Mudanças

### 1. Helper puro `evaluateWeightsHealth` (novo)

`src/lib/prontidaoWeightsHealth.ts` (~40 linhas).

```ts
export type WeightsHealth = 'zero' | 'low' | 'ok';
export interface WeightsHealthInfo {
  status: WeightsHealth;
  total: number;
  normalized: Record<keyof ProntidaoWeights, number>; // percentuais 0-100, somam 100 (ou 0 se zero)
}
export function evaluateWeightsHealth(weights: ProntidaoWeights): WeightsHealthInfo;
```

Regras: `total === 0 → 'zero'`; `total < 30 → 'low'`; senão `'ok'`. Normalizados = `(w/total)*100` arredondado a 1 casa, ou todos 0 se total = 0.

### 2. `ProntidaoWeightsEditor.tsx`

- Importar `Alert`, `AlertDescription`, `AlertTriangle`/`Info` (lucide), `evaluateWeightsHealth`.
- Calcular `health = evaluateWeightsHealth(displayedWeights)`.
- Acima do bloco de sliders, renderizar:
  - Se `status === 'zero'`: `Alert variant="destructive"` (mas usando tokens semânticos via classe `border-destructive/50 text-destructive`) — "Soma dos pesos é zero. Sem proporção definida, o score volta ao padrão de fábrica. Aumente pelo menos um fator."
  - Se `status === 'low'`: `Alert` informativo — "Pesos muito baixos (soma {total}%). O sistema vai normalizar automaticamente, mas a precisão fica reduzida. Considere aumentar a proporção entre os fatores."
  - Sempre (independente do status): linha discreta abaixo do `Badge "Total"` — "O que importa é a **proporção** entre os fatores, não a soma. Os pesos são normalizados automaticamente." com `Info` icon `h-3 w-3`.
- Quando `status === 'ok'` e o usuário passa o cursor sobre o badge "Total", tooltip mostra a tabela de percentuais normalizados (cada fator com seu % final). Implementação leve: envolver o `Badge` num `Tooltip` que lista `Cadência: {n.cadence}% • Recência: {n.recency}% • ...` a partir de `health.normalized`.

### 3. `ProntidaoDefaultsSection.tsx`

Mesma lógica de Alert + hint permanente, posicionados acima do bloco de sliders e abaixo do `Badge "Total"` respectivamente. Reusa o mesmo helper.

### 4. Garantia de cálculo seguro (defesa em profundidade)

Verificar rapidamente em `src/lib/prontidaoScore.ts` se já há proteção para `total === 0`. Se não houver, adicionar guarda: quando soma = 0, usar `DEFAULT_PRONTIDAO_WEIGHTS` como fallback no cálculo (alinhado com o que o Alert promete ao usuário). Sem mudar a assinatura da função.

## Critérios de aceite

(a) Editor inline e seção de Configurações mostram `Alert` destructive quando soma = 0 e `Alert` informativo quando 1 ≤ soma ≤ 30; (b) ambos os locais mostram hint permanente (1 linha) explicando que os pesos são normalizados automaticamente e a proporção é o que conta; (c) tooltip no badge "Total" mostra os percentuais normalizados por fator; (d) helper `evaluateWeightsHealth` é puro, testável, sem dependências, <50 linhas; (e) `prontidaoScore.ts` tem fallback seguro para soma = 0 (usa pesos de fábrica), alinhado com a mensagem do Alert; (f) sem nova dependência, sem `any`, PT-BR, cores via tokens semânticos; (g) cada arquivo permanece <200 linhas; (h) a11y: Alerts com `role="status"` (não `alert`), tooltip com conteúdo acessível.

