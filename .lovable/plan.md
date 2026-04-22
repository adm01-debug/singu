

# Plano: Relatórios fixos (presets nomeados com descrição) com 1-clique para resumo IA

## Contexto

Hoje em **Ficha 360 → Últimas Interações**:
- `useFicha360FilterFavorites` já persiste presets simples (período + canais + tags) em `localStorage`, com `quickSave`, `rename`, `remove` e import via link compartilhado.
- `FavoritosFiltrosMenu` expõe esses favoritos atrás de um botão.
- `ResumoConversaIADialog` + `GerarResumoIAButton` foram criados num passo anterior mas **não estão renderizados** em `Ficha360.tsx` (apenas importados).
- Faltam: campo **descrição**, **busca livre `q`** no preset, barra horizontal sempre visível, e fluxo "1-clique → aplica + abre resumo IA".

A solicitação atual é: salvar preset como **relatório fixo** com **nome + descrição**, alternar entre eles em uma barra, e ao aplicar **já abrir o dialog de resumo IA**. Tudo client-side via `localStorage` — escopo global (mesmo conjunto disponível em qualquer Ficha 360).

## Mudanças

### 1. Schema v2 dos favoritos (adiciona descrição + busca)

`useFicha360FilterFavorites.ts`:

```ts
export interface FilterFavorite {
  id: string;
  name: string;
  description?: string;     // NOVO — máx 200 chars
  days: number;
  channels: string[];
  tags: InteractionTag[];
  q?: string;               // NOVO — termo de busca livre
  autoOpenSummary?: boolean; // NOVO — ao aplicar, abrir resumo IA (default true)
  createdAt: number;
  updatedAt?: number;       // NOVO
}
```

- Migração silenciosa: presets v1 sem `description/q/autoOpenSummary/updatedAt` carregam com defaults (`undefined`, `undefined`, `true`, `createdAt`).
- `sanitizeDescription(raw)` — string ≤200, trim.
- `sameCombo` passa a comparar também `q` (normalizado: `''` ≡ `undefined`).
- `findMatch(days, channels, tags, q)` ganha 4º arg.
- `quickSave` e `save` recebem `q` opcional e `description?`.
- Novo método `update(id, patch: Partial<Pick<FilterFavorite, 'name' | 'description' | 'autoOpenSummary'>>)` → atualiza `updatedAt`. Valida nome único (case-insensitive contra outros presets, dedup com sufixo `(2)` igual a `quickSave`).
- `MAX_FAVORITES` continua 10.

### 2. Nova barra horizontal `RelatoriosFixosBar.tsx` (~150 linhas)

Inserida em `Ficha360.tsx` logo **acima** de `FiltrosInteracoesBar`, dentro do `headerExtra` de `UltimasInteracoesCard`:

```
📊 Relatórios fixos:  [⭐ Quentes 30d] [Aguardando proposta] [+3 ▾]   [+ Salvar atual]
                              ↑ ring-2 quando preset bate com filtros atuais
```

- Mostra até 4 chips inline; o resto vai para dropdown `[Mais ▾]`.
- Cada chip:
  - Botão `role="button"` com `aria-pressed={isActive}` (ativo = `findMatch` bate).
  - Hover mostra tooltip com `description` (se houver) + resumo `30d · WhatsApp+Email · 2 tags · busca "x"`.
  - Click → `applyRelatorio(preset)` (aplica filtros + opcionalmente abre resumo IA).
  - Botão `⋮` (visible on hover/focus): **Editar** (abre dialog), **Atualizar com filtros atuais**, **Excluir**.
- Botão final `[+ Salvar atual]`:
  - Se `findMatch` já existe: disabled com tooltip "Já salvo como X".
  - Se nenhum filtro além do default: disabled com tooltip "Configure filtros antes de salvar".
  - Senão abre `SalvarRelatorioDialog` em modo `create` com nome sugerido pré-preenchido.
- Se `favorites.length === 0`: empty state inline `[+ Crie seu primeiro relatório]`.

### 3. Dialog `SalvarRelatorioDialog.tsx` (~140 linhas)

Reaproveita shadcn `Dialog`. Modos `create` | `edit`:

