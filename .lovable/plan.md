
# Plano: Timeline cronológica unificada em /interacoes

## Objetivo

Adicionar uma nova aba "Timeline" em `/interacoes` que agrupa interações por **Empresa** ou **Pessoa**, exibindo mensagens, ligações, emails, reuniões e notas em ordem cronológica, com filtros por tipo e período.

## Reutilização (não reinventar)

Já existem 3 componentes de timeline maduros no projeto:
- `ContactTimelineWidget` (por contato, usa `useContactTimeline`)
- `CompanyTimelineCard` (por empresa, recebe eventos via prop)
- `ExternalInteractionsTimeline` (por contato, agrupado visualmente)

A nova tela **agrega múltiplas entidades** numa única visão filtrada — não substitui os widgets existentes.

## Arquitetura

```text
/interacoes
 ├─ Tab "Lista" (atual)
 └─ Tab "Timeline" (NOVA)
      ├─ Toggle: [Por Empresa] [Por Pessoa]
      ├─ Filtros: tipo (chips multi-select) + período (date range)
      ├─ Busca: nome de empresa/pessoa
      └─ Lista de grupos colapsáveis:
           └─ Cada grupo = entidade
               └─ Eventos cronológicos (desc) com ícone, canal, resumo, data
```

## Implementação

### 1. Novo hook `useTimelineByEntity`
Arquivo: `src/hooks/useTimelineByEntity.ts`
- Recebe `{ groupBy: 'company' | 'contact', dateFrom, dateTo, channels[] }`
- Chama RPC externa `get_interactions_timeline_grouped` via `callExternalRpc`
- **Fallback**: se a RPC não existir, busca interações de `useInteractionsRpc` e agrupa client-side por `empresa_id` ou `contato_id`
- Retorna `Array<{ entity_id, entity_name, entity_type, events: TimelineEvent[] }>`
- StaleTime 5min, TanStack Query (sem useEffect)

### 2. Novo componente `UnifiedTimelineView`
Arquivo: `src/components/interactions/UnifiedTimelineView.tsx` (≤300 linhas)
- Header com toggle Empresa/Pessoa (Tabs shadcn)
- Barra de filtros sticky:
  - Chips multi-select de canais (whatsapp, call, email, meeting, note) — reutiliza `channelIcons`/`channelColors` do `UnifiedCommunicationHistory`
  - Date range picker (Popover + Calendar shadcn, `pointer-events-auto`)
  - Input de busca por nome
- Lista virtualizada com `Accordion` por entidade:
  - Cabeçalho: avatar + nome + badge contagem + última atividade
  - Conteúdo: timeline vertical com linha conectora (padrão visual de `ContactTimelineWidget`)
- Empty state e Skeleton

### 3. Subcomponentes
- `TimelineGroupCard.tsx` — grupo de uma entidade (≤150 linhas)
- `TimelineFilterBar.tsx` — barra de filtros isolada (≤120 linhas)

### 4. Integração em `/interacoes`
- Editar `src/pages/Interacoes.tsx`: envolver conteúdo atual em `<Tabs>` com 2 abas: "Lista" (atual) e "Timeline" (novo `UnifiedTimelineView`)
- Persistir aba ativa em URL via `useSearchParams` (padrão do projeto)

### 5. Resiliência e padrões obrigatórios
- `Array.isArray()` antes de iterar
- Tratamento gracioso de RPC failure (fallback client-side)
- Memoização: `React.memo` no `TimelineGroupCard`
- Tudo em PT-BR
- Sem `any`, sem `dangerouslySetInnerHTML`
- Cores via tokens semânticos (Nexus Blue), flat design sem sombras/gradientes

## Arquivos tocados

**Novos:**
- `src/hooks/useTimelineByEntity.ts`
- `src/components/interactions/UnifiedTimelineView.tsx`
- `src/components/interactions/TimelineGroupCard.tsx`
- `src/components/interactions/TimelineFilterBar.tsx`

**Editados:**
- `src/pages/Interacoes.tsx` (adicionar Tabs Lista/Timeline)

## Critério de fechamento

(a) Aba "Timeline" acessível em `/interacoes?tab=timeline`, (b) toggle Empresa/Pessoa funcional, (c) filtros por canal e data range aplicáveis, (d) agrupamento cronológico desc por entidade, (e) fallback client-side se RPC falhar, (f) zero regressão na aba Lista existente.
