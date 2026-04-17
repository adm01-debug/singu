
#7 entregue. Próximo gap real do item 14 (AI Generativo Avançado): resumo automático de threads de email longas com extração de action items, reusando o padrão `meeting-summary`.

## Melhoria #8: Email Thread Summary AI

### Escopo
Quando uma `interaction` do tipo `email`/`email_received` tem conteúdo longo (>800 chars) ou múltiplas mensagens encadeadas (mesmo `contact_id`, mesmo `subject`, dentro de 30 dias), permitir gerar um resumo IA com:
- Resumo executivo (2-3 frases)
- Pontos-chave (bullets)
- Action items (`{ task, responsible, deadline }`)
- Sentimento geral
- Próximas ações sugeridas

### Backend
- Nova tabela `email_thread_summaries` (espelhando `meeting_summaries`):
  - `id, user_id, thread_key (text — hash de contact_id+subject), interaction_ids (uuid[]), summary, key_points (text[]), action_items (jsonb), sentiment, next_steps (text[]), generated_by_model, created_at, updated_at`
  - RLS por `user_id`, índices em `(user_id, thread_key)` e `(user_id, created_at)`
  - Trigger `update_updated_at_column`
- Nova edge function `email-thread-summary` (Deno.serve + Zod + JWT + rate-limit 20/min):
  - Input: `{ interaction_id }` ou `{ contact_id, subject }`
  - Agrega interações (até 20 últimas do thread), chama Lovable AI (`google/gemini-2.5-flash`) com `response_format: json_object`
  - Upsert em `email_thread_summaries` por `(user_id, thread_key)`

### Frontend
- Hook `useEmailThreadSummary(interactionId?)` — `useQuery` lê resumo existente + `useMutation` para gerar
- Componente `EmailThreadSummaryCard` (similar ao `MeetingSummaryCard`):
  - Botão "Resumir thread com IA" → mostra loading
  - Renderiza resumo, pontos-chave, action items (com badges), sentimento e próximas ações
  - Botão "Regenerar"
- Integração em `InteracaoDetalhe.tsx` (ou equivalente): mostra card quando `type` ∈ {email,email_received} e (conteúdo >800 chars OU thread_count >1)
- Integração em `ContatoDetalhe.tsx`: aba "Emails" ganha botão "Resumir conversas" no topo

### Arquivos
- Migration SQL: tabela `email_thread_summaries` + RLS + índices + trigger
- Novo: `supabase/functions/email-thread-summary/index.ts`
- Novo: `src/hooks/useEmailThreadSummary.ts`
- Novo: `src/components/ai/EmailThreadSummaryCard.tsx`
- Editar: `src/pages/InteracaoDetalhe.tsx` (montar card)
- Editar: `src/pages/ContatoDetalhe.tsx` (botão na aba emails se existir)
- Nova memória: `mem://features/email-thread-summary-ai.md`

### Validação E2E
- Build limpo
- Abrir interação email longa → card aparece → "Resumir" → resumo renderizado em <10s
- Action items mostrados como lista
- "Regenerar" atualiza
- Em ContatoDetalhe com 3+ emails do mesmo subject, botão funciona

### Restrições
≤400 linhas/arquivo, sem `any`, sem `useEffect` para fetch, PT-BR. Reusar padrão `meeting-summary` (estrutura idêntica).

Após #8 → #9 (sentiment trend chart por contato — agregação de sentiments de interações ao longo do tempo).
