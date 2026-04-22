

# Plano: Exibir contribuição (peso × score) e ranking no WhyScoreDrawer

## Estado atual

`WhyScoreDrawer.tsx` linhas 90–93 já ordena por `b.weight * b.score - a.weight * a.score`. Porém, na UI o usuário vê apenas `Score/100 · peso X%` sem entender por que a ordem é aquela. Falta tornar a **contribuição** visível.

## Mudanças

Único arquivo: `src/components/intelligence/WhyScoreDrawer.tsx`.

### 1. Calcular contribuição e contribuição relativa

No `useMemo` existente, em vez de retornar só `sortedFactors`, devolver também `contribution` (= `weight * score`, escala 0–100) e `contributionPct` (= contribuição do fator ÷ soma das contribuições, em %), além do `rank` (1, 2, 3…).

### 2. Mostrar badge "#1 maior impacto" no fator de topo

No primeiro item de `sortedFactors`, renderizar pequeno `Badge` com texto `#1 maior impacto` ao lado do label. Itens 2 e 3 ganham badge sutil `#2` / `#3` (variant outline, text-[10px]). Demais sem badge.

### 3. Linha de contribuição abaixo do score/peso

Logo abaixo da linha `Score/100 · peso X%`, adicionar `Contribuição: <X> pts (Y% do total)` em texto pequeno, com `<X>` = `Math.round(contribution)` e `<Y>` = `Math.round(contributionPct)`. Isso explica matematicamente por que o fator está naquela posição.

### 4. Mini-barra de contribuição relativa (opcional, leve)

Trocar a `<Progress value={f.score} />` atual por um layout de duas linhas:
- linha 1 (mantém): `<Progress value={f.score}>` — mostra a "qualidade" do fator
- linha 2 (NOVA): barra fininha (`h-1`) com `value={contributionPct}` e cor `bg-primary/60` — mostra "quanto pesou no total"

Cada barra com `aria-label` próprio para leitores de tela: `"Qualidade do fator: 72/100"` e `"Contribuição relativa: 35% do score total"`.

### 5. Tooltip explicativo no header da seção

Em "Fatores que contribuíram", adicionar pequeno ícone `Info` com tooltip: `"Ordenados pela contribuição real (peso × score). O fator no topo é o que mais influenciou o resultado."`.

### 6. Nada muda em consumidores

A API pública (`WhyScoreFactor`, props) permanece idêntica. `ScoreProntidaoCard`, `LeadScoreBadge`, `DealRiskDrawer` e demais não precisam mudar.

## Critérios de aceite

(a) Fatores continuam ordenados por `weight × score` desc; (b) primeiro fator exibe badge `#1 maior impacto`, 2º e 3º exibem `#2`/`#3` discretos; (c) cada fator mostra `Contribuição: X pts (Y% do total)` abaixo de score/peso; (d) duas barras visíveis: qualidade (existente) + contribuição relativa (nova, mais fina); (e) header da seção tem tooltip explicando o critério de ordenação; (f) `aria-label` claros nas duas barras; (g) sem `any`, sem nova dependência, PT-BR; (h) arquivo permanece <250 linhas.

