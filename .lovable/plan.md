

# Plano: Tornar o feedback de carregamento incremental mais visível na lista de interações

## Contexto

Em `/interacoes`, no modo `view=list`, a renderização progressiva já existe via `useInfiniteList` (revela itens em lotes ao rolar) e o sentinela `InfiniteScrollSentinel` exibe 3 `<Skeleton>` linha + texto "Carregando mais interações…". Os mesmos pontos existem em outros consumidores como `UltimasInteracoesCard` (Ficha 360°).

Lacunas atuais:
- O skeleton é genérico (3 retângulos `h-20`) e não respeita a **densidade compacta** introduzida agora — em `compact` ficam grandes demais e descolam visualmente do item real.
- Não há **barra de progresso** indicando quantos itens já foram revelados vs total (ex.: "120 de 873"), só o texto final.
- Não há indicador no **topo** quando o usuário está longe do sentinela; só percebe carregamento ao chegar perto do fim.
- O texto "Carregando mais interações…" é discreto e não comunica progresso quantitativo.

## Decisão de escopo

Melhorar **apenas** o feedback do carregamento incremental, sem mudar a lógica de paginação/observer. Foco em 3 ajustes no `InfiniteScrollSentinel` + uma barrinha de progresso fina e opcional:

1. **Skeletons cientes de densidade**: aceitar prop opcional `density?: 'comfortable' | 'compact'` (default `'comfortable'`). Em `compact`, usar `h-12` em vez de `h-20`, exibir 2 skeletons em vez de 3, e reduzir `space-y-3 py-4` → `space-y-2 py-2`.

2. **Barra de progresso linear fina** (`h-1`) acima dos skeletons quando `hasMore`, mostrando `totalLoaded / total` como largura percentual. Usa cor `bg-primary/70` sobre track `bg-muted`. Apenas visual (sem `<progress>` nativo para evitar estilos default), com `role="progressbar"`, `aria-valuemin=0`, `aria-valuemax={total}`, `aria-valuenow={totalLoaded}`, `aria-label="Carregando mais interações"`.

3. **Contador inline** ao lado do texto: `"Carregando mais interações… (120 de 873)"` no estado `hasMore`. No estado final mantém o texto atual de "Fim da lista".

4. **Indicador de status no topo da lista (opt-in)**: nova prop `showTopIndicator?: boolean` (default `false`). Quando `true` e `hasMore`, renderizar uma faixa fina sticky no topo do container do consumidor — mas como o sentinela hoje só vive no fim, **fica fora do escopo desta tarefa** para evitar mudança estrutural. Mantemos a melhoria só no sentinela inferior. (Documentado no plano para evitar dúvida; não será implementado agora.)

5. **Acessibilidade**: manter `aria-live="polite"` e `aria-busy="true"` já existentes; adicionar `aria-label` no progressbar; texto continua em PT-BR.

6. **Backward-compat**: `density` é opcional → consumidores que não passam (ex.: `UltimasInteracoesCard`) seguem com layout atual. Quem quiser densidade só passa a prop.

## Implementação

### 1. `src/components/interactions/InfiniteScrollSentinel.tsx`
- Adicionar props opcionais:
  ```ts
  density?: 'comfortable' | 'compact';
  ```
- Derivar `pct = total > 0 ? Math.min(100, Math.round((totalLoaded / total) * 100)) : 0`.
- Render no estado `hasMore`:
  - Container com `space-y-{2|3} py-{2|4}` conforme densidade.
  - Barra `<div role="progressbar" …>` track `h-1 w-full rounded-full bg-muted overflow-hidden` + filho `bg-primary/70` com `style={{ width: \`${pct}%\` }}` e `transition-[width] duration-300`.
  - 2 ou 3 `<Skeleton>` (`h-12` ou `h-20`) conforme densidade.
  - Parágrafo: `Carregando mais interações… ({totalLoaded} de {total})`.
- Estado final (sem `hasMore`): inalterado.

### 2. `src/pages/interacoes/InteracoesContent.tsx`
- No uso do `<InfiniteScrollSentinel>` (modo lista), passar `density={isCompact ? 'compact' : 'comfortable'}`.

### 3. `src/components/ficha-360/UltimasInteracoesCard.tsx`
- Sem mudança obrigatória. Como o card é compacto por natureza, **passar `density="compact"`** opcionalmente para alinhar visualmente com os itens da lista de últimas interações. Sem efeito colateral em outras props.

## Testes

**Editar/criar** `src/components/interactions/__tests__/InfiniteScrollSentinel.test.tsx`:
1. `total=0` → não renderiza nada (regressão do early return).
2. `hasMore=true, totalLoaded=10, total=100` → exibe `progressbar` com `aria-valuenow=10`, `aria-valuemax=100`, largura `10%`, e texto contém "10 de 100".
3. `hasMore=false, totalLoaded=50, total=50` → exibe "Fim da lista — 50 interações exibidas" (sem barra).
4. `density="compact"` → renderiza exatamente 2 skeletons; default renderiza 3.
5. `hasMore=true, total=0` é coberto pelo caso 1 (early return). 
6. Acessibilidade: `aria-live="polite"`, `aria-busy="true"` e `role="progressbar"` presentes no estado de carregamento.

## Padrões obrigatórios

- PT-BR, flat, zero novas deps.
- Backward-compat total: `density` opcional, default mantém visual atual.
- A11y: `role="progressbar"` + `aria-value*` + `aria-label`, `aria-live="polite"`, `aria-busy`.
- Sem mudança em `useInfiniteList` ou no `IntersectionObserver`.
- ≤400 linhas por arquivo (sentinel atual ~33 linhas; novo arquivo segue muito abaixo).

## Arquivos tocados

**Editado (3):**
- `src/components/interactions/InfiniteScrollSentinel.tsx` — barra de progresso, contador, prop `density`.
- `src/pages/interacoes/InteracoesContent.tsx` — passa `density` ao sentinela conforme `isCompact`.
- `src/components/ficha-360/UltimasInteracoesCard.tsx` — passa `density="compact"` ao sentinela.

**Novo (1) — testes:**
- `src/components/interactions/__tests__/InfiniteScrollSentinel.test.tsx` — 5 casos cobrindo barra, contador, densidade, estado final e a11y.

## Critério de fechamento

(a) Durante o scroll incremental, aparece uma barra fina de progresso preenchendo conforme `totalLoaded/total`; (b) o texto inclui contador `"X de Y"`; (c) em densidade compacta, o skeleton encolhe (2 itens, `h-12`, padding reduzido); (d) `UltimasInteracoesCard` exibe versão compacta; (e) estado final ("Fim da lista") permanece igual; (f) `total=0` continua não renderizando nada; (g) atributos a11y (`role="progressbar"`, `aria-value*`, `aria-live`, `aria-busy`) presentes; (h) testes cobrem todos os caminhos; (i) PT-BR, flat, zero novas deps.

