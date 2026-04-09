# 🗄️ SINGU CRM — Documentação do Schema

> **Gerado a partir de `src/integrations/supabase/types.ts` (~117 KB)**
>
> O schema tem ~80 tabelas. Esta doc cobre as **principais** organizadas por domínio.
> Para schema completo automático, rode: `supabase gen types typescript --local > types.ts`

---

## 📋 Domínios

1. **Identity** — usuários e perfis
2. **CRM Core** — empresas, contatos, interações
3. **Behavioral** — DISC, NLP, EQ, vieses cognitivos
4. **Intelligence** — Lux, RFM, insights, alertas
5. **Communication** — WhatsApp, automações
6. **Audit & Telemetry** — logs, métricas

---

## 1️⃣ IDENTITY

### `auth.users` (Supabase nativo)
Não modificar. Referência por `auth.uid()`.

### `public.profiles`
Extensão dos users com dados de aplicação.

| Coluna | Tipo | Descrição |
|---|---|---|
| `id` | uuid PK | FK para `auth.users.id` |
| `email` | text | Cache do email |
| `full_name` | text | Nome de exibição |
| `avatar_url` | text | URL da foto |
| `is_admin` | boolean | **NOVO** — flag RBAC, default false |
| `nlp_profile` | jsonb | Perfil PNL próprio do usuário |
| `preferences` | jsonb | Configurações UI, notificações, etc |
| `timezone` | text | Default America/Sao_Paulo |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

**RLS:** users só veem o próprio profile. Admins veem todos.

---

## 2️⃣ CRM CORE

### `public.companies`
Empresas do CRM.

| Coluna | Tipo | Descrição |
|---|---|---|
| `id` | uuid PK | |
| `user_id` | uuid FK | Dono |
| `name` | text | Razão social ou fantasia |
| `industry` | text | Setor (livre) |
| `website` | text | |
| `phone` | text | Principal |
| `email` | text | Principal |
| `address` | text | Logradouro |
| `city` | text | |
| `state` | text | UF |
| `logo_url` | text | |
| `financial_health` | text | Healthy / At Risk / Critical |
| `employee_count` | int | |
| `annual_revenue` | numeric | |
| `competitors` | text[] | Lista de concorrentes |
| `challenges` | text[] | Lista de desafios |
| `tags` | text[] | Tags livres |
| `notes` | text | Anotações |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

Tabelas relacionadas (1:N): `company_phones`, `company_emails`, `company_addresses`, `company_social_media`, `company_cnaes`, `company_rfm_scores`, `company_stakeholder_map`.

### `public.contacts`
Contatos pessoais (decisores, influenciadores, usuários).

| Coluna | Tipo | Descrição |
|---|---|---|
| `id` | uuid PK | |
| `user_id` | uuid FK | Dono |
| `company_id` | uuid FK? | Empresa associada (opcional) |
| `first_name` | text | |
| `last_name` | text | |
| `email` | text | |
| `phone` | text | |
| `whatsapp` | text | |
| `role_title` | text | Cargo |
| `linkedin` | text | URL |
| `relationship_stage` | text | unknown/cold/warm/hot/customer/lost |
| `relationship_score` | int | 0-100 |
| `sentiment` | text | positive/neutral/negative |
| `behavior` | jsonb | Snapshot DISC/NLP/etc atualizado |
| `birthday` | date | |
| `notes` | text | |
| `tags` | text[] | |
| `avatar_url` | text | |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

Tabelas relacionadas (1:N): `contact_phones`, `contact_emails`, `contact_addresses`, `contact_social_media`, `life_events`, `contact_relatives`, `contact_preferences`, `contact_cadence`, `contact_time_analysis`, `communication_preferences`.

### `public.interactions`
Touchpoints com contatos (mensagens, ligações, reuniões, e-mails).

| Coluna | Tipo | Descrição |
|---|---|---|
| `id` | uuid PK | |
| `user_id` | uuid FK | Quem registrou |
| `contact_id` | uuid FK | |
| `company_id` | uuid FK? | |
| `type` | text | call/whatsapp/email/meeting/note/etc |
| `title` | text | Resumo curto |
| `content` | text | Conteúdo completo |
| `sentiment` | text | positive/neutral/negative |
| `initiated_by` | text | us/them |
| `follow_up_required` | bool | |
| `follow_up_date` | timestamptz | |
| `duration` | int | Segundos (pra calls) |
| `audio_url` | text | URL da gravação |
| `attachments` | jsonb | Arquivos anexos |
| `emotion_analysis` | jsonb | Análise emocional auto |
| `tags` | text[] | |
| `created_at` | timestamptz | |

