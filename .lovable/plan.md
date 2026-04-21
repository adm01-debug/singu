

# Plano: Janela de contexto configurável para excertos

## Diagnóstico

- Hoje o tamanho da janela de contexto dos excertos está hard-coded em `ThemeExamplesDrawer.tsx`:
  - `extractExcerpts(..., { totalCap: 5, maxPerSource: 2, window: 140 })`
  - `pickTopPassages(..., { totalCap: 5, maxPerSource: 2, window: 220 })`
- Não há forma de o usuário ajustar a janela sem editar código.
- `extractExcerpts` e `pickTopPassages` já recebem `window` como parâmetro — basta expor controle no drawer.

## O que será construído

1. Centralizar os presets de janela em uma constante editável.
2. Adicionar um controle compacto no header do `ThemeExamplesDrawer` para alternar entre **Curto / Médio / Longo**, persistindo a escolha em `localStorage` para permanecer entre sessões.

## Mudanças

### 1. Novo arquivo: `src/lib/insights/excerptWindow.ts`
- Exportar:
  - `EXCERPT_WINDOW_PRESETS = { short: 80, medium: 140, long: 240 } as const`
  - `FALLBACK_WINDOW_RATIO = 1.6` (passagens de fallback usam janela ~60% maior, mantendo a proporção atual 220/140)
  - Tipo `ExcerptWindowPreset = "short" | "medium" | "long"`
  - Helpers `getExcerptWindow(preset)` e `getFallbackWindow(preset)` (retorna `Math.round(EXCERPT_WINDOW_PRESETS[preset] * FALLBACK_WINDOW_RATIO)`)
  - `DEFAULT_EXCERPT_PRESET: ExcerptWindowPreset = "medium"`
  - `EXCERPT_PRESET_STORAGE_KEY = "insights:excerpt-window"`

### 2. `src/components/interactions/insights/ThemeExamplesDrawer.tsx`
- Estado local `preset` lido/escrito em `localStorage` via pequeno helper inline (sem novo hook).
- Substituir `window: 140` por `window: getExcerptWindow(preset)` no `extractExcerpts`.
- Substituir `window: 220` por `window: getFallbackWindow(preset)` no `pickTopPassages`.
- Adicionar no header do `SheetContent`, abaixo do título, um pequeno grupo de 3 botões `ToggleGroup` (já disponível em `@/components/ui/toggle-group`) com labels **Curto · Médio · Longo** e tooltip "Tamanho do trecho exibido".
- Re-renderiza excertos automaticamente quando `preset` muda (já está nos `useMemo` deps).
- Sem mudanças em hooks de dados, tipos ou outros componentes.
- Arquivo permanece ≤300 linhas.

## Critérios de aceite

(a) Constante `EXCERPT_WINDOW_PRESETS` em `src/lib/insights/excerptWindow.ts` define os 3 tamanhos de janela em um único lugar editável; (b) o drawer de exemplos do tema mostra um seletor compacto Curto/Médio/Longo no header; (c) trocar a opção atualiza imediatamente os excertos exibidos (matches e fallback) com a nova janela; (d) escolha persiste em `localStorage` e é restaurada ao reabrir o drawer; (e) padrão inicial = "Médio" (140 chars), preservando comportamento atual; (f) janela do fallback escala proporcionalmente (≈ × 1.6) mantendo a relação atual 140/220; (g) sem novas dependências, PT-BR, flat; (h) sem `any`, sem `dangerouslySetInnerHTML`; (i) `ThemeExamplesDrawer.tsx` permanece ≤300 linhas e novo arquivo ≤50 linhas; (j) sem regressão em highlight de keywords, banner de fallback, link Ficha 360, ordenação ou estados de loading/empty.

