# 📋 SINGU CRM — POPs (Procedimentos Operacionais Padrão)

> **Objetivo:** documentar formalmente os 10 fluxos principais do sistema. Cada POP segue o padrão BPMN textual + responsáveis + gatilhos + entradas/saídas + regras + KPIs + automações sugeridas.
>
> **Convenção de status / actores:**
> - **Atores**: Vendedor, SDR, Gestor Comercial, Sistema, Cliente, Agente IA
> - **Status**: `pendente` → `em_andamento` → `concluído` / `cancelado` / `expirado`
> - **Gatilhos**: eventos que iniciam o processo (criação de registro, mudança de campo, cron, webhook externo)

---

## 🏷️ POP 01 — DISC: Análise Comportamental Automática

### Objetivo
Identificar o perfil DISC de um contato a partir de mensagens reais (texto livre), gerando estratégias de venda adaptadas.

### Escopo
Toda interação salva no SINGU com `content` ≥ 100 caracteres dispara análise.

### Atores
- **Sistema** (trigger automático após criação de `interaction`)
- **Edge Function** `disc-analyzer` (executa análise via Lovable AI)
- **Vendedor** (consome resultado na ficha do contato)

### Entradas
- `texts: string[]` — array de textos (mensagens, e-mails, transcrições)
- `contactId: uuid` — contato dono da análise
- `interactionId: uuid?` — interação que originou (opcional)
- `userId` — vem do JWT autenticado (NÃO do payload)

### Saídas
- Registro em `disc_analysis_history` com scores D/I/S/C, perfil primário/secundário/blend, confiança 0-100
- Atualização do campo `behavior` em `contacts` com snapshot do último DISC
- Registro em `disc_communication_logs` para métricas de conversão

### Fluxo BPMN textual

```
Início: Mensagem com ≥100 chars chega ao SINGU
   │
   ├─ Tarefa 1 — Sistema: Identificar contato e user_id
   │
   ├─ Tarefa 2 — Sistema: Disparar disc-analyzer (fire-and-forget)
   │
   ├─ Gateway: Texto válido?
   │     ├─ Sim → Continua
   │     └─ Não → Fim (status: ignored)
   │
   ├─ Tarefa 3 — Edge Function: Validar JWT + ownership do contato
   │     └─ Falha → 401/403 → Fim
   │
   ├─ Tarefa 4 — Edge Function: Combinar textos e chamar Lovable AI (Gemini Flash)
   │     │
   │     └─ Gateway: Resposta válida?
   │           ├─ Sim → Parse JSON
   │           └─ Não → Fallback (perfil indefinido confidence=40)
   │
   ├─ Tarefa 5 — Edge Function: Calcular blend code (primary, secondary)
   │
   ├─ Tarefa 6 — Sistema: Persistir em disc_analysis_history
   │
   ├─ Tarefa 7 — Sistema: Atualizar contacts.behavior com snapshot
   │
   ├─ Tarefa 8 — Sistema: Logar em disc_communication_logs
   │
   └─ Fim: Retornar análise estruturada para o frontend
```

### Regras de negócio
- **R1**: Análise só dispara para textos ≥ 100 caracteres (evita ruído)
- **R2**: Blend secundário só é registrado se score ≥ 40
- **R3**: Confiança < 50 marca o resultado como "indicativo, não definitivo"
- **R4**: Se Lovable AI retornar 402 (sem créditos), exibir alerta no dashboard admin
- **R5**: Histórico nunca é apagado — usado para timeline de evolução do perfil

### Pontos de atenção / riscos
- **🔴 Antes do hardening**: aceitava `userId` arbitrário no payload → impersonação
- **🟢 Depois**: `userId` vem do JWT, valida ownership do contato antes de gravar
- **⚠️ Custo**: cada análise consome ~2k tokens Gemini. Frequência alta de mensagens = custo proporcional. **Mitigação**: rate limit por usuário (próximo passo)
- **⚠️ Qualidade**: análise é melhor com 3+ mensagens consolidadas vs 1 mensagem isolada

### KPIs
| KPI | Meta | Como medir |
|---|---|---|
| Taxa de análise bem-sucedida | ≥ 95% | `(success / total) FROM disc_analysis_history WHERE created_at > now()-7d` |
| Confiança média | ≥ 70 | `AVG(confidence) FROM disc_analysis_history` |
| Tempo médio (p95) | ≤ 3s | log do edge function |
| Custo médio por análise | ≤ R$ 0,01 | tokens × tarifa Gemini |
| % vendedores que abrem o DISC | ≥ 80% | telemetria do `DISCEvolutionTimeline` |

