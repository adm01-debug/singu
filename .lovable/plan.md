

# Plano: Sugestão automática de nome ao salvar preset de busca

## Contexto

Hoje em `InteracoesPresetsMenu`, ao clicar em "Salvar busca atual", o `Input` de nome abre vazio e o usuário precisa inventar um nome do zero. Vamos pré-preencher esse `Input` com um nome inteligente derivado dos filtros ativos (ex.: `"Acme · WhatsApp · últimos 30d"`), que o usuário pode aceitar com Enter ou editar livremente.

## Decisão de escopo

- **Geração 100% client-side**, pura, sem rede e sem IA — só formatação dos filtros já presentes em `AdvancedFilters`.
- **Aplicar nos dois menus de presets**: `InteracoesPresetsMenu` (filtros de interações) e `SearchPresetsMenu` (Contatos/Empresas, filtros genéricos `Record<string, string[]>`).
- **Helpers separados** por contexto pra manter os formatos naturais de cada domínio.
- **Comportamento do input**:
  - Ao abrir o modo "salvar" (`setIsNaming(true)`), pré-preencher com a sugestão.
  - Texto fica selecionado (`autoFocus` + `select()`) pra usuário sobrescrever digitando ou aceitar com Enter.
  - Se nenhum filtro ativo, fallback `"Busca <data atual>"` (ex.: `"Busca 21/04"`).
  - Dedup de nome: se já existir preset com nome igual, sufixo `(2)`, `(3)` etc. (reusa a lógica `dedupeNameAgainst` já existente em `searchPresetTransport`).
- **Truncamento**: máx. 60 caracteres no nome sugerido pra caber no `Input` sem ficar feio.
- **Botão pequeno "↻ Sugerir"** ao lado do `Input` (ícone `Sparkles`) que regenera a sugestão se o usuário limpou tudo e quer voltar (opcional, only-if-empty).

## Implementação

### 1. Novo helper `src/lib/suggestPresetName.ts` (~120 linhas)

```ts
import type { AdvancedFilters } from '@/hooks/useInteractionsAdvancedFilter';

const CHANNEL_LABELS: Record<string, string> = {
  whatsapp: 'WhatsApp', email: 'Email', call: 'Ligação',
  meeting: 'Reunião', linkedin: 'LinkedIn', sms: 'SMS',
};

const SORT_LABELS: Record<string, string> = {
  oldest: 'mais antigos', relevance: 'relevância', entity: 'por entidade',
};

const DIRECAO_LABELS = { inbound: 'recebidas', outbound: 'enviadas' };

/**
 * Gera um nome de preset com base nos filtros de Interações.
 * Ex.: "Acme · WhatsApp · últimos 30d"
 */
export function suggestInteracoesPresetName(f: AdvancedFilters): string {
  const parts: string[] = [];

  // 1. Termo de busca (q) tem prioridade — usuário lembra disso
  if (f.q?.trim()) parts.push(`"${f.q.trim().slice(0, 24)}"`);

  // 2. Empresa, depois contato
  if (f.company?.trim()) parts.push(f.company.trim().slice(0, 24));
  else if (f.contact?.trim()) parts.push(f.contact.trim().slice(0, 24));

  // 3. Canais (até 2; se >2 mostra "3 canais")
  if (Array.isArray(f.canais) && f.canais.length > 0) {
    if (f.canais.length === 1) parts.push(CHANNEL_LABELS[f.canais[0]] ?? f.canais[0]);
    else if (f.canais.length === 2) parts.push(f.canais.map(c => CHANNEL_LABELS[c] ?? c).join('+'));
    else parts.push(`${f.canais.length} canais`);
  }

  // 4. Direção (só se não-default)
  if (f.direcao && f.direcao !== 'all') parts.push(DIRECAO_LABELS[f.direcao]);

  // 5. Intervalo de datas — formatos curtos
  const range = formatDateRange(f.de, f.ate);
  if (range) parts.push(range);

  // 6. Sort, só se não-default
  if (f.sort && f.sort !== 'recent' && SORT_LABELS[f.sort]) parts.push(SORT_LABELS[f.sort]);

  if (parts.length === 0) return `Busca ${formatToday()}`;
  return parts.join(' · ').slice(0, 60);
}

/**
 * Versão genérica para SearchPresetsMenu (Contatos/Empresas).
 * Usa as chaves dos filtros como dicas.
 */
export function suggestGenericPresetName(
  filters: Record<string, string[]>,
  searchTerm?: string,
): string {
  const parts: string[] = [];
  if (searchTerm?.trim()) parts.push(`"${searchTerm.trim().slice(0, 24)}"`);
  for (const [key, values] of Object.entries(filters)) {
    if (!values?.length) continue;
    if (values.length === 1) parts.push(values[0].slice(0, 20));
    else parts.push(`${values.length} ${key}`);
  }
  if (parts.length === 0) return `Busca ${formatToday()}`;
  return parts.join(' · ').slice(0, 60);
}

// Helpers internos: formatDateRange (últimos Nd, mês passado, "01-15/jan", etc.) + formatToday
```