**Trigger automático:** após INSERT, dispara `disc-analyzer` se `content.length >= 100`.

---

## 3️⃣ BEHAVIORAL

### `public.disc_analysis_history`
Histórico de análises DISC. Nunca apaga (timeline de evolução).

| Coluna | Tipo | Descrição |
|---|---|---|
| `id` | uuid PK | |
| `user_id` | uuid FK | |
| `contact_id` | uuid FK | |
| `interaction_id` | uuid FK? | Origem (opcional) |
| `dominance_score` | int | 0-100 |
| `influence_score` | int | 0-100 |
| `steadiness_score` | int | 0-100 |
| `conscientiousness_score` | int | 0-100 |
| `primary_profile` | text | D/I/S/C |
| `secondary_profile` | text? | D/I/S/C ou null |
| `blend_profile` | text | DI/SC/DC/etc |
| `stress_primary` | text? | Como age sob pressão |
| `stress_secondary` | text? | |
| `confidence` | int | 0-100 |
| `analysis_source` | text | ai_analysis/manual/keyword |
| `detected_keywords` | text[] | |
| `detected_phrases` | text[] | |
| `behavior_indicators` | text[] | |
| `analyzed_text` | text | Truncado a 5000 |
| `profile_summary` | text | |
| `created_at` | timestamptz | |

Outras tabelas DISC: `disc_profile_config`, `disc_communication_logs`, `disc_conversion_metrics`.

### `public.nlp_profile` / metaprogram_analysis / vak_analysis_history
Análise PNL: metaprogramas (matching/mismatching, in-time/through-time, etc), VAK (visual/auditivo/cinestésico).

### `public.eq_analysis_history`
Análise de Inteligência Emocional por contato/interação.

### `public.cognitive_bias_history`
Detecção de vieses cognitivos exibidos pelo contato (ancoragem, confirmação, escassez, etc).

### `public.emotional_anchors` / `emotional_states_history`
Sistema de ancoragem PNL — estados emocionais associados a estímulos.

### `public.hidden_objections`
Objeções não verbalizadas detectadas em interações.

---

## 4️⃣ INTELLIGENCE

### `public.lux_intelligence`
Análises Lux 360º (assíncronas via n8n).

| Coluna | Tipo | Descrição |
|---|---|---|
| `id` | uuid PK | |
| `user_id` | uuid FK | |
| `entity_type` | text | contact/company |
| `entity_id` | uuid | |
| `status` | text | processing/completed/error/timeout |
| `started_at` | timestamptz | |
| `completed_at` | timestamptz? | |
| `social_profiles` | jsonb | LinkedIn/Insta/X/etc |
| `social_analysis` | jsonb | |
| `fiscal_data` | jsonb | CNPJ, capital, receita |
| `stakeholders` | jsonb | Lista de pessoas-chave |
| `audience_analysis` | jsonb | |
| `personal_profile` | jsonb | |
| `ai_report` | text | Relatório longo |
| `ai_summary` | text | Resumo executivo |
| `n8n_execution_id` | text | |
| `error_message` | text? | |

### `public.rfm_analysis`
Segmentação RFM por contato.

| Coluna | Tipo | Descrição |
|---|---|---|
| `id` | uuid PK | |
| `user_id` | uuid FK | |
| `contact_id` | uuid FK | |
| `recency_days` | int | |
| `frequency_count` | int | |
| `monetary_value` | numeric | |
| `recency_score` | int | 1-5 |
| `frequency_score` | int | 1-5 |
| `monetary_score` | int | 1-5 |
| `segment` | text | Champions/Loyal/At Risk/Lost/etc |
| `calculated_at` | timestamptz | |

### `public.health_alerts`
Alertas de saúde do relacionamento.

| Coluna | Tipo | Descrição |
|---|---|---|
| `id` | uuid PK | |
| `user_id` | uuid FK | |
| `contact_id` | uuid FK? | |
| `company_id` | uuid FK? | |
| `severity` | text | info/warning/critical |
| `type` | text | inactive/negative_sentiment/promise_overdue/etc |
| `message` | text | |
| `resolved_at` | timestamptz? | |
| `resolution_notes` | text? | |
| `created_at` | timestamptz | |