### Automações sugeridas
- **Slack alert** quando confiança < 40 em conta-chave
- **Reanálise periódica**: a cada 30 dias se confiança < 60 e houve nova interação
- **Bundle de templates**: oferecer template de mensagem DISC-aware quando vendedor abrir composer

---

## 🏷️ POP 02 — Lux Intelligence: Enriquecimento 360º

### Objetivo
Coletar dados sociais, fiscais e de stakeholders sobre uma empresa/contato via workflow n8n, sem bloquear o usuário.

### Escopo
Botão "Lux Scan" disponível em fichas de contatos e empresas. Dispara processo assíncrono.

### Atores
- **Vendedor** (clica no botão Lux)
- **Edge Function** `lux-trigger` (cria registro + dispara n8n)
- **n8n workflow** (executa scraping, enriquecimento, IA)
- **Edge Function** `lux-webhook` (recebe resultado e atualiza)
- **Sistema** (auto-cria stakeholders detectados como contatos)

### Entradas
- `entityType: 'contact' | 'company'`
- `entityId: uuid`
- `entityData: object` (snapshot inicial)
- `webhookUrl: string?` (URL do n8n; default: env)

### Saídas
- Registro em `lux_intelligence` com status `processing` → `completed`
- `social_profiles`, `social_analysis`, `fiscal_data`, `stakeholders`, `audience_analysis`, `personal_profile`, `ai_report`, `ai_summary`
- Novos registros em `contacts` (stakeholders detectados)
- Atualização da entidade-mãe (campos derivados)

### Fluxo BPMN textual

```
Início: Vendedor clica em "Lux Scan" no contato/empresa
   │
   ├─ Tarefa 1 — Frontend: POST para lux-trigger com {entityType, entityId, entityData}
   │
   ├─ Tarefa 2 — lux-trigger: Validar JWT
   │     └─ Falha → 401 → Fim
   │
   ├─ Tarefa 3 — lux-trigger: INSERT em lux_intelligence (status='processing')
   │
   ├─ Tarefa 4 — lux-trigger: POST async para n8n webhook (fire-and-forget)
   │     │
   │     └─ Gateway: n8n acessível?
   │           ├─ Sim → Continua
   │           └─ Não → UPDATE status='error', error_message; Fim
   │
   ├─ Tarefa 5 — lux-trigger: Retorna 200 com luxRecordId pro frontend
   │
   ├─ Tarefa 6 — Frontend: Polling em useLuxIntelligence (5s)
   │
   ├─ === Em paralelo, n8n executa: ===
   │     ├─ Scraping LinkedIn (EnrichLayer)
   │     ├─ Scraping web (Firecrawl)
   │     ├─ Consulta CNPJ (Receita)
   │     ├─ Análise de áudio (ElevenLabs)
   │     └─ Síntese via LLM
   │
   ├─ Tarefa 7 — n8n: POST para lux-webhook com X-Lux-Secret + payload completo
   │
   ├─ Tarefa 8 — lux-webhook: Validar shared secret
   │     └─ Falha → 401 → Fim
   │
   ├─ Tarefa 9 — lux-webhook: UPDATE lux_intelligence com todos os campos
   │
   ├─ Gateway: Tem stakeholders novos?
   │     ├─ Sim → Tarefa 10: INSERT contacts para cada stakeholder
   │     └─ Não → Pular
   │
   ├─ Gateway: Tem entityUpdates?
   │     ├─ Sim → Tarefa 11: UPDATE companies/contacts
   │     └─ Não → Pular
   │
   └─ Fim: Frontend detecta status='completed' via polling, mostra relatório
```

### Regras de negócio
- **R1**: Apenas 1 análise Lux ativa por entidade simultaneamente (idempotência)
- **R2**: Se análise > 5 min sem completar, marcar como `timeout`
- **R3**: Stakeholders auto-criados são marcados com `source: 'lux_auto'` (revisão futura)
- **R4**: Custo estimado por análise ≥ R$ 0,50 — só admins e gerentes podem disparar (futuro)