- Campo **Nome** (input, max 40, validação: ≥1 char não-espaço, único).
- Campo **Descrição** (textarea, max 200, contador, opcional).
- Switch **"Abrir resumo IA ao aplicar"** (default ON em create).
- Preview compacto dos filtros capturados: `30d · WhatsApp+Email · 2 tags · busca "abc"`.
- Footer: `[Cancelar]` `[Salvar]` (disabled enquanto inválido). Atalhos: `Enter` confirma, `Esc` cancela.
- Em `edit`, valida unicidade de nome contra outros presets (dedup automático com sufixo se houver colisão).

### 4. Wiring em `Ficha360.tsx`

- Renderizar finalmente `<ResumoConversaIADialog>` no JSX (estava importado mas não montado), recebendo `interactions={sortedInteractions}` (já filtradas), `contactSnapshot` (montado a partir de `profile`/`intelligence`/`prontidao`) e `filtersSummary` `{ period_days: days, channels, tags, query: q }`.
- Inserir `<RelatoriosFixosBar>` no `headerExtra` (acima de `FiltrosInteracoesBar`).
- `applyRelatorio(preset)`:
  ```ts
  setDays(preset.days); setChannels(preset.channels);
  setTags(preset.tags); setQ(preset.q ?? '');
  setSearchInput(preset.q ?? '');
  setDraftDays(preset.days); setDraftChannels(preset.channels);
  if (preset.autoOpenSummary !== false) {
    // Pequeno setTimeout(0) para garantir que recompute filteredInteractions antes
    setTimeout(() => setResumoIAOpen(true), 0);
  }
  toast.success(`Relatório aplicado: "${preset.name}"`, { description: preset.description });
  ```
- Manter `FavoritosFiltrosMenu` existente como atalho secundário (não remove — já tem atalho `Shift+F`).

### 5. Sugestão de nome estendida

`suggestFavoriteName(days, channels, tags, q)` ganha 4º arg: se `q` existe, sufixo ` · "<q.slice(0,12)>"`. Mantém ≤40 chars.

### 6. Compartilhamento

- `encodeFavoriteToToken` v2: inclui `description`, `q`, `autoOpenSummary` no payload (versão `v: 2`). Decoder aceita `v: 1` (defaults para campos novos) e `v: 2`.
- `AplicarFavoritoCompartilhadoDialog` mostra também descrição (se houver) no preview antes de importar.

### 7. Atalho

- `Shift+R` (novo) abre dialog de salvar relatório atual (equivalente a clicar `[+ Salvar atual]`). Adicionar em `useFicha360FilterShortcuts.ts` e listar no cheatsheet.

## Não muda

- Edge functions, banco, RLS — tudo client-side.
- `useFicha360ConversationSummary` (já existe e funciona).
- `FavoritosFiltrosMenu`, `useFicha360Sort`, view modes, atalhos existentes.
- `CompanyInteractionsTab`, `ConversasRelacionadasCard`.
- Lógica de filtros, `recentInteractions`, `sortedInteractions`.

## Critérios de aceite

(a) Barra `RelatoriosFixosBar` visível acima de `FiltrosInteracoesBar`, com chips dos relatórios; (b) chip cujo combo bate com filtros atuais mostra `ring-2 ring-primary` e `aria-pressed=true`; (c) `[+ Salvar atual]` abre dialog com nome sugerido + descrição opcional + switch "Abrir resumo IA"; (d) ao clicar num chip, filtros são aplicados (período/canais/tags/busca) e, se `autoOpenSummary !== false`, o `ResumoConversaIADialog` abre automaticamente com as interações já filtradas; (e) `⋮` permite **Editar** (nome + descrição + switch), **Atualizar com filtros atuais**, **Excluir** com confirm toast; (f) presets v1 (sem descrição/q) continuam funcionando após migração silenciosa; (g) `Shift+R` abre o dialog de salvar; (h) tokens compartilhados v2 transportam descrição + q + flag, v1 antigos seguem funcionando; (i) sem nova dependência, sem `any`, PT-BR; (j) novos arquivos: `RelatoriosFixosBar.tsx` <160 linhas, `SalvarRelatorioDialog.tsx` <150 linhas; (k) acessibilidade: chips com `aria-pressed` e `aria-label` descritivo, dialog com `aria-labelledby`, switch com `aria-describedby`; (l) `ResumoConversaIADialog` é finalmente renderizado em `Ficha360.tsx` com snapshots corretos.

