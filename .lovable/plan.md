

# Plano: Highlight de todas as keywords do tema em cada excerto

## Diagnóstico

- `ThemeExamplesDrawer` já usa `<MarkExcerpt>` para destacar **apenas** `excerpt.matchTerm` (o termo específico que disparou aquele excerto), via `<mark>` + split em React (já sem `dangerouslySetInnerHTML`, case-insensitive via flag `gi`).
- Quando um excerto contém múltiplas keywords do tema (ex.: "preço" e "valor" na mesma frase), só uma fica marcada.

## O que será construído

Estender `MarkExcerpt` para aceitar a lista completa de `keywords` do tema e marcar **todas** as ocorrências, mantendo:
- case-insensitive + acento-insensitive (consistente com `extractExcerpts`),
- sem `dangerouslySetInnerHTML` (split + nodes React),
- sem novas dependências, sem mudanças em `extractExcerpts.ts`, hooks ou tipos.

## Mudanças

### `src/components/interactions/insights/ThemeExamplesDrawer.tsx`

1. **Substituir `MarkExcerpt`** por uma versão que recebe `terms: string[]`:
   - Filtrar terms vazios/curtos (≥2 chars), deduplicar (case-insensitive) e ordenar por tamanho desc (evita match parcial quando uma keyword é prefixo de outra).
   - Construir um único regex `new RegExp("(" + escaped.join("|") + ")", "giu")` com bordas de palavra Unicode `(?:^|[^\\p{L}\\p{N}])` + lookahead `(?=$|[^\\p{L}\\p{N}])` (espelho do padrão usado em `extractExcerpts`) para não marcar substrings dentro de palavras.
   - Para suportar acento-insensitive sem alterar o texto exibido: normalizar uma cópia do `text` (NFD + remover diacríticos) só para localizar as posições via `regex.exec`, e usar os índices para fatiar o texto **original** em segmentos `{ text, isMatch }`. Isso preserva visualmente acentos e maiúsculas.
   - Renderizar `<mark className="bg-warning/30 text-foreground rounded px-0.5">` para segmentos `isMatch`, `<span>` para os demais. Manter `key` estável por índice.

2. **Atualizar uso em `ExcerptItem`**: passar `terms={keywords}` (já calculado no `useMemo` do componente pai) em vez de `term={excerpt.matchTerm}`. Propagar `keywords` via prop até `ExcerptItem` (props: adicionar `keywords: string[]`) ou via contexto local — preferir prop simples.

3. **Manter fallback**: se `terms.length === 0`, retorna o texto puro.

## Critérios de aceite

(a) Cada excerto no `ThemeExamplesDrawer` destaca **todas** as ocorrências de **todas** as keywords do tema (não só `matchTerm`); (b) destaque é case-insensitive e acento-insensitive (ex.: "preço" e "PRECO" ambos marcam); (c) marcações respeitam bordas de palavra (não destacam substrings dentro de palavras maiores); (d) texto original (acentos/caixa) é preservado visualmente; (e) sem uso de `dangerouslySetInnerHTML`; (f) sem novas dependências; (g) sem mudanças em `extractExcerpts.ts`, hooks, tipos ou outros componentes; (h) arquivo permanece ≤300 linhas; (i) sem `any`; (j) sem regressão no resto do drawer (header, lista de interações, link Ficha 360, estados de loading/empty).

