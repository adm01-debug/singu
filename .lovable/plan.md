

# Plano: Contadores por canal nos chips do `CanaisQuickFilter`

## Contexto

Hoje os chips em `CanaisQuickFilter` (WhatsApp, Ligação, Email, Reunião, Vídeo, Nota) mostram só o ícone. O usuário quer ver, ao lado de cada ícone, **quantas interações** existem para aquele canal no dataset atual de `/interacoes`, sem precisar abrir a busca avançada.

## Decisão de escopo

- Contagem é calculada a partir do **dataset já carregado** na página `/interacoes` (mesma fonte que alimenta a tabela), respeitando os filtros não-canal já aplicados (busca, contato, empresa, datas, direção). Ou seja: se o usuário tem `direcao=inbound` ativo, os contadores refletem só as inbound — assim o número bate com o que ele veria ao clicar no chip.
- Os contadores **ignoram o próprio filtro de canal**, para que o usuário veja o "potencial" de cada canal antes de selecionar (caso contrário, todos os outros mostrariam 0 quando um chip está ativo).
- Renderização: `WhatsApp 12` ao lado do ícone, em fonte tabular pequena (`text-[10px] tabular-nums`). Quando contagem = 0, o chip fica com opacidade reduzida (`opacity-50`) e tooltip "Sem interações neste canal" — mas continua clicável (caso o dataset mude).
- Quando contagem > 999, exibe `999+`.
- Loading state: enquanto o dataset carrega, mostra `·` no lugar do número (sem skeleton pesado).

## Implementação

### 1. Novo helper: `src/lib/countByChannel.ts`

```ts
export function countByChannel(
  items: Array<{ channel?: string | null; tipo?: string | null }>,
  excludeCanaisFilter: string[] = [], // não usado aqui, mas documenta o contrato
): Record<string, number> {
  const counts: Record<string, number> = {};
  if (!Array.isArray(items)) return counts;
  for (const it of items) {
    const c = (it.channel ?? it.tipo ?? '').toLowerCase();
    if (!c) continue;
    counts[c] = (counts[c] ?? 0) + 1;
  }
  return counts;
}
```

### 2. `CanaisQuickFilter.tsx`

- Nova prop opcional: `counts?: Record<string, number>` (default `{}`).
- Renderiza ao lado do ícone, dentro do botão do chip:
  ```tsx
  {typeof counts[id] === 'number' && (
    <span className="ml-1 text-[10px] tabular-nums opacity-70">
      {counts[id] > 999 ? '999+' : counts[id]}
    </span>
  )}
  ```
- Se `counts[id] === 0`, adiciona `opacity-50` ao botão e tooltip "Sem interações neste canal".
- Backward compat: sem a prop, comporta-se como hoje.

### 3. Página `/interacoes` (`src/pages/Interacoes.tsx` ou equivalente)

- Onde já existe o dataset filtrado (sem o filtro de canal aplicado), calcular `useMemo(() => countByChannel(datasetSemCanal), [datasetSemCanal])` e passar para `<CanaisQuickFilter counts={...} />`.
- Se hoje só existe o dataset **com** filtro de canal aplicado, criar uma derivação extra: aplicar todos os filtros **exceto** `canais` antes de contar. Isso é barato (filter sobre array já em memória).

### 4. Testes: `CanaisQuickFilter.test.tsx`

3 testes novos:
1. Sem `counts`, chips renderizam só ícone (comportamento atual preservado).
2. Com `counts={ email: 12, whatsapp: 0 }`, chip Email mostra "12" e WhatsApp tem `opacity-50`.
3. Contagem > 999 renderiza "999+".

## Padrões obrigatórios

- PT-BR, tokens semânticos, flat, sem novas deps.
- Sem nova query: reusa o dataset que já está em memória.
- Backward compat: prop opcional.

## Arquivos tocados

**Criados (1):**
- `src/lib/countByChannel.ts`

**Editados (3):**
- `src/components/interactions/CanaisQuickFilter.tsx` — prop `counts` + render de número.
- `src/pages/Interacoes.tsx` (ou arquivo equivalente que renderiza a `AdvancedSearchBar`) — calcular contagens e passar via prop.
- `src/components/interactions/__tests__/CanaisQuickFilter.test.tsx` — 3 testes novos.

## Critério de fechamento

(a) Cada chip mostra o número de interações daquele canal no dataset filtrado (ignorando o próprio filtro de canal); (b) chips com 0 ficam com opacidade reduzida e tooltip explicativo; (c) >999 vira "999+"; (d) sem novas queries — tudo derivado em memória; (e) backward compat preservado quando `counts` não é passado; (f) testes cobrem render com/sem counts e edge cases; (g) PT-BR, flat, tokens semânticos, zero novas deps.