`formatDateRange` cobre casos comuns: `de=hoje-7d` → `"últimos 7d"`, `de=hoje-30d` → `"últimos 30d"`, mês inteiro → `"abril/25"`, intervalo arbitrário → `"01/04 → 15/04"`.

### 2. Helper de dedup centralizado

Reusar `dedupeNameAgainst` que já existe em `src/lib/searchPresetTransport.ts` (não precisa criar novo).

### 3. Refatorar `InteracoesPresetsMenu.tsx`

- Importar `suggestInteracoesPresetName` e `dedupeNameAgainst`.
- Quando o usuário clica em "Salvar busca atual" (entra em modo `isNaming`):
  ```ts
  const handleStartNaming = () => {
    const suggested = suggestInteracoesPresetName(filters);
    const finalName = dedupeNameAgainst(presets.map(p => p.name), suggested);
    setPresetName(finalName);
    setIsNaming(true);
  };
  ```
- No `Input`, adicionar `ref` e `useEffect` que chama `inputRef.current?.select()` quando `isNaming` vira true (texto pré-selecionado pra sobrescrever).
- Adicionar botão `<Sparkles />` ao lado do `Input` (só visível se `presetName` estiver vazio) que regenera a sugestão.

### 4. Refatorar `SearchPresetsMenu.tsx`

- Mesma lógica usando `suggestGenericPresetName(currentFilters, currentSearchTerm)`.
- Mesma seleção automática do texto.

### 5. Testes em `src/lib/__tests__/suggest-preset-name.test.ts` (novo, ~80 linhas)

- `suggestInteracoesPresetName` com filtros vazios → `"Busca DD/MM"`.
- Com `company="Acme"` + `canais=["whatsapp"]` → `"Acme · WhatsApp"`.
- Com `de`/`ate` igual a últimos 7/30/90 dias → `"últimos Nd"`.
- Com `q="proposta"` + `company="Acme"` → `'"proposta" · Acme'`.
- Com 3+ canais → `"3 canais"`.
- Truncamento em 60 chars.
- `suggestGenericPresetName` com `{cargo: ["CEO", "CTO"]}` → `"2 cargo"`.

## Padrões obrigatórios

- PT-BR
- Pure functions, sem side effects
- Tokens semânticos, flat
- Zero novas deps, zero novas queries de rede
- Backward compat: se usuário apagar a sugestão, comportamento antigo (campo vazio) preservado

## Arquivos tocados

**Criados (2):**
- `src/lib/suggestPresetName.ts`
- `src/lib/__tests__/suggest-preset-name.test.ts`

**Editados (2):**
- `src/components/interactions/InteracoesPresetsMenu.tsx`
- `src/components/search/SearchPresetsMenu.tsx`

## Critério de fechamento

(a) Ao clicar em "Salvar busca atual" em `/interacoes`, o `Input` aparece pré-preenchido com nome derivado dos filtros (ex.: `"Acme · WhatsApp · últimos 30d"`); (b) texto vem pré-selecionado pra usuário sobrescrever só digitando; (c) se já houver preset com mesmo nome, sufixo `(2)`, `(3)`; (d) sem filtros ativos, sugere `"Busca DD/MM"`; (e) mesmo comportamento aplicado ao `SearchPresetsMenu` de Contatos/Empresas; (f) Enter salva direto sem precisar editar; (g) zero regressão em export/import, favoritos, ordenação, dedup, save/apply/delete; (h) PT-BR, tokens semânticos, flat, sem novas deps.

