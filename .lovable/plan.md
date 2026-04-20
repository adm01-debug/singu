
# Revisão #2 do `docs/RUNBOOK.md` consolidado — Próxima camada de maturidade

## Diagnóstico

A consolidação anterior resolveu os 10 gaps críticos (duplicação, health check, severidades, troubleshooting, kill switches, secrets, cross-references). O runbook agora é a fonte canônica única.

Esta segunda revisão eleva o documento de **operacional reativo** para **engenharia de confiabilidade proativa (SRE)**. Foram identificados 8 gaps de maturidade.

### Gaps remanescentes

1. **Sem error budget formalizado** — SLO de 99.5% existe, mas sem cálculo de orçamento mensal (3.6h/mês) nem política de freeze quando estourado.
2. **Sem matriz RACI** — papéis durante incidente (Incident Commander, Comms Lead, Scribe, Subject Matter Expert) não definidos.
3. **Postmortem sem template** — runbook menciona "agendar em 48h" mas não fornece estrutura (timeline, root cause 5-Whys, action items com owner/prazo, lessons learned, blameless statement).
4. **Sem runbook de capacidade** — sinais para escalar (tamanho de tabela, conexões DB, rate de invocação de edge functions, tokens IA gastos/dia).
5. **Sem chaos engineering / game days** — drills do DR são trimestrais e genéricos; faltam cenários injetados (matar edge function, simular 502, revogar secret).
6. **Backup verification não documentada** — backups existem mas não há procedimento de restore-test mensal em staging.
7. **Sem dependency map / blast radius** — qual módulo cai se WhatsApp/Voice/Email/IA Gateway falhar? Tabela de impacto cruzado ausente.
8. **Sem on-call handoff template** — passagem de plantão sem checklist (incidentes abertos, deploys agendados, alertas suprimidos, secrets em rotação).

## Plano de Melhoria — Rodada 2

### Ação 1 — Error Budget Policy
Adicionar seção com:
- Cálculo: 99.5% → 3.6h downtime/mês permitido
- Política de freeze: se >50% do budget consumido em janela de 7 dias → bloquear deploys não-críticos
- Tracking via `system-health` histórico (criar agregação semanal)

### Ação 2 — Matriz RACI de Incidentes
Tabela com 4 papéis (Incident Commander, Comms Lead, Scribe, SME) × 6 atividades (declarar, investigar, mitigar, comunicar, registrar, resolver).

### Ação 3 — Template de Postmortem
Bloco markdown reutilizável com: resumo executivo, timeline minuto-a-minuto, impacto (usuários/receita/dados), root cause via 5-Whys, contributing factors, action items (P0/P1/P2 com owner+due date), lessons learned, declaração blameless.

### Ação 4 — Runbook de Capacidade
Tabela "Sinal → Threshold → Ação":
- Tabela `interactions` >5M rows → particionamento por mês
- Edge function >100 invocações/min sustentado → revisar rate limit
- Tokens Lovable AI >R$X/dia → ativar cache agressivo
- Conexões DB >80% pool → investigar long-running queries

### Ação 5 — Chaos / Game Days
Calendário trimestral com 4 cenários scriptados:
- Q1: matar `external-data` durante horário comercial
- Q2: revogar `EVOLUTION_API_KEY` e validar fallback
- Q3: simular schema drift externo (renomear coluna)
- Q4: load test 2× pico via k6

### Ação 6 — Backup Verification Protocol
Procedimento mensal: restaurar PITR de 24h atrás em projeto staging, rodar `system-health`, validar contagem de rows em 5 tabelas críticas, documentar em `docs/dr-drills/YYYY-MM-restore.md`.

### Ação 7 — Dependency Map / Blast Radius
Diagrama ASCII + tabela mostrando cascata de falhas:
```text
Lovable AI Gateway down
  → ai-writing-assistant ❌
  → ask-crm ❌
  → meeting-summary ❌
  → lead-scorer (degradado, usa fallback heurístico)
```

### Ação 8 — On-Call Handoff Checklist
Template de 10 itens para passagem entre plantonistas: incidentes abertos, deploys nas próximas 24h, alertas em snooze, secrets em rotação, drills agendados, mudanças de schema pendentes, rate limits ajustados, feature flags ativadas, links para dashboards, contato de escalation atualizado.

### Ação 9 — Versionamento e Changelog do Runbook
Adicionar header com versão semântica + tabela de changelog (data, autor, mudança) para rastreabilidade.

### Ação 10 — Quick Reference Card (1 página)
Sumário executivo no topo: comandos mais usados (rollback, kill switch, health check), telefones/links de escalation, severidade matrix em 3 linhas. Para uso em incidente sob pressão.

## Arquivos tocados

- `docs/RUNBOOK.md` (adições não-destrutivas; preserva tudo da Rodada 1)
- `docs/postmortem-template.md` (novo, referenciado pelo RUNBOOK)
- `docs/dr-drills/README.md` (novo, índice de drills + protocolo de restore-test)

## Critério de fechamento

(a) Error budget calculado e política de freeze documentada, (b) Matriz RACI presente, (c) Template de postmortem extraído para arquivo próprio e linkado, (d) 4 game days do ano agendados, (e) Quick Reference Card de 1 página no topo do RUNBOOK, (f) Changelog versionado iniciando em v2.0.0.