### Pontos de atenção
- **🔴 Antes**: lux-webhook aceitava qualquer POST, qualquer um podia injetar dados arbitrários no `lux_intelligence`
- **🟢 Depois**: exige `X-Lux-Secret` validado por constant-time
- **⚠️ Latência**: análises podem demorar 30s-5min, depende de n8n e APIs externas
- **⚠️ Custo**: somar custo de Firecrawl + EnrichLayer + ElevenLabs + LLM por execução

### KPIs
| KPI | Meta |
|---|---|
| Taxa de conclusão (não-erro) | ≥ 90% |
| Tempo médio p95 | ≤ 90s |
| Stakeholders descobertos por scan | ≥ 3 |
| Custo médio por scan | ≤ R$ 1,00 |
| Vendas convertidas com Lux antes do contato | métrica de impacto |

### Automações sugeridas
- **Auto-Lux**: disparar automaticamente quando empresa for criada com receita > R$ 1M
- **Re-scan trimestral** para contas estratégicas
- **Dashboard de ROI** comparando taxa de fechamento com/sem Lux

---

## 🏷️ POP 03 — RFM: Segmentação de Clientes

### Objetivo
Calcular Recência, Frequência e Monetária de clientes a partir do `purchase_history` e segmentar em buckets acionáveis.

### Atores
- **Sistema** (cron diário) ou **Vendedor** (botão "Recalcular RFM")
- **Edge Function** `rfm-analyzer`

### Entradas
- `userId` (do JWT)
- `contactId?: uuid` (opcional — se omitido, recalcula todos do user)

### Saídas
- Registros em `rfm_analysis` (1 por contato) com scores R/F/M de 1-5 e segmento

### Fluxo BPMN textual

```
Início: Cron diário 03:00 OR vendedor clica "Recalcular RFM"
   │
   ├─ Tarefa 1 — Edge Function: Validar JWT (ou cron secret se cron)
   │
   ├─ Tarefa 2 — Edge Function: Buscar purchase_history WHERE user_id = ?
   │
   ├─ Para cada contato com compras:
   │     │
   │     ├─ Tarefa 3 — Calcular Recência (dias desde última compra)
   │     ├─ Tarefa 4 — Calcular Frequência (nº de compras nos últimos 365 dias)
   │     ├─ Tarefa 5 — Calcular Monetária (soma dos valores)
   │     ├─ Tarefa 6 — Atribuir scores 1-5 (quintis sobre a base)
   │     ├─ Tarefa 7 — Determinar segmento (Champions, Loyal, At Risk, Lost, etc)
   │     └─ Tarefa 8 — UPSERT rfm_analysis
   │
   └─ Fim: Retorna resumo (X contatos atualizados, distribuição por segmento)
```

### Segmentos padrão
| Segmento | R | F | M | Ação sugerida |
|---|---|---|---|---|
| **Champions** | 4-5 | 4-5 | 4-5 | Programa VIP, upsell premium |
| **Loyal Customers** | 3-5 | 3-5 | 3-5 | Manutenção, indicações |
| **Potential Loyalists** | 3-5 | 1-3 | 1-3 | Educação, cross-sell |
| **New Customers** | 4-5 | 1 | 1-3 | Onboarding intensivo |
| **At Risk** | 1-2 | 3-5 | 3-5 | Reativação urgente |
| **Cant Lose** | 1-2 | 4-5 | 4-5 | Recuperação personalizada |
| **Hibernating** | 1-2 | 1-2 | 1-2 | Campanha winback ou descarte |
| **Lost** | 1 | 1 | 1 | Arquivar |

### KPIs
| KPI | Meta |
|---|---|
| % de Champions | ≥ 15% |
| % At Risk | ≤ 10% |
| Taxa de reativação At Risk → Loyal (90d) | ≥ 25% |
| Receita média Champions vs Lost | razão ≥ 20× |

### Automações sugeridas
- **Alerta** quando contato cai de Loyal → At Risk (movimento de cluster)
- **Cadência automática** de email/WhatsApp baseada no segmento
- **Dashboard executivo** com migração mensal entre segmentos

---

## 🏷️ POP 04 — Health Alerts: Saúde do Relacionamento

### Objetivo
Monitorar sinais de degradação no relacionamento com contatos/empresas e alertar antes que vire churn.

### Atores
- **Edge Function** `check-health-alerts` (cron 6h em 6h)
- **Sistema** (avalia regras configuradas em `health_alert_settings`)
- **Vendedor** (recebe alerta no painel + push notification)

