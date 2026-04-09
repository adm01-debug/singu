# 🏗️ SINGU CRM — Arquitetura Completa

## 📐 Visão geral

```mermaid
graph TB
    subgraph "👤 Usuários"
        U1[Vendedor]
        U2[Gestor Comercial]
        U3[Admin]
    end

    subgraph "🌐 Frontend (Lovable + Vite)"
        FE[React 18 + TypeScript]
        PWA[PWA / Workbox]
        SW[Service Worker]
    end

    subgraph "🔐 Auth Layer"
        SA[Supabase Auth]
        JWT[JWT Validation]
    end

    subgraph "🗄️ Supabase Postgres (rqodmqosrotmtrjnnjul)"
        DB[(Postgres + RLS)]
        T1[contacts / companies]
        T2[interactions]
        T3[disc_* / nlp_*]
        T4[lux_intelligence]
        T5[rfm_analysis]
        T6[health_alerts]
        T7[external_data_audit_log]
    end

    subgraph "⚡ Edge Functions Deno"
        EF1[withAuth]
        EF2[disc-analyzer]
        EF3[lux-trigger]
        EF4[rfm-analyzer]
        EF5[generate-insights]
        EF6[external-data ADMIN]
        EF7[bitrix24-webhook]
        EF8[evolution-webhook]
        EF9[lux-webhook]
        EF10[Cron functions]
    end

    subgraph "🌍 Integrações Externas"
        EXT1[Bitrix24]
        EXT2[Evolution API/WhatsApp]
        EXT3[n8n Workflows]
        EXT4[Lovable AI Gateway]
        EXT5[Firecrawl]
        EXT6[EnrichLayer]
        EXT7[ElevenLabs]
        EXT8[Banco Externo Supabase]
    end

    U1 & U2 & U3 --> FE
    FE --> PWA
    PWA --> SW
    FE --> SA
    SA --> JWT
    FE -->|JWT Bearer| EF1
    EF1 --> EF2 & EF3 & EF4 & EF5 & EF6
    EF2 & EF3 & EF4 & EF5 & EF6 --> DB

    EXT1 -->|x-bitrix-secret| EF7
    EXT2 -->|x-evolution-secret| EF8
    EXT3 -->|x-lux-secret| EF9
    EF7 & EF8 & EF9 --> DB

    EF2 & EF5 --> EXT4
    EF3 --> EXT3
    EXT3 --> EXT5 & EXT6 & EXT7
    EF6 -->|admin only| EXT8

    DB --- T1 & T2 & T3 & T4 & T5 & T6 & T7

    Cron[pg_cron / Scheduler] -->|x-cron-secret| EF10
    EF10 --> DB

    style FE fill:#3b82f6,color:#fff
    style DB fill:#0ea5e9,color:#fff
    style EF1 fill:#10b981,color:#fff
    style EF6 fill:#ef4444,color:#fff
    style T7 fill:#f59e0b,color:#fff
```

---

## 🔒 Modelo de autenticação por edge function

```mermaid
flowchart LR
    Req[Request HTTP] --> Type{Tipo de chamada?}
    
    Type -->|Frontend autenticado| A1[withAuth do JWT]
    Type -->|Webhook terceiro| A2[requireWebhookSecret]
    Type -->|Cron job| A3[requireCronSecret]
    Type -->|Admin write| A4[withAuth + isAdmin]
    
    A1 -->|Bearer válido| OK1[✅ Processa]
    A1 -->|Inválido| KO1[❌ 401]
    
    A2 -->|x-bitrix-secret OK| OK2[✅ Processa]
    A2 -->|x-evolution-secret OK| OK2
    A2 -->|x-lux-secret OK| OK2
    A2 -->|Inválido| KO2[❌ 401]
    
    A3 -->|x-cron-secret OK| OK3[✅ Processa]
    A3 -->|Inválido| KO3[❌ 401]
    
    A4 -->|JWT + is_admin=true| OK4[✅ Processa + audit log]
    A4 -->|Não admin| KO4[❌ 403 + audit log]
    
    style OK1 fill:#10b981,color:#fff
    style OK2 fill:#10b981,color:#fff
    style OK3 fill:#10b981,color:#fff
    style OK4 fill:#10b981,color:#fff
    style KO1 fill:#ef4444,color:#fff
    style KO2 fill:#ef4444,color:#fff
    style KO3 fill:#ef4444,color:#fff
    style KO4 fill:#ef4444,color:#fff
```

---

## 🔁 Fluxo: Mensagem WhatsApp → Análise DISC

