

# Plano: Marcar "Feito" em cada Próximo Passo com registro de resultado

## Contexto

Hoje em `ProximosPassosCard`, cada passo permite expandir um formulário rápido para criar uma tarefa OU copiar um script multi-canal. Falta o ciclo de fechamento: depois que o usuário executou a ação (ligou, mandou WhatsApp, e-mail), não há um jeito leve de marcar "feito" e registrar o desfecho. Esse feedback é crucial para alimentar futuras recomendações.

## Decisão de escopo

- **Persistência local-first**: registrar o feedback em uma tabela `proximo_passo_feedback` no Supabase do CRM (`public`), com RLS por `user_id`. Sem mexer no banco externo.
- **Schema enxuto**: `id, user_id, contact_id, passo_id, outcome, executed_at, channel_used, notes, created_at`.
- **Outcomes pré-definidos** (enum):
  - `respondeu_positivo` — Contato respondeu, conversa avançou
  - `respondeu_neutro` — Respondeu, mas sem avanço claro
  - `nao_respondeu` — Sem resposta até agora
  - `nao_atendeu` — Telefone/reunião sem retorno
  - `pulou` — Decidi não executar (irrelevante / momento errado)
- **Uso futuro nas recomendações**:
  - Em `proximosPassos.ts`, ler feedbacks recentes (últimos 14d) para **rebaixar prioridade** de passos com `nao_respondeu` repetido (ex.: 2 `nao_respondeu` consecutivos viram `media`→`baixa` ou somem por 7d).
  - `pulou` esconde o passo por 7 dias.
  - `respondeu_positivo` fortalece sinal positivo no `computeProntidaoScore` futuro (registrar mas não impactar nesta entrega — só preparar dados).

## Implementação

### 1. Migration: tabela `proximo_passo_feedback`

```sql
create type public.passo_outcome as enum (
  'respondeu_positivo','respondeu_neutro','nao_respondeu','nao_atendeu','pulou'
);

create table public.proximo_passo_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  contact_id text not null,
  passo_id text not null,
  outcome public.passo_outcome not null,
  channel_used text,
  notes text,
  executed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

alter table public.proximo_passo_feedback enable row level security;

create policy "owner_select" on public.proximo_passo_feedback for select to authenticated
  using (user_id = auth.uid());
create policy "owner_insert" on public.proximo_passo_feedback for insert to authenticated
  with check (user_id = auth.uid());
create policy "owner_delete" on public.proximo_passo_feedback for delete to authenticated
  using (user_id = auth.uid());

create index idx_ppf_user_contact_recent on public.proximo_passo_feedback (user_id, contact_id, executed_at desc);
create index idx_ppf_user_contact_passo on public.proximo_passo_feedback (user_id, contact_id, passo_id, executed_at desc);
```

### 2. Hook: `src/hooks/useProximoPassoFeedback.ts` (~80 linhas)

- `useProximoPassoFeedbacks(contactId)` — `useQuery` retorna últimos 30d, `staleTime` 60s.
- `useRegisterPassoFeedback()` — `useMutation` insere e invalida cache do contato + `proximosPassos` (para reavaliar prioridades).
- Helpers exportados:
  - `getLastOutcome(feedbacks, passoId)` → último outcome do passo.
  - `getRecentSkipUntil(feedbacks, passoId)` → ISO até quando o passo está silenciado por `pulou`.

### 3. Novo componente: `src/components/ficha-360/PassoFeedbackMenu.tsx` (~140 linhas)

Popover compacto, trigger = botão `<Check /> Feito`:

- Header: "Como foi?" + ícone do passo.
- Grid 1 col com 5 botões grandes (`variant="outline"`, ícone + label):
  - ✅ Respondeu — positivo
  - 💬 Respondeu — neutro
  - 🔇 Não respondeu
  - 📵 Não atendeu
  - ⏭️ Pular por 7 dias
