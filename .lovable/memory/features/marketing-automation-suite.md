---
name: Marketing Automation Suite
description: Hub unificado /marketing com Forms builder + routing, Lead Magnets, Nurturing runner, MQL→SQL classification e Multi-touch Attribution (first/last/linear/U/W/time-decay)
type: feature
---
- Tabelas: `forms` + `form_submissions` (slug único, fields jsonb, routing_rules round-robin, RLS público read+insert), `lead_magnets` + `lead_magnet_downloads`, `mql_criteria` + `mql_classifications`, `attribution_touchpoints` + `attribution_models_cache`, `nurturing_executions`
- RPCs SECURITY DEFINER: `submit_public_form`, `increment_form_view`, `track_magnet_download`, `increment_magnet_view`, `compute_attribution`, `evaluate_mql`, `enroll_contact_in_workflow`
- Edge Functions: `form-submit-handler` (público, service role), `nurturing-runner` (cron processa enrollments com next_action_at <= now), `mql-evaluator` (cron+on-demand), `attribution-calculator` (on-demand auth)
- Hooks: `useForms` + `useForm` + `useFormSubmissions`, `useLeadMagnets` + `useMagnetDownloads`, `useMQLCriteria` + `useMQLClassifications` + `useEvaluateMQL` + `useHandoffMQL`, `useTouchpoints` + `useAttribution` + `useRecordTouchpoint`, `useNurturingExecutions` + `useEnrollContact` + `useRunNurturing`
- Páginas: `/marketing` (hub 5 tabs), `/marketing/forms/:id` (FormBuilder + preview + submissions), `/marketing/lead-magnets/:id` (config + downloads), `/f/:slug` (público form), `/lm/:slug` (público magnet)
- Componentes: `FormBuilder`, `PublicFormRenderer`, `AttributionBreakdownChart`
- Routing: round-robin entre members do `routing_rules.members[]` baseado em `submission_count % len`
- Attribution models: first/last/linear/u_shape/w_shape/time_decay calculados em SQL puro com cache em `attribution_models_cache`
- Touchpoints automáticos: forms e magnets gravam touchpoint via RPC; sequences usam trigger existente
