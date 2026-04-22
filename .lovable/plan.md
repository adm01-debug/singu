

# Plano: Mostrar peso percentual e razão da banda (low/mid/high) no WhyScoreDrawer

## Estado atual

`WhyScoreDrawer` mostra para cada fator: ícone de direção, label, score/100, peso bruto (`peso X%`), contribuição em pts e duas barras. Mas:

1. O **peso exibido é o peso bruto do fator** (ex.: 30%), não o peso **normalizado em relação ao total dos fatores ranqueados** — o usuário não vê "este fator vale X% do score final".
2. O **score do fator** (0–100) é mostrado como número e barra, mas não há explicação de **por que ele caiu na banda atual** (low <35 / mid 35–65 / high >65). O `inferDirection` já usa esses cortes, mas o motivo é invisível.

## Objetivo

Adicionar duas informações por fator:

- **Peso percentual normalizado**: `peso_fator / soma_pesos × 100` → "representa X% do score". Mantém o `peso bruto` como tooltip secundário.
- **Razão da banda**: chip discreto `Banda: baixa/média/alta` com tooltip explicando os cortes (`<35 baixa`, `35–65 média`, `>65 alta`) e qual deles este fator atingiu.

## Mudanças

Único arquivo: `src/components/intelligence/WhyScoreDrawer.tsx` (ou `whyScoreHelpers.ts` se já extraído — checar primeiro).

1. **Helper `getBand(score)`** retornando `'low' | 'mid' | 'high'` + `BAND_META` com label PT-BR e classe de cor (reusa tokens semânticos existentes).
2. **Cálculo do peso normalizado**: somar `factor.weight` de todos os fatores ranqueados, dividir cada um pela soma × 100. Adicionar como `normalizedWeight` no objeto enriquecido por `rankFactors` (ou inline).
3. **UI por fator**: 
   - Linha de meta atual (`Score/100 · peso X% (bruto Y%)`) → reescrever como `Score/100 · representa X% do total`.
   - Adicionar chip `Banda: {label}` ao lado do chip de direção, com `Tooltip` explicando a faixa.
4. **Tooltip explicativo no header da seção de fatores**: já existe, adicionar uma linha sobre bandas.

## Critérios de aceite

(a) Cada fator mostra "representa X% do score" usando peso normalizado; (b) cada fator mostra chip "Banda: baixa/média/alta" alinhado com a cor semântica; (c) tooltip do chip de banda explica os cortes (`<35`, `35–65`, `>65`) e indica qual o fator atingiu; (d) tooltip do peso mostra o valor bruto como referência secundária; (e) cores via tokens semânticos (sem hex direto); (f) sem nova dependência, sem `any`, PT-BR; (g) `WhyScoreDrawer` permanece <320 linhas; (h) `aria-label` do chip de banda informa "Banda {label}: score {N} entre {min} e {max}".