### Entradas
- Configurações em `health_alert_settings` (thresholds, canais, prioridades)
- Dados das tabelas: `interactions`, `contacts`, `companies`, `disc_analysis_history`

### Saídas
- Registros em `health_alerts` com severidade (`info` | `warning` | `critical`)
- Push notification (via `send-push-notification`)

### Regras de saúde (defaults)
| Regra | Threshold | Severidade |
|---|---|---|
| Sem interação há > 30 dias (cliente ativo) | 30d | warning |
| Sem interação há > 60 dias | 60d | critical |
| Sentimento médio últimas 5 interações negativo | < 0 | warning |
| Mudança brusca de DISC blend | qualquer | info |
| Cliente VIP sem follow-up agendado | 7d | critical |
| Aniversário do contato em ≤ 7 dias | 7d | info |
| Promessa não cumprida (`follow_up_required` vencido) | passou da data | critical |

### Fluxo BPMN textual

```
Início: Cron 6h/6h dispara check-health-alerts
   │
   ├─ Tarefa 1 — Validar X-Cron-Secret
   │
   ├─ Tarefa 2 — Buscar todos os usuários ativos
   │
   ├─ Para cada user:
   │     │
   │     ├─ Buscar configurações em health_alert_settings (com defaults se vazio)
   │     │
   │     ├─ Para cada regra ativada:
   │     │     ├─ Aplicar query correspondente sobre contacts/interactions
   │     │     ├─ Para cada match:
   │     │     │     ├─ Já existe alerta aberto desse tipo p/ esse contato? → pular
   │     │     │     ├─ INSERT health_alerts
   │     │     │     └─ Trigger send-push-notification (se priority ≥ warning)
   │     │     └─ Fim do loop
   │     │
   │     └─ Fim
   │
   └─ Fim: Retorna {usersProcessed, alertsCreated}
```

### KPIs
| KPI | Meta |
|---|---|
| Tempo médio entre criação de alerta crítico e resolução | ≤ 24h |
| % alertas críticos resolvidos < 48h | ≥ 90% |
| Falsos positivos (alerta resolvido sem ação) | ≤ 15% |
| Churn rate de contas com alerta crítico não tratado | medir e reduzir |

### Automações sugeridas
- **Escalation**: se alerta crítico não tratado em 48h, notificar gestor
- **Auto-tarefa**: criar `activity` automaticamente vinculada ao alerta
- **Resumo semanal**: digest de alertas no email do gestor (terças 8h)

---

## 🏷️ POP 05 — WhatsApp via Evolution API

### Objetivo
Receber/enviar mensagens WhatsApp pelo SINGU, com vinculação automática a contatos e análise DISC para mensagens longas.

### Atores
- **Cliente** (envia/recebe via WhatsApp)
- **Evolution API** (Baileys, instância wpp2)
- **Edge Function** `evolution-webhook` (recebe eventos)
- **Edge Function** `evolution-api` (envia mensagens via API)
- **Sistema** (vincula contato → cria interação → dispara DISC)

### Entradas
- Eventos WhatsApp: `messages.upsert`, `messages.update`, `connection.update`, `contacts.upsert`, `presence.update`, `call`, `send.message`

### Saídas
- Registros em `whatsapp_messages` (mensagem bruta)
- Registros em `interactions` (vinculadas ao contato)
- Atualizações em `whatsapp_instances` (status de conexão)
- Análises DISC automáticas para textos ≥ 100 chars

### Fluxo BPMN textual (caminho feliz: nova mensagem recebida)

```
Início: WhatsApp envia mensagem para o número conectado
   │
   ├─ Tarefa 1 — Evolution API: POST para evolution-webhook com payload + X-Evolution-Secret
   │
   ├─ Tarefa 2 — evolution-webhook: Validar shared secret
   │     └─ Falha → 401 → Fim
   │
   ├─ Tarefa 3 — Sistema: Extrair phoneNumber, sanitizar (sanitizePhone)
   │     └─ Inválido → Fim (status: ignored)
   │
   ├─ Tarefa 4 — Sistema: Determinar tipo de mensagem (texto/imagem/áudio/...)
   │
   ├─ Tarefa 5 — Sistema: findContactByPhone()
   │     │
   │     ├─ Existe local? → usar
   │     ├─ Existe no banco externo? → usar (com defaultUserId)
   │     └─ Não existe? → criar contato local "WhatsApp <phone>"
   │
   ├─ Tarefa 6 — Sistema: UPSERT em whatsapp_messages
   │
   ├─ Gateway: Mensagem é texto E ≥ 100 chars?
   │     │
   │     ├─ Sim → Tarefa 7: invoke disc-analyzer com service_role
   │     └─ Não → Pular
   │
   ├─ Tarefa 8 — Sistema: INSERT em interactions
   │
   └─ Fim: Retorna {status, contactId, source, analyzed}
```

