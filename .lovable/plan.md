
#10 entregue. Próximo: #11 — Next-Best-Action por contato (sugestão IA do próximo passo).

## Melhoria #11: Next-Best-Action (NBA) por contato

### Escopo
Card no `ContatoDetalhe` que sugere a **próxima melhor ação** para o contato com base em sinais já existentes: lead score, sentiment trend, dias desde última interação, stage do deal, intent signals recentes. IA gera recomendação acionável + justificativa + canal sugerido + script curto.

### Sinais de entrada (todos client-side, dados já existem)
- Lead score atual + grade (A/B/C/D)
- Sentiment trend (up/stable/down) — reusa `useContactSentimentTrend`
- Dias desde última interação
- Última interação: tipo, sentiment, sumário (se houver)
- Deals abertos: stage, valor, idade
- Intent signals últimos 30d (se houver)
- DISC do contato (se houver) e do vendedor

### Backend
- Nova edge function `next-best-action` (Deno.serve + Zod + JWT + rate-limit 30/min)
- Input: `{ contact_id }`
- Agrega sinais via SQL (1 query JOIN), monta contexto e chama Lovable AI (`google/gemini-2.5-flash`, `response_format: json_object`)
- Retorna: `{ action, reason, channel, urgency, suggested_script, expected_outcome }`
- Cache em nova tabela `contact_next_actions` (upsert por `contact_id`, TTL 24h client-side via `staleTime`)

### Tabela `contact_next_actions`
- `id, user_id, contact_id (unique per user), action, reason, channel, urgency (low|medium|high), suggested_script, expected_outcome, signals_snapshot jsonb, generated_at, model`
- RLS por user_id, índice `(user_id, contact_id)`

### Frontend
- Hook `useNextBestAction(contactId)` — `useQuery` (lê) + `useMutation` (gera/regenera)
- Componente `NextBestActionCard.tsx` em `src/components/contact-detail/`
  - Header: ícone Sparkles + badge urgência (cor semântica)
  - Ação principal em destaque (ex: "Enviar email reforçando proposta")
  - Justificativa curta (2-3 linhas)
  - Badge canal sugerido (Email/WhatsApp/Call/LinkedIn)
  - Script sugerido (collapsible, copiável)
  - Resultado esperado em rodapé
  - Botões: "Copiar script", "Regenerar", "Marcar como feito" (cria task)
- Empty state: botão "Gerar sugestão IA"

### Integração
- `ContatoDetalhe.tsx`: card no topo da aba "Visão Geral" (acima do score), ou nova posição de destaque
- "Marcar como feito" → cria entrada em `tasks` (reusa hook existente)

### Arquivos
- Migration: tabela `contact_next_actions` + RLS + índices
- Novo: `supabase/functions/next-best-action/index.ts`
- Novo: `src/hooks/useNextBestAction.ts`
- Novo: `src/components/contact-detail/NextBestActionCard.tsx`
- Editar: `src/pages/ContatoDetalhe.tsx`
- Nova memória: `mem://features/next-best-action.md`

### Validação E2E
- Build limpo
- Contato com dados → "Gerar sugestão" → card renderizado em <8s com ação + script
- Regenerar atualiza
- Copiar script funciona
- Marcar como feito cria tarefa
- Empty state em contato novo

### Restrições
≤400 linhas/arquivo, sem `any`, sem `useEffect` para fetch, PT-BR. Reusar `rateLimit` shared, padrão de edge functions existente.

Após #11 → #12 (deal slip risk — alerta IA quando deals começam a "esfriar" baseado em sinais combinados).
