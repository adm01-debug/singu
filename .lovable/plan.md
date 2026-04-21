

# Plano: Persistir preferências de visualização (densidade, lote, modo, ordenação) entre sessões

## Contexto

Em `useInteractionsAdvancedFilter`:
- `density` já tem hidratação one-shot do `localStorage` no mount + persistência reativa.
- `perPage`, `view` e `sort` são lidos/escritos só na URL. Sem `?perPage=`, `?view=`, `?sort=` na URL, o usuário sempre volta aos defaults (`25`, `list`, `recent`), mesmo que tenha escolhido outro valor antes.

O usuário quer manter densidade **e tamanho do lote** (e por consistência também `view` e `sort`) ao voltar à página `/interacoes`.

## Decisão de escopo

Adicionar persistência local **somente para preferências de visualização** (não para filtros de dados como busca, contato, empresa, canais, direção, datas — esses ficam URL-only para evitar confundir o usuário com filtros "fantasma").

Preferências persistidas em `localStorage`:
- `perPage` (chave `singu-interactions-perPage-v1`) — valores válidos: 10/25/50/100; default 25.
- `view` (chave `singu-interactions-view-v1`) — `list | by-contact | by-company`; default `list`.
- `sort` (chave `singu-interactions-sort-v1`) — `recent | oldest | relevance | entity`; default `recent`.

Regras (mesmo padrão já aplicado para `density`):
- **URL ganha sobre cache**: se o usuário chega via link com `?perPage=50`, isso prevalece e atualiza o cache.
- **Hidratação one-shot no mount**: se o param **não está** na URL e o cache tem valor diferente do default, faz `setSearchParams(..., { replace: true })` adicionando o param.
- **Persistência reativa**: qualquer mudança em `filters.perPage|view|sort` grava no `localStorage`.
- **Não conta em `activeCount`** (já não conta hoje).
- **`clear()` mantém preferências**: zera filtros de dados, mas não toca em densidade/lote/modo/sort (comportamento já existente — `clear` apaga via `KEYS.forEach delete`, e os useEffects de hidratação só rodam no mount, então após `clear` os params somem da URL mas o cache continua. No próximo mount, voltam. Isso é o desejado).

## Implementação

### `src/hooks/useInteractionsAdvancedFilter.ts`

1. Adicionar três constantes de chave + parsers de cache:
   ```ts
   const PERPAGE_STORAGE_KEY = 'singu-interactions-perPage-v1';
   const VIEW_STORAGE_KEY    = 'singu-interactions-view-v1';
   const SORT_STORAGE_KEY    = 'singu-interactions-sort-v1';
   ```

2. Refatorar a hidratação para **um único `useEffect` one-shot** que processa todas as preferências em uma única atualização da URL (evita 4 `setSearchParams` consecutivos):
   ```ts
   const prefsHydratedRef = useRef(false);
   useEffect(() => {
     if (prefsHydratedRef.current) return;
     prefsHydratedRef.current = true;
     const next = new URLSearchParams(searchParams);
     let changed = false;

     if (!searchParams.get('density')) {
       const v = readLS(DENSITY_STORAGE_KEY);
       if (v === 'compact') { next.set('density', 'compact'); changed = true; }
     }
     if (!searchParams.get('perPage')) {
       const n = parseInt(readLS(PERPAGE_STORAGE_KEY) ?? '', 10);
       if ((VALID_PER_PAGE as readonly number[]).includes(n) && n !== DEFAULT_PER_PAGE) {
         next.set('perPage', String(n)); changed = true;
       }
     }
     if (!searchParams.get('view')) {
       const v = readLS(VIEW_STORAGE_KEY);
       if (v && (VALID_VIEWS as string[]).includes(v) && v !== 'list') {
         next.set('view', v); changed = true;
       }
     }
     if (!searchParams.get('sort')) {
       const v = readLS(SORT_STORAGE_KEY);
       if (v && (VALID_SORTS as string[]).includes(v) && v !== 'recent') {
         next.set('sort', v); changed = true;
       }
     }
     if (changed) setSearchParams(next, { replace: true });
   }, []);
   ```
   Remove o `useEffect` de hidratação isolada de `density` (consolidado neste).

