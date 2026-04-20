
Status atual: **65/65 melhorias entregues** (Rodadas A–M). Para continuar evoluindo sem retrabalho, proponho **Rodada N — Inteligência Artificial nas Conexões & Self-Healing (5 → 70/70)**.

# Rodada N — IA nas Conexões, Auto-mapeamento & Self-Healing

**1. Auto-mapeamento de campos via IA** — em `IncomingWebhookFormDialog`, botão "Sugerir mapping com IA" envia `example_payload` + `target_entity` schema para nova edge function `ai-suggest-mapping` (Lovable AI Gateway, `google/gemini-2.5-flash`). Retorna `field_mapping` JSON pronto com confiança por campo. Reduz onboarding de webhook desconhecido de minutos para 5 segundos.

**2. Detecção de anomalias em latência/erros via IA** — edge function `connection-anomaly-detector` (cron diário) lê `incoming_webhook_logs` últimos 7d, envia série temporal agregada para IA detectar padrões anômalos (picos de erro, degradação gradual, janelas suspeitas). Resultados em nova tabela `connection_anomalies` exibidos em widget no `/admin/conexoes/logs` com severidade e explicação textual.

**3. Self-healing automático para webhooks com schema drift** — quando `incoming-webhook` falha por campo ausente no payload, dispara `ai-suggest-mapping` em background com payload real recebido. Se confiança ≥0.8, propõe atualização do mapping ao admin via `smart_notifications` (canal `mapping_drift`) com botão "Aceitar correção" que aplica mudança auditada.

**4. Chat conversacional sobre conexões** — adicionar contexto "conexões" ao `ask-crm` existente, permitindo perguntas tipo "qual conexão está mais lenta hoje?", "mostre webhooks com erro nas últimas 2h", "qual quota está mais próxima do limite?". Reusa infra de NL→SQL com whitelist de tabelas (`connection_*`, `incoming_webhook_*`, `mcp_tool_calls`).

**5. ADR-017 + memória `mem://features/ux-rodada-n-ia-self-healing.md`** — documentar contratos IA, política de auto-healing (sempre human-in-the-loop), thresholds de confiança e modelo de detecção de anomalias. CHANGELOG v2.6.0 — Connections AI & Self-Healing. Consolida **70/70 melhorias**.

## Restrições mantidas
Português, max 400 linhas/arquivo, sem `any`, TanStack Query exclusivo, sem `useEffect` para fetch, reusar primitivas (`Sheet`, `EmptyState`, `useActionToast`, `smart_notifications`, `ask-crm`).

## Critério 10/10 por etapa
(a) compila, (b) console limpo, (c) feature verificável, (d) sem regressão, (e) RLS auditado, (f) sem secret vazado, (g) IA sempre com fallback determinístico, (h) human-in-the-loop em mudanças destrutivas.
