# 📊 SINGU CRM — KPIs e Dashboards de Gestão por Processos

## 🎯 Filosofia

> "O que não é medido, não é gerenciado." — Peter Drucker

Cada processo do SINGU tem KPIs específicos. Esses indicadores formam **3 níveis de dashboard**:

1. **Operacional** — vendedor individual (ações do dia)
2. **Tático** — gestor comercial (time, semana/mês)
3. **Estratégico** — diretoria (trimestre, tendências)

---

## 📈 NÍVEL 1 — Dashboard Operacional (Vendedor)

### Objetivo
Mostrar ao vendedor o que precisa ser feito **hoje** e como está performando **esta semana**.

### Componentes

#### 1.1 — "Seu Dia" (`YourDaySection`)
| Item | Visualização |
|---|---|
| Tarefas pendentes hoje | Lista com prioridade |
| Follow-ups vencidos | Badge vermelho |
| Aniversariantes da semana | Card horizontal |
| Health alerts críticos | Top 3 com ação |
| Insights novos (24h) | Carousel |

#### 1.2 — Métricas pessoais (semana atual)
| KPI | Visualização | Meta padrão |
|---|---|---|
| Interações realizadas | Big number + sparkline 7d | ≥ 25/semana |
| Novos contatos cadastrados | Big number | ≥ 5/semana |
| Taxa de follow-up cumprido | % | ≥ 85% |
| Cadências ativas | Lista compacta | — |
| Sentimento médio das interações | Gauge -1 a +1 | ≥ 0.3 |
| DISC analyses geradas | Counter | — |

#### 1.3 — SQL exemplo (interações da semana)
```sql
SELECT 
  COUNT(*) AS total,
  AVG(CASE 
    WHEN sentiment = 'positive' THEN 1
    WHEN sentiment = 'negative' THEN -1
    ELSE 0
  END) AS avg_sentiment,
  COUNT(*) FILTER (WHERE follow_up_required AND created_at < now() - interval '7 days') AS overdue_followups
FROM interactions
WHERE user_id = auth.uid()
  AND created_at >= date_trunc('week', now());
```

---

## 📊 NÍVEL 2 — Dashboard Tático (Gestor Comercial)

### Objetivo
Visão semanal/mensal do time, identificando gargalos e ranqueando performers.

### 2.1 — Funil de vendas (mês atual)
```
Lead → MQL → SQL → Proposta → Negociação → Ganho
```

| Estágio | Quantidade | % conversão | Tempo médio |
|---|---|---|---|
| Lead | 250 | — | — |
| MQL | 120 | 48% | 2 dias |
| SQL | 60 | 50% | 5 dias |
| Proposta | 35 | 58% | 7 dias |
| Negociação | 20 | 57% | 10 dias |
| Ganho | 8 | 40% | 6 dias |
| **Conversão total** | — | **3,2%** | **30 dias** |

### 2.2 — Ranking do time (mês)

| Vendedor | Interações | Taxa follow-up | Receita atribuída | DISC accuracy |
|---|---|---|---|---|
| 🥇 Maria | 142 | 92% | R$ 85k | 78% |
| 🥈 João | 128 | 88% | R$ 62k | 72% |
| 🥉 Ana | 115 | 85% | R$ 58k | 68% |

### 2.3 — Saúde do portfolio
| Segmento RFM | Quantidade | % do total | Receita 90d | Variação vs mês anterior |
|---|---|---|---|---|
| 🏆 Champions | 45 | 12% | R$ 220k | +8% |
| 💚 Loyal | 80 | 22% | R$ 180k | +3% |
| 🌱 Potential | 65 | 18% | R$ 90k | +12% |
| 🆕 New | 30 | 8% | R$ 45k | +25% |
| ⚠️ At Risk | 50 | 14% | R$ 65k | -15% |
| 🔴 Cant Lose | 12 | 3% | R$ 80k | -8% |
| 💤 Hibernating | 60 | 17% | R$ 20k | -5% |
| ❌ Lost | 18 | 5% | R$ 0 | — |

### 2.4 — Alertas de saúde (consolidado)
| Tipo | Aberto | Resolvido (7d) | Tempo médio resolução |
|---|---|---|---|
| Sem interação 60d+ | 23 | 18 | 14h |
| Sentimento negativo | 8 | 7 | 6h |
| Promessa vencida | 5 | 4 | 22h |
| VIP sem follow-up | 3 | 3 | 4h |

