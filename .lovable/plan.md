
# Plano: Filtros rápidos de canal na busca de /interacoes

## Objetivo

Expor **chips de canal** (WhatsApp, Ligação, Email, Reunião, Nota) **diretamente na barra de busca** de `/interacoes`, antes do popover de filtros avançados, permitindo alternar canais com 1 clique sem abrir nenhum diálogo.

## Reutilização

- `useInteractionsAdvancedFilter → filters.canais` + `setFilter('canais', ...)` — estado já persiste na URL (`?canais=`)
- Padrão visual de chips de canal idêntico ao `FiltrosInteracoesBar.tsx` da Ficha 360 (`Badge` toggle + ícone + label) — copiamos o pattern, sem dependência cruzada
- Ícones `MessageSquare/Phone/Mail/Calendar/FileText` do `lucide-react`

Sem nova tabela, sem novo fetch, sem novo hook.

## Arquitetura

```text
AdvancedSearchBar (header sticky de /interacoes)
 ├─ Input de texto (existente)
 ├─ [NOVO] CanaisQuickFilter — 5 chips toggle inline
 │     └─ usa filters.canais + setFilter('canais', next[])
 ├─ Botão "Filtros avançados" (popover existente — pessoa, empresa, datas)
 ├─ InteracoesPresetsMenu (existente)
 └─ Botão "Limpar tudo" (existente)
```

## Implementação

### 1. Novo componente `CanaisQuickFilter.tsx` (≤90 linhas)

`src/components/interactions/CanaisQuickFilter.tsx`

- Props: `canais: string[]`, `onChange: (next: string[]) => void`
- 5 chips fixos: `whatsapp`, `call`, `email`, `meeting`, `note` com ícone + label PT-BR
- Toggle: clique adiciona/remove do array; mantém ordem original
- Visual flat: `Badge variant="default"` quando ativo, `outline` quando inativo
- `aria-pressed`, `role="button"`, `title` com label completo
- Label oculto em mobile (`hidden sm:inline`), apenas ícone visível
- `React.memo`

### 2. Integração em `AdvancedSearchBar.tsx`

- Importar `CanaisQuickFilter`
- Renderizar **logo após** o input de busca e **antes** do botão "Filtros avançados", na mesma linha (flex-wrap)
- Passar `filters.canais` e `(next) => setFilter('canais', next)`
- Garantir que o popover de filtros avançados **deixe de exibir** o controle de canais (evita duplicação) — manter pessoa/empresa/datas no popover

### 3. Padrões obrigatórios

- PT-BR
- `Array.isArray(canais)` defensivo
- Sem `any`, sem `dangerouslySetInnerHTML`
- Tokens semânticos, flat design
- Mantém persistência em URL (já implementada via `setFilter`)
- `activeCount` continua refletindo canais selecionados (já calcula `filters.canais.length > 0 ? 1 : 0`)

## Arquivos tocados

**Novos (1):**
- `src/components/interactions/CanaisQuickFilter.tsx`

**Editados (1):**
- `src/components/interactions/AdvancedSearchBar.tsx` — inserir chips e remover seção de canais do popover

## Critério de fechamento

(a) 5 chips de canal visíveis inline na barra de busca de `/interacoes`, (b) clique alterna canal e atualiza URL (`?canais=`) instantaneamente, (c) seção de canais removida do popover de filtros avançados (sem duplicação), (d) labels ocultos em mobile (apenas ícones), (e) zero novas queries de rede, (f) zero regressão em presets, busca textual ou outros filtros.
