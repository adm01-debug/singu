

# Plano: Ordenar excertos por relevância

## Diagnóstico

- Hoje `extractExcerpts` (em `src/lib/insights/extractExcerpts.ts`) intercala excertos em **round-robin por interação**, preservando a ordem original das fontes e a posição dentro de cada uma. O resultado: os 5 excertos exibidos no `ThemeExamplesDrawer` refletem distribuição entre conversas, não relevância.
- Cada `RawHit` já tem `position` (offset no texto) e o regex já permite contar quantas keywords/matches existem no snippet.
- Para "relevância" usaremos dois sinais simples e determinísticos:
  1. **Densidade de matches** no próprio snippet (quantas ocorrências de keywords aparecem na janela exibida) — mais matches = mais relevante.
  2. **Posição relativa** no texto (`position / textLength`) — empate desempata a favor de quem aparece mais cedo na conversa (sinal de tema central, não digressão final).
- Preservar o cap por fonte (`maxPerSource`) para evitar que uma única conversa monopolize os 5 slots.

## Mudanças

### `src/lib/insights/extractExcerpts.ts`

1. **Calcular densidade por hit**: ao montar cada `RawHit`, contar matches do regex dentro do `snippet` final (re-executar o mesmo regex sobre o snippet com `lastIndex = 0`). Armazenar `density: number` e `relPosition: number` (= `matchStart / Math.max(textLength, 1)`) no hit.
2. **Substituir o round-robin** por uma seleção em duas fases:
   - **Fase A — coleta com cap por fonte**: manter agrupamento por source e o limite `maxPerSource` (já existente) para garantir diversidade.
   - **Fase B — ordenação global por relevância**: achatar todos os hits coletados em uma lista única e ordenar por:
     - `density` desc (primário),
     - `relPosition` asc (secundário, mais cedo = melhor),
     - ordem original da fonte como desempate final estável.
   - Cortar em `totalCap`.
3. **Manter a interface `Excerpt` inalterada** (não expor `density`/`relPosition`) — são apenas critérios internos de ordenação. Sem mudanças em hooks, tipos, no drawer ou em `pickTopPassages`.
4. Sem novas dependências, sem `any`, arquivo permanece bem abaixo de 400 linhas.

## Critérios de aceite

(a) Os até 5 excertos exibidos no `ThemeExamplesDrawer` aparecem ordenados por relevância: mais matches de keywords no snippet primeiro, com posição mais cedo no texto desempatando; (b) cap `maxPerSource = 2` continua valendo, evitando que uma única interação ocupe todos os slots; (c) excertos sem matches ou com regex inválida continuam retornando `[]` (mesmo fallback atual aciona `pickTopPassages`); (d) nenhuma mudança em `pickTopPassages.ts`, `ThemeExamplesDrawer.tsx`, hooks, tipos públicos ou outros componentes; (e) sem novas dependências, sem `any`, sem `dangerouslySetInnerHTML`; (f) função permanece pura, determinística e estável (mesma entrada → mesma saída); (g) PT-BR, flat; (h) sem regressão em highlight de keywords, banner de fallback, seletor Curto/Médio/Longo, link Ficha 360 ou estados de loading/empty.

