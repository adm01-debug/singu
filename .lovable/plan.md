

# Plano: Atalhos de teclado para chips de filtros ativos

## Objetivo

Permitir gerenciar os chips ativos de "Últimas Interações" (Ficha 360) sem mouse: remover individualmente período / canais / busca e limpar tudo via teclado.

## Atalhos propostos

Escopo: ativos somente quando a Ficha 360 está montada e o foco **não** está em campo editável (input/textarea/select/contenteditable). Registrados via `useScopedShortcut` (registry já existente em `src/lib/keyboardShortcutRegistry.ts`), o que garante listagem automática no cheatsheet (`?`).

| Atalho | Ação |
|---|---|
| `Shift + C` | Limpar tudo (período → 90d, canais → [], busca → "") |
| `Shift + P` | Remover chip de período (volta para 90d) |
| `Shift + B` | Remover chip de busca textual |
| `Shift + 1…5` | Remover canal pela ordem em que aparecem nos chips ativos (1=primeiro chip de canal, 2=segundo, etc.) |

Decisões:
- `Shift + tecla` evita conflito com atalhos globais (`?`, `g d`, `Cmd/Ctrl+B` da sidebar) e com digitação normal.
- `Shift + 1…5` usa a **ordem visual atual** dos chips (após sort do `useFicha360FilterFavorites`), não a ordem fixa do whitelist — assim o usuário sempre vê "1 = primeiro chip à esquerda".
- Quando não há nada para remover (ex.: `Shift+B` sem busca ativa), o handler vira no-op silencioso (sem toast de erro).
- Toda ação bem-sucedida dispara um toast curto (`sonner`, info, 1.5s) confirmando: "Período limpo", "Canal WhatsApp removido", "Filtros limpos".

## Mudanças (arquivos)

### 1. `src/components/ficha-360/FiltrosAtivosChips.tsx`
- Adicionar dica visual de atalho no chip ao passar o mouse: usar `<KeyboardHint keys={['⇧','P']} />` (componente já existe em `src/components/ui/keyboard-hint.tsx`) **dentro do `title`** do botão de fechar do `Badge` (tooltip nativo, sem inflar o layout). Não muda layout flat.
- Sem novo prop: o componente continua puramente visual; os atalhos vivem no consumidor.

### 2. Novo: `src/hooks/useFicha360FilterShortcuts.ts` (~70 linhas)
Hook que recebe estado e setters atuais e registra os atalhos via `useScopedShortcut`:

```ts
useFicha360FilterShortcuts({
  days, channels, q,
  onClearAll, onClearPeriod, onClearSearch, onRemoveChannel,
  enabled, // false em loading/erro para evitar disparar enquanto não há chips
});
```

Internamente:
- 1 `useScopedShortcut` por atalho fixo (`Shift+C`, `Shift+P`, `Shift+B`).
- 5 `useScopedShortcut` para `Shift+1`…`Shift+5`, cada um lendo `channels[i]` no momento do disparo (via ref para evitar re-registrar a cada mudança).
- `scope: 'ficha360-filtros'` para aparecer agrupado no cheatsheet.

### 3. `src/pages/Ficha360.tsx`
- Importar e chamar `useFicha360FilterShortcuts` passando handlers já existentes (`clearFilters`, `setDays(90)`, `setQ('')`, `setChannels(channels.filter(...))`) + sincronização com draft (igual ao `applyFavoriteFilters`).
- `enabled = !contactLoading && !!contactData`.

### 4. Cheatsheet
- Nada a fazer: o `KeyboardShortcutsDialogEnhanced` (carregado em `AppChrome.tsx`) já consome `getRegisteredShortcuts()` do registry, então os 8 atalhos aparecerão automaticamente sob a seção "ficha360-filtros" quando a página estiver montada.

## Não muda

- Outras páginas, hooks de paginação, `useFicha360Filters`, `useFicha360FilterFavorites`, `FiltrosInteracoesBar`, layout/CSS dos chips.
- Sem novo atalho global; tudo escopado e com guarda anti-input.

## Critérios de aceite

(a) `Shift+C` limpa período, canais e busca de uma vez, com toast; (b) `Shift+P` reseta período para 90d quando havia chip de período, no-op caso contrário; (c) `Shift+B` limpa a busca quando há `q`, no-op caso contrário; (d) `Shift+1…5` removem o N-ésimo chip de canal visível, no-op se índice fora do range; (e) atalhos não disparam quando foco está em input/textarea/select/contenteditable; (f) atalhos só ficam ativos enquanto Ficha 360 está montada e dados carregaram; (g) cheatsheet (`?`) lista os 8 atalhos sob "ficha360-filtros" com descrição em PT-BR; (h) tooltip dos chips mostra o atalho correspondente; (i) sem nova dependência, sem `any`, todos os arquivos <200 linhas.

