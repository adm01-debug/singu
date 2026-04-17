
Win/Loss acabou. Faltam grandes módulos do roadmap de excelência. Próximo grande gap = **Conversation Intelligence** — análise IA de chamadas/reuniões transcritas com detecção de tópicos, talk ratio, objeções, momentos críticos e coaching automático. Hoje só existe `meeting-summary` simples; falta análise estruturada profunda + dashboard de coaching.

## Plano: Conversation Intelligence

### 1. Schema (migration)
- `conversation_analyses` — `id, user_id, interaction_id (FK), contact_id, deal_id (nullable), duration_seconds, talk_ratio_rep numeric, talk_ratio_customer numeric, longest_monologue_seconds, questions_asked int, sentiment_overall ('positive'|'neutral'|'negative'|'mixed'), sentiment_timeline jsonb, topics jsonb, objections jsonb, action_items jsonb, key_moments jsonb, coaching_score int (0-100), coaching_tips text[], next_best_action text, analyzed_at`
- `conversation_topics_catalog` — `id, user_id, topic_key, label, category ('product'|'pricing'|'competition'|'objection'|'closing'|'discovery'|'other'), keywords text[], active` — biblioteca de tópicos rastreados
- `coaching_scorecards` — `id, user_id, name, criteria jsonb (lista de critérios com peso), active` — templates de avaliação
- RLS por user_id, audit em conversation_analyses, função `seed_conversation_topics(_user_id)` cria 12 tópicos padrão

### 2. Edge Functions
- **`conversation-analyzer`**: recebe `interaction_id` → lê `interactions.content` (transcrição) → invoca Lovable AI (gemini-3-flash-preview) com tool calling estruturado para extrair talk ratio, sentiment timeline, tópicos detectados (cruzando com catálogo), objeções, action items, key moments, coaching score + tips → persiste em `conversation_analyses`. Rate limit + JWT
- **`conversation-coaching-digest`**: gera digest semanal por vendedor — média de coaching score, top objeções não tratadas, padrões de melhoria → invoca IA para narrativa executiva

### 3. Hooks `src/hooks/useConversationIntel.ts`
- `useConversationAnalysis(interactionId)`, `useConversationAnalyses(filters)`, `useAnalyzeConversation`
- `useTopicsCatalog`, `useUpsertTopic`, `useDeleteTopic`, `useSeedTopics`
- `useCoachingScorecards`, `useUpsertScorecard`
- `useCoachingMetrics(period, repId?)` — score médio, tendência, top objeções

### 4. UI
**`/conversation-intelligence`** (hub):
- 4 KPIs: Conversas analisadas (período), Coaching Score médio, Talk Ratio médio do rep, Objeções não tratadas
- Tabs: "Conversas" (tabela com score badge, sentiment, ações) | "Tópicos" (frequência por categoria) | "Coaching" (cards de tendência por vendedor) | "Setup"
- Gráfico: barra de top objeções, line de coaching score ao longo do tempo

**`/conversation-intelligence/setup`**: editor de tópicos (CRUD + seed) e scorecards de coaching

**Widget `ConversationAnalysisCard`**: aparece em `InteracaoDetalhe` mostrando talk ratio, sentiment timeline, tópicos detectados, action items e tips

**Componentes** em `src/components/conversation-intel/`:
- `CoachingScoreBadge`, `TalkRatioBar`, `SentimentTimeline` (recharts area), `TopicsChart` (donut), `ObjectionsList`, `KeyMomentsTimeline`
- `ConversationAnalysesTable`, `TopicsEditor`, `ScorecardEditor`, `AnalyzeButton`

### 5. Integração
- `InteracaoDetalhe`: botão "Analisar com IA" + render do `ConversationAnalysisCard` quando análise existe
- Lead Scoring: coaching score alto + sentiment positivo entram como sinal de engagement
- Win/Loss: objeções recorrentes entram em supporting_data dos insights

### 6. Navegação
- Sidebar: "Conversation Intel" (ícone MessageSquare ou Mic) abaixo de Win/Loss
- Rotas `/conversation-intelligence` e `/conversation-intelligence/setup` em App.tsx

### 7. Memória
- `mem://features/conversation-intelligence` + atualizar índice

### Não fazer
- Não criar tabelas products/proposals
- Não substituir `meeting-summary` existente — coexiste como resumo rápido
- Não implementar gravação ao vivo nem STT em tempo real (usa transcrição já presente em interactions)