### Regras de negócio
- **R1**: Sanitização de telefone obrigatória — evita injection no `.or()`
- **R2**: Mensagens de grupo (`@g.us`) são processadas mas marcadas
- **R3**: Mensagens de mim (`fromMe=true`) não disparam alertas, mas são salvas
- **R4**: Reações, presença e enquetes são logadas mas não criam interação
- **R5**: Áudios precisam passar por `voice-to-text` antes da análise DISC

### Pontos de atenção
- **🔴 Antes**: webhook aceitava qualquer POST → criação massiva de mensagens lixo
- **🟢 Depois**: validação de `X-Evolution-Secret`
- **⚠️ Performance**: cada mensagem dispara até 4 queries no banco — considerar batch

### KPIs
| KPI | Meta |
|---|---|
| Latência webhook→interaction | ≤ 500ms p95 |
| % mensagens vinculadas a contato | ≥ 95% |
| % mensagens analisadas DISC (das elegíveis) | ≥ 90% |
| Taxa de erro de processamento | ≤ 0,5% |

### Automações sugeridas
- **Bot de respostas frequentes** (FAQ baseado em interactions anteriores)
- **Auto-tag** de mensagens por intenção (compra, suporte, dúvida)
- **Resumo diário** de conversas para o vendedor (digest matinal)

---

## 🏷️ POP 06 — Bitrix24: Sincronização de Ligações

### Objetivo
Importar ligações telefônicas do Bitrix24 (VoxImplant) como interações no SINGU, vinculadas ao contato pelo telefone.

### Atores
- **Bitrix24 Telefonia** (origem do evento)
- **Edge Function** `bitrix24-webhook` (recebe e processa)
- **Sistema** (vincula contato + cria interação)

### Eventos suportados
- `ONVOXIMPLANTCALLEND` (VoxImplant nativo)
- `ONEXTERNALCALLFINISH` (PABX externo)
- `ONCRMCALLEND` (qualquer chamada CRM)

### Fluxo BPMN textual

```
Início: Ligação termina no Bitrix24
   │
   ├─ Tarefa 1 — Bitrix24: POST form-urlencoded ou JSON para bitrix24-webhook
   │                       com X-Bitrix-Secret no header
   │
   ├─ Tarefa 2 — Webhook: Validar shared secret
   │     └─ Falha → 401 → Fim
   │
   ├─ Tarefa 3 — Sistema: Detectar content-type, parsear payload
   │
   ├─ Tarefa 4 — Sistema: Verificar evento na lista válida
   │     └─ Não está → 200 {status: ignored}
   │
   ├─ Tarefa 5 — Sistema: sanitizePhone(data.PHONE_NUMBER)
   │     └─ Inválido → 200 {status: ignored, reason: invalid phone}
   │
   ├─ Tarefa 6 — Sistema: Buscar contato por phone OU whatsapp (.eq)
   │     └─ Não encontrado → 200 {status: skipped}
   │
   ├─ Tarefa 7 — Sistema: Calcular duração formatada e outcome
   │     │
   │     └─ Gateway: duration > 0?
   │           ├─ Sim → outcome = "Ligação completada", sentiment = neutral
   │           └─ Não → outcome = CALL_FAILED_REASON, sentiment = negative,
   │                    follow_up_required = true
   │
   ├─ Tarefa 8 — Sistema: INSERT interactions (type=call, tags=[bitrix24, auto-imported])
   │
   └─ Fim: 200 {status: success, interactionId, contactId, duration}
```

### Regras de negócio
- **R1**: Telefone no formato Brasil — remover prefixo 55 se length > 11
- **R2**: Ligações não atendidas marcam `follow_up_required = true` automaticamente
- **R3**: Áudio da ligação (`CALL_RECORD_URL`) é salvo em `audio_url` para reprodução posterior
- **R4**: Tag `auto-imported` permite filtrar ligações automáticas vs manuais