3. Persistência reativa (substitui o effect específico de density):
   ```ts
   useEffect(() => { writeLS(DENSITY_STORAGE_KEY, filters.density); }, [filters.density]);
   useEffect(() => { writeLS(PERPAGE_STORAGE_KEY, String(filters.perPage)); }, [filters.perPage]);
   useEffect(() => { writeLS(VIEW_STORAGE_KEY, filters.view); }, [filters.view]);
   useEffect(() => { writeLS(SORT_STORAGE_KEY, filters.sort); }, [filters.sort]);
   ```
   Helpers internos `readLS(k)`/`writeLS(k,v)` com try/catch para ambientes sem localStorage.

4. `clear()`, `applyAll()`, `setFilter()`: **sem mudanças**. As preferências continuam viajando pela URL como hoje; o localStorage é só um espelho para hidratação cross-session.

## Testes

**Editar** `src/hooks/__tests__/useInteractionsAdvancedFilter.density.test.ts` — renomear para `useInteractionsAdvancedFilter.preferences.test.ts` (ou adicionar bloco). Casos novos:

1. Sem `?perPage` e cache `'50'` → após mount, URL passa a `?perPage=50` e `filters.perPage === 50`.
2. Com `?perPage=10` e cache `'50'` → URL ganha; `filters.perPage === 10`; cache reescrito para `'10'` pelo effect reativo.
3. Sem `?view` e cache `'by-contact'` → hidrata para `view=by-contact`.
4. Sem `?sort` e cache `'oldest'` → hidrata para `sort=oldest`.
5. `setFilter('perPage', 50)` grava `'50'` no `localStorage`.
6. `setFilter('view', 'by-company')` grava `'by-company'`.
7. `setFilter('sort', 'relevance')` grava `'relevance'`.
8. Cache inválido (`'foo'`/`'999'`) → ignorado, mantém defaults sem erro.
9. Defaults explícitos (`perPage=25`, `view=list`, `sort=recent`) **não** adicionam param à URL na hidratação (continuam "limpos").
10. Regressão: density continua hidratando como antes.

## Padrões obrigatórios

- PT-BR, flat, zero novas deps.
- Backward-compat total: API pública do hook intacta (`filters`, `setFilter`, `clear`, `applyAll`, `applyDateRange`, `activeCount`, `debouncedQ`).
- ≤400 linhas no arquivo (atual ~287, sobra folga).
- `try/catch` em todo acesso a `localStorage` (SSR-safe / modo privado).
- Hidratação consolidada em **um único `setSearchParams`** para evitar re-renders desnecessários.

## Arquivos tocados

**Editado (1):**
- `src/hooks/useInteractionsAdvancedFilter.ts` — novas chaves, hidratação consolidada, 4 effects de persistência reativa.

**Editado (1) — testes:**
- `src/hooks/__tests__/useInteractionsAdvancedFilter.density.test.ts` (renomear ou estender) — 7+ casos novos cobrindo `perPage`, `view`, `sort` + regressão de `density`.

## Critério de fechamento

(a) Ao voltar a `/interacoes` sem query params, densidade/lote/modo/sort são restaurados da última escolha do usuário; (b) link compartilhado com params na URL prevalece e atualiza o cache; (c) defaults (`25`, `list`, `recent`, `comfortable`) não poluem a URL nem o cache; (d) `clear()` apaga filtros de dados mas as preferências de visualização voltam no próximo mount via cache; (e) `localStorage` indisponível não quebra o hook; (f) hidratação faz no máximo um `setSearchParams` por mount; (g) testes cobrem todos os caminhos; (h) PT-BR, flat, ≤400 linhas, zero novas deps.

