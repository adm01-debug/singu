

# Plano: Persistência de período e canais na URL (deep-link)

## Status atual

A persistência **já está implementada** em `src/hooks/useFicha360Filters.ts`:

- `?periodo=<7|30|90|365>` para período (omitido quando = 90, o default)
- `?canais=<csv>` para canais (omitido quando vazio)
- `?q=<termo>` para busca textual
- `clear()` remove os 3 params
- `useSearchParams` do react-router garante reatividade a back/forward, refresh e colagem de URL

Os setters (`setDays`, `setChannels`, `setQ`) usam `setSearchParams(..., { replace: true })`, o que **substitui** a entrada do histórico em vez de empilhar — bom para digitação, mas ruim para compartilhar (o usuário não consegue voltar a um estado anterior por engano e a URL nem sempre está "settled").

O que falta para a experiência de **compartilhar link** ficar redonda:

## Lacunas identificadas

1. **Sem botão "Copiar link"** dedicado para a configuração atual de filtros. Hoje o usuário precisa copiar a URL do navegador manualmente — usável, mas não óbvio. Já existe `FavoritosFiltrosMenu` com "Compartilhar favorito", mas isso exige salvar como favorito antes.
2. **`replace: true` em todos os setters**: ao mudar período/canais, o histórico não cresce, então `back` não restaura o estado anterior dos filtros. Para deep-link compartilhável isso é OK, mas para navegação intra-página é ruim.
3. **Validação defensiva ao colar URL**: `parseCanais` em `useFicha360Filters` filtra por whitelist? Vou conferir — se não, valores inválidos no link entram silenciosamente.
4. **Sem feedback visual ao abrir um deep-link**: usuário que recebe o link não sabe que filtros vieram da URL. Toast curto resolveria.

## Mudanças

### 1. `src/hooks/useFicha360Filters.ts` — endurecer parse e push vs replace

- **Whitelist de canais** no parse: aplicar `KNOWN_CHANNELS = ['whatsapp','call','email','meeting','note']` e descartar valores fora da lista (consistente com `useInteractionsAdvancedFilter` que já faz isso — ver `use-interactions-advanced-filter-apply-all.test.ts`).
- **Push vs replace**: aceitar opção `{ pushHistory?: boolean }` em `setDays`, `setChannels`, `setQ` e `clear`. Default segue `replace: true` (não quebra debounce de busca). Botão "Copiar link" e "Aplicar favorito" passariam `pushHistory: true` para criar entrada navegável.
- Sem mudança de assinatura pública: param opcional → consumidores existentes intactos.

### 2. Novo: `src/components/ficha-360/CopiarLinkFiltrosButton.tsx` (~70 linhas)

- Botão `Link2` icon-only no `headerExtra` do `UltimasInteracoesCard`, **ao lado** do `FavoritosFiltrosMenu`.
- `aria-label="Copiar link com filtros atuais"`, tooltip explicativo.
- Ao clicar:
  1. Monta URL absoluta usando `window.location.origin + window.location.pathname + '?' + searchParams.toString()`.
  2. `navigator.clipboard.writeText(url)` com fallback para `document.execCommand('copy')` em browsers antigos (já existe util `copyToClipboard` em `src/lib/clipboard.ts`? — verificar e reutilizar; senão inline).
  3. Toast `sonner` "Link copiado · período + N canais + busca" descrevendo o estado.
- Desabilitado (`opacity-50`) quando não há filtros ativos (`activeCount === 0`) com tooltip "Configure ao menos um filtro para gerar link".

### 3. `src/pages/Ficha360.tsx` — integração

- Importar `CopiarLinkFiltrosButton` e renderizar no `headerExtra` antes de `FavoritosFiltrosMenu`.
- Hook novo `useFicha360DeeplinkToast`:
  - Em `useEffect` de mount-only, se `activeCount > 0` ao montar (ou seja, página abriu **com** filtros na URL), dispara toast info uma vez: "Filtros aplicados via link · {resumo}".
  - Usa `useRef` para garantir que dispara só uma vez por sessão de página.

### 4. Atalho de teclado

- Adicionar em `useFicha360FilterShortcuts`: `Shift + L` → "Copiar link com filtros atuais", reusando o handler do botão (passar via prop `onCopyLink`).
- Aparece automaticamente no cheatsheet sob escopo `ficha360-filtros`.

### 5. Tooltip nos chips

- Em `FiltrosAtivosChips`, adicionar dica visual no rodapé "Compartilhe este link: {url}" — **não**, isso polui. Decisão: pular. O botão dedicado + atalho já resolvem.

## Não muda

- Estrutura de query params (`?periodo`, `?canais`, `?q` permanecem); back/forward para usuários que recebem link funciona via histórico do browser nativo.
- `useFicha360DraftFilters`, `FiltrosInteracoesBar`, `FavoritosFiltrosMenu` (que já tem fluxo de compartilhar **favorito** com `?favorito=` separado, complementar a este).
- RLS, edge functions, tabelas.
- Whitelist de períodos (já validada como `[7,30,90,365]`).

## Critérios de aceite

(a) Botão `Link2` no header de "Últimas Interações" copia URL absoluta com `?periodo=`, `?canais=`, `?q=` (omitindo defaults); (b) toast `Link copiado` confirma com descrição do estado; (c) botão desabilitado quando não há filtro ativo; (d) `Shift + L` faz o mesmo via teclado e aparece no cheatsheet; (e) abrir um link com filtros aplica-os automaticamente (já funciona) e dispara toast `Filtros aplicados via link` 1x por sessão; (f) canais inválidos colados na URL são descartados via whitelist; (g) sem nova dependência, sem `any`, PT-BR, flat, todos os arquivos novos <120 linhas.