### `public.insights`
Insights gerados automaticamente.

| Coluna | Tipo | Descrição |
|---|---|---|
| `id` | uuid PK | |
| `user_id` | uuid FK | |
| `type` | text | hot_opportunity/anomaly/churn_risk/etc |
| `entity_type` | text? | contact/company/deal |
| `entity_id` | uuid? | |
| `priority` | text | low/medium/high/critical |
| `title` | text | |
| `body` | text | |
| `actionable` | bool | |
| `dismissed_at` | timestamptz? | |
| `acted_upon` | bool | |

---

## 5️⃣ COMMUNICATION

### `public.whatsapp_instances`
Instâncias Evolution API conectadas.

| Coluna | Tipo | Descrição |
|---|---|---|
| `id` | uuid PK | |
| `user_id` | uuid FK | |
| `instance_name` | text | Único |
| `phone_number` | text | |
| `status` | text | connected/disconnected/connecting |
| `last_connected_at` | timestamptz | |
| `qr_code` | text? | Para reconexão |

### `public.whatsapp_messages`
Mensagens brutas WhatsApp.

| Coluna | Tipo | Descrição |
|---|---|---|
| `id` | uuid PK | |
| `user_id` | uuid FK | |
| `contact_id` | uuid FK? | |
| `instance_name` | text | |
| `message_id` | text UNIQUE | ID do WhatsApp |
| `remote_jid` | text | |
| `from_me` | bool | |
| `message_type` | text | text/image/audio/video/etc |
| `content` | text | |
| `status` | text | pending/sent/delivered/read/played |
| `timestamp` | timestamptz | |
| `delivered_at` | timestamptz? | |
| `read_at` | timestamptz? | |
| `metadata` | jsonb | |

### `public.automation_rules` / `automation_logs`
Regras de automação configuradas pelo usuário.

---

## 6️⃣ AUDIT & TELEMETRY

### `public.external_data_audit_log` ⭐ NOVO

Audit log de operações sensíveis em `external-data` edge function.

| Coluna | Tipo | Descrição |
|---|---|---|
| `id` | uuid PK | |
| `user_id` | uuid FK | Quem chamou |
| `operation` | text | select/insert/update/delete/distinct/schema/list_tables |
| `table_name` | text | Tabela do banco externo |
| `payload` | jsonb | Request body (truncado) |
| `outcome` | text | success/denied/error |
| `created_at` | timestamptz | |

**RLS:** apenas admins (`is_admin = true`) podem SELECT.

**Índices:**
- `(user_id, created_at DESC)` — auditoria por usuário
- `(outcome, created_at DESC) WHERE outcome IN ('denied','error')` — detecção de abuso

### `public.activities`
Tarefas e atividades vinculadas a contatos/deals.

### `public.alerts` / `compatibility_alerts` / `behavior_alerts`
Sistema unificado de alertas (além dos health_alerts específicos).

### `public.push_subscriptions`
Web Push subscriptions por usuário (PWA).

---

## 🔍 Como gerar tipos atualizados

```bash
# Local (precisa do supabase CLI logado)
supabase gen types typescript --project-id rqodmqosrotmtrjnnjul > src/integrations/supabase/types.ts

# Ou via Lovable: o Lovable regenera automaticamente após migrations
```

---

## 📐 Padrões do schema

### Convenções
- **Plural** nos nomes de tabelas: `contacts`, `interactions`
- **snake_case** em colunas: `first_name`, `created_at`
- **UUID PKs** com `gen_random_uuid()` default
- **`user_id` FK + RLS** em toda tabela do `public`
- **Timestamps** sempre com timezone (`timestamptz`)
- **JSONB** para dados flexíveis (behavior, metadata, preferences)

### Triggers comuns
- `updated_at` automático via trigger BEFORE UPDATE
- `disc-analyzer` invocado após INSERT em `interactions` (se content >= 100 chars)
- `health_alerts` checados via cron a cada 6h

### Indices recomendados
- `(user_id, created_at DESC)` em todas as tabelas com timeline
- `(contact_id)` em todas as 1:N filhas de contacts
- `phone` e `whatsapp` em contacts (para lookup do webhook)
- `is_admin` em profiles (predicado raro mas usado)

---

**Versão:** 1.0 — 2026-04-09
