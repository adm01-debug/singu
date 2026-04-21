
# Plano: Chips de filtros ativos + contador no topo de "Últimas Interações"

## Objetivo

Exibir, acima da lista de "Últimas Interações" da Ficha 360, uma barra de chips removíveis representando cada filtro ativo (período ≠ 90d e cada canal selecionado), com um contador no formato **"12 de 48"** mostrando quantas interações estão visíveis vs. total.

## Status atual

- `FiltrosInteracoesBar` (já existente) tem chips clicáveis para selecionar canais e botões de período, mas chips ativos ficam misturados com inativos — não há linha resumo com "X de Y" + remoção individual destacada acima da lista.
- Já existe rodapé `"Mostrando X de Y interação(ões)"`, mas embaixo da barra de filtros, não como header da lista.
- `useFicha360Filters` já expõe `days`, `channels`, `setDays`, `setChannels`, `clear`, `activeCount` e default (`days = 90`, `channels = []`).

## Implementação

### 1. Novo componente: `src/components/ficha-360/FiltrosAtivosChips.tsx` (~80 linhas)

Componente memoizado que recebe:
```ts
{
  days: Ficha360Period;
  channels: string[];
  shownCount: number;
  totalCount: number;
  onRemoveDays: () => void;       // reseta para 90 (default)
  onRemoveChannel: (c: string) => void;
  onClearAll: () => void;
}
```

Renderiza:
- **Contador à esquerda**: `<span>` com `"<strong>{shown}</strong> de {total}"` em `text-xs text-muted-foreground` (oculto se `total === 0`).
- **Chip de período** (apenas quando `days !== 90`): `Badge variant="secondary" closeable` com ícone `Calendar`, label `"Período: 7d|30d|1a"`, `onClose={onRemoveDays}`.
- **Chips de canal** (um por canal em `channels`): `Badge variant="secondary" closeable` com ícone do canal (mesmo mapa de `FiltrosInteracoesBar`: WhatsApp/Phone/Mail/Calendar/FileText) e label PT-BR.
- **Botão "Limpar tudo"** (`Button variant="ghost" size="xs"`, `ml-auto`) só quando há ≥2 chips ativos.
- Não renderiza nada quando não há filtros ativos E `total === 0`.
- Quando há contador mas sem filtros ativos, renderiza apenas o contador (linha discreta).

### 2. Plugar no consumidor

Localizar onde `FiltrosInteracoesBar` é usado dentro da seção "Últimas Interações" da Ficha 360 (provavelmente em `src/pages/Ficha360.tsx` ou um wrapper tipo `UltimasInteracoesSection.tsx`). Inserir `<FiltrosAtivosChips ... />` **logo acima** do `<UltimasInteracoesCard />` (e abaixo do `FiltrosInteracoesBar`), passando:
- `days`, `channels` direto do `useFicha360Filters()`
- `shownCount` = comprimento da lista já filtrada client-side (a mesma usada para alimentar o card)
- `totalCount` = comprimento da lista pré-filtro client-side (antes de aplicar `channels`/`days`); se a query já vem filtrada por `days/channels`, usar o `recentInteractions.length` como `total` e `shownCount` igual — nesse caso o contador vira "N de N" e ainda é útil como resumo.
- `onRemoveDays = () => setDays(90)`
- `onRemoveChannel = (c) => setChannels(channels.filter(x => x !== c))`
- `onClearAll = clear`

### 3. Pequeno ajuste em `FiltrosInteracoesBar`

Remover a linha rodapé `"Mostrando X de Y..."` (deduplicada agora pelo header de chips) — ou manter e apenas ocultar via prop `hideSummary`. Preferência: remover, já que o novo header cumpre o papel com mais clareza.

### 4. Padrões obrigatórios

- PT-BR
- Tokens semânticos (sem cores fixas)
- Flat (sem shadow)
- `React.memo` no novo componente
- Reaproveitar `Badge closeable` (já existe em `src/components/ui/badge.tsx`)
- Zero novas queries
- Zero regressão em sentimento, KPIs, drawers, paginação progressiva ou outras abas

## Arquivos tocados

**Criado (1):**
- `src/components/ficha-360/FiltrosAtivosChips.tsx`

**Editados (2):**
- `src/pages/Ficha360.tsx` (ou wrapper equivalente da seção) — montar `FiltrosAtivosChips` acima do card
- `src/components/ficha-360/FiltrosInteracoesBar.tsx` — remover (ou condicionar) o rodapé "Mostrando X de Y" para evitar duplicação

## Critério de fechamento

(a) Acima da lista aparece header com contador `"X de Y interações"`, (b) cada filtro ativo (período ≠ 90d, cada canal) vira um chip com ícone + label removível via "×", (c) remover um chip atualiza URL e lista sem recarregar dados, (d) "Limpar tudo" aparece quando há ≥2 chips, (e) sem filtros ativos só o contador aparece (ou nada se total = 0), (f) zero duplicação com o rodapé antigo da `FiltrosInteracoesBar`, (g) zero novas queries, (h) zero regressão em paginação, sentimento, KPIs ou drawers.
