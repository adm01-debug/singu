

# Revisão de `docs/RUNBOOK.md` — Diagnóstico e Plano de Melhoria

## Diagnóstico

A inspeção revelou **dois runbooks coexistindo** com escopos sobrepostos e divergentes:

| Arquivo | Escopo | Problemas |
|---|---|---|
| `docs/RUNBOOK.md` (202 linhas, MAIÚSCULO) | Visão estratégica: deploy, rollback, severidades, secrets | Desatualizado: cita `health` mas o real é `system-health` v2.0; inventário de 30 funções sem detalhe; sem tracing/SLOs; sem optimistic locking |
| `docs/runbook.md` (195 linhas, minúsculo) | Operacional tático: 409, 502, tracing, SLOs, deploy guard | Faltam seções de incidentes/severidade/secrets/DR |

Em sistemas case-insensitive (macOS/Windows), os dois arquivos colidem. As Rodadas R-V adicionaram conteúdo apenas no `runbook.md` minúsculo, deixando o `RUNBOOK.md` (referenciado pelo `DISASTER_RECOVERY.md`) defasado.

### Gaps adicionais identificados

1. **Health check desatualizado** — runbook cita `/functions/v1/health`; a função real é `system-health` (5 componentes: db local, db externo, WhatsApp, email, voice). Endpoint e tabela de checks estão errados.
2. **Sem cross-references** entre RUNBOOK ↔ DISASTER_RECOVERY ↔ LOAD_TESTING ↔ SECURITY.
3. **Sem inventário real** das 30+ edge functions (lista é exemplificativa, não exaustiva).
4. **Severidades sem critérios mensuráveis** (ex.: P1 não define % de usuários impactados).
5. **Sem playbook de comunicação** (canal de status, template de mensagem para usuários).
6. **Sem on-call rotation** ou cadeia de escalation (existe no DR mas não referenciada no RUNBOOK).
7. **Troubleshooting curto** — 5 cenários, faltam: optimistic locking 409, fallback Cloudflare, schema drift, slow queries, drift de mapping de campos.
8. **Checklist trimestral** sem owner, sem data da última execução, sem link para evidências.
9. **Rotação de secrets** sem `LOVABLE_API_KEY`, `GEMINI_API_KEY`, `FIRECRAWL_API_KEY`, `EXTERNAL_SUPABASE_URL`.
10. **Sem seção de feature flags / kill switches** para desabilitar módulos sem deploy.

## Plano de Melhoria

### Ação 1 — Consolidar em arquivo único `docs/RUNBOOK.md`

Mesclar `runbook.md` (minúsculo) dentro de `RUNBOOK.md`, deletar o duplicado e atualizar referências em `DISASTER_RECOVERY.md`, `ONBOARDING.md`, `HARDENING_*.md` e memórias.

### Ação 2 — Atualizar Health Check (correção factual)

Substituir referências a `/functions/v1/health` por `/functions/v1/system-health`. Atualizar tabela de checks para os 5 componentes reais (`database_local`, `database_external`, `whatsapp`, `email_pipeline`, `voice_ai`) com semântica `up/degraded/down/not_configured`.

### Ação 3 — Inventário completo de Edge Functions

Listar as 30+ funções reais agrupadas por categoria, com: nome, auth guard (`withAuth`/`requireCronSecret`/`withAuthOrServiceRole`/webhook secret), rate limit configurado e link para o código.

### Ação 4 — Critérios mensuráveis nas severidades

Reescrever tabela de severidades com gatilhos objetivos:
- **P1**: >50% usuários sem login OU `system-health` retornando `unhealthy` por >5min OU perda de dados confirmada
- **P2**: módulo core (Contatos/Empresas/Pipeline) com >5% taxa de erro
- **P3**: módulo secundário degradado afetando <20% usuários
- **P4**: bug visual sem impacto funcional

### Ação 5 — Expandir Troubleshooting (5 → 12 cenários)

Adicionar: `409 CONCURRENT_EDIT`, `fallback:true` Cloudflare, schema drift externo, slow query >3s (via badge global), VAPID keys ausentes, conflito de mapping de campos, ElevenLabs 401, Evolution API instance offline.

### Ação 6 — Playbook de Comunicação

Templates prontos em PT-BR para: incidente em curso, resolução, postmortem 48h. Definir canal oficial (ex.: status page, email para usuários ativos).

### Ação 7 — Feature Flags & Kill Switches

Documentar como desabilitar rapidamente: Lux Intelligence (webhook), WhatsApp sync, Voice AI, integrações externas via `connection_configs.is_active = false`.

### Ação 8 — Atualizar Rotação de Secrets

Adicionar: `LOVABLE_API_KEY` (auto), `GEMINI_API_KEY`, `FIRECRAWL_API_KEY`, `ENRICHLAYER_API_KEY`, `EXTERNAL_SUPABASE_URL/SERVICE_ROLE_KEY`. Coluna "owner" + "última rotação".

### Ação 9 — Cross-references e Índice

Adicionar bloco "Documentos relacionados" no topo: `DISASTER_RECOVERY.md`, `LOAD_TESTING.md`, `SECURITY.md`, `EDGE_FUNCTIONS_API.md`. Atualizar índice numerado.

### Ação 10 — Manter conteúdo das Rodadas R-V

Preservar integralmente as seções: Tracing & Correlação, SLOs, Deploy Anti-Regressão, Comandos de Diagnóstico SQL — apenas reorganizar dentro do RUNBOOK consolidado.

## Arquivos tocados

- `docs/RUNBOOK.md` (reescrita consolidada)
- `docs/runbook.md` (deletar após merge)
- `docs/DISASTER_RECOVERY.md` (atualizar 1 link)
- `mem://technical/system-health-monitoring` (atualizar referência ao endpoint correto)

## Critério de fechamento

(a) Arquivo único `RUNBOOK.md` cobrindo deploy/rollback/health/edge functions/troubleshooting/severidades/comunicação/flags/secrets/SLOs/tracing, (b) `runbook.md` removido e referências atualizadas, (c) endpoint health correto (`system-health`), (d) zero divergência entre runbook e código, (e) índice navegável com cross-references para DR/Load/Security.

