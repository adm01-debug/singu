
# Plano: Drawer de excertos por tema na aba Insights

## Objetivo

Evoluir o `ThemeExamplesDrawer` para exibir **5 excertos curtos** de mensagens/transcrições onde o tema realmente aparece, em vez do snippet genérico do `content` da interação inteira. Cada excerto mostra a frase com a palavra-chave do tema **destacada**, contexto antes/depois, e link para abrir a interação na Ficha 360.

## Status atual

`ThemeExamplesDrawer` já abre por tema e busca em `interactions(id, title, type, created_at, content, contact_id, sentiment)` usando `theme.examples` (até 5 IDs). Limita-se a mostrar `content` truncado em 3 linhas — **não** identifica onde o tema é mencionado dentro da transcrição. Em interações com transcrição longa (calls), o card mostra apenas o início, perdendo o contexto da menção.

## Reutilização

- `Sheet`, `Badge`, `Button`, `Link` (já em uso)
- `useTopicsCatalog` → fornece `keywords[]` por `topic_key` (já existente em `useConversationIntel`)
- `theme.examples` (interaction_ids já agregados em `useInteractionsInsights`)
- Padrão de fetch defensivo do drawer atual

Sem novo hook de dados, sem nova RPC, sem nova edge function.

## Arquitetura

```text
ThemeExamplesDrawer (refatorado)
 ├─ useTopicsCatalog → resolve keywords do tema selecionado
 ├─ Fetch interactions(id, title, type, created_at, content,
 │    transcription, contact_id, sentiment) WHERE id IN theme.examples
 └─ extractExcerpts(text, keywords, maxPerInteraction=2, totalCap=5)
       → distribui excertos entre as interações para chegar a 5 no total
       → cada excerto: ~140 chars centrados na ocorrência, com "…" nas bordas
```

## Algoritmo `extractExcerpts` (≤60 linhas, em util novo)

`src/lib/insights/extractExcerpts.ts`:

```ts
interface Excerpt {
  interactionId: string;
  text: string;          // já com bordas "…"
  matchTerm: string;     // palavra exata encontrada (para highlight)
  position: number;      // offset original (sort estável)
}

extractExcerpts(
  sources: { id: string; text: string }[],
  keywords: string[],
  opts: { totalCap: number; maxPerSource: number; window: number }
): Excerpt[]
```

- Normaliza keywords (lowercase + sem acento) e cria regex `\b(k1|k2|…)\b` (escape, case-insensitive)
- Para cada `source.text` (preferindo `transcription` > `content`), itera matches:
  - Pega janela `[max(0, idx - 60), idx + matchLen + 80]`
  - Trim + prefixa "…" se cortou no início, sufixa "…" se cortou no fim
  - Coleta `matchTerm` exato encontrado (case original) para highlight
- Limita a `maxPerSource` por interação, para diversificar
- Para alcançar `totalCap=5`, faz 2 passadas: 1ª pega 1 por interação, 2ª preenche restante até cap
- Retorna lista achatada na ordem das interações originais

## Componente: highlight inline

`MarkExcerpt`: helper local (≤25 linhas) que recebe `text` + `term` e renderiza spans, marcando com `<mark className="bg-warning/30 text-foreground rounded px-0.5">` cada ocorrência (case-insensitive, sem regex injection — `term` já é literal vindo do extractor).

Sem `dangerouslySetInnerHTML`. Split por regex e map para `<>{plain}<mark>{hit}</mark></>`.

## Refatoração do `ThemeExamplesDrawer`

1. Adicionar `transcription` ao select da query existente
2. Buscar `useTopicsCatalog()` para resolver keywords do tema atual (match por `label` normalizado, fallback para `theme.label` como única keyword caso o catálogo não tenha o tópico)
3. Após receber `examples`, computar `excerpts = extractExcerpts(sources, keywords, { totalCap: 5, maxPerSource: 2, window: 140 })`
4. UI:
   - Topo do conteúdo do Sheet: cabeçalho "5 excertos das transcrições" + contador real (`X excertos de Y conversas`)
   - Lista de excerto: card flat com:
     - `<MarkExcerpt text={ex.text} term={ex.matchTerm} />` em texto serif/normal `text-sm`
     - Footer `text-[10px]`: título da interação + tipo + data + botão "Ficha 360"
   - Empty: "Nenhuma menção encontrada na transcrição. Mostrando interações relacionadas." + fallback ao layout antigo (cards de interação) — preserva valor quando o LLM marcou o tema mas não bate com keywords literais
5. Mantém loading + cleanup `cancelled` existentes

## Edge cases

- Tema sem entrada no catálogo: usa `[theme.label]` como única keyword
- Transcrição vazia: cai para `content`
- Nenhum match em nenhuma interação: empty state + cards-fallback (modo atual)
- Texto sem espaços ao cortar (URLs longas): trunca duro e adiciona "…"
- Keywords com caracteres regex (`+`, `.`): escape obrigatório no util
- Acentuação: comparação normalizada, mas exibição mantém texto original

## Padrões obrigatórios

- PT-BR
- Sem `any`, sem `dangerouslySetInnerHTML`
- `Array.isArray()` defensivo
- Tokens semânticos (`warning`, `muted`, `border-border/60`)
- Flat, sem shadow
- Zero novas queries de rede além dos catálogo+interações já necessários
- `React.memo` no item de excerto

## Arquivos tocados

**Novos (2):**
- `src/lib/insights/extractExcerpts.ts` — util puro, testável
- `src/lib/insights/__tests__/extractExcerpts.test.ts` — Vitest cobrindo: 1 keyword/1 match, múltiplas interações, regex escape, sem match, totalCap, maxPerSource, acentos

**Editados (1):**
- `src/components/interactions/insights/ThemeExamplesDrawer.tsx` — buscar transcrição + catálogo, gerar excertos, renderizar com highlight, fallback

## Critério de fechamento

(a) Ao abrir um tema na aba Insights, o drawer mostra até 5 excertos curtos da transcrição com a palavra-chave destacada em `mark`, (b) cada excerto mostra contexto ~140 chars com "…" nas bordas, (c) excertos são distribuídos entre interações (máx 2 por interação até atingir 5 no total), (d) sem matches → fallback para o layout antigo (cards de interação) com aviso, (e) keywords vêm de `conversation_topics_catalog` quando disponíveis, fallback para o próprio label do tema, (f) zero novas RPCs/edge functions, (g) testes do extrator cobrindo regex injection, sem matches, acentuação e cap, (h) zero regressão em sentimento, objeções, KPIs, ou no spotlight.
