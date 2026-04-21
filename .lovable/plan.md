

# Plano: Refinamento do tooltip do SentimentTrendChart

## Diagnóstico

O `WeeklySentimentTooltip` em `SentimentTrendChart.tsx` (linhas 80-148) **já implementa** a maior parte do pedido:
- Total de conversas da semana ✓
- % positivo da semana ✓
- Contagens por sentimento (positivo/neutro/negativo/misto) ✓
- MM3 e anotações como bônus ✓

**Lacunas reais a corrigir:**
1. Sentimentos com `count === 0` são ocultados (linha 115: `if (count === 0) return null;`) — então quando uma semana tem só Positivos, o usuário não vê "Negativo: 0" e fica em dúvida se o dado é zero ou ausente.
2. O título usa o ISO bruto (`formatWeek` resulta em "15 de jan"), mas falta o **range da semana** (ex.: "15 – 21 jan") para reforçar que é agregação semanal.
3. Falta uma linha de "destaque" no topo separando claramente **volume total** do detalhamento.
4. Atualmente a ordem visual mistura percentuais quando todos os 4 sentimentos aparecem — mini barras horizontais ajudam a leitura.

## O que será construído

Toda a mudança em `src/components/interactions/insights/SentimentTrendChart.tsx`. Sem novos hooks/dependências.

### 1. `WeeklySentimentTooltip` reformulado

**Header reforçado:**
- Linha 1: `Semana de {dd mmm} – {dd mmm}` (calculado com `weekStart` + 6 dias).
- Linha 2 (destaque): `Total: {N} conversas` em `text-sm font-semibold text-foreground`.
- Quando `total === 0`: mostra apenas "sem conversas" (preserva).

**Bloco de % positivo:**
- `% Positivo: NN%` com cor semântica (`pctClass`).
- MM3 abaixo, se disponível (preserva).

**Detalhamento por sentimento (sempre 4 linhas):**
- Renderiza **sempre** as 4 linhas (positivo/neutro/negativo/misto), inclusive zeros — `count === 0` mostra "—" em `text-muted-foreground/50`.
- Adiciona mini-barra horizontal (largura proporcional ao % do total) abaixo do número, usando a cor do sentimento — feedback visual instantâneo da distribuição.
- Mantém: bullet colorido + label + count tabular + percentual entre parênteses.

**Anotações:**
- Bloco preservado integralmente.

### 2. Helper local `formatWeekRange(weekStartIso): string`

- Recebe ISO `YYYY-MM-DD`, retorna `"15 – 21 jan"` (ou `"29 jan – 04 fev"` cruzando mês).
- Usa `toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })`.
- Função local (não exportada), 8-10 linhas.

### 3. Sem alterações em

- Conexão do tooltip ao `<Tooltip content={<WeeklySentimentTooltip />}>` (já está correta na linha 413).
- Todas as séries, eixos, legenda, switch de % positivo, MM3, anotações, evolução, confiança, mascaramento de IP.
- Hooks de fetch, agregação, ordenação cronológica.
- Estrutura de dados de `SentimentTrendPoint`.

## Critérios de aceite

(a) Header do tooltip mostra **range da semana** (`"dd mmm – dd mmm"`) e **total destacado** em `text-sm font-semibold`; (b) bloco de % positivo permanece com cor semântica e MM3; (c) detalhamento renderiza **sempre as 4 linhas** (positivo/neutro/negativo/misto), com count 0 exibido como "—" em opacidade reduzida; (d) cada linha de sentimento ganha mini-barra horizontal proporcional ao % do total na cor do sentimento; (e) bloco de anotações preservado; (f) helper `formatWeekRange` adicionado localmente sem novas dependências; (g) sem mudanças em séries, eixos, switch, MM3, evolução, confiança, anotações, IP masking ou hooks; (h) sem `any`, sem `dangerouslySetInnerHTML`, PT-BR, flat; (i) arquivo permanece ≤500 linhas; (j) sem regressão em layout, responsividade ou demais funcionalidades.

