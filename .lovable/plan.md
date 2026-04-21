
# Plano: Salvar e reutilizar buscas avançadas em /interacoes

## Objetivo

Adicionar um menu suspenso na barra de busca avançada de `/interacoes` que permite **salvar a combinação atual** de filtros (texto, contato, empresa, canais, datas) com um nome e **reaplicá-la em 1 clique** depois. Persistência local por usuário/navegador, com até 10 presets.

## Reutilização

- `useSearchPresets(context)` — hook genérico já existente em `src/hooks/useSearchPresets.ts` (localStorage, máx 10, CRUD pronto).
- `AdvancedFilters` (URL state) já existente em `useInteractionsAdvancedFilter.ts` — apenas leremos/escreveremos via `setFilter`/`clear`.
- Padrão visual de presets já existente em `SearchPresetsMenu.tsx` (Empresas/Contatos) — adaptaremos a forma de payload, não o visual.

Sem nova tabela, sem edge function, sem fetch novo.

## Arquitetura

```text
AdvancedSearchBar (header sticky em /interacoes)
 └─ [novo] InteracoesPresetsMenu  (Popover ao lado de "Limpar tudo")
     ├─ Trigger: Bookmark + contador (n)
     ├─ Lista de presets (clique → aplica todos os campos via setFilter)
     ├─ Ação por item: aplicar / excluir
     └─ Rodapé: "Salvar busca atual" + input de nome (inline)

Storage: localStorage 'relateiq-search-presets-interactions' (via useSearchPresets('interactions'))
Payload por preset:
{
  id, name, createdAt,
  filters: { q, contact, company, canais[], de(ISO|null), ate(ISO|null) }
}
```

## Implementação

### 1. Novo componente `InteracoesPresetsMenu.tsx` (≤200 linhas)

`src/components/interactions/InteracoesPresetsMenu.tsx`

- Props: `filters: AdvancedFilters`, `setFilter`, `clear`, `activeCount`
- Usa `useSearchPresets('interactions')` (já existe)
- Adapta o payload: serializa `Date → ISO string` ao salvar e converte de volta ao aplicar
- UI:
  - Botão `outline` com `Bookmark` + badge de contador
  - `Popover` à direita: cabeçalho "Buscas salvas", lista compacta com nome + resumo (ex.: *"3 canais · 14 dias · 'kickoff'"*), botão lixeira por linha
  - Empty state PT-BR: *"Nenhuma busca salva. Aplique filtros e clique em 'Salvar busca atual'."*
  - Rodapé: botão "Salvar busca atual" → expande para `Input` + confirmar (Enter); desabilitado se `activeCount === 0`
  - Toast de sucesso/remoção
- Função `applyPreset(p)`:
  1. `clear()` (zera URL params atuais)
  2. Para cada chave do preset, chama `setFilter(key, value)` (datas convertidas de ISO → `Date`)

### 2. Integração em `AdvancedSearchBar.tsx`

- Importar `InteracoesPresetsMenu`
- Renderizar imediatamente **antes** do botão "Limpar tudo" (mesma linha do header)
- Passar `filters`, `setFilter`, `clear`, `activeCount`

### 3. Edge cases & padrões

- `Array.isArray()` defensivo em `canais`
- Datas: `Date` é serializável via `toISOString()`; ao aplicar, `new Date(iso)` validado com `isNaN`
- Nome do preset: trim, max 60 chars
- Sem `any`, sem `dangerouslySetInnerHTML`, PT-BR, flat design, tokens semânticos
- `React.memo` no menu

## Arquivos tocados

**Novos (1):**
- `src/components/interactions/InteracoesPresetsMenu.tsx`

**Editados (1):**
- `src/components/interactions/AdvancedSearchBar.tsx` — incluir o novo menu na barra

## Critério de fechamento

(a) Menu "Buscas salvas" visível na barra de busca avançada de `/interacoes`, (b) salvar combinação atual nomeada com até 10 entradas, (c) clicar num preset reaplica todos os campos (texto, contato, empresa, canais, datas) e atualiza URL, (d) excluir preset com confirmação via toast, (e) empty state quando não há presets, (f) zero novas queries de rede, (g) zero regressão na busca existente.
