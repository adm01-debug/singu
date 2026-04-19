
# Análise Estratégica de Product Design — SINGU CRM

Vou agir como **Product Designer Strategist sênior** e fazer uma análise exaustiva. Primeiro preciso explorar o estado atual do produto além do Intelligence Hub (já dominado) para mapear gaps reais nas outras superfícies.

## Exploração realizada (mental, baseada em memória)

O SINGU é um CRM enterprise extremamente maduro com 90+ features documentadas:
- **Núcleo CRM**: Contatos, Empresas, Pipeline (Kanban), Interações, Tarefas
- **Inteligência**: Intelligence Hub (10/10), Lead Scoring, Forecast Confidence, Churn Risk, Sentiment Trend, Best Time Heatmap
- **Outbound/ABM**: Sequences multi-canal, ABM, Intent Data, Territory Optimization AI, Lead Routing
- **Comunicação**: WhatsApp Enterprise, Email Pipeline, Voice AI, AI Email Composer
- **Enrichment**: Email/Phone Validation, People Intelligence, Lux Intelligence, Data Enrichment
- **Admin/Ops**: Health Check, Audit Trail, Schema Drift, Slow Query, Knowledge Export, Help Desk
- **Gov/Compliance**: LGPD, RBAC, Brute Force Protection, Push Privacy

O usuário está em `/pipeline`. Existe runtime error "signal is aborted" (request cancelado — provavelmente AbortController em navegação rápida, baixa prioridade).

## Diagnóstico estratégico — onde está a fricção

Apesar da maturidade, identifiquei **6 eixos de melhoria de alto impacto** com base em padrões enterprise top-tier (Linear, Attio, Notion, Salesforce Lightning, Gong, Clay):

### Eixo 1 — Coesão do Sistema de Navegação
**Problema**: 50+ rotas sem hierarquia visual clara. `/intelligence`, `/abm`, `/intent`, `/enrichment`, `/territory-optimization`, `/sequences` competem por atenção. Usuário precisa decorar onde mora cada feature.
**Insight**: Falta um **Command Bar global** (estilo Linear ⌘K) que unifique navegação + ações + busca semântica em uma única superfície. O `GlobalSearch` existente é só busca.

### Eixo 2 — Estados de Trabalho do Vendedor (Modos)
**Problema**: O CRM trata todos os usuários igual. Mas SDR, Closer, CSM e Gestor têm jornadas radicalmente diferentes. Hoje cada um navega o mesmo menu.
**Insight**: **Workspace Modes** — perfis de UI (SDR Mode, Closer Mode, CSM Mode, Manager Mode) que reorganizam dashboard, sidebar e atalhos. Persistido por usuário.

### Eixo 3 — Inbox Unificada (Hoje fragmentada)
**Problema**: Email, WhatsApp, Voice, Notificações vivem em rotas separadas. Vendedor abre 4 abas para ver "o que precisa responder agora".
**Insight**: **`/inbox`** — uma única fila priorizada por IA com toggles de canal, ações em batch (responder, snooze, delegar) e modo "Zero Inbox" gameficado.

### Eixo 4 — Loop de Confiança nos Dados de IA
**Problema**: Lead Scoring, Forecast Confidence, Churn Risk, Sentiment geram scores, mas usuário não sabe **por quê** nem pode **corrigir**. Confiança em IA cai sem feedback loop.
**Insight**: **"Why this score?" universal** — drawer explicativo em todo score IA com breakdown de fatores + botão "marcar como incorreto" que alimenta retraining (mesmo que local).

### Eixo 5 — Onboarding & Empty States Premium
**Problema**: Sistema é vasto. Novo usuário entra e vê dashboard vazio sem direção. Empty states genéricos ("Nenhum dado encontrado").
**Insight**: **Progressive Disclosure Onboarding** — checklist persistente "First 7 Days" + empty states com CTA contextual ("Adicione seu primeiro contato e veja a IA enriquecer em 30s").

### Eixo 6 — Performance Percebida & Microinterações
**Problema**: Mesmo com TanStack Query, transições entre rotas pesadas (ex: `/empresas` → `EmpresaDetalhe`) parecem síncronas. Falta feedback de progresso e celebrações de marcos.
**Insight**: **View Transitions API** + skeleton inteligente + celebrações sutis (deal fechado, meta batida, NPS alto).

## Top 12 melhorias priorizadas (ICE: Impact × Confidence × Ease)

| # | Melhoria | Impacto | Esforço | Pilar |
|---|----------|---------|---------|-------|
| 1 | **Command Bar global ⌘K** unificada (nav + ações + busca semântica + IA) | 🔥🔥🔥 | M | Navegação |
| 2 | **`/inbox` unificada** (email + WhatsApp + voice + tasks + notif) | 🔥🔥🔥 | G | Produtividade |
| 3 | **Workspace Modes** (SDR/Closer/CSM/Manager) com layouts adaptáveis | 🔥🔥 | M | Personalização |
| 4 | **"Why this score?" universal** em todos scores IA + feedback loop | 🔥🔥🔥 | M | Trust |
| 5 | **Onboarding "First 7 Days"** checklist + empty states contextuais | 🔥🔥 | P | Ativação |
| 6 | **View Transitions** + skeletons inteligentes + celebrações | 🔥🔥 | P | Polish |
| 7 | **Daily Briefing** ao login (resumo IA: o que mudou, prioridades hoje) | 🔥🔥🔥 | M | Engagement |
| 8 | **Bulk Actions universais** em todas listas (multi-select + ações batch) | 🔥🔥 | M | Eficiência |
| 9 | **Saved Views compartilháveis** em Contatos/Empresas/Pipeline (estilo Notion) | 🔥🔥 | M | Colaboração |
| 10 | **Keyboard-first navigation** completa (j/k/enter em todas listas, hints visuais) | 🔥🔥 | M | Power user |
| 11 | **Mobile responsiveness audit** (Pipeline/Inbox em mobile real) | 🔥🔥 | M | Reach |
| 12 | **Theme System v2** (light + dark + high-contrast + density global) | 🔥 | P | Acessibilidade |

## Recomendação de execução em rodadas

**Rodada A — Quick Wins (1 sprint)** — itens 5, 6, 12 + parte do 4
**Rodada B — Game Changers (2 sprints)** — itens 1, 4, 7, 9
**Rodada C — Transformação (3 sprints)** — itens 2, 3, 8, 10, 11

## Constraints respeitadas
- Português obrigatório
- Reusa primitivas existentes (CommandPalette, IntelCommandPalette padrão)
- Sem novos backends (tudo client-side ou edge functions já existentes)
- Sem mexer em CRM/Pipeline/ABM no nível de regra de negócio — só camada de UX/IA
- Max 400 linhas/arquivo, sem `any`, TanStack Query exclusivo

## Próximo passo sugerido

Aprove para eu **iniciar a Rodada A (Quick Wins)** executando 1-a-1 sem pausas, no mesmo padrão de excelência das Rodadas 1-7 do Intelligence Hub. Ao final de cada rodada eu apresento a próxima.

Posso começar pela Rodada A imediatamente após sua aprovação.