### 2.5 — SQL: ranking de vendedores
```sql
SELECT 
  p.full_name AS vendedor,
  COUNT(DISTINCT i.id) AS total_interacoes,
  ROUND(100.0 * COUNT(*) FILTER (
    WHERE i.follow_up_required AND i.completed_at IS NOT NULL
  ) / NULLIF(COUNT(*) FILTER (WHERE i.follow_up_required), 0), 1) AS taxa_followup,
  COUNT(DISTINCT i.contact_id) AS contatos_unicos,
  COUNT(DISTINCT da.id) AS analyses_disc
FROM profiles p
LEFT JOIN interactions i 
  ON i.user_id = p.id 
  AND i.created_at >= date_trunc('month', now())
LEFT JOIN disc_analysis_history da 
  ON da.user_id = p.id 
  AND da.created_at >= date_trunc('month', now())
GROUP BY p.id, p.full_name
ORDER BY total_interacoes DESC;
```

---

## 🏛️ NÍVEL 3 — Dashboard Estratégico (Diretoria)

### Objetivo
Tendências trimestrais, ROI dos módulos, previsão e benchmarks.

### 3.1 — North Star Metrics
| Métrica | Valor atual | Meta Q | Tendência (90d) |
|---|---|---|---|
| **MRR** | R$ 480k | R$ 600k | ↗️ +12% |
| **NRR (Net Revenue Retention)** | 108% | ≥ 110% | → estável |
| **CAC payback** | 8 meses | ≤ 6 meses | ↘️ -1mês |
| **LTV/CAC** | 3.4× | ≥ 4× | ↗️ +0.2 |
| **Churn mensal** | 2.8% | ≤ 2% | ↘️ -0.4pp |
| **Win rate** | 32% | ≥ 35% | ↗️ +3pp |

### 3.2 — Adoção dos módulos enterprise
| Módulo | Usuários ativos (DAU) | % do time | Impacto medido |
|---|---|---|---|
| DISC Analyzer | 12/15 | 80% | +18% taxa fechamento |
| NLP Coach | 9/15 | 60% | +12% rapport scores |
| Lux Intelligence | 6/15 | 40% | +35% conversão high-touch |
| RFM | 8/15 | 53% | -22% churn em segmentos top |
| Carnegie Tools | 4/15 | 27% | métrica em construção |
| Trigger Bundles | 11/15 | 73% | +14% reply rate |

### 3.3 — ROI de cada integração externa
| Integração | Custo mensal | Eventos/mês | Custo unitário | Receita atribuída |
|---|---|---|---|---|
| Lovable AI (DISC + NLP + Insights) | R$ 800 | 12k | R$ 0,07 | R$ 65k |
| Firecrawl (Lux) | R$ 200 | 400 | R$ 0,50 | R$ 80k |
| EnrichLayer (LinkedIn) | R$ 300 | 800 | R$ 0,38 | R$ 80k |
| ElevenLabs (voz) | R$ 150 | 200 | R$ 0,75 | — |
| Evolution API (WhatsApp) | R$ 50 | ∞ | flat | crítico |
| **TOTAL** | **R$ 1.500** | — | — | **R$ 225k** |
| **ROI** | — | — | — | **150×** |

### 3.4 — Forecast 90 dias
Modelo: regressão linear sobre histórico de 12 meses + ajuste sazonal.

| Métrica | Atual | Previsão Q+1 | Confiança |
|---|---|---|---|
| MRR | R$ 480k | R$ 580k | 78% |
| Novos clientes | 18/mês | 24/mês | 82% |
| Churn | 2.8% | 2.2% | 65% |
| Receita Lux-influenciada | R$ 80k | R$ 130k | 70% |

---

## 🛠️ Implementação técnica dos dashboards

### Tabelas-fonte
| Dashboard | Tabelas usadas |
|---|---|
| Operacional | `interactions`, `activities`, `health_alerts`, `insights`, `contacts.cadence` |
| Tático | `interactions`, `rfm_analysis`, `health_alerts`, `disc_analysis_history`, `pipeline_stages` |
| Estratégico | tudo + `purchase_history`, `external_data_audit_log`, telemetria |

