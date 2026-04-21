

# Plano: Render resiliente de chips de canal desconhecido

## Contexto

Em `ActiveFiltersBar`, hoje canais que não estão em `CHANNEL_META` (whatsapp, call, email, meeting, video_call, note) já têm fallback para label capitalizado:
```ts
const label = meta?.label ?? c.charAt(0).toUpperCase() + c.slice(1);
```
Mas há lacunas:
- Sem ícone, o chip fica desalinhado com os demais.
- Strings sujas (`" WHATSAPP "`, `"unknown_channel"`) renderizam feias.
- Strings vazias ou apenas-espaço viram chip fantasma sem label.
- Remoção usa `canais.filter((x) => x !== c)` — funciona, mas se vier valor duplicado/diferindo só por case na URL, a normalização atual no parser já filtra. O risco real é o chip render de algo que o `CanaisQuickFilter` nem reconhece.

O `channelPersistence` e o parser de URL **já fazem whitelist + lowercase + dedup** (vide `lib/channelPersistence.ts` com `VALID`). Então em condições normais valores desconhecidos não chegam. Mas se um link antigo, externo ou manualmente editado trouxer canal fora da whitelist, o chip precisa renderizar de forma digna **e remover sem deixar lixo na URL**.

## Decisão de escopo

Melhorar APENAS o render do chip de canal desconhecido em `ActiveFiltersBar.tsx`:

1. **Sanitização do label**: `trim()`, colapsar whitespace interno, substituir `_`/`-` por espaço, capitalizar cada palavra. Ex.: `"unknown_channel"` → `"Unknown Channel"`, `"  WHATSAPP  "` → `"Whatsapp"`.
2. **Fallback de label vazio**: se após sanitização sobrar string vazia, usar `"Canal"`.
3. **Ícone fallback**: usar ícone genérico `Tag` (lucide) quando o canal não estiver em `CHANNEL_META`, garantindo alinhamento visual idêntico aos chips conhecidos.
4. **Tooltip com valor bruto**: adicionar `title={c}` no chip desconhecido para o usuário entender de onde veio.
5. **Remoção segura**: manter `canais.filter((x) => x !== c)`. Adicional: se após filtrar a lista ficar vazia, passar `[]` (já é o comportamento — o hook normaliza para remover o param da URL). Sem mudança de lógica, só garantir via teste.
6. **Key estável**: chave do `.map()` continua sendo `c` (string única após dedup pelo parser). Caso entre dois desconhecidos com mesma string sanitizada mas `c` diferente, a key bruta evita colisão.

## Implementação

### `src/components/interactions/ActiveFiltersBar.tsx`

- Importar `Tag` de `lucide-react`.
- Adicionar helper local puro:
  ```ts
  function prettifyChannel(raw: string): string {
    const cleaned = raw.replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase();
    if (!cleaned) return 'Canal';
    return cleaned.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  }
  ```
- No `.map()` dos canais, quando `meta` for `undefined`:
  - `label = prettifyChannel(c)`
  - `Icon = Tag`
  - Adicionar `title={\`Canal desconhecido: ${c}\`}` no `<Badge>` (via prop HTML).

Mantém PT-BR, flat, zero novas deps, backward-compat. Sem mudança de API do componente.

## Testes

**Editar/criar** `src/components/interactions/__tests__/ActiveFiltersBar.test.tsx`:
1. Render com canal `"unknown_channel"` mostra chip com label `"Unknown Channel"`.
2. Render com canal `"  WHATSAPP_BIZ  "` mostra `"Whatsapp Biz"` (sanitizado).
3. Render com canal `""` (string vazia) mostra label fallback `"Canal"` sem quebrar.
4. Click no `X` de canal desconhecido chama `setFilter('canais', [...sem aquele])` corretamente.
5. Quando o canal desconhecido é o único, click no `X` chama `setFilter('canais', [])`.
6. Canal conhecido (`whatsapp`) continua usando `MessageSquare` e label `"WhatsApp"` (regressão).

## Padrões obrigatórios

- PT-BR, flat, sem novas deps (Tag já está em `lucide-react`).
- Backward-compat total: nenhuma mudança de prop ou comportamento dos canais conhecidos.
- A11y: `title` no chip ajuda usuário a inspecionar valor bruto sem poluir UI.
- ≤400 linhas no arquivo.

## Arquivos tocados

**Editado (1):**
- `src/components/interactions/ActiveFiltersBar.tsx` — helper `prettifyChannel`, ícone `Tag` fallback, `title` informativo.

**Editado (1) — testes:**
- `src/components/interactions/__tests__/ActiveFiltersBar.test.tsx` — 6 casos cobrindo sanitização, fallback vazio, remoção e regressão.

## Critério de fechamento

(a) Canal fora da whitelist renderiza com label capitalizado e sanitizado (`unknown_channel` → `Unknown Channel`); (b) string vazia/whitespace renderiza `"Canal"` sem chip fantasma; (c) ícone `Tag` mantém alinhamento visual com chips conhecidos; (d) `title` no chip mostra o valor bruto para diagnóstico; (e) clicar no `X` remove o canal específico via `setFilter('canais', filtered)` sem quebrar a URL — quando vira lista vazia, o param é removido pelo hook; (f) canais conhecidos não mudam de aparência ou comportamento; (g) testes cobrem sanitização, fallback, remoção isolada e remoção do último item; (h) PT-BR, flat, zero novas deps.

