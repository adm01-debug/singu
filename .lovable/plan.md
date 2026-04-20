
# Plano: Bateria de Testes Abrangentes — Documentação SRE v2.0.0

## Escopo

Validar **exclusivamente** o que foi implementado na última rodada (Runbook v2.0.0 + arquivos satélites). Como são entregas **documentais** (não-executáveis), o teste é estrutural, semântico e de integração com a base de código existente.

## Arquivos sob teste

1. `docs/RUNBOOK.md` (v2.0.0)
2. `docs/postmortem-template.md` (novo)
3. `docs/dr-drills/README.md` (novo)

## Bateria de Testes — 6 Camadas × 30 cenários

### Camada 1 — Integridade Estrutural (5 testes)
- T1.1 Os 3 arquivos existem e têm tamanho >0
- T1.2 RUNBOOK.md tem header de versão semântica (v2.0.0) + tabela de changelog
- T1.3 Quick Reference Card está no topo (primeiras 80 linhas)
- T1.4 Sumário/índice presente e navegável (anchors válidos)
- T1.5 Encoding UTF-8 sem caracteres corrompidos

### Camada 2 — Cobertura SRE das 10 Ações Aprovadas (10 testes)
- T2.1 Error Budget Policy: 99.5% / 3.6h-mês / freeze >50%
- T2.2 Matriz RACI: 4 papéis × 6 atividades
- T2.3 Template de Postmortem extraído + linkado do RUNBOOK
- T2.4 Tabela de Capacidade: ≥4 sinais (interactions, edge fn, IA tokens, DB pool)
- T2.5 Calendário Game Days: 4 cenários Q1-Q4
- T2.6 Backup Verification Protocol mensal documentado
- T2.7 Dependency Map / Blast Radius (diagrama ASCII + tabela)
- T2.8 On-Call Handoff Checklist com 10 itens
- T2.9 Quick Reference Card com rollback + kill switch + health
- T2.10 Changelog v2.0.0 com data/autor/mudança

### Camada 3 — Consistência com Código (6 testes)
- T3.1 Endpoint health citado é `system-health` (não `health` legado)
- T3.2 Funções referenciadas existem em `supabase/functions/` (external-data, ask-crm, lead-routing, voice-agent, etc.)
- T3.3 Páginas admin citadas existem em `src/pages/admin/` (audit-trail, error-logs, lux-config, etc.)
- T3.4 Comandos de rollback alinhados com CI/CD real do projeto
- T3.5 SLOs (99.5%) coerentes com `mem://standards/performance-budget`
- T3.6 Severidades (P0-P3) coerentes com `mem://features/ux-rodada-f-hardening`

### Camada 4 — Cross-References (4 testes)
- T4.1 RUNBOOK→postmortem-template (link relativo válido)
- T4.2 RUNBOOK→dr-drills/README (link relativo válido)
- T4.3 RUNBOOK→LOAD_TESTING.md, FIELD_MAPPING.md (links existentes)
- T4.4 Memórias citadas existem (`mem://...`)

### Camada 5 — Qualidade Editorial (3 testes)
- T5.1 100% PT-BR (regra Core do projeto)
- T5.2 Sem TODO/FIXME/placeholders esquecidos
- T5.3 Tabelas markdown bem formadas (pipe alignment)

### Camada 6 — Usabilidade em Incidente Real (2 testes-cenário)
- T6.1 **Cenário "P0 às 3h da manhã"**: plantonista abre RUNBOOK → consegue rollback em <30s lendo só o Quick Ref Card?
- T6.2 **Cenário "Postmortem 48h após"**: template gera documento auto-suficiente sem consultar fontes externas?

## Execução

Tudo via tools read-only:
- `code--view` nos 3 arquivos novos/editados
- `code--search_files` para validar referências cruzadas (endpoints, funções, páginas)
- `code--list_dir` em `supabase/functions/` e `src/pages/admin/` para confirmar existência
- `code--exec wc -l` e `grep` para métricas estruturais

## Entregáveis

Relatório PT-BR formato tabela:

| # | Camada | Teste | Status | Evidência |
|---|--------|-------|--------|-----------|
| T1.1 | Estrutural | Arquivos existem | ✅/❌ | `wc -l`... |

Mais:
- **Score final** (X/30)
- **Bugs encontrados** (se houver) com severidade
- **Recomendações de correção** priorizadas
- **Veredito**: aprovação 10/10, aprovação com ressalvas, ou reprovação

## Critério de fechamento

(a) 30 cenários executados, (b) cada um com evidência concreta (linha/grep/diff), (c) bugs classificados por severidade, (d) veredito explícito sobre se a entrega SRE v2.0.0 está pronta para produção ou requer iteração.