- Campo opcional `<Input>` "Observação" (até 200 chars).
- Botão `Cancelar` no rodapé.
- Ao clicar em um outcome → `mutate({ contactId, passoId, outcome, notes, channelUsed })` + toast "Feedback registrado" + fecha popover.
- `React.memo`, PT-BR, tokens semânticos, flat.

### 4. Refatorar `ProximosPassosCard.tsx`

- Importar `useProximoPassoFeedbacks`, `getLastOutcome`, `getRecentSkipUntil`, `PassoFeedbackMenu`.
- Buscar feedbacks: `const { data: feedbacks = [] } = useProximoPassoFeedbacks(contactId);`
- Filtrar passos: esconder os com `pulou` ainda dentro do silêncio de 7 dias (configurável: ainda exibir com badge "Silenciado" + opção restaurar — decisão: **esconder, mais limpo**).
- Para cada passo, calcular `lastOutcome`:
  - Se houver, exibir badge inline ao lado do título: "✅ Respondeu" / "💬 Neutro" / "🔇 Sem resposta" / "📵 Sem atender", com cor semântica e timestamp curto (`há 2d`).
- Adicionar botão `<PassoFeedbackMenu passoId={p.id} contactId={contactId} channelHint={p.channel} />` na linha de ações, **entre** "Criar tarefa" e "Copiar script".
- Manter restante intocado (`ProximaAcaoCTA`, `CopyScriptMenu`, `ProximoPassoQuickForm`).

### 5. Integração futura na recomendação (preparação leve)

- Em `proximosPassos.ts`: aceitar parâmetro opcional `feedbackHints?: { passoId: string; lastOutcome: PassoOutcome; daysAgo: number }[]`.
- Lógica simples (esta entrega):
  - Se `lastOutcome === 'nao_respondeu'` e `daysAgo < 3` → rebaixa `priority` em 1 nível (alta→média, média→baixa).
  - Se `lastOutcome === 'respondeu_positivo'` e `daysAgo < 7` → marca o passo como concluído na rodada atual (não exibe).
- `Ficha360.tsx` passa hints derivados de `feedbacks` ao `computeProximosPassos`.

## Padrões obrigatórios

- PT-BR
- Tokens semânticos (success/warning/muted)
- Flat, sem shadow/gradient
- `React.memo` no menu
- Mutation invalida `['proximos-passos-feedback', contactId]` e força revalidação
- RLS estrita por `user_id`
- Backward compat: card funciona sem feedbacks (lista vazia)

## Arquivos tocados

**Migration (1):** criação de `proximo_passo_feedback` + enum + RLS

**Criados (2):**
- `src/hooks/useProximoPassoFeedback.ts`
- `src/components/ficha-360/PassoFeedbackMenu.tsx`

**Editados (3):**
- `src/components/ficha-360/ProximosPassosCard.tsx` — botão Feito, badge de outcome, filtro de silêncio
- `src/lib/proximosPassos.ts` — aceitar `feedbackHints` e ajustar prioridades/visibilidade
- `src/pages/Ficha360.tsx` — buscar feedbacks (via hook) e passar hints

## Critério de fechamento

(a) Cada passo tem botão `Feito` que abre popover com 5 opções de outcome + campo opcional de observação, (b) ao escolher outcome, registra no Supabase (`proximo_passo_feedback`) com `user_id` via RLS e dispara toast "Feedback registrado", (c) badge do último outcome aparece ao lado do título do passo (com tempo relativo), (d) `pulou` esconde o passo por 7 dias, (e) `nao_respondeu` recente rebaixa a prioridade do passo na próxima renderização, (f) `respondeu_positivo` recente remove o passo da lista por 7 dias, (g) zero regressão no formulário rápido, no `CopyScriptMenu`, no `ProximaAcaoCTA` ou no Modo de Testes, (h) PT-BR, tokens semânticos, flat, RLS estrita.

