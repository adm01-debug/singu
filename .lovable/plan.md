
Vou explorar o estado atual antes de planejar.

Análise do que já existe (do contexto):
- Email marketing campaigns: módulo `/campanhas` com EmailBuilder ✅
- Landing pages builder: `/landing-pages` + `/lp/:slug` ✅
- Lead nurturing workflows: `useNurturingWorkflows` hook ✅ (mas falta UI de execução/runner)
- MQL→SQL handoff: existe lead-routing/handoff ✅ (mas falta classificação MQL formal)
- Sequences multi-canal já existem

Gaps reais (do item 6 do roadmap):
1. **Forms builder** com routing automático — NÃO existe
2. **Lead nurturing runner** + UI completa de workflows comportamentais — hook existe, falta UI/edge
3. **MQL classification** formal (score+critérios → marca contato MQL → handoff SDR) — falta camada formal
4. **Multi-touch attribution** (first/last/linear/U-shape) por touchpoint — NÃO existe
5. **Lead magnets** com tracking de download — NÃO existe

Plano: entregar como módulo unificado **Marketing Automation Suite** focado nos 5 gaps reais (não duplicar email/LP/sequences que já existem).

## Plano: Marketing Automation Suite

### 1. Schema (migration)
- `forms` — id, user_id, name, slug, fields jsonb (array de {key,label,type,required}), routing_rules jsonb, redirect_url, success_message, is_published, submission_count, view_count
- `form_submissions` — id, form_id, user_id, data jsonb, contact_id (auto-criado), routed_to (member_id), utm_source/medium/campaign, page_url, created_at
- `lead_magnets` — id, user_id, title, description, type (ebook|webinar|whitepaper|template|video), file_path, thumbnail_url, gated bool, form_id (FK), download_count, view_count, is_published
- `lead_magnet_downloads` — id, magnet_id, user_id, contact_id, email, downloaded_at, utm_*
- `mql_criteria` — id, user_id, name, conditions jsonb (score>=X, has tag Y, intent signal Z), is_active, auto_handoff bool, handoff_to_role (sdr|closer)
- `mql_classifications` — id, user_id, contact_id, criteria_id, qualified_at, status (mql|sql|disqualified), handoff_assignment_id, score_snapshot int
- `attribution_touchpoints` — id, user_id, contact_id, touchpoint_type (form|email|page_view|magnet|sequence|call|meeting|ad), source, medium, campaign, content, occurred_at, deal_id, value_attributed numeric
- `attribution_models_cache` — id, user_id, deal_id, model (first|last|linear|u_shape|w_shape), allocations jsonb, total_value, computed_at
- `nurturing_executions` — id, workflow_id, contact_id, current_step int, status (active|paused|completed), next_action_at, last_action_at, started_at, completed_at
- RLS por user_id em todas; público leia forms publicados + insira submissions
- RPC `submit_public_form(_slug, _data, _utms)` SECURITY DEFINER
- RPC `compute_attribution(_deal_id, _model)` retorna allocations
- RPC `evaluate_mql(_contact_id)` checa critérios e classifica

### 2. Edge Functions
- `form-submit-handler` (público, no JWT): valida, cria contact se não existe, aplica routing rule (round-robin entre owners definidos), grava submission + touchpoint, dispara nurturing workflow se configurado
- `nurturing-runner` (cron a cada 5min): processa enrollments com `next_action_at <= now()`, executa step (email/whatsapp/wait/task), avança current_step
- `mql-evaluator` (cron diário + on-demand): roda critérios MQL ativos para contatos elegíveis, classifica e dispara handoff
- `attribution-calculator` (on-demand): calcula allocations conforme modelo escolhido para um deal

### 3. Hooks
- `useForms`, `useForm(id)`, `useUpsertForm`, `useFormSubmissions(formId)`
- `useLeadMagnets`, `useLeadMagnet(id)`, `useUpsertLeadMagnet`, `useMagnetDownloads`
- `useMQLCriteria`, `useMQLClassifications`, `useEvaluateMQL`, `useHandoffMQL`
- `useTouchpoints(contactId|dealId)`, `useAttribution(dealId, model)`, `useRecordTouchpoint`
- Estender `useNurturingWorkflows` com `useEnrollContact`, `useNurturingExecutions`

### 4. UI

**`/marketing`** (hub central com 5 tabs):
- Tab "Formulários": grid de forms, botão Novo (form builder drag-drop), copiar URL pública
- Tab "Lead Magnets": grid de magnets, upload + form gating
- Tab "Nurturing": workflows com status, enrollments ativos, runner stats
- Tab "MQL → SQL": critérios configuráveis + lista de contatos qualificados aguardando handoff
- Tab "Attribution": seletor de modelo (first/last/linear/U/W) + breakdown por deal/campanha

**`/marketing/forms/:id`** — builder de campos (FormBuilder), preview, settings de routing
**`/marketing/lead-magnets/:id`** — editor com upload, form de gating, share URL
**`/f/:slug`** (rota pública) — renderiza form + captura, redirect ou success message
**`/lm/:slug`** (rota pública) — landing de lead magnet com gate de form

**Componentes** em `src/components/marketing/`:
- `FormBuilder` (campos drag-drop), `FormFieldEditor`, `PublicFormRenderer`
- `LeadMagnetCard`, `LeadMagnetEditor`, `MagnetGatingForm`
- `NurturingWorkflowEditor` (canvas de steps), `NurturingExecutionList`
- `MQLCriteriaEditor`, `MQLContactList`, `MQLHandoffDialog`
- `AttributionModelSelector`, `AttributionBreakdownChart`, `TouchpointTimeline`

### 5. Integração
- ContatoDetalhe: nova aba "Touchpoints" com timeline + badge MQL/SQL
- PipelineKanban deal card: botão "Attribution" abre breakdown
- AppSidebar: novo grupo "Marketing" com link para `/marketing`

### 6. Rotas (App.tsx)
- `/marketing`, `/marketing/forms/:id`, `/marketing/lead-magnets/:id` (auth)
- `/f/:slug`, `/lm/:slug` (públicas)

### 7. Memória
- `mem://features/marketing-automation-suite` + atualizar índice

### Não fazer
- Não duplicar email-builder/landing-pages/sequences que já existem
- Não criar produtos/propostas
- Sem editor WYSIWYG complexo de email (reusa EmailBuilder)
- Sem ad platform integration (Google/Meta) — touchpoints manuais ou via UTM
- Sem pixel tracking novo (reusa intent-tracker)
