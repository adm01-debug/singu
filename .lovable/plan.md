

# Plano: Renomear preset e editar filtros salvos in-place

## Contexto

Hoje, no `InteracoesPresetsMenu` (e `SearchPresetsMenu`), o usuário só pode **aplicar** ou **excluir** um preset. Para mudar o nome ou ajustar um filtro (ex.: trocar canal de WhatsApp para Email, ou mudar a data), precisa excluir e criar do zero — perdendo `usageCount`, `lastUsedAt`, `isFavorite` e `createdAt`.

Vamos adicionar:
1. **Renomear** in-place (ícone lápis por linha → input editável)
2. **Atualizar filtros** do preset com os filtros atualmente ativos na tela ("Atualizar com filtros atuais")

Tudo preserva `id`, `createdAt`, `usageCount`, `lastUsedAt`, `isFavorite`.

## Decisão de escopo

- **Renomear**: ícone `<Pencil>` por linha (ao lado de `<Star>`/`<Trash>`). Click → linha vira input editável (mesmo padrão do "Salvar busca atual"). Enter salva, Esc cancela. Dedup: se nome novo já existir em outro preset, sufixo `(2)`. Reusa `dedupeNameAgainst`.
- **Atualizar filtros (Interações)**: ícone `<RefreshCw>` por linha — só visível se `activeCount > 0` (há filtros ativos na tela). Click → confirma com `<AlertDialog>` mostrando preview do que vai mudar (antes/depois resumido) → substitui `filters` do preset pelos filtros atuais. Toast "Preset atualizado".
- **Atualizar filtros (Contatos/Empresas)**: mesmo padrão, reusa `currentFilters` + `currentSearchTerm`.
- **Hook**: `useSearchPresets` já tem `updatePreset(id, updates)` — só precisa expor para a UI usar com `{ name }` ou `{ filters, sortBy, sortOrder }`.
- **Sem novo dialog separado**: edição de nome é inline; atualização de filtros é só `<AlertDialog>` de confirmação (consistente com o resto do menu).
- **A11y**: ícones com `title` e `aria-label`; input com `autoFocus` + `select()`.
- **Backward compat**: presets antigos mantêm todos os campos; só `filters/name/sortBy/sortOrder/updatedAt(opcional)` mudam.

## Implementação

### 1. `useSearchPresets.ts` (mínimo)

`updatePreset` já existe. Garantir que aceita `Partial<Pick<SearchPreset, 'name' | 'filters' | 'sortBy' | 'sortOrder'>>` sem mexer em `usageCount/lastUsedAt/isFavorite/createdAt`. Adicionar campo opcional `updatedAt?: string` no tipo + setar no `updatePreset` para auditoria leve. Sem mudança de API pública.

### 2. `InteracoesPresetsMenu.tsx`

Por linha de preset, adicionar entre `<Star>` e `<Trash2>`:

```tsx
{editingId === preset.id ? (
  <Input
    ref={renameInputRef}
    value={renameValue}
    onChange={(e) => setRenameValue(e.target.value)}
    onKeyDown={handleRenameKeydown}
    onBlur={cancelRename}
    maxLength={60}
    className="h-7 text-xs"
  />
) : (
  <span onClick={apply}>{preset.name}</span>
)}

{/* Ações hover */}
<Button title="Renomear" onClick={(e) => startRename(preset, e)}>
  <Pencil className="w-3 h-3" />
</Button>

{activeCount > 0 && (
  <Button title="Atualizar com filtros atuais" onClick={(e) => askUpdateFilters(preset, e)}>
    <RefreshCw className="w-3 h-3" />
  </Button>
)}
```

Estados novos:
- `editingId: string | null`
- `renameValue: string`
- `renameInputRef`
- `pendingFilterUpdate: SearchPreset | null` (para o `AlertDialog`)

Handlers:
- `startRename(p, e)` → `e.stopPropagation()`, `setEditingId(p.id)`, `setRenameValue(p.name)`, foca + seleciona via `useEffect`
- `commitRename()` → valida não-vazio; se nome igual ao atual, só sai; senão dedup contra `presets.filter(x => x.id !== editingId).map(x => x.name)` → `updatePreset(id, { name: final })` → toast "Preset renomeado"
- `cancelRename()` → `setEditingId(null)`
- `askUpdateFilters(p, e)` → `setPendingFilterUpdate(p)`
- `confirmUpdateFilters()` → constrói `filters` a partir do `AdvancedFilters` atual (mesmo shape usado em `handleSave`) → `updatePreset(p.id, { filters: nextFilters, sortBy: f.sort, sortOrder: 'desc' })` → toast "Filtros do preset atualizados"

`<AlertDialog>` com título "Atualizar filtros deste preset?", descrição "Os filtros salvos serão substituídos pelos filtros ativos agora. As estatísticas de uso e o favorito serão preservados." + preview compacto: `{contagem} filtros ativos serão salvos em "{preset.name}"`.

### 3. `SearchPresetsMenu.tsx`

Mesma estrutura, adaptada para `currentFilters` + `currentSearchTerm`:
- `<Pencil>` para renomear (mesma lógica)
- `<RefreshCw>` só se `hasActiveFilters` → confirm → `updatePreset(p.id, { filters: currentFilters, searchTerm: currentSearchTerm, sortBy, sortOrder })`

### 4. Testes em `src/lib/__tests__/use-search-presets-update.test.ts` (novo, ~60 linhas)

- `updatePreset` com `{ name }` preserva `id`, `createdAt`, `usageCount`, `lastUsedAt`, `isFavorite`
- `updatePreset` com `{ filters }` preserva mesma coisa
- Múltiplos updates não duplicam preset nem mexem em outros presets
- Dedup de nome ao renomear: `dedupeNameAgainst(['A', 'B'], 'A')` → `'A (2)'` (reusa helper já testado)

## Padrões obrigatórios

- PT-BR
- Tokens semânticos, flat (sem shadow/gradient)
- Reusa `dedupeNameAgainst` (já existe)
- Zero novas deps, zero novas queries de rede
- Backward compat total

## Arquivos tocados

**Editados (4):**
- `src/hooks/useSearchPresets.ts` — campo opcional `updatedAt` + setar no `updatePreset`
- `src/components/interactions/InteracoesPresetsMenu.tsx` — renomear inline + atualizar filtros + AlertDialog
- `src/components/search/SearchPresetsMenu.tsx` — mesma adição genérica
- `src/lib/__tests__/use-search-presets-update.test.ts` (novo) — testes de preservação

## Critério de fechamento

(a) Cada preset tem ícone "Renomear" (lápis) que vira input inline com Enter/Esc/blur; (b) renomear faz dedup automático contra outros presets; (c) cada preset com filtros ativos na tela mostra ícone "Atualizar com filtros atuais" (refresh) que pede confirmação via AlertDialog; (d) confirmar substitui `filters/sortBy/sortOrder` mas preserva `id/createdAt/usageCount/lastUsedAt/isFavorite`; (e) toasts em PT-BR; (f) zero regressão em salvar/aplicar/excluir/favoritar/exportar/importar/sugestão de nome/ordenação; (g) mesma UX em `SearchPresetsMenu` (Contatos/Empresas); (h) tokens semânticos, flat, sem novas deps.

