
# Plano: Botão "Todos os canais" na FiltrosInteracoesBar

## Objetivo

Adicionar um atalho de um clique para voltar ao padrão da barra de filtros da Ficha 360 (todos os canais visíveis, ou seja, `channels = []`), distinto do "Limpar" atual que zera período E canais.

## Status atual

`FiltrosInteracoesBar` já tem botão "Limpar" que chama `onClear` (zera período `90d` E canais). Não há ação rápida para zerar **só** os canais mantendo o período escolhido pelo usuário — caso comum: estou em 7d filtrando WhatsApp e quero voltar a ver todos os canais nos mesmos 7d.

## Implementação

### Arquivo: `src/components/ficha-360/FiltrosInteracoesBar.tsx`

1. Logo após o grupo de chips de canais (antes do botão "Limpar"), adicionar um botão `ghost` size `sm` rotulado **"Todos os canais"** com ícone `Layers` (lucide), visível apenas quando `channels.length > 0`.
2. Ao clicar: `onChannelsChange([])` — mantém o período atual, remove `?canais=` da URL (já tratado pelo hook).
3. Acessibilidade: `aria-label="Mostrar todos os canais"`, `title` igual.
4. Manter "Limpar" como está (zera tudo) — só aparece quando `activeCount > 0` (já é o caso).
5. Quando ambos visíveis, ordem: chips → "Todos os canais" → "Limpar".

### Detalhes visuais

- Mesmo tamanho/peso do "Limpar" (`variant="ghost" size="sm" h-6 px-2 text-xs text-muted-foreground gap-1`)
- Ícone `Layers` 3×3 à esquerda
- Sem badge, sem cor de destaque (é uma ação secundária discreta)

### Edge cases

- `channels = []` → botão não renderiza (não há o que zerar)
- Período custom + canais selecionados → ambos botões visíveis lado a lado, com semânticas distintas
- Sem mudança no hook `useFicha360Filters` (já suporta `setChannels([])`)

### Padrões obrigatórios

- PT-BR
- Tokens semânticos
- Flat (sem shadow)
- Zero novas queries
- Zero regressão na aba Insights, sentimento, KPIs ou drawers

## Arquivo tocado

**Editado (1):**
- `src/components/ficha-360/FiltrosInteracoesBar.tsx` — adicionar botão "Todos os canais" entre chips e "Limpar"

## Critério de fechamento

(a) Quando há ≥1 canal selecionado, aparece botão "Todos os canais" com ícone Layers, (b) clicar restaura `channels = []` mantendo o período atual e remove `?canais=` da URL, (c) "Limpar" continua zerando período E canais, (d) sem canais selecionados o botão some, (e) zero novas queries, (f) zero regressão.