### KPIs
| KPI | Meta |
|---|---|
| % ligações vinculadas | ≥ 90% |
| Latência webhook→interaction | ≤ 300ms |
| Taxa de erro | ≤ 0,5% |
| % ligações com follow-up cumprido em 24h | ≥ 80% |

---

## 🏷️ POP 07 — Sistema de Insights Automáticos

### Objetivo
Gerar insights acionáveis a partir dos dados do CRM (padrões, anomalias, recomendações) periodicamente.

### Atores
- **Edge Function** `generate-insights` (cron diário)
- **Sistema** (analisa interactions, contacts, companies via IA)
- **Vendedor** (consome na página `/insights`)

### Tipos de insights
| Tipo | Trigger |
|---|---|
| **Oportunidade quente** | Contato com 3+ interações positivas em 7 dias |
| **Anomalia de comportamento** | Mudança brusca de sentimento/cadência |
| **Risco de churn** | Combinação RFM At Risk + sentimento negativo |
| **Padrão de fechamento** | Sequência de ações que precedeu vendas similares |
| **Cross-sell** | Cliente similar comprou produto X que esse não tem |

### Fluxo BPMN textual

```
Início: Cron diário 06:00 dispara generate-insights
   │
   ├─ Tarefa 1 — Validar cron secret
   │
   ├─ Tarefa 2 — Buscar usuários ativos
   │
   ├─ Para cada user:
   │     │
   │     ├─ Tarefa 3 — Coletar features dos últimos 30 dias
   │     │     (interações, sentimentos, RFM, DISC, alertas)
   │     │
   │     ├─ Tarefa 4 — Para cada regra de insight:
   │     │     ├─ Aplicar query SQL ou chamar IA com contexto
   │     │     └─ Se match → INSERT em insights
   │     │
   │     └─ Tarefa 5 — Notificar via push se insight crítico
   │
   └─ Fim
```

### KPIs
| KPI | Meta |
|---|---|
| Insights gerados por usuário/dia | 3-10 |
| Taxa de "útil" (feedback do vendedor) | ≥ 70% |
| Insights que geraram ação rastreável | ≥ 50% |
| Receita atribuída a insights | medir |

---

## 🏷️ POP 08 — Cadência de Contato

### Objetivo
Definir e executar cadências personalizadas (sequências de touchpoints) por contato.

### Atores
- **Vendedor** (configura cadência inicial)
- **Sistema** (executa próximos passos automaticamente ou propõe)
- **Edge Function** `smart-reminders` (cron horário)

### Entradas
- `contact_cadence`: { contact_id, sequence_id, current_step, next_action_at, status }
- Templates de cadência: Frio (D+0, D+3, D+7, D+14, D+30), Quente (D+0, D+1, D+2, D+5)

### Fluxo BPMN textual

```
Início: Vendedor escolhe template de cadência ao criar contato
   │
   ├─ Tarefa 1 — Sistema: INSERT contact_cadence (step=1, status=active)
   │
   ├─ Tarefa 2 — Cron horário (smart-reminders):
   │     │
   │     ├─ Buscar cadências com next_action_at <= now() AND status='active'
   │     │
   │     ├─ Para cada:
   │     │     ├─ Gerar tarefa em activities (vendedor executa manualmente)
   │     │     ├─ OU disparar mensagem automática (se template marcado como auto)
   │     │     │
   │     │     ├─ Avançar current_step
   │     │     ├─ Calcular next_action_at = now() + delay do próximo step
   │     │     └─ Se step > total_steps → status='completed'
   │     │
   │     └─ Fim
   │
   └─ Fim
```

### Regras
- **R1**: Cadência pausa automaticamente se contato responder (interaction.initiated_by='them')
- **R2**: Cadência pausa se cliente fechar negócio
- **R3**: Vendedor pode editar/avançar/pausar manualmente

### KPIs
| KPI | Meta |
|---|---|
| Taxa de conclusão de cadência | ≥ 80% |
| Taxa de resposta dentro da cadência | ≥ 30% |
| Conversão da cadência em oportunidade | ≥ 15% |

---

## 🏷️ POP 09 — Onboarding de Novo Usuário

### Objetivo
Garantir que todo novo vendedor configure perfil, importe contatos iniciais e ative integrações nos primeiros 30 minutos.

### Atores
- **Novo usuário** (autocadastro)
- **Sistema** (`OnboardingChecklist`, telemetria)

