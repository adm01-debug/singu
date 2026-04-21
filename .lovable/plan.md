
# Plano: Filtros no topo da Ficha 360

## Objetivo

Adicionar uma barra de filtros compacta no topo da seção "Últimas Interações" da Ficha 360, permitindo escolher **período** (7/30/90/365 dias) e **canais** (WhatsApp, Email, Ligação, Reunião, Nota) antes de renderizar a lista. Os filtros persistem na URL para deep-link.

## Reutilização

- `useExternalInteractions(contactId, limit)` já existe — vamos estender para aceitar `{ days, channels }` e filtrar no `select` ou client-side.
- `useFicha360` já agrega tudo — apenas passa as opções de filtro adiante.
- Padrão visual idêntico ao `TimelineFilterBar` (chips de canal, badge ativo) para consistência.
- Persistência via `useSearchParams` (padrão do projeto, memory `persistencia-de-estado-na-url`).

## Arquitetura

```text
Ficha 360
 └─ Card "Últimas Interações"
     ├─ Header: título + botão "Ver todas"
     ├─ FiltrosInteracoesBar (NOVO, compacto inline)
     │    [7d|30d|90d|365d]   [WA] [☎] [✉] [📅] [📝]   "X de Y"
     └─ Lista (já existe — recebe items já filtrados)
```

## Implementação

### 1. Estender `useExternalInteractions`
- Adicionar parâmetros opcionais `{ days?: number, channels?: string[] }`.
- Aplicar `data_interacao >= now - days` e `channel in channels` na query (ou client-side se vier de RPC).
- Ajustar `queryKey` para invalidação correta por filtro.

### 2. Estender `useFicha360`
- Aceitar `options?: { days?: number; channels?: string[] }`.
- Passar para `useExternalInteractions`.
- `channelCounts` continua refletindo o conjunto carregado.

### 3. Novo componente `FiltrosInteracoesBar`
`src/components/ficha-360/FiltrosInteracoesBar.tsx` (≤120 linhas)
- Tabs/segmented control para período (7/30/90/365 dias, default 90).
- Chips multi-select para canais (WhatsApp, Call, Email, Meeting, Note) — visual igual `TimelineFilterBar`.
- Contador "X de Y interações" + botão "Limpar" quando há filtros ativos.
- `React.memo`.

### 4. Hook `useFicha360Filters`
`src/hooks/useFicha360Filters.ts` (≤80 linhas)
- Sincroniza `?periodo=` e `?canais=` (CSV) na URL via `useSearchParams`.
- Retorna `{ days, channels, setDays, setChannels, clear, activeCount }`.
- Defaults: `days=90`, `channels=[]` (todos).

### 5. Integração em `Ficha360.tsx`
- Instanciar `useFicha360Filters()`.
- Passar `{ days, channels }` para `useFicha360`.
- Renderizar `<FiltrosInteracoesBar />` dentro do header de `UltimasInteracoesCard` (via prop) ou logo acima do card.

### 6. Ajuste em `UltimasInteracoesCard`
- Aceitar prop opcional `headerExtra?: ReactNode` para renderizar a barra de filtros logo abaixo do título sem quebrar o layout.
- Mostrar empty state específico quando filtros zeram resultados ("Nenhuma interação no período/canais selecionados").

## Padrões obrigatórios
- PT-BR
- `Array.isArray()` antes de iterar
- Sem `any`, sem `dangerouslySetInnerHTML`
- Tokens semânticos, flat design
- Persistência URL para deep-link
- Sem `useEffect` para fetch (composição TanStack Query)

## Arquivos tocados

**Novos (2):**
- `src/components/ficha-360/FiltrosInteracoesBar.tsx`
- `src/hooks/useFicha360Filters.ts`

**Editados (4):**
- `src/hooks/useExternalInteractions.ts` — aceitar `{days, channels}`
- `src/hooks/useFicha360.ts` — propagar opções
- `src/pages/Ficha360.tsx` — instanciar filtros e passar adiante
- `src/components/ficha-360/UltimasInteracoesCard.tsx` — slot para filtros + empty state filtrado

## Critério de fechamento

(a) Barra de filtros visível no topo da seção "Últimas Interações", (b) seleção de período (7/30/90/365d) e canais (multi) funcional, (c) lista re-renderiza com itens filtrados, (d) estado persistido na URL (`?periodo=&canais=`), (e) empty state contextual quando filtros zeram resultados, (f) zero regressão nos demais cards da Ficha 360.
