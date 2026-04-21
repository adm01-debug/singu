

# Plano: Persistir chips de canal ativos no localStorage

## Contexto

Hoje os canais ativos vivem só na URL (`?canais=whatsapp,email`). Se o usuário sair de `/interacoes` e voltar pela sidebar (sem a URL), perde a seleção. Já existe persistência de **pending** (modo manual) no localStorage via `channel-pending-canais`, mas **não** dos canais aplicados. Vou adicionar uma camada de cache leve que restaura a última seleção quando a URL chega vazia.

## Decisão de escopo

- Nova chave: `channel-applied-canais` (separada de `channel-pending-canais` pra não confundir os contratos).
- **Escrita**: toda vez que `filters.canais` muda em `useInteractionsAdvancedFilter`, persiste no localStorage. Array vazio → remove a chave (não polui storage).
- **Leitura/restauração**: no mount do hook, se a URL **não tem** `?canais=` E o localStorage tem valor válido, hidrata a URL via `setSearchParams` com `replace: true`. Não sobrescreve nunca uma URL que já tem `canais=` (URL ganha sempre).
- Validação: só aceita valores que pertencem ao set conhecido de canais (`whatsapp|call|email|meeting|video_call|note`). Lixo é descartado.
- TTL opcional: 30 dias. Após isso, descarta. Evita "fantasma" de seleção antiga.
- **Opt-out**: respeita `?canais=` vazio explícito? Não — URL sem o param = "não especificado", então hidrata. Se o usuário quiser "limpar de verdade", o "Limpar canais" já chama `onChange([])` que apaga a chave.
- Não toca em URL params além de `canais`. Sem efeito em outros filtros.
- Backward compat: se a chave não existe ou está corrompida, comporta como hoje.

## Implementação

### 1. Novo helper: `src/lib/channelPersistence.ts`

```ts
const KEY = 'channel-applied-canais';
const TTL_MS = 30 * 24 * 60 * 60 * 1000;
const VALID = new Set(['whatsapp','call','email','meeting','video_call','note']);

interface Stored { canais: string[]; ts: number; }

export function readAppliedCanais(): string[] | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Stored;
    if (!parsed || !Array.isArray(parsed.canais) || typeof parsed.ts !== 'number') return null;
    if (Date.now() - parsed.ts > TTL_MS) { localStorage.removeItem(KEY); return null; }
    const filtered = parsed.canais.filter(v => typeof v === 'string' && VALID.has(v));
    return filtered.length > 0 ? filtered : null;
  } catch { return null; }
}

export function writeAppliedCanais(canais: string[]) {
  try {
    if (!Array.isArray(canais) || canais.length === 0) {
      localStorage.removeItem(KEY);
      return;
    }
    const filtered = canais.filter(v => VALID.has(v));
    if (filtered.length === 0) { localStorage.removeItem(KEY); return; }
    localStorage.setItem(KEY, JSON.stringify({ canais: filtered, ts: Date.now() }));
  } catch { /* noop */ }
}

export function clearAppliedCanais() {
  try { localStorage.removeItem(KEY); } catch { /* noop */ }
}
```

### 2. `src/hooks/useInteractionsAdvancedFilter.ts`

- Importar helper.
- Adicionar `useEffect` no mount que faz **hidratação one-shot**:
  ```ts
  const hydratedRef = useRef(false);
  useEffect(() => {
    if (hydratedRef.current) return;
    hydratedRef.current = true;
    if (searchParams.get('canais')) return; // URL ganha
    const cached = readAppliedCanais();
    if (cached && cached.length > 0) {
      const next = new URLSearchParams(searchParams);
      next.set('canais', cached.join(','));
      setSearchParams(next, { replace: true });
    }
  }, []); // mount-only
  ```
- Adicionar `useEffect` que persiste sempre que `filters.canais` muda:
  ```ts
  useEffect(() => {
    writeAppliedCanais(filters.canais);
  }, [filters.canais]);
  ```

### 3. Testes

**Novo arquivo**: `src/lib/__tests__/channelPersistence.test.ts`
1. `writeAppliedCanais([])` remove a chave.
2. `writeAppliedCanais(['email','whatsapp'])` salva valores válidos com timestamp.
3. `readAppliedCanais` filtra valores inválidos (`['email','garbage']` → `['email']`).
4. `readAppliedCanais` retorna null e limpa após TTL expirado (mock `Date.now`).
5. `readAppliedCanais` retorna null se chave não existe / JSON corrompido.

**Editar**: `src/hooks/__tests__/useInteractionsAdvancedFilter.test.ts` (criar se não existir)
1. Hidrata da localStorage quando URL não tem `canais=`.
2. NÃO hidrata quando URL já tem `canais=`.
3. Persiste no localStorage quando `setFilter('canais', […])` é chamado.
4. Limpa localStorage quando `setFilter('canais', [])` é chamado.

## Padrões obrigatórios

- PT-BR, tokens semânticos, flat, zero novas deps.
- TTL evita estado "fossilizado" indefinidamente.
- URL sempre ganha sobre cache (zero surpresa em deep links).
- Backward compat: ausência da chave = comportamento atual.

## Arquivos tocados

**Criados (2):**
- `src/lib/channelPersistence.ts`
- `src/lib/__tests__/channelPersistence.test.ts`

**Editados (1-2):**
- `src/hooks/useInteractionsAdvancedFilter.ts` — hidratação no mount + persistência reativa.
- `src/hooks/__tests__/useInteractionsAdvancedFilter.test.ts` (criar/editar).

## Critério de fechamento

(a) Voltar em `/interacoes` sem URL params restaura a última seleção de canais; (b) URL com `?canais=` ganha sempre, mesmo com cache divergente; (c) "Limpar canais" remove a chave do localStorage; (d) TTL de 30 dias descarta cache antigo; (e) valores inválidos no cache são filtrados; (f) zero impacto em outros filtros (busca, datas, contato, empresa, direção, sort); (g) testes cobrem hidratação, persistência, TTL, validação e prioridade de URL; (h) PT-BR, flat, zero novas deps.

