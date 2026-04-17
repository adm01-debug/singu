
Behavioral Score Bridge acabou. Próximo grande gap = **Sales Playbooks & Battle Cards** — biblioteca de playbooks por situação (discovery, demo, negociação, win-back) e battle cards por concorrente, com sugestão contextual durante o ciclo de venda. Hoje existem ApproachEngine e CopywritingTools, mas falta playbook estruturado por estágio + battle cards consultáveis em segundos durante a call.

## Plano: Sales Playbooks & Battle Cards

### 1. Schema (migration)
- `sales_playbooks` — `id, user_id, name, description, scenario ('discovery'|'demo'|'negotiation'|'objection'|'closing'|'winback'|'onboarding'|'custom'), stage_target, industry_target, persona_target, content jsonb (sections array), tags[], active, usage_count, created_at, updated_at`
- `playbook_sections` (embed em jsonb): `{title, type:'talktrack'|'questions'|'objections'|'next_steps'|'resources', body, items[]}`
- `battle_cards` — `id, user_id, competitor_name, competitor_logo_url, our_strengths jsonb, their_strengths jsonb, weaknesses jsonb, pricing_comparison, win_themes text[], landmines text[], proof_points jsonb, last_updated_by, version int, active`
- `playbook_usage_log` — `id, user_id, playbook_id, contact_id, deal_id, opened_at, action ('opened'|'copied'|'shared')`
- RLS por user_id, audit, seed `seed_playbook_defaults` (4 playbooks + 2 battle cards exemplo)

### 2. Edge Functions
- **`playbook-recommender`**: dado `{deal_id|contact_id, current_stage, recent_topics?}` retorna top 3 playbooks rankeados por relevância (match em scenario/stage/persona) + 1 battle card se concorrente foi mencionado em conversation_intelligence
- **`playbook-generator`**: gera novo playbook via Lovable AI (gemini-3-flash-preview) a partir de prompt curto (cenário + indústria) com tool calling estruturado retornando sections JSON pronto

### 3. Hooks `src/hooks/usePlaybooks.ts` e `useBattleCards.ts`
- `usePlaybooks(filters)`, `usePlaybook(id)`, `useUpsertPlaybook`, `useDeletePlaybook`, `useGeneratePlaybook`
- `useBattleCards`, `useBattleCard(id)`, `useUpsertBattleCard`, `useDeleteBattleCard`
- `useRecommendPlaybooks(context)`, `useLogPlaybookUsage`

### 4. UI

**`/playbooks`** (hub):
- Tabs: "Playbooks" | "Battle Cards" | "Uso"
- Filtros por scenario/indústria/persona, busca textual
- Card grid + botão "Gerar com IA" e "Novo manual"

**`/playbooks/:id`** (detalhe):
- Renderização rica de sections (talktrack, perguntas SPIN, objeções+respostas, next steps, resources)
- Botão "Copiar bloco" por seção, "Usar no deal" (registra usage)

**`/playbooks/battle-cards/:id`**:
- Layout Nós x Eles, win themes, landmines, proof points, pricing comparison

**Drawer `<PlaybookSuggestionDrawer />`** (lateral):
- Acionado em PipelineKanban deal card e ContatoDetalhe header — chama `playbook-recommender` e mostra top 3 playbooks + battle card sugerido

**Componentes** em `src/components/playbooks/`:
- `PlaybookCard`, `PlaybookSectionRenderer`, `PlaybookEditor` (form com sections dinâmicas), `GeneratePlaybookDialog`
- `BattleCardView`, `BattleCardEditor`, `CompetitorComparisonTable`
- `PlaybookSuggestionDrawer`, `PlaybookUsageChart`

### 5. Integração
- `PipelineKanban` deal card: ícone "BookOpen" abre drawer de sugestão
- `ContatoDetalhe`: botão "Playbook" no header
- `ConversationIntelligence` insights: se concorrente detectado → link direto para battle card

### 6. Navegação
- Sidebar: "Playbooks" (ícone BookOpen) abaixo de Conversation Intel
- Rotas `/playbooks`, `/playbooks/:id`, `/playbooks/battle-cards/:id` em App.tsx

### 7. Memória
- `mem://features/sales-playbooks-battle-cards` + atualizar índice

### Não fazer
- Não criar tabelas products/proposals
- Sem editor WYSIWYG complexo (markdown simples + sections estruturadas)
- Sem versionamento histórico de playbooks (só `version` int)
- Sem importação de PDFs externos