### Materialized views recomendadas
```sql
-- Refresh diário às 02:00
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_user_weekly_stats AS
SELECT 
  user_id,
  date_trunc('week', created_at) AS week,
  COUNT(*) AS total_interactions,
  COUNT(DISTINCT contact_id) AS unique_contacts,
  AVG(CASE 
    WHEN sentiment = 'positive' THEN 1
    WHEN sentiment = 'negative' THEN -1
    ELSE 0
  END) AS avg_sentiment,
  COUNT(*) FILTER (WHERE follow_up_required) AS followups_created,
  COUNT(*) FILTER (WHERE type = 'call') AS calls,
  COUNT(*) FILTER (WHERE type = 'whatsapp') AS whatsapp,
  COUNT(*) FILTER (WHERE type = 'email') AS emails
FROM interactions
GROUP BY user_id, date_trunc('week', created_at);

CREATE UNIQUE INDEX ON mv_user_weekly_stats (user_id, week);

-- Refresh
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_user_weekly_stats;
```

```sql
-- RFM aggregation por user (refresh nightly)
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_rfm_distribution AS
SELECT 
  user_id,
  segment,
  COUNT(*) AS contact_count,
  SUM(monetary_value) AS total_value,
  AVG(monetary_value) AS avg_value
FROM rfm_analysis
GROUP BY user_id, segment;
```

---

## 🚨 Alertas executivos automáticos

Configurar `cron` que monitora KPIs e dispara push pra diretoria quando:

| Alerta | Condição | Destinatário |
|---|---|---|
| 🔴 Churn acima da meta | mensal > 3% | CEO + Head Comercial |
| 🔴 Win rate caindo | 7d-avg vs 28d-avg < -5pp | Head Comercial |
| 🔴 Vendedor zerou semana | 0 interações em 5 dias úteis | Gestor direto |
| 🟡 Custo IA > orçamento | mês > R$ 1k | CFO |
| 🟡 Edge function 5xx > 1% | 1h | Tech Lead |
| 🟢 Meta MRR atingida | mensal | Toda diretoria |

Implementação: edge function `executive-alerts` (cron diário 8h) usando `requireCronSecret`.

---

## 📐 Padrões de visualização

### Cores semânticas (Tailwind)
- Verde (`green-500`) — meta atingida, positivo
- Amarelo (`amber-500`) — atenção
- Vermelho (`red-500`) — crítico
- Azul (`blue-500`) — informativo
- Roxo (`purple-500`) — destaque/prêmio

### Tipos de gráfico
| Dado | Gráfico recomendado |
|---|---|
| Tendência temporal | Line chart |
| Distribuição categórica | Bar chart |
| Composição | Stacked bar / Donut |
| Comparação multi-dim | Radar chart |
| Funil | Funnel chart |
| Geográfico | Mapa (Leaflet, já tá no projeto) |
| Network/relacionamento | Force graph (já tá) |

### Hierarquia visual
1. **Big number** no topo (1-3 KPIs principais)
2. **Tendência** logo abaixo (sparkline ou %)
3. **Detalhe** em abas/expansíveis
4. **Drill-down** por clique → leva à tabela de origem

---

## 🎯 SLAs do sistema

### Performance
| Operação | SLA p50 | SLA p95 |
|---|---|---|
| Page load (auth pages) | < 800ms | < 2s |
| Page load (lista contatos 100 itens) | < 1.2s | < 3s |
| Edge function call | < 500ms | < 2s |
| disc-analyzer | < 1.5s | < 4s |
| lux-trigger (response inicial) | < 300ms | < 1s |
| external-data SELECT | < 600ms | < 2s |
| Push notification delivery | < 5s | < 30s |

### Disponibilidade
| Componente | SLA |
|---|---|
| Frontend (Lovable Cloud) | 99.9% |
| Supabase Postgres | 99.9% |
| Edge Functions | 99.5% |
| WhatsApp (Evolution) | 99.0% (depende de Meta) |

---

## 📚 Próximos passos

1. **Implementar** as materialized views acima
2. **Criar** páginas `/dashboard/operacional`, `/dashboard/tatico`, `/dashboard/estrategico`
3. **Configurar** crons de alertas executivos
4. **Integrar** Sentry para observabilidade frontend
5. **Setup** Grafana ou Metabase apontando pro Supabase pros dashboards estratégicos

---

**Versão:** 1.0 — 2026-04-09
