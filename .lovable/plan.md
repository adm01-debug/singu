
## Diagnóstico de lentidão geral

### Problemas identificados

**1. AppLayout monta MUITOS componentes pesados em TODA navegação** (src/components/layout/AppLayout.tsx)

Cada vez que troca de rota, o `AppLayout` re-renderiza e dispara *imediatamente*:
- `<NotificationCenter />` → `useRealtimeNotifications` (canal Supabase Realtime + 4 listeners postgres_changes)
- `<AskCrmChat />` → componente sempre montado (210 linhas)
- `<AIEmailComposer />` → dialog global sempre montado
- `<OnboardingTourWrapper />`
- `<KeyboardShortcutsCheatsheet />`
- `<SlowQueryIndicator />` → assinatura no QueryCache
- `<GlobalSearch open={isOpen} ...>` → mesmo fechado, hooks `useSemanticSearch`/`useConversationalSearch` podem inicializar
- `<QuickAddButton />`, `<NotificationCenter />` etc.

Resultado: cada navegação executa **dezenas de hooks `useEffect`, queries TanStack e abre canais realtime**, segurando a thread principal.

**2. Console mostra RPCs falhando em loop por todo o app**
- `get_instant_kpis` → "column resolved_at does not exist"
- `get_duplicate_contacts` → "column reference 'email' is ambiguous"
- Esses erros disparam `CircuitBreaker`, retries e logs constantes (peso de CPU + rede).

**3. Calendário usa `useEffect` para fetch** em vez de TanStack Query (linha 33 de `Calendario.tsx`), violando padrão e impedindo cache entre navegações.

**4. Páginas detalhe abrem realtime channels** (`useContactDetail`) sem unsubscribe consistente em navegação rápida.

### Plano de correção (3 frentes, foco em maior ROI)

**Frente A — Defer chrome global pesado** (src/components/layout/AppLayout.tsx)
- Mover `AskCrmChat`, `AIEmailComposer`, `KeyboardShortcutsCheatsheet`, `OnboardingTourWrapper` para `lazy()` + render só após `requestIdleCallback` (≈800 ms após mount), igual já é feito com `DeferredAppChrome` em App.tsx.
- `GlobalSearch` continuar montado, mas garantir hooks internos só ativam quando `open === true` (já parcialmente feito após último fix).

**Frente B — Silenciar RPCs quebradas** (não-bloqueante)
- `useInstantKpis` e `useDuplicateContacts`: detectar erro de schema (`column ... does not exist` / `is ambiguous`) e marcar `enabled: false` em sessão (cache) para não retentar. Reduz logs e ciclos do CircuitBreaker.

**Frente C — Realtime sob demanda**
- `useRealtimeNotifications` (montado pelo `NotificationCenter` em todo layout): só abrir canal quando o popover do sino abre pela primeira vez; manter cache de notificações em memória após abrir.
- Alternativa mais leve: adiar `subscribe()` para `requestIdleCallback` após 1.5 s do load inicial.

**Frente D — Calendário com TanStack Query**
- Substituir `useEffect + fetch` por `useQuery` com `staleTime: 60_000`, evitando refetch a cada visita.

### Arquivos a editar
- `src/components/layout/AppLayout.tsx` — defer de chrome global
- `src/hooks/useRealtimeNotifications.ts` — abrir canal sob demanda
- `src/hooks/useInstantKpis.ts` — circuit-break de schema
- `src/hooks/useDuplicateContacts.ts` — circuit-break de schema
- `src/pages/Calendario.tsx` — migrar para useQuery

### Resultado esperado
- Navegação entre módulos < 300 ms (hoje: vários segundos).
- Console limpo dos 2 erros recorrentes.
- Menos canais Realtime abertos em paralelo.
- Sem regressão funcional (notificações continuam chegando, busca continua, etc.).

### Validação
Após aplicar, eu vou clicar entre `/`, `/empresas`, `/contatos`, `/calendario`, `/pipeline`, `/revops` e medir tempo de paint via `browser--performance_profile`.

Aprovar para executar.
