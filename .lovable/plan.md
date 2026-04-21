
# Plano: Card "Objeções em destaque" na aba Insights

## Objetivo

Adicionar um **card de destaque** no topo da seção de objeções da aba Insights de `/interacoes`, evidenciando as 3 objeções mais críticas (mais frequentes E menos tratadas) com contadores, taxa de tratamento, resposta sugerida pela IA e link para conversas de exemplo.

## Status atual

`ObjectionsRanking` já lista todas as objeções com:
- Contador de menções
- Barra de % tratada (handled/count)
- Resposta sugerida (apenas quando `unhandled > 0`)
- Badge de categoria

**Lacuna:** sem hierarquia visual — uma objeção crítica (10× mencionada, 0% tratada) aparece com o mesmo peso visual de uma trivial (2× mencionada, 100% tratada). Não há "spotlight" das que precisam de ação imediata, e a resposta sugerida fica escondida no fim de cada item.

## Reutilização

- `useInteractionsInsights` → `topObjections: ObjectionAggregate[]` (já tem count, handled, unhandled, suggestedResponse, examples)
- `Card`, `Badge`, `Button` do design system
- Padrão de cores semânticas já em uso (`success`/`warning`/`destructive`)
- `SentimentExamplesDrawer` (criado na rodada anterior) como referência para drawer de exemplos por objeção (futuro — não nesta entrega)

Sem novo fetch, sem novo hook, sem nova RPC.

## Arquitetura

```text
InsightsPanel
 ├─ KPIs (existente)
 ├─ Charts (existente)
 ├─ ThemesRanking (existente)
 ├─ [NOVO] ObjectionsSpotlight  ← topo da coluna de objeções
 │     ├─ Header: "Objeções que pedem ação"
 │     └─ 3 cards destacados (criticidade decrescente)
 │         ├─ Ícone de severidade (Flame/AlertTriangle/Info)
 │         ├─ Texto da objeção + badge categoria
 │         ├─ Métricas: N× mencionada · X% tratada
 │         ├─ Barra de progresso colorida por severidade
 │         └─ Bloco "Resposta sugerida" expandido (ou "✓ Bem tratada")
 └─ ObjectionsRanking (existente, abaixo do spotlight, lista completa)
```

## Score de criticidade

```ts
criticality = unhandled * 2 + count
```

Pondera dobrado as não tratadas (impacto direto em pipeline) e soma frequência (volume = relevância). Garante que uma objeção 5× mencionada com 5 unhandled (score 15) supere uma 8× com 0 unhandled (score 8).

Severidade visual:
- **alta** (`unhandled >= 3` ou taxa <= 30%): borda + ícone `destructive`, Flame
- **média** (`unhandled >= 1` ou taxa <= 70%): borda + ícone `warning`, AlertTriangle
- **baixa** (resto): borda + ícone `success`, CheckCircle2

## Implementação

### 1. Novo `src/components/interactions/insights/ObjectionsSpotlight.tsx` (≤140 linhas)

- Props: `objections: ObjectionAggregate[]`
- Calcula `criticality` e ordena desc, pega top 3
- Empty state: se array vazio, retorna `null` (o ranking abaixo já mostra "Nenhuma objeção")
- Cada card:
  - Layout em `Card` flat, borda colorida por severidade
  - Header: ícone (Flame/AlertTriangle/CheckCircle2) + objeção truncada + badge categoria
  - Métricas em linha: `<N>× mencionada` · `<handled>/<count> tratadas` · `<X>% taxa`
  - Barra de progresso (h-2) com cor semântica (destructive/warning/success)
  - Quando `suggestedResponse` E `unhandled > 0`: bloco destacado com fundo `bg-warning/8`, ícone Lightbulb, texto da resposta sugerida (não truncado, max 3 linhas)
  - Quando `unhandled === 0`: bloco verde discreto "✓ Esta objeção está sendo bem tratada"
- `React.memo`
- PT-BR, sem `any`, tokens semânticos, flat

### 2. Integração em `InsightsPanel.tsx`

Localizar o bloco da coluna de objeções (provavelmente `<Card><CardHeader>Objeções recorrentes</CardHeader>…</Card>`) e:

- Renderizar `<ObjectionsSpotlight objections={topObjections} />` **acima** do card existente que envolve `ObjectionsRanking`
- Manter `ObjectionsRanking` intacto (lista completa abaixo do spotlight, sem regressão)

### 3. Edge cases

- Menos de 3 objeções: renderiza só as que existem (1 ou 2 cards)
- Zero objeções: `null` (ranking abaixo já cobre vazio)
- Objeção sem `suggestedResponse` e com `unhandled > 0`: bloco neutro "Sem resposta sugerida disponível ainda"
- Texto longo de objeção: `line-clamp-2` no título, tooltip nativo via `title` attr
- Resposta sugerida longa: `line-clamp-3` com expansão `whitespace-pre-wrap`

### 4. Padrões obrigatórios

- PT-BR
- Sem `any`, sem `dangerouslySetInnerHTML`
- `Array.isArray()` defensivo no início
- Tokens semânticos (`success`/`warning`/`destructive`/`muted`)
- Flat (sem shadow), bordas sutis
- Zero novas queries de rede
- `React.memo`

## Arquivos tocados

**Novos (1):**
- `src/components/interactions/insights/ObjectionsSpotlight.tsx`

**Editados (1):**
- `src/components/interactions/insights/InsightsPanel.tsx` — montar o spotlight acima do ranking

## Critério de fechamento

(a) Spotlight aparece no topo da seção de objeções com até 3 cards ordenados por criticidade (`unhandled*2 + count`), (b) cada card mostra severidade visual (cor/ícone), contadores, taxa de tratamento e barra de progresso, (c) resposta sugerida da IA é exibida em bloco destacado quando há objeções não tratadas, (d) objeções 100% tratadas mostram badge positivo "Bem tratada", (e) ranking completo abaixo permanece sem regressão, (f) zero novas queries de rede, (g) zero regressão em sentimento, temas, KPIs ou tendência.
