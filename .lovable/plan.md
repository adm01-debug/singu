
Forecasting acabou. Próximo grande gap = **Deal Rooms & Mutual Action Plans (MAP)** — espaço colaborativo por oportunidade com plano de ação compartilhado entre vendedor e comprador, milestones, documentos, stakeholders e tracking de engajamento. Hoje deals só têm pipeline_kanban + forecast; falta workspace de execução do ciclo.

## Plano: Deal Rooms & Mutual Action Plans

### 1. Schema (migration)
- `deal_rooms` — `id, user_id, deal_id, deal_name, company_id, title, description, status ('active'|'won'|'lost'|'paused'), target_close_date, share_token (unique), share_enabled bool, last_buyer_view_at, buyer_view_count int`
- `deal_room_milestones` — `id, room_id, user_id, title, description, due_date, status ('pending'|'in_progress'|'done'|'blocked'), owner_side ('seller'|'buyer'|'both'), sort_order, completed_at, completed_by`
- `deal_room_stakeholders` — `id, room_id, user_id, contact_id (nullable), name, email, role_title, side ('seller'|'buyer'), influence ('champion'|'decision_maker'|'influencer'|'blocker'|'user'), engagement_score int 0-100, notes`
- `deal_room_documents` — `id, room_id, user_id, title, file_path (storage), file_type, file_size, uploaded_by_side, view_count int, last_viewed_at`
- `deal_room_activities` — `id, room_id, user_id, actor_side, actor_label, activity_type ('milestone_completed'|'doc_uploaded'|'doc_viewed'|'comment'|'view'), payload jsonb, created_at`
- `deal_room_comments` — `id, room_id, user_id, author_side, author_label, body, created_at`
- RLS: vendedor por user_id; rota pública `/dr/:token` lê via share_token (RPC SECURITY DEFINER)
- RPC `get_deal_room_by_token(_token)` retorna room+milestones+stakeholders+docs+activities (sem expor user_id)
- RPC `record_buyer_view(_token, _payload)` incrementa contadores + cria activity
- Trigger audit em deal_rooms e deal_room_milestones

### 2. Edge Functions
- **`deal-room-share`**: gera/rota share_token, retorna URL pública
- **`deal-room-buyer-view`**: endpoint público (no JWT) que valida token e registra view + activity (chamado pela rota pública)
- **`deal-room-health`**: calcula health do room (milestones em dia %, engajamento de stakeholders, recência de view do buyer) e gera 2-3 recomendações via Lovable AI (gemini-3-flash-preview)

### 3. Hooks `src/hooks/useDealRooms.ts`
- `useDealRooms(filters)`, `useDealRoom(id)`, `useCreateDealRoom`, `useUpdateDealRoom`, `useDeleteDealRoom`
- `useMilestones(roomId)`, `useUpsertMilestone`, `useDeleteMilestone`, `useToggleMilestone`
- `useStakeholders(roomId)`, `useUpsertStakeholder`, `useDeleteStakeholder`
- `useRoomDocuments(roomId)`, `useUploadDocument`, `useDeleteDocument`
- `useRoomActivities(roomId)`, `useRoomComments(roomId)`, `useAddComment`
- `useShareRoom`, `useRoomHealth`
- `usePublicDealRoom(token)` (sem JWT, via RPC)

### 4. UI

**`/deal-rooms`** (lista):
- Cards de rooms com progresso de milestones, próximo milestone, último view do buyer, status
- Filtros: status, próximos a fechar, sem atividade do buyer >7d

**`/deal-rooms/:id`** (workspace interno do vendedor):
- Header: deal name, valor, target close, share button (gera link público)
- 4 KPIs: % milestones done, dias até target, stakeholders engajados, buyer views
- Tabs: "Plano" (kanban de milestones) | "Stakeholders" | "Documentos" | "Atividade" | "Comentários" | "Health IA"

**`/dr/:token`** (rota pública para o buyer — sem auth):
- Layout limpo, branded, mostra plano, milestones, stakeholders (lado buyer), documentos disponíveis, comentários
- Buyer pode marcar milestones do lado dele como done, comentar e baixar docs
- Registra view ao carregar

**Componentes** em `src/components/deal-rooms/`:
- `DealRoomCard`, `MilestoneKanban`, `MilestoneCard`, `StakeholderList`, `StakeholderCard`
- `DocumentsList`, `DocumentUploader`, `ActivityFeed`, `CommentsThread`
- `ShareDialog` (mostra URL + toggle), `RoomHealthCard`, `BuyerSidePanel`

### 5. Storage
- Reutiliza bucket `documents` (já existe, privado) com path `deal-rooms/{room_id}/{file}`
- RLS: vendedor sobe; buyer baixa via signed URL gerado por RPC quando token válido

### 6. Integração
- `PipelineKanban` deal card: botão "Abrir Deal Room" (cria se não existir)
- `EmpresaDetalhe` aba comercial: lista de rooms ativos da conta
- Win/Loss: ao fechar deal, marca room como won/lost e congela edição

### 7. Navegação
- Sidebar: "Deal Rooms" (ícone Briefcase ou Handshake) abaixo de Forecasting
- Rotas `/deal-rooms`, `/deal-rooms/:id` (auth) e `/dr/:token` (pública) em App.tsx

### 8. Memória
- `mem://features/deal-rooms-mutual-action-plans` + atualizar índice

### Não fazer
- Não criar tabelas products/proposals
- Sem autenticação magic-link do buyer agora (token compartilhado basta)
- Sem assinatura eletrônica de docs
- Sem chat em tempo real (comments por refresh)
