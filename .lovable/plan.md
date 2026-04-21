

# Plano: Filtros e ordenação em "Próximos Passos" da Ficha 360

## Contexto

Hoje o `ProximosPassosCard` lista todos os passos sugeridos em ordem fixa (definida por `computeProximosPassos`). Quando há 5–7 sugestões com prioridades e canais variados, fica difícil focar no que importa agora (ex: "só alta prioridade" ou "só WhatsApp"). Vamos adicionar uma barra leve de filtros + ordenação inline no header do card, persistida na URL para sobreviver a refresh e ser compartilhável.

## Decisão de escopo

- **Filtros disponíveis**: prioridade (alta/média/baixa, multi-select) + canal (whatsapp/email/call/meeting/linkedin, multi-select).
- **Ordenação**: 3 opções — `Sugerido` (default, mantém ordem do `computeProximosPassos`), `Prioridade` (alta→baixa) e `Canal` (alfabético, agrupando por canal).
- **Persistência**: query params `?nbaPrio=alta,media&nbaCanal=whatsapp&nbaSort=prioridade` (prefixo `nba` para não colidir com filtros existentes da Ficha 360 como `?periodo=` e `?canais=`). Reusa `useSearchParams` (mesmo padrão de `useFicha360Filters`).
- **UI compacta**: chips toggle no estilo `CanaisQuickFilter` para canal/prioridade + `Select` de ordenação no estilo `SortSelect`. Tudo flat, tokens semânticos, PT-BR.
- **Contador inteligente**: `"3 de 7 sugestões"` no header quando há filtro ativo, com botão "Limpar" se ≥1 filtro estiver ligado.
- **Empty state contextual**: se filtros zerarem a lista mas houver passos disponíveis, mostrar "Nenhuma sugestão com esses filtros" + botão "Limpar filtros". Sem filtros e lista vazia = empty state atual (intocado).
- **Zero impacto em outros fluxos**: `ProximaAcaoCTA` (que pega o primeiro passo de prioridade alta) usa a lista **original** (não filtrada), pois é o "destaque do topo". Só a lista exibida abaixo é filtrada.

## Implementação

### 1. Novo hook: `src/hooks/useProximosPassosFilters.ts` (~90 linhas)

```ts
export type NbaPriority = 'alta' | 'media' | 'baixa';
export type NbaSort = 'sugerido' | 'prioridade' | 'canal';

export function useProximosPassosFilters() {
  // lê/escreve em searchParams (nbaPrio, nbaCanal, nbaSort)
  // retorna { priorities, channels, sort, setPriorities, setChannels, setSort, clear, activeCount }
}
```

- Padrão idêntico ao `useFicha360Filters` (URL como single source of truth, `replace: true`).
- `sort = 'sugerido'` é default e não polui a URL.

### 2. Novo helper: `src/lib/filterProximosPassos.ts` (~40 linhas)

```ts
export function filterAndSortPassos(
  passos: ProximoPasso[],
  opts: { priorities: NbaPriority[]; channels: string[]; sort: NbaSort }
): ProximoPasso[]
```

- Pure function, deterministic. Map `alta/media/baixa` → string match. Ordena por `PRIORITY_RANK` (alta=3, media=2, baixa=1) ou alfabeticamente por `channel`.

### 3. Novo componente: `src/components/ficha-360/ProximosPassosFiltersBar.tsx` (~140 linhas)

- Linha 1 (chips compactos):
  - **Prioridade**: 3 badges toggle (Alta/Média/Baixa) com cor semântica (destructive/default/secondary), no estilo `CanaisQuickFilter`.
  - Separador vertical sutil.
  - **Canal**: 5 badges toggle (WhatsApp/Email/Ligação/Reunião/LinkedIn) com ícones `lucide-react`.
- Linha 2 (rodapé do filtro, condicional):
  - Texto "{shown} de {total} sugestões" + botão "Limpar" (só se `activeCount ≥ 1`).
  - À direita: `<Select>` de ordenação (Sugerido / Prioridade / Canal).
- `React.memo`, PT-BR, tokens semânticos.

### 4. Refatorar `ProximosPassosCard.tsx`

- Importar `useProximosPassosFilters`, `filterAndSortPassos`, `ProximosPassosFiltersBar`.
- Manter `passos` original para `ProximaAcaoCTA` (já usa `passos[0]` no `Ficha360.tsx`, fora do card — sem mudança).
- Calcular `displayPassos = filterAndSortPassos(passos, { priorities, channels, sort })`.
- Renderizar `<ProximosPassosFiltersBar>` no header, abaixo do `CardTitle`, **só se `passos.length >= 2`** (não polui quando há 1 sugestão).
- Iterar sobre `displayPassos` (não `passos`) na lista renderizada.
- Empty state contextual: se `passos.length > 0 && displayPassos.length === 0` → mostrar mini-empty "Nenhuma sugestão com esses filtros" + botão "Limpar filtros".
- Manter intactos: badges de outcome, `AgendarReuniaoForm`, `ProximoPassoQuickForm`, `CopyScriptMenu`, `PassoFeedbackMenu`, `createdIds`, etc.

### 5. Sem mudanças em `Ficha360.tsx`

- `ProximaAcaoCTA` continua recebendo `passos` (lista bruta do `computeProximosPassos`) — o filtro é puramente visual no card abaixo.

## Padrões obrigatórios

- PT-BR
- Tokens semânticos (sem cores fixas)
- Flat (sem shadow/gradient)
- `React.memo` no FiltersBar
- URL como source of truth (mesmo padrão do `useFicha360Filters`)
- Zero novas queries de rede
- Backward compat: lista exibida idêntica quando nenhum filtro está ativo (sort=`sugerido` preserva ordem original)

## Arquivos tocados

**Criados (3):**
- `src/hooks/useProximosPassosFilters.ts`
- `src/lib/filterProximosPassos.ts`
- `src/components/ficha-360/ProximosPassosFiltersBar.tsx`

**Editados (1):**
- `src/components/ficha-360/ProximosPassosCard.tsx` — barra de filtros + lista filtrada + empty state contextual

## Critério de fechamento

(a) Header do card mostra chips de prioridade (Alta/Média/Baixa) e canal (WhatsApp/Email/Ligação/Reunião/LinkedIn) clicáveis quando há ≥2 sugestões, (b) `Select` de ordenação com opções Sugerido/Prioridade/Canal, default Sugerido, (c) filtros e ordenação persistem em `?nbaPrio=…&nbaCanal=…&nbaSort=…` na URL e sobrevivem a refresh, (d) header mostra "{shown} de {total} sugestões" + botão "Limpar" quando há filtro ativo, (e) lista filtrada vazia exibe mini-empty contextual com CTA "Limpar filtros", (f) `ProximaAcaoCTA` não é afetado (continua usando a lista bruta), (g) zero regressão em `AgendarReuniaoForm`, `ProximoPassoQuickForm`, `CopyScriptMenu`, `PassoFeedbackMenu`, badges de outcome ou Modo de Testes, (h) PT-BR, tokens semânticos, flat.

