

# Plano: Botão flutuante "Voltar ao topo" otimizado para `/interacoes`

## Contexto

Já existe `ScrollToTopButton` global montado em `AppLayout` (desktop em `bottom-8 right-8`, mobile via container `md:hidden`). Ele aparece quando `window.scrollY > 400` e some quando overlays mobile abrem. Em `/interacoes` com infinite scroll, ele já funciona — mas há lacunas:

1. **Limiar de 400px é alto** para listas densas (modo compacto). Em compacto, o usuário precisa rolar muito antes de ver o botão.
2. **Não comunica progresso da lista** (quantos itens já passou).
3. **Animação de scroll-to-top usa `behavior: 'smooth'`** — em listas com 800+ itens revelados, fica lento; ideal cair para `'instant'` quando rolagem é muito longa.
4. **Conflito potencial** com `QuickAddButton` no mesmo canto (já resolvido via `flex flex-col gap-3`, mas vale validar).

Decisão: **não criar componente novo nem rota-específico**. Refinar o `ScrollToTopButton` existente com props opcionais e baseline melhorada — mudanças benéficas para todas as rotas, com ganho extra em `/interacoes`.

## Decisão de escopo

Refinar `ScrollToTopButton.tsx`:

1. **Limiar configurável**: prop `threshold?: number` (default `400`). Continua 400 globalmente, sem regressão.
2. **Limiar adaptativo automático**: quando o documento é muito alto (`document.documentElement.scrollHeight > 4000`), reduz limiar para `300`. Cobre listas longas sem precisar de prop.
3. **Smart scroll behavior**: se `window.scrollY > 5000`, usa `behavior: 'instant'` (ou `'auto'` se reduced motion); senão `'smooth'`. Evita scroll de 8 segundos em listas enormes.
4. **Tooltip contextual**: adiciona `title="Voltar ao topo"` no botão (já tem `aria-label`, mas tooltip nativo ajuda hover desktop).
5. **Respeita `prefers-reduced-motion`**: força `behavior: 'auto'` se o sistema do usuário pedir.
6. **Throttle do listener**: usa `requestAnimationFrame` para reduzir custos em scroll rápido (atual chama setState a cada evento `scroll`).

Sem mudanças em `AppLayout`, `MobileBottomNav` ou em `/interacoes` — o botão segue global e a melhoria é transparente.

## Implementação

### `src/components/navigation/ScrollToTopButton.tsx`

- Adicionar prop opcional:
  ```ts
  interface ScrollToTopButtonProps {
    className?: string;
    threshold?: number; // default 400
  }
  ```

- Lógica de visibilidade adaptativa:
  ```ts
  const [visible, setVisible] = useState(false);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const compute = () => {
      const docHeight = document.documentElement.scrollHeight;
      const effective = docHeight > 4000 ? Math.min(threshold, 300) : threshold;
      setVisible(window.scrollY > effective);
      rafRef.current = null;
    };
    const onScroll = () => {
      if (rafRef.current != null) return;
      rafRef.current = requestAnimationFrame(compute);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    compute();
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, [threshold]);
  ```

- Função `scrollToTop` smart:
  ```ts
  const scrollToTop = () => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const tooFar = window.scrollY > 5000;
    window.scrollTo({
      top: 0,
      behavior: reduceMotion || tooFar ? 'auto' : 'smooth',
    });
  };
  ```

- Adicionar `title="Voltar ao topo"` no `<Button>`. Manter `aria-label` existente.

- Manter listeners `mobile-overlay-open/close` e estilo atuais inalterados.

## Testes

**Editar/criar** `src/components/navigation/__tests__/ScrollToTopButton.test.tsx`:
1. Não visível com `scrollY=0` (default threshold 400).
2. Visível ao ultrapassar `scrollY=400`.
3. Threshold customizado (`threshold=200`) → visível com `scrollY=250`.
4. Some quando evento `mobile-overlay-open` é disparado, mesmo com scroll alto.
5. Click chama `window.scrollTo` com `top:0`.
6. Em `prefers-reduced-motion: reduce`, usa `behavior: 'auto'`.
7. Limiar adaptativo: documentElement.scrollHeight grande + threshold default → fica visível com `scrollY=350`.

(Mock `window.scrollTo`, `window.matchMedia` e `Object.defineProperty(document.documentElement, 'scrollHeight', ...)`.)

## Padrões obrigatórios

- PT-BR no texto exposto (`title`/`aria-label`).
- Backward-compat total: prop `threshold` opcional, comportamento default igual ao atual em todas as rotas.
- Zero novas deps, ≤400 linhas (arquivo atual ~70 linhas).
- A11y mantida: `aria-label`, foco visível do `Button` shadcn, `prefers-reduced-motion` honrado.
- Sem mudança em `AppLayout`, `InteracoesContent`, `MobileBottomNav`.

## Arquivos tocados

**Editado (1):**
- `src/components/navigation/ScrollToTopButton.tsx` — prop `threshold`, limiar adaptativo, scroll smart, throttling com rAF, tooltip.

**Novo (1) — testes:**
- `src/components/navigation/__tests__/ScrollToTopButton.test.tsx` — 7 casos cobrindo visibilidade, threshold, overlay, reduced motion, click.

## Critério de fechamento

(a) Em `/interacoes` com infinite scroll, o botão flutuante "Voltar ao topo" aparece após rolagem moderada e leva o usuário ao topo; (b) em listas muito longas (`scrollHeight > 4000`), aparece mais cedo (limiar 300px); (c) em rolagens muito altas (`scrollY > 5000`), o scroll é instantâneo para evitar espera; (d) respeita `prefers-reduced-motion`; (e) listener de scroll throttled via `requestAnimationFrame`; (f) outras rotas mantêm exatamente o comportamento atual; (g) tooltip "Voltar ao topo" no hover desktop; (h) testes cobrem visibilidade, threshold, overlay, reduced-motion e click; (i) PT-BR, flat, zero novas deps.