```mermaid
sequenceDiagram
    autonumber
    participant Cli as 📱 Cliente
    participant Evo as Evolution API
    participant EW as evolution-webhook
    participant DB as Postgres
    participant DA as disc-analyzer
    participant AI as Lovable AI
    participant FE as Frontend Vendedor

    Cli->>Evo: Envia "olá quero saber sobre o produto..."
    Evo->>EW: POST /evolution-webhook<br/>X-Evolution-Secret
    EW->>EW: Valida secret (constant-time)
    EW->>EW: sanitizePhone(remoteJid)
    EW->>DB: SELECT contacts WHERE phone.eq.X
    
    alt Contato existe
        DB-->>EW: contact found
    else Contato não existe
        EW->>DB: INSERT contact (auto-criado)
    end
    
    EW->>DB: UPSERT whatsapp_messages
    EW->>DB: INSERT interactions
    
    alt Mensagem ≥ 100 chars
        EW->>DA: invoke(texts, contactId)<br/>service_role token
        DA->>DA: withAuth(service_role)
        DA->>AI: POST gemini-flash<br/>DISC_PROMPT + texts
        AI-->>DA: JSON {scores, profile, blend}
        DA->>DB: INSERT disc_analysis_history
        DA->>DB: UPDATE contacts.behavior
        DA->>DB: INSERT disc_communication_logs
    end
    
    EW-->>Evo: 200 OK
    
    Note over FE,DB: Vendedor abre ficha do contato
    FE->>DB: SELECT contacts + last DISC
    DB-->>FE: profile + scores
    FE->>FE: Renderiza DISCProfileCard
```

---

## 🎯 Fluxo: Lux Intelligence (assíncrono)

```mermaid
sequenceDiagram
    autonumber
    participant FE as Frontend
    participant LT as lux-trigger
    participant DB as Postgres
    participant N8 as n8n Workflow
    participant Ext as APIs Externas
    participant LW as lux-webhook
    
    FE->>LT: POST {entityType, entityId}<br/>JWT Bearer
    LT->>LT: withAuth(JWT) → userId
    LT->>DB: INSERT lux_intelligence (status=processing)
    DB-->>LT: luxRecordId
    LT->>N8: POST async (fire-and-forget)
    LT-->>FE: 200 {luxRecordId}
    
    par Polling no frontend
        loop A cada 5s
            FE->>DB: SELECT lux_intelligence WHERE id=?
            alt Status != completed
                DB-->>FE: status=processing
            else
                DB-->>FE: status=completed + data
            end
        end
    and Execução paralela no n8n
        N8->>Ext: Firecrawl scrape site
        N8->>Ext: EnrichLayer LinkedIn
        N8->>Ext: Receita Federal CNPJ
        N8->>Ext: ElevenLabs voice
        N8->>Ext: LLM síntese
        Ext-->>N8: dados consolidados
    end
    
    N8->>LW: POST com X-Lux-Secret + payload completo
    LW->>LW: requireWebhookSecret
    LW->>DB: UPDATE lux_intelligence (status=completed)
    
    alt Stakeholders detectados
        LW->>DB: INSERT contacts (cada stakeholder)
    end
    
    alt entityUpdates presentes
        LW->>DB: UPDATE companies/contacts
    end
    
    Note over FE: Próximo polling detecta completed
    FE->>FE: Renderiza relatório completo
```

---

## 📊 Stack tecnológica

```mermaid
graph LR
    subgraph "Frontend"
        F1[Vite 5]
        F2[React 18]
        F3[TypeScript 5.8]
        F4[Tailwind 3]
        F5[shadcn/ui + Radix]
        F6[TanStack Query]
        F7[Zustand]
        F8[react-hook-form + Zod]
    end
    
    subgraph "Backend"
        B1[Supabase Postgres]
        B2[Edge Functions Deno]
        B3[Supabase Auth JWT]
        B4[Supabase Storage]
        B5[Supabase Realtime]
        B6[RLS policies]
    end
    
    subgraph "DevOps"
        D1[Lovable Cloud]
        D2[GitHub repo]
        D3[Bun lockfile]
        D4[Vitest + Testing Library]
        D5[ESLint + TypeScript]
        D6[Vite PWA + Workbox]
    end
    
    subgraph "Observabilidade"
        O1[Web Vitals]
        O2[Edge Function logs]
        O3[external_data_audit_log]
        O4[Sentry futuro]
    end
```

---

## 🗂️ Estrutura de pastas

```
singu/
├── .env.example                 ← template de variáveis
├── .gitignore                   ← .env bloqueado
├── README.md                    ← documentação principal
├── docs/
│   ├── POPs_PROCESSOS.md        ← procedimentos operacionais
│   ├── ARQUITETURA.md           ← este arquivo
│   ├── SECURITY.md              ← política de segurança
│   ├── KPIs_GESTAO.md           ← dashboards e métricas
│   └── SCHEMA.md                ← documentação do banco
├── src/
│   ├── App.tsx                  ← rotas + providers
│   ├── main.tsx
│   ├── components/              ← UI components
│   │   ├── disc/                ← módulo DISC
│   │   ├── nlp/                 ← módulo NLP
│   │   ├── neuro/               ← Neuromarketing
│   │   ├── carnegie/            ← Carnegie
│   │   ├── triggers/            ← Trigger Bundles
│   │   └── ui/                  ← shadcn/ui base
│   ├── pages/                   ← rotas
│   ├── hooks/                   ← lógica de negócio
│   ├── lib/
│   │   └── externalData.ts      ← cliente external-data
│   ├── integrations/
│   │   └── supabase/
│   │       ├── client.ts        ← cliente Supabase
│   │       └── types.ts         ← tipos gerados (117KB)
│   ├── stores/                  ← Zustand
│   └── __tests__/               ← Vitest tests
├── supabase/
│   ├── config.toml              ← config edge functions
│   ├── functions/
│   │   ├── _shared/
│   │   │   └── auth.ts          ← helpers de auth (NOVO)
│   │   ├── disc-analyzer/
│   │   ├── lux-trigger/         ← já tinha auth manual
│   │   ├── lux-webhook/
│   │   ├── bitrix24-webhook/
│   │   ├── evolution-webhook/
│   │   ├── external-data/       ← com admin gate (NOVO)
│   │   └── ... (28 functions total)
│   └── migrations/              ← ~50 SQL migrations
└── public/
    └── pwa-*.png
```

