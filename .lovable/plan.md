

# Plano: Filtro por tags/assuntos nas interações

## Contexto

Hoje em **Ficha 360 → Últimas Interações** existem filtros por período, canais e busca livre. Falta o filtro temático por **assuntos/tags** (ex.: "orçamento", "follow-up", "proposta") — um eixo distinto da busca livre porque:
- É **multi-seleção** (orçamento E proposta).
- Usa **vocabulário curado** com sinônimos (ex.: "follow-up" pega "followup", "retomada").
- Persiste no URL e em favoritos.

A view `vw_interaction_timeline` traz `assunto` e `resumo` como texto livre — sem coluna de tags. Vamos derivar tags **client-side** via dicionário de palavras-chave aplicado a `assunto + resumo`, sem nova query nem mudança de schema.

## Mudanças

### 1. Novo: `src/lib/interactionTags.ts` (~80 linhas)

Dicionário canônico de tags + extração:

```ts
export const TAG_DICTIONARY = {
  orcamento:  { label: 'Orçamento',  keywords: ['orçamento','orcamento','cotação','cotacao','preço','valor','quanto custa'] },
  proposta:   { label: 'Proposta',   keywords: ['proposta','contrato','minuta','termos'] },
  followup:   { label: 'Follow-up',  keywords: ['follow-up','followup','follow up','retomar','retomada','lembrete'] },
  reuniao:    { label: 'Reunião',    keywords: ['reunião','reuniao','call','agenda','agendar','marcar'] },
  duvida:     { label: 'Dúvida',     keywords: ['dúvida','duvida','pergunta','esclarecer'] },
  objecao:    { label: 'Objeção',    keywords: ['objeção','objecao','caro','não tenho interesse','não posso'] },
  fechamento: { label: 'Fechamento', keywords: ['fechado','assinou','assinado','aprovado','ganhamos'] },
  suporte:    { label: 'Suporte',    keywords: ['suporte','problema','erro','bug','reclamação','reclamacao'] },
} as const;

export type InteractionTag = keyof typeof TAG_DICTIONARY;

export function extractTags(text: string): InteractionTag[];          // normaliza + scan
export function interactionMatchesTags(i, selected): boolean;          // OR entre tags
export function countByTag(items): Record<InteractionTag, number>;
```

Normalização: `toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '')` (já existe `normalizeForSearch` em `src/lib/normalizeText.ts` — reusar).

### 2. `src/hooks/useFicha360Filters.ts` — adicionar `tags`

Novo query param `?tags=orcamento,proposta`. Whitelist usando `Object.keys(TAG_DICTIONARY)`. Setter `setTags(next)`. Incluir em `clear()` e em `activeCount`.

### 3. Novo: `src/components/ficha-360/FiltroTagsDropdown.tsx` (~110 linhas)

Botão `[🏷 Tags ▾]` no `FiltrosInteracoesBar`, ao lado dos chips de canais. Dropdown multi-seleção com checkboxes:

```
🏷 Tags  [3]
─────────
☑ Orçamento (8)
☑ Proposta (3)
☐ Follow-up (12)
☐ Reunião (5)
...
─────────
[Limpar tags]
```

- Contagem entre parênteses vem de `countByTag(allInteractionsInPeriod)` — calculada em `Ficha360.tsx` e passada via props.
- Tags com count `0` ficam `opacity-50` mas continuam clicáveis (pode futuramente aparecer).
- Item com `role="menuitemcheckbox"` + `aria-checked`. `onSelect={(e) => e.preventDefault()}` para manter aberto ao clicar.
- Botão `Limpar tags` no rodapé só quando há seleção.

### 4. `Ficha360.tsx` — aplicação do filtro

- Ler `tags` do `useFicha360Filters()`.
- Calcular `tagCounts = useMemo(() => countByTag(externalInteractions), [externalInteractions])` sobre o conjunto **já filtrado por período e canais** (mesma lógica que `ContagemPorTipoBar` usa para `Y`).
- Aplicar filtro de tags ao lado do filtro de busca: `if (tags.length > 0 && !interactionMatchesTags(it, tags)) return false;`
- Renderizar `<FiltroTagsDropdown selected={tags} onChange={setTags} counts={tagCounts} />` na barra de filtros.

### 5. `FiltrosAtivosChips.tsx` — chips para tags ativas

Adicionar bloco depois dos chips de canal:

```tsx
{tags.map(t => (
  <Badge variant="secondary" closeable onClose={() => onRemoveTag(t)} icon={<Tag className="h-3 w-3" />}>
    {TAG_DICTIONARY[t].label}
  </Badge>
))}
```

Props extra: `tags: InteractionTag[]`, `onRemoveTag: (t) => void`. Atualizar `activeChipCount` para incluir `tags.length`. Atualizar regra de "Limpar tudo" (já era `>= 2` chips ativos).

### 6. Favoritos: incluir `tags` no schema

Em `useFicha360FilterFavorites.ts` adicionar `tags: InteractionTag[]` ao tipo `FilterPreset` e bumpar `SCHEMA_VERSION`. Migração: presets antigos sem `tags` recebem `tags: []` ao carregar. Comparação de "preset ativo" (que destaca o ⭐) passa a comparar tags ordenadas também.

### 7. Atalho de teclado

Em `useFicha360FilterShortcuts.ts`, adicionar `Shift + T` → abre o `FiltroTagsDropdown` (foco no botão via `ref` exposto ou via evento custom `ficha360:open-tags`). Aparece automaticamente no cheatsheet (`?`).

### 8. `ContagemPorTipoBar` (sem mudança)

Continua mostrando contagem por **canal**. Tags são um eixo diferente — não duplicamos a barra. As contagens por tag aparecem dentro do próprio dropdown.

## Não muda

- `useExternalInteractions`, `vw_interaction_timeline`, edge functions, RLS, schema.
- `OrdenacaoToggle`, `ConversasRelacionadasCard`, `CompanyInteractionsTab`.
- Busca livre `q` permanece independente (busca em qualquer texto; tags são curadas).

## Critérios de aceite

(a) Botão "🏷 Tags" aparece em `FiltrosInteracoesBar` com badge mostrando quantas tags estão selecionadas; (b) dropdown lista 8 tags do dicionário com contagem por tag no período/canais correntes; (c) seleção múltipla com OR (tag A **ou** B) reflete imediatamente na lista; (d) URL persiste `?tags=orcamento,proposta` (omitido quando vazio); (e) chips fechaveis por tag ativa em `FiltrosAtivosChips`; (f) atalho `Shift + T` abre o dropdown e aparece no cheatsheet; (g) presets favoritos incluem tags (com migração automática para presets antigos); (h) `aria-label` em cada checkbox com label PT-BR + count; (i) sem nova dependência, sem `any`, PT-BR, novo arquivo `interactionTags.ts` <100 linhas, dropdown <120 linhas.

