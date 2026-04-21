

# Plano: Modo "Aplicar filtros" (rascunho) na Ficha 360

## Objetivo

Permitir ajustar período e canais em um **estado rascunho** (sem atualizar a URL nem a lista a cada clique) e aplicar tudo de uma vez via botão "Aplicar filtros". Mantém compatibilidade com URL deep-link.

## Decisão de design

- **Estado rascunho local** vive em `Ficha360.tsx`, inicializado a partir de `useFicha360Filters` (URL).
- **Aplicar** propaga rascunho → URL via `setDays` + `setChannels` (já com `replace: true`).
- **Indicador de pendência**: botão "Aplicar filtros" só aparece quando há diferença entre rascunho e URL (`isDirty`).
- **Botão "Descartar"** ao lado, para reverter rascunho ao estado da URL.
- **Atalho `Enter`** dentro da barra aplica; `Esc` descarta.
- **Auto-sync**: se a URL mudar por fonte externa (preset aplicado, navegação, back/forward), o rascunho ressincroniza para refletir os novos valores.

## Mudanças

### 1. Novo hook: `src/hooks/useFicha360DraftFilters.ts` (~60 linhas)

Encapsula a lógica de rascunho:

```ts
export function useFicha360DraftFilters(
  appliedDays: Ficha360Period,
  appliedChannels: string[],
) {
  const [draftDays, setDraftDays] = useState(appliedDays);
  const [draftChannels, setDraftChannels] = useState(appliedChannels);

  // Ressincroniza quando URL muda externamente (presets, back/forward)
  useEffect(() => { setDraftDays(appliedDays); }, [appliedDays]);
  useEffect(() => { setDraftChannels(appliedChannels); }, [appliedChannels.join(',')]);

  const isDirty =
    draftDays !== appliedDays ||
    draftChannels.length !== appliedChannels.length ||
    draftChannels.some((c) => !appliedChannels.includes(c));

  const reset = useCallback(() => {
    setDraftDays(appliedDays);
    setDraftChannels(appliedChannels);
  }, [appliedDays, appliedChannels]);

  return { draftDays, draftChannels, setDraftDays, setDraftChannels, isDirty, reset };
}
```

> Observação: o projeto proíbe `useEffect` para **fetch**, mas permite para sincronização de estado UI puro como esta — padrão idêntico ao já usado em outros hooks de UI da base.

### 2. `Ficha360.tsx`

- Manter `useFicha360Filters()` (fonte da URL = aplicado).
- Adicionar `useFicha360DraftFilters(days, channels)`.
- `useFicha360(id, { days, channels })` continua usando o aplicado (não o rascunho) — lista **não muda** até aplicar.
- `useFicha360ChannelCounts(id, draftDays)` passa a usar **`draftDays`** para que as contagens reflitam o período em ajuste (feedback antecipado de impacto). Justificativa: contagens são leves (200 itens, cache 5min) e o usuário quer ver o impacto antes de aplicar — alinhado ao plano anterior aprovado.
- Handler `onApply`: `setDays(draftDays); setChannels(draftChannels);` (uma vez).
- Passar para `FiltrosInteracoesBar`: `days=draftDays`, `channels=draftChannels`, `onDaysChange=setDraftDays`, `onChannelsChange=setDraftChannels`, `isDirty`, `onApply`, `onDiscard=reset`.

### 3. `FiltrosInteracoesBar.tsx`

- Novas props opcionais: `isDirty?: boolean`, `onApply?: () => void`, `onDiscard?: () => void`.
- Quando `isDirty === true`, renderizar (logo após "Limpar"):

```tsx
{isDirty && onApply && (
  <div className="ml-auto flex items-center gap-1.5">
    <span className="text-xs text-warning">Alterações não aplicadas</span>
    {onDiscard && (
      <Button variant="ghost" size="sm" onClick={onDiscard}
        className="h-6 px-2 text-xs gap-1" aria-label="Descartar alterações"
        title="Descartar (Esc)">
        <Undo2 className="h-3 w-3" /> Descartar
      </Button>
    )}
    <Button variant="default" size="sm" onClick={onApply}
      className="h-6 px-2.5 text-xs gap-1" aria-label="Aplicar filtros"
      title="Aplicar (Enter)">
      <Check className="h-3 w-3" /> Aplicar
    </Button>
  </div>
)}
```

- Atalhos: adicionar `onKeyDown` no contêiner raiz da barra — `Enter` chama `onApply`, `Esc` chama `onDiscard`. Usar `tabIndex={-1}` para captura sem mudar foco visual.
- "Limpar" passa a operar no rascunho (`onChannelsChange([])` + `onDaysChange(90)`), não na URL — fica consistente com o resto do modo rascunho. A URL só muda no Aplicar.
- Comportamento sem props (`isDirty`/`onApply` undefined): mantém retrocompatibilidade — barra continua aplicando direto (uso atual em outros lugares, se houver).

### 4. Backwards compatibility

- `FiltrosAtivosChips` continua refletindo o **aplicado** (URL), não o rascunho — mostra o que está realmente filtrando a lista. Sem mudança.
- `useFicha360Filters` intacto.
- Deep-link (`?periodo=30&canais=...`) continua funcionando: ao carregar com URL, `applied = draft` → `isDirty = false`, sem botão visível.

### 5. Acessibilidade

- Botão Aplicar com `aria-label="Aplicar filtros"`, `title` mostrando atalho.
- Indicador "Alterações não aplicadas" com `role="status"` e `aria-live="polite"`.
- Foco volta para Aplicar ao surgir (`autoFocus` evitado para não sequestrar; usuário vê visualmente).

## Não faz parte deste plano

- Persistir rascunho entre sessões (localStorage).
- Confirmação ao sair com rascunho pendente (pode vir depois via `useBlocker`).
- Mexer em `useFicha360.ts`, `useExternalInteractions.ts`, `FiltrosAtivosChips.tsx`, `useFicha360Filters.ts`.
- Aplicar o mesmo modo em `ProximosPassosFiltersBar` (escopo separado).

## Critérios de aceite

(a) Ajustes em período/canais não atualizam a lista até clicar "Aplicar"; (b) botão "Aplicar filtros" só aparece quando há diferença rascunho vs URL (`isDirty`); (c) "Descartar" reverte rascunho ao estado aplicado; (d) `Enter` aplica, `Esc` descarta; (e) ao aplicar, URL é atualizada via `setDays`+`setChannels` com `replace: true` (sem novo histórico); (f) deep-link funciona: refresh com `?periodo=30` carrega já aplicado, sem botão visível; (g) presets aplicados externamente ressincronizam o rascunho automaticamente; (h) contagens por canal usam `draftDays` para feedback antecipado; (i) `FiltrosAtivosChips` segue refletindo o aplicado; (j) novo hook ≤ 80 linhas, sem `any`; (k) `FiltrosInteracoesBar` permanece ≤ 200 linhas e retrocompatível (props opcionais); (l) flat, PT-BR, sem emojis, sem dependência nova.