---

## 🧬 Modelo de dados — entidades principais

```mermaid
erDiagram
    profiles ||--o{ contacts : "owns"
    profiles ||--o{ companies : "owns"
    profiles ||--o{ interactions : "owns"
    profiles {
        uuid id PK
        text email
        text full_name
        bool is_admin
        jsonb nlp_profile
        jsonb preferences
    }
    
    companies ||--o{ contacts : "has"
    companies ||--o{ interactions : "has"
    companies {
        uuid id PK
        uuid user_id FK
        text name
        text industry
        text financial_health
        int employee_count
        numeric annual_revenue
        text[] tags
    }
    
    contacts ||--o{ interactions : "has"
    contacts ||--o{ disc_analysis_history : "analyzed_in"
    contacts ||--o{ life_events : "has"
    contacts ||--o{ contact_relatives : "has"
    contacts ||--o{ contact_preferences : "has"
    contacts ||--o{ contact_cadence : "has"
    contacts ||--o{ rfm_analysis : "scored_in"
    contacts ||--o{ health_alerts : "monitored"
    contacts {
        uuid id PK
        uuid user_id FK
        uuid company_id FK
        text first_name
        text last_name
        text email
        text phone
        text whatsapp
        text relationship_stage
        int relationship_score
        text sentiment
        jsonb behavior
    }
    
    interactions ||--o{ disc_analysis_history : "triggers"
    interactions {
        uuid id PK
        uuid contact_id FK
        uuid company_id FK
        uuid user_id FK
        text type
        text title
        text content
        text sentiment
        text initiated_by
        bool follow_up_required
        text audio_url
        text[] tags
        jsonb emotion_analysis
    }
    
    disc_analysis_history {
        uuid id PK
        uuid user_id FK
        uuid contact_id FK
        uuid interaction_id FK
        int dominance_score
        int influence_score
        int steadiness_score
        int conscientiousness_score
        text primary_profile
        text blend_profile
        int confidence
    }
    
    lux_intelligence {
        uuid id PK
        uuid user_id FK
        text entity_type
        uuid entity_id
        text status
        jsonb social_profiles
        jsonb fiscal_data
        jsonb stakeholders
        text ai_report
    }
    
    external_data_audit_log {
        uuid id PK
        uuid user_id FK
        text operation
        text table_name
        jsonb payload
        text outcome
        timestamptz created_at
    }
```

---

## 🛡️ Camadas de segurança

```mermaid
flowchart TB
    subgraph L1["Camada 1: Network"]
        N1[HTTPS obrigatório]
        N2[CORS controlado]
        N3[Rate limit Cloudflare<br/>futuro]
    end
    
    subgraph L2["Camada 2: Authentication"]
        A1[Supabase Auth JWT]
        A2[Webhook shared secrets]
        A3[Cron secret]
        A4[Constant-time comparison]
    end
    
    subgraph L3["Camada 3: Authorization"]
        Z1[RLS em todas as tabelas]
        Z2[is_admin flag]
        Z3[ownership checks]
    end
    
    subgraph L4["Camada 4: Input Validation"]
        I1[sanitizePhone]
        I2[Allowed tables list]
        I3[Zod schemas frontend]
        I4[Size limits<br/>5MB audio etc]
    end
    
    subgraph L5["Camada 5: Audit"]
        AU1[external_data_audit_log]
        AU2[Edge function logs]
        AU3[Web Vitals]
    end
    
    L1 --> L2 --> L3 --> L4 --> L5
```

---

## 📦 Edge Functions — categorização

| Categoria | Funções | Auth model |
|---|---|---|
| **Frontend chamadas** | disc-analyzer, voice-to-text, ai-writing-assistant, generate-insights, generate-offer-suggestions, suggest-next-action, enrichlayer-linkedin, firecrawl-scrape, enrich-contacts, social-*, rfm-analyzer, elevenlabs-*, voice-agent, send-push-notification, external-data | `withAuth` (JWT) |
| **Webhooks de terceiros** | bitrix24-webhook, evolution-webhook, evolution-api, lux-webhook | `requireWebhookSecret` |
| **Triggers do user** | lux-trigger | `withAuth` (manual) |
| **Crons** | check-notifications, check-health-alerts, client-notifications, template-success-notifications, smart-reminders, weekly-digest | `requireCronSecret` |

**Total: 28 edge functions**

---

**Versão:** 1.0 — 2026-04-09
