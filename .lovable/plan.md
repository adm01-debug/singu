

# Plano: Anotações por semana no chart de sentimento

## Diagnóstico

- O `SentimentTrendChart.tsx` plota séries semanais com volume, MA e faixa de evolução, mas não há forma de marcar eventos contextuais (campanhas, mudanças de abordagem, releases) que ajudem a explicar variações.
- Anotações precisam ser persistidas por contato e por semana (`week_start`), com texto curto, categoria e cor — visíveis a todos os usuários da org com permissão de leitura ao contato, editáveis por quem criou ou admins.
- Como o chart aparece em `interactions/insights` (visão por contato/empresa via filtros do hook `useInteractionsInsights`), o escopo da anotação será **por contato** (campo opcional `company_id` para anotações de empresa), com `scope` enum `contact|company|global` futuro — começamos só com `contact` para casar com o uso atual.

## O que será construído

### 1. Backend (Lovable Cloud)

**Tabela `sentiment_annotations`** (migração):
- `id uuid pk`, `created_by uuid` (auth.uid), `contact_id uuid not null`, `week_start date not null` (segunda-feira da semana ISO)
- `category text not null check in ('campanha','abordagem','release','reuniao','outro')`
- `title text not null` (≤80 chars), `description text` (≤500 chars, opcional)
- `created_at timestamptz default now()`, `updated_at timestamptz default now()` (trigger)
- Índice `(contact_id, week_start)`
- RLS:
  - SELECT: usuários autenticados podem ver anotações (mesma política dos demais módulos do CRM por contato)
  - INSERT: `auth.uid() = created_by`
  - UPDATE/DELETE: `auth.uid() = created_by` OR `has_role(auth.uid(), 'admin')`

### 2. Hook `useSentimentAnnotations(contactId)`

`src/hooks/useSentimentAnnotations.ts` — TanStack Query:
- `list`: query por `contact_id`, retorna `Map<weekStartISO, Annotation[]>`
- `create`, `update`, `delete`: mutations com invalidate da query
- StaleTime 5min, sem `useEffect`

### 3. UI no `SentimentTrendChart.tsx`

- **Marcadores no chart**: `<ReferenceDot>` por semana com anotação, no topo do `yAxisId="pct"` (y=100), cor por categoria, raio 5, com `onClick` abrindo popover.
- **Tooltip enriquecido**: quando a semana tem anotações, lista até 2 títulos com cor da categoria.
- **Botão "Anotar" no header** (ghost size xs, `Pin` icon) ao lado de "Suavizar": abre `Dialog` para criar nova anotação com `Select` de semana (apenas semanas presentes em `data`), `Select` de categoria, `Input` título, `Textarea` descrição.
- **Drawer/lista lateral compacta** (collapsible abaixo do chart, fechado por padrão): exibe todas as anotações ordenadas por `week_start desc`, com badge de categoria, texto, autor e ações editar/excluir (visíveis para owner/admin).

### 4. Tipos e mapeamento

- `AnnotationCategory` enum local com `label`, `color` (hsl token semântico), `icon` (lucide).
- Categorias: campanha (primary), abordagem (warning), release (success), reuniao (accent), outro (muted).

### 5. Constraints

- Sem mudanças em `useInteractionsInsights.ts`, agregação semanal, MA, faixa de evolução, stat cards, barras de volume.
- Sem `any`, sem `dangerouslySetInnerHTML`, PT-BR, flat.
- `SentimentTrendChart.tsx` permanece ≤350 linhas (extrair `AnnotationDialog.tsx` e `AnnotationList.tsx` em arquivos próprios dentro de `interactions/insights/`).

## Critérios de aceite

(a) Existe tabela `sentiment_annotations` com RLS adequada (criador ou admin edita/remove; autenticados leem); (b) hook `useSentimentAnnotations` expõe list/create/update/delete via TanStack Query com invalidação correta; (c) no chart, semanas com anotação exibem `ReferenceDot` colorido por categoria no topo, e o tooltip da semana lista títulos das anotações; (d) botão "Anotar" no header abre dialog para criar anotação com seleção de semana (limitada às semanas com dados), categoria, título (obrigatório, ≤80) e descrição (opcional, ≤500); (e) lista colapsível abaixo do chart mostra todas as anotações com badge de categoria, autor, data e ações editar/excluir respeitando permissão; (f) sem mudanças em hooks de agregação, MA, faixa de evolução, stat cards, barras de volume; (g) sem novas dependências, PT-BR, flat, sem `any`, sem `dangerouslySetInnerHTML`; (h) `SentimentTrendChart.tsx` ≤350 linhas (componentes extraídos quando necessário); (i) sem regressão em layout responsivo, legenda, ReferenceLines existentes ou seletor de período.

