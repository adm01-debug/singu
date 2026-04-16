
## Auditoria das funcionalidades 2.2 e 2.3

### 2.2 ✅ Automação de Atribuição de Leads — JÁ IMPLEMENTADO (~95%)

**Backend completo:**
- Tabelas: `sales_team_members` (weight, caps, férias, manager), `lead_routing_rules` (priorizadas, 5 tipos: round_robin, weighted, territory, specialization, load_balanced), `lead_assignments` (SLA tracking), `redistribution_log`, `handoff_requests`
- DB Functions: `reset_daily_lead_counts()`, `auto_reset_leads_on_update()`, `get_team_member_ids()`
- Edge Function `lead-routing` server-side com 3 actions: `distribute` (round-robin ponderado), `redistribute` (inativos), `reset_daily`
- RLS policies + auditoria

**Frontend completo:**
- Rota `/rodizio` com 4 tabs: Equipe, Regras, Handoff, Métricas
- CRUD de membros (weight, caps, férias, toggle ativo)
- CRUD de regras priorizadas com switch
- Fila de handoff SDR→Closer com BANT
- Métricas de distribuição
- Hooks: `useSalesTeam`, `useRoutingRules`, `useLeadAssignments`, `useServerDistribute`, `useServerRedistribute`, `useResetDailyCounts`, `useHandoffQueue`, `useRoutingMetrics`

**Pequeno gap:** trigger automático "lead criado → distribui" não está cabeado em automação (precisa chamar `useServerDistribute` manualmente ou via regra de Automações). Pode ser adicionado como template em `AutomationTemplates`.

---

### 2.3 ❌ Sequências de Email Automatizadas — APENAS ESQUELETO (~40%)

**O que existe:**
- Tabelas: `sequences`, `sequence_steps`, `sequence_enrollments` com `pause_on_reply`/`pause_on_meeting`
- UI `/sequencias`: criar cadência, listar, toggle, delete, enrollment manual
- Steps multi-canal (email/whatsapp/call/linkedin/sms) com delay dias+horas
- Tracking de open/click existe em `email_logs` (mas só p/ campaigns)

**O que FALTA (o coração da feature):**

| Componente | Status |
|---|---|
| Edge Function `sequence-processor` (cron que avança enrollments) | ❌ |
| Envio real de email do step via `send-transactional-email` | ❌ |
| Triggers comportamentais (abriu→ramifica, clicou→avança, não-abriu-3d→reenvia) | ❌ |
| Branching condicional (steps só lineares hoje) | ❌ |
| Pause-on-reply automático (flag existe, ninguém lê `replied_at`) | ❌ |
| Auto-enrollment por evento (lead criado → entra) | ❌ |
| Tracking de pixel/clicks dos próprios steps | ❌ |
| Trigger "visitou pricing page" | ❌ |

---

## Veredicto

| Item | Status real |
|---|---|
| **2.2 Round-Robin/Weighted** | ✅ Implementado backend + frontend |
| **2.3 Drip + Behavioral Triggers** | ❌ Só schema + UI de desenho; sem motor |

Para fechar 2.3 é preciso construir: `sequence-processor` (cron 5min), tabela `sequence_events` (open/click/reply/visit), pixel de tracking, integração com `send-transactional-email`, branching condicional nos steps, leitor de `replied_at` para pause automático, e gancho de auto-enrollment via Automações.

Aprove para eu implementar o motor de execução de sequências (2.3) — 2.2 já está pronto, não precisa tocar.
