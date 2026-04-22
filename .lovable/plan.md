

# Plano: Salvar e recarregar filtros de "Últimas Interações"

## Status atual

Esta funcionalidade **já está implementada** na Ficha 360. A análise do código confirma:

- **`src/hooks/useFicha360FilterFavorites.ts`** já existe — gerencia favoritos em `localStorage` (com sort, limite, dedupe e schema versionado).
- **`FavoritosFiltrosMenu`** já está montado no `headerExtra` do card "Últimas Interações" em `Ficha360.tsx`, com:
  - Listagem dos favoritos salvos (clique = aplica)
  - "Salvar filtros atuais como favorito" (com nome custom)
  - Renomear / excluir
  - Compartilhar via `?favorito=<token>` + `AplicarFavoritoCompartilhadoDialog`
- **Período + canais** já são as duas dimensões salvas (busca textual `q` é volátil por design — ver decisão na rodada anterior).

Ou seja: o pedido literal já é entregue hoje. O que **agrega valor real** sem reinventar a roda:

## Lacunas reais a fechar

1. **Descoberta**: o `FavoritosFiltrosMenu` é um botão `Star` icon-only no header. Usuário novo pode não perceber que é "salvar/recarregar filtros".
2. **Quick-save sem nomear**: hoje exige abrir popover → digitar nome → confirmar. Para o usuário que só quer "salvar isto agora", são 3 cliques.
3. **Indicação de favorito ativo**: se o conjunto atual de filtros bate com um favorito salvo, não há feedback visual ("você está vendo o favorito X").
4. **Atalho de teclado**: existem atalhos para limpar/remover chips e copiar link, mas nenhum para salvar/abrir favoritos.

## Mudanças propostas

### 1. `useFicha360FilterFavorites.ts` — utilitários novos

- Adicionar `quickSave(days, channels): SavedFavorite | null` que gera nome automático (`"30d · WhatsApp, Email"` truncado em 40 chars) e salva direto, sem prompt. Reutiliza a normalização e o limite (`MAX_FAVORITES`) já existentes; se já houver match exato (`findMatch`), retorna o existente em vez de duplicar.
- Sem mudança nos consumidores atuais (função adicional).

### 2. `FavoritosFiltrosMenu.tsx` — pequenas melhorias UX

- **Badge de match ativo**: se `findMatch(days, channels)` retorna um favorito, o ícone `Star` ganha `fill-primary text-primary` (em vez de outline) e um tooltip "Vendo: {nome}". Sinaliza ao usuário que ele está num estado salvo.
- **Item "Salvar como…" → divide em dois**: 
  - "💾 Salvar agora" (quick-save, sem prompt) — desabilitado quando já existe match
  - "✏️ Salvar com nome…" (fluxo atual com prompt)

### 3. `useFicha360FilterShortcuts.ts` — 2 novos atalhos

- `Shift + S` → quick-save dos filtros atuais (chama `quickSave`); toast "Favorito salvo: {nome}" ou "Já existe favorito: {nome}".
- `Shift + F` → abrir o `FavoritosFiltrosMenu` (controlled state). Toast não dispara; só abre o popover para escolher.

Ambos no escopo `ficha360-filtros`, aparecem no cheatsheet automaticamente.

### 4. `Ficha360.tsx` — wiring mínimo

- Estado `favoritosMenuOpen` controlado, passado a `FavoritosFiltrosMenu` (`open` + `onOpenChange`) para permitir abertura via atalho `Shift + F`.
- Handler `handleQuickSave` chama `quickSave(days, channels)` e dispara toast com resultado.
- Passar handlers ao `useFicha360FilterShortcuts({ ..., onQuickSaveFavorito, onAbrirFavoritos })`.

### 5. Acessibilidade

- Botão de quick-save no menu: `aria-label="Salvar filtros atuais como favorito sem nomear"`.
- Estado ativo do `Star`: `aria-pressed={!!matchAtivo}` + `aria-label` dinâmico.

## Não muda

- Estrutura de armazenamento (`localStorage`, schema versionado, limite, sort).
- `AplicarFavoritoCompartilhadoDialog`, `CopiarLinkFiltrosButton`, `useFicha360DeeplinkToast`, `useFicha360Filters`, `useFicha360DraftFilters`.
- RLS, edge functions, tabelas externas — favoritos seguem locais ao navegador (decisão prévia: simples, sem custo, sem rede).
- Atalhos existentes (`Shift+C/P/B/L/1…5`).

## Critérios de aceite

(a) Item "Salvar agora" aparece no `FavoritosFiltrosMenu` e cria favorito com nome auto-gerado em 1 clique; (b) item desabilita quando o estado atual já bate com um favorito existente, com tooltip explicando; (c) ícone `Star` do menu fica preenchido (`fill-primary`) quando os filtros ativos batem com um favorito salvo, com tooltip "Vendo: {nome}"; (d) `Shift + S` faz quick-save com toast confirmando (criado ou já existente); (e) `Shift + F` abre o menu de favoritos via teclado; (f) ambos atalhos listados no cheatsheet (`?`) sob `ficha360-filtros`; (g) sem nova dependência, sem `any`, PT-BR, flat, todos os arquivos abaixo de 200 linhas.