### Checklist (página `/onboarding`)

```
☐ 1. Completar perfil (nome, foto, role, timezone)
☐ 2. Conectar Google Calendar (opcional)
☐ 3. Importar primeiros 10 contatos (CSV ou WhatsApp)
☐ 4. Configurar instância WhatsApp (Evolution)
☐ 5. Definir 3 metas iniciais
☐ 6. Tour guiado pelas páginas principais
☐ 7. Criar primeira interação manual
```

### Fluxo BPMN textual

```
Início: Email de signup confirmado
   │
   ├─ Tarefa 1 — Sistema: Redireciona para /onboarding
   │
   ├─ Tarefa 2 — Sistema: Mostra OnboardingChecklist
   │
   ├─ Para cada item:
   │     ├─ Usuário completa
   │     └─ Sistema marca completo + telemetria
   │
   ├─ Gateway: Todos os items completos?
   │     ├─ Sim → Mostra celebração + redireciona /
   │     └─ Não → Continua exibindo no topo até completar
   │
   └─ Fim
```

### KPIs
| KPI | Meta |
|---|---|
| Taxa de conclusão de onboarding | ≥ 80% |
| Tempo médio até completar | ≤ 30 min |
| Drop-off por etapa | identificar e otimizar |
| Ativação (7d): usuários que criaram 5+ interações | ≥ 70% |

---

## 🏷️ POP 10 — Gestão de Oportunidades (Pipeline)

### Objetivo
Acompanhar deals do primeiro contato ao fechamento, com previsão e alertas de gargalo.

### Atores
- **Vendedor** (cria e move deals)
- **Sistema** (`useDealVelocity`, `ClosingScorePanel`)

### Estágios padrão
1. **Lead** (qualificação inicial)
2. **MQL** (Marketing Qualified Lead)
3. **SQL** (Sales Qualified Lead)
4. **Proposta** (orçamento enviado)
5. **Negociação**
6. **Fechado/Ganho** ou **Fechado/Perdido**

### Fluxo BPMN textual

```
Início: Lead entra (manual ou import ou form)
   │
   ├─ Tarefa 1 — Vendedor: Qualificar (BANT, MEDDIC ou similar)
   │     │
   │     └─ Gateway: Qualificado?
   │           ├─ Sim → Move para SQL
   │           └─ Não → Lead nurturing (cadência fria)
   │
   ├─ Tarefa 2 — Sistema: Calcular ClosingScore (probabilidade)
   │
   ├─ Tarefa 3 — Vendedor: Enviar proposta
   │
   ├─ Gateway: Cliente respondeu em 7 dias?
   │     ├─ Sim → Próximo step
   │     └─ Não → Health Alert "Proposta sem retorno"
   │
   ├─ Tarefa 4 — Negociação (loops)
   │     │
   │     └─ Sistema: Tracking de DealVelocity (dias por estágio)
   │
   └─ Gateway final:
         ├─ Ganho → Mover RFM, criar onboarding cliente
         └─ Perdido → Registrar motivo, programa winback
```

### KPIs
| KPI | Meta |
|---|---|
| Taxa de conversão Lead → Ganho | ≥ 5% |
| Velocidade média do pipeline | ≤ 30 dias |
| Win rate (Ganho / Total fechados) | ≥ 30% |
| Receita média por deal ganho | crescente |
| Forecast accuracy | ≥ 80% |

---

# 📌 Convenções globais

## Nomenclatura
- Tabelas: `snake_case` plural (`contacts`, `disc_analysis_history`)
- Colunas: `snake_case` (`first_name`, `created_at`)
- Funções edge: `kebab-case` (`disc-analyzer`)
- Componentes React: `PascalCase` (`DISCEvolutionTimeline`)

## Status padrão
| Status | Significado |
|---|---|
| `pendente` | Aguardando ação |
| `em_andamento` | Em execução |
| `concluído` | Finalizado com sucesso |
| `cancelado` | Cancelado pelo usuário |
| `expirado` | Passou do prazo sem ação |
| `erro` | Falha técnica |

## Prioridades
- **P0** — Bloqueia o usuário, resolver em horas
- **P1** — Impacta resultado, resolver em dias
- **P2** — Melhoria, resolver no sprint
- **P3** — Backlog

---

**Versão:** 1.0 — 2026-04-09
**Próxima revisão:** após implementação de cada módulo, registrar refinamentos
