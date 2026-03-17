# AUDITORIA COMPLETA DO SISTEMA SINGU - Março 2026

## Sumário Executivo

Auditoria exaustiva realizada em 17/03/2026 cobrindo **todas as camadas** do sistema SINGU:
- **26 Edge Functions** do Supabase analisadas
- **31 migrações SQL** do banco de dados revisadas
- **95+ React Hooks** auditados
- **14 páginas** da aplicação verificadas
- **7 integrações externas** mapeadas
- **50+ tabelas** do banco de dados inspecionadas

---

## ÍNDICE

1. [Segurança - Achados Críticos](#1-segurança---achados-críticos)
2. [Edge Functions - Análise Detalhada](#2-edge-functions---análise-detalhada)
3. [Banco de Dados - Schema e Integridade](#3-banco-de-dados---schema-e-integridade)
4. [React Hooks - Bugs e Performance](#4-react-hooks---bugs-e-performance)
5. [Páginas e Roteamento](#5-páginas-e-roteamento)
6. [APIs Externas - Integrações](#6-apis-externas---integrações)
7. [Resumo de Severidades](#7-resumo-de-severidades)
8. [Plano de Ação Recomendado](#8-plano-de-ação-recomendado)

---

## 1. SEGURANÇA - ACHADOS CRÍTICOS

### 1.1 CORS Wildcard em TODAS as Edge Functions (CRÍTICO)

**Afeta:** Todas as 26 edge functions
**Problema:** `Access-Control-Allow-Origin: "*"` habilitado universalmente
**Risco:** Permite ataques Cross-Origin de qualquer domínio. Sites maliciosos podem disparar chamadas API com credenciais do usuário.
**Correção:** Restringir para domínios específicos da aplicação.

### 1.2 Webhooks SEM Verificação de Assinatura (CRÍTICO)

**Afeta:**
- `supabase/functions/evolution-webhook/index.ts`
- `supabase/functions/bitrix24-webhook/index.ts`
- `supabase/functions/lux-webhook/index.ts`

**Problema:** Webhooks aceitam qualquer payload sem validação HMAC.
**Risco:** Atacantes podem injetar dados maliciosos, criar contatos falsos ou disparar operações sensíveis.
**Correção:** Implementar verificação HMAC-SHA256 com secret compartilhado.

### 1.3 SERVICE_ROLE_KEY Usado em Funções Expostas (CRÍTICO)

**Afeta:** 20+ edge functions (enrich-contacts, evolution-webhook, lux-webhook, send-push-notification, bitrix24-webhook, etc.)
**Problema:** Service role keys bypasam completamente as políticas RLS.
**Risco:** Se uma function for comprometida, acesso irrestrito ao banco inteiro.
**Correção:** Usar anon key + auth token para operações do usuário; service key apenas para jobs internos com validação adicional.

### 1.4 Credenciais de Banco Externo Expostas (CRÍTICO)

**Afeta:** enrich-contacts, evolution-webhook, external-data
**Problema:** `EXTERNAL_SUPABASE_URL` e `EXTERNAL_SUPABASE_SERVICE_ROLE_KEY` como env vars sem rotação.
**Risco:** Comprometimento total do banco externo se credenciais vazarem.
**Correção:** Usar Supabase Vault, implementar API gateway entre bancos.

### 1.5 Dados Sensíveis no localStorage (CRÍTICO)

**Afeta:** `src/lib/errorReporting.ts` (linhas 75, 106, 114, 201)
**Problema:** userId e logs de erro armazenados em localStorage, acessível via XSS.
**Correção:** Usar sessionStorage ou auth session do Supabase.

### 1.6 Sessão Armazenada em localStorage (MÉDIO-ALTO)

**Afeta:** `src/integrations/supabase/client.ts` (linha 13-14)
**Problema:** `auth: { storage: localStorage }` - tokens de sessão vulneráveis a XSS.
**Correção:** Considerar httpOnly cookies via custom auth adapter.

### 1.7 Faltam Headers de Segurança (MÉDIO)

**Afeta:** `index.html`
**Ausentes:**
- Content-Security-Policy (CSP)
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY
- Referrer-Policy
- Strict-Transport-Security

### 1.8 .env no Controle de Versão (MÉDIO)

**Afeta:** `.env` commitado com chaves Supabase
**Nota:** São chaves anon (publishable), risco menor, mas deveria estar em `.env.local`.

---

## 2. EDGE FUNCTIONS - ANÁLISE DETALHADA

### 2.1 Funções SEM Autenticação

| Função | Risco |
|--------|-------|
| `enrich-contacts` | Qualquer um pode disparar enriquecimento |
| `check-health-alerts` | Qualquer um pode gerar alertas |
| `check-notifications` | Qualquer um pode disparar verificação |
| `evolution-api` | Sem verificação de auth |
| `firecrawl-scrape` | Sem verificação de auth |

### 2.2 Validação de Input Ausente

| Função | Campo | Problema |
|--------|-------|----------|
| `ai-writing-assistant` | customContext, contact.hobbies | Prompt injection possível |
| `external-data` | filter.column | Nomes de coluna sem whitelist |
| `social-profile-scraper` | profileUrl | URL sem validação (SSRF) |
| `firecrawl-scrape` | url | URL sem validação (SSRF) |
| `enrichlayer-linkedin` | LinkedIn URL | Formato sem validação |
| `lux-trigger` | entityType, entityId | Valores sem validação |

### 2.3 Tratamento de Erros Deficiente

| Problema | Funções Afetadas |
|----------|-----------------|
| Falhas silenciosas em DB | check-health-alerts, check-notifications, smart-reminders |
| Null checks ausentes | check-notifications (linhas 51, 123), weekly-digest (linha 118) |
| Promise rejections não tratadas | evolution-webhook (linha 355), check-health-alerts (linha 242) |
| Mensagens genéricas "Erro desconhecido" | generate-insights, suggest-next-action, social-behavior-analyzer |
| Rate limit 429 sem retry/backoff | ai-writing-assistant (linha 192), disc-analyzer (linha 166) |

### 2.4 Performance das Edge Functions

| Problema | Função | Detalhe |
|----------|--------|---------|
| N+1 queries | smart-reminders | Para cada contato, query individual da última interação |
| Sync em webhooks | evolution-webhook | Chamada síncrona ao DB externo (linhas 112-159) |
| Sem paginação | rfm-analyzer | Carrega TODOS contatos + compras + interações na memória |
| Regex para dados estruturados | social-profile-scraper | Usa regex para parsear markdown |

### 2.5 Bug: Atribuição Não-Determinística de Usuário

**Arquivo:** `evolution-webhook/index.ts` (linha 142)
**Problema:** `profiles.limit(1)` retorna usuário aleatório para atribuição de contato.
**Impacto:** Contatos criados via WhatsApp podem ser atribuídos ao usuário errado.

---

## 3. BANCO DE DADOS - SCHEMA E INTEGRIDADE

### 3.1 Foreign Keys Ausentes (CRÍTICO)

| Tabela | Coluna | Problema |
|--------|--------|----------|
| `contact_relatives` | `contact_id` | SEM constraint REFERENCES - registros órfãos quando contato é deletado |
| `trigger_usage_history` | `contact_id` | SEM FK constraint - integridade referencial comprometida |
| `lux_intelligence` | `entity_id` | UUID sem FK - pode apontar para entidades inexistentes |
| `favorite_templates` | `template_id` | TEXT sem referência - templates órfãos possíveis |

**Correção Imediata:**
```sql
ALTER TABLE public.contact_relatives
ADD CONSTRAINT fk_contact_relatives_contact
FOREIGN KEY (contact_id) REFERENCES public.contacts(id) ON DELETE CASCADE;
```

### 3.2 Cascading Deletes Inconsistentes

| Relação | Comportamento Atual | Problema |
|---------|---------------------|----------|
| companies → contacts | ON DELETE SET NULL | Contatos perdem referência mas persistem |
| contacts → contact_relatives | SEM CASCADE | Registros órfãos no banco |
| contacts → whatsapp_messages | ON DELETE SET NULL | Mensagens órfãs |
| contacts → trigger_usage_history | SEM CASCADE | Histórico sem contato |

### 3.3 Índices Compostos Ausentes (Performance)

**Índices necessários para evitar N+1 queries:**

```sql
-- Análises por contato (timeline)
CREATE INDEX idx_disc_history_contact_date ON disc_analysis_history(contact_id, analyzed_at DESC);
CREATE INDEX idx_eq_history_contact_date ON eq_analysis_history(contact_id, analyzed_at DESC);
CREATE INDEX idx_cognitive_history_contact_date ON cognitive_bias_history(contact_id, analyzed_at DESC);
CREATE INDEX idx_vak_history_contact_date ON vak_analysis_history(contact_id, analyzed_at DESC);

-- Histórico de triggers
CREATE INDEX idx_trigger_usage_user_contact ON trigger_usage_history(user_id, contact_id, used_at DESC);

-- Mensagens WhatsApp por contato
CREATE INDEX idx_whatsapp_contact_time ON whatsapp_messages(contact_id, timestamp DESC);

-- Sugestões de ofertas
CREATE INDEX idx_offer_suggestions_contact_date ON offer_suggestions(contact_id, created_at DESC);
```

### 3.4 CHECK Constraints Ausentes

| Tabela | Campo | Constraint Necessário |
|--------|-------|-----------------------|
| `health_alert_settings` | critical_threshold, warning_threshold | `CHECK (critical_threshold > warning_threshold)` |
| `offer_suggestions` | confidence_score | `CHECK (confidence_score >= 0 AND confidence_score <= 100)` |
| `lux_intelligence` | entity_id | `NOT NULL` (é identificador core) |

### 3.5 RLS (Row Level Security) - Análise

**Status Geral:** Excelente (95% de cobertura)

- **48+ tabelas** com RLS habilitado
- Migração 20260314204440 hardened policies de `public` para `authenticated`
- Padrão consistente: `auth.uid() = user_id` em SELECT/INSERT/UPDATE/DELETE

**Gap identificado:**
- `disc_profile_config`: Permite TODOS os users autenticados verem TODAS as configs (intencional para dados de sistema, mas documentar)
- `contact_relatives`: RLS habilitado mas SEM FK constraint - risco de órfãos

### 3.6 Validação JSONB Ausente

Campos JSONB sem schema validation:
- `contacts.behavior` - sem validação de estrutura
- `contacts.life_events` - sem validação
- `social_profiles.education`, `experience` - sem validação
- `whatsapp_messages.metadata` - sem validação

**Risco:** Dados JSONB inválidos difíceis de migrar/consultar no futuro.

### 3.7 Type Safety: TypeScript ↔ SQL

**Discrepância encontrada:**
- `rfm_analysis.rfm_score`: Coluna GENERATED ALWAYS no SQL, mas TypeScript permite INSERT/UPDATE (deveria ser readonly)
- `contact_relatives`: TS mostra `Relationships: []` (vazio) quando deveria ter FK para contacts

---

## 4. REACT HOOKS - BUGS E PERFORMANCE

### 4.1 useAuth.tsx - Interceptação Global do Fetch (CRÍTICO)

**Arquivo:** `src/hooks/useAuth.tsx` (linhas 147-188)

**Problemas:**
- **Race condition:** Múltiplas instâncias do hook modificam `window.fetch` simultaneamente
- **Stale closure:** `setUser` e `setSession` não estão no dependency array do effect
- **Memory leak:** Flag `isHandling401Ref` pode ficar presa em `true` se componente desmonta durante request
- **Correção:** Usar biblioteca de interceptor (ex: ky, wretch) ou queue para tratar 401s serialmente

### 4.2 useRealtimeNotifications.ts - Race Condition (CRÍTICO)

**Arquivo:** `src/hooks/useRealtimeNotifications.ts` (linhas 59-110)

**Problemas:**
- Handlers `handleNewAlert`, `handleNewInsight`, `handleNewHealthAlert` incrementam `unreadCount` sem sincronização
- Dependency array (linha 211) inclui handlers que são recriados a cada render → re-subscribe constante
- Sem error handling para falhas de subscription

### 4.3 useContacts / useInteractions - Re-render Infinito (ALTO)

**Problema:** `fetchContacts()` no dependency array depende de `toast` (objeto instável que muda a cada render)
**Impacto:** Potencial loop infinito de re-renders
**Correção:** Memoizar callback com useCallback, estabilizar referência do toast

### 4.4 useDashboardStats.ts - Algoritmo O(n²) (ALTO)

**Arquivo:** `src/hooks/useDashboardStats.ts` (linhas 110-114)

**Problema:** Para cada contato, busca em `companies[]` com find() → O(n²)
**Com 100 contatos e 100 empresas:** 10.000 lookups
**Correção:** Criar Map de lookup: `const companyMap = new Map(companies.map(c => [c.id, c]))`

### 4.5 useVAKAnalysis / useMetaprogramAnalysis - Código Duplicado (ALTO)

**Problema:** Lógica de keyword-checking duplicada com 12 forEach loops separados cada
**Performance:** O(n²) - 500 palavras × 1000 predicados = 500.000 comparações
**Correção:** Extrair `useGenericKeywordAnalysis` com Set/Trie para lookups O(1)

### 4.6 useNLPAutoAnalysis.ts - Erros Não Tratados (ALTO)

**Problema:**
- Insert no banco (linha 97) sem validação de sucesso
- `analysisQueue` (Ref) não é limpa em caso de erro → fila trava
- Texto sem sanitização antes de salvar no banco

### 4.7 useNotifications.ts - Cleanup Ausente (MÉDIO)

**Problemas:**
- Interval chama 3 funções async a cada hora sem batching
- localStorage race condition entre abas
- Push subscription sem cleanup se permissão negada mid-flow

### 4.8 useFormDraft.ts - Memory Leak (MÉDIO)

**Problemas:**
- Debounce timeout dispara após unmount
- `form.watch()` subscription nunca é explicitamente cancelada
- localStorage sem handling de quota exceeded

### 4.9 useContactDetail.ts - Subscriptions Múltiplas (MÉDIO)

**Problema:** Cria subscriptions separadas para contacts, interactions, insights, alerts no mesmo canal
**Correção:** Consolidar em um único channel com múltiplos filtros

### 4.10 use-toast.ts - Listeners Acumulam (BAIXO)

**Problema:** Array `listeners` cresce indefinidamente conforme hooks montam/desmontam
**Correção:** Implementar cleanup de subscriber, considerar Context API

---

## 5. PÁGINAS E ROTEAMENTO

### 5.1 Pontos Fortes

- **Auth Protection:** Todas as 13 rotas protegidas com `RequireAuth` wrapper
- **Error Boundaries:** 1 root + 14 component-level boundaries
- **Lazy Loading:** 15+ componentes com code splitting
- **Virtualização:** `react-window` para listas >50 items (Contatos.tsx)
- **Acessibilidade:** aria-labels, aria-hidden, aria-pressed, role="group"
- **PWA:** Service worker cleanup, caching strategy, manifest

### 5.2 Problemas Identificados

| Área | Problema | Severidade |
|------|----------|------------|
| Error Reporting | `errorReporting.ts` só grava em localStorage, não envia para backend | Médio |
| CSP | Sem Content-Security-Policy em index.html | Médio |
| Virtual List | Tipagem do rowComponent pode ter issues (Contatos.tsx:503) | Baixo |
| Acessibilidade | Alguns botões icon-only podem faltar aria-label | Baixo |

### 5.3 Configuração de Build (vite.config.ts)

- PWA com Workbox precaching (limite 5MB por arquivo)
- Runtime caching para API Supabase
- HMR overlay desabilitado (bom para produção)
- Path alias configurado: `@` → `./src`

### 5.4 Query Caching (App.tsx)

```typescript
staleTime: 5 * 60 * 1000, // 5 minutos - adequado
refetchOnWindowFocus: false, // Evita refetch desnecessário
```

---

## 6. APIs EXTERNAS - INTEGRAÇÕES

### 6.1 Mapa de Integrações

| API/Serviço | Funções | Qualidade | Timeout | Retry | Cache | Rate Limit |
|-------------|---------|-----------|---------|-------|-------|------------|
| **Lovable AI Gateway** | 7 functions | BAIXA | ❌ | ❌ | ❌ | ❌ |
| **Firecrawl (Web Scraping)** | 3 functions | MÉDIA-BAIXA | ❌ | ❌ | ❌ | ❌ |
| **Evolution API (WhatsApp)** | 2 functions | MÉDIA | ❌ | ❌ | ❌ | ❌ |
| **EnrichLayer (LinkedIn)** | 1 function | BAIXA | ❌ | ❌ | ❌ | ❌ |
| **Bitrix24 CRM** | 1 function | MÉDIA-BAIXA | ✅ | ❌ | ❌ | ❌ |
| **Supabase Externo** | 2 functions | MÉDIA | ✅ | ❌ | ❌ | ❌ |
| **Push Notifications** | 1 function | BAIXA | ✅ | ❌ | ❌ | ❌ |

### 6.2 Problemas Comuns a TODAS as Integrações

1. **Sem timeout** em chamadas fetch (podem travar indefinidamente)
2. **Sem retry** com exponential backoff em falhas transientes
3. **Sem cache** de resultados (chamadas repetidas ao mesmo recurso)
4. **Sem rate limiting** do lado do cliente
5. **CORS wildcard** em todas as functions

### 6.3 Lovable AI Gateway (7 funções)

**Funções:** ai-writing-assistant, disc-analyzer, generate-insights, smart-reminders, social-behavior-analyzer, suggest-next-action, voice-to-text

**Problemas específicos:**
- Response parsing assume estrutura específica sem validação
- Bearer token em header HTTP (depende apenas de HTTPS)
- Rate limit 429 detectado mas sem implementação de retry

### 6.4 Evolution API / WhatsApp (2 funções)

**Problemas específicos:**
- Phone number parsing frágil com múltiplas regex operations (linhas 78-89)
- Webhook processing síncrono com DB externo → latência
- **BUG:** Contato criado via webhook atribuído a usuário aleatório (`profiles.limit(1)`)

### 6.5 Firecrawl Web Scraping (3 funções)

**Problemas específicos:**
- **SSRF risk:** URLs do usuário passadas diretamente sem validação
- Markdown parsing com regex frágil (quebra se layout muda)
- Sem cache de perfis já scraped

### 6.6 Bitrix24 CRM (1 função)

**Problemas específicos:**
- **Sem verificação de assinatura** do webhook
- Phone number parsing assume formato brasileiro
- Detecção de resultado de chamada usa `duration=0` como "não atendida" (não confiável)

### 6.7 Push Notifications

**Problemas específicos:**
- VAPID public key hardcoded no código
- Implementação Web Push simplificada/incompleta
- Comentário no código: "For production, consider using a library like web-push"

---

## 7. RESUMO DE SEVERIDADES

### CRÍTICO (Corrigir Imediatamente) - 12 itens

1. CORS wildcard em todas as 26 edge functions
2. Webhooks sem verificação de assinatura (Evolution, Bitrix24, Lux)
3. SERVICE_ROLE_KEY em 20+ functions expostas
4. Credenciais de banco externo sem proteção adequada
5. Dados sensíveis em localStorage (userId, logs)
6. contact_relatives sem FK constraint (registros órfãos)
7. trigger_usage_history sem FK constraint
8. lux_intelligence com entity_id sem referência
9. useAuth.tsx race condition na interceptação de fetch
10. useRealtimeNotifications race condition em handlers
11. Funções sem autenticação (enrich-contacts, check-health-alerts, etc.)
12. Bug: atribuição não-determinística de usuário em evolution-webhook

### ALTO (Corrigir Esta Semana) - 10 itens

1. Validação de input ausente em URLs, colunas, phones
2. Sem timeout em chamadas fetch externas
3. Algoritmo O(n²) em useDashboardStats
4. Código duplicado em useVAKAnalysis/useMetaprogramAnalysis
5. Erros não tratados em useNLPAutoAnalysis
6. Cascading deletes inconsistentes no schema
7. Índices compostos ausentes (N+1 queries)
8. Re-render infinito potencial em useContacts/useInteractions
9. SSRF possível em firecrawl-scrape e social-profile-scraper
10. Sem rate limiting em nenhuma edge function

### MÉDIO (Corrigir Este Mês) - 12 itens

1. CSP e security headers ausentes
2. Sessão em localStorage (vs httpOnly cookies)
3. .env commitado no repositório
4. Error reporting só local (sem backend)
5. CHECK constraints ausentes no banco
6. JSONB sem schema validation
7. useNotifications cleanup deficiente
8. useFormDraft memory leak
9. useContactDetail subscriptions múltiplas
10. Sem audit logging
11. Sem webhook idempotency
12. Generated columns mutáveis no TypeScript

### BAIXO (Débito Técnico) - 8 itens

1. use-toast listeners acumulando
2. useReducedMotion inicialização duplicada
3. usePrefetch Set nunca limpo
4. useSidebarState sem cross-tab sync
5. Naming inconsistente de TIMESTAMPTZ
6. Documentação de lifecycle de dados ausente
7. Virtual list typing issues
8. Botões icon-only sem aria-label

---

## 8. PLANO DE AÇÃO RECOMENDADO

### Fase 1: Segurança Crítica (1 semana)

- [ ] Restringir CORS para domínios específicos em todas as edge functions
- [ ] Implementar verificação HMAC nos webhooks (Evolution, Bitrix24, Lux)
- [ ] Adicionar autenticação em: enrich-contacts, check-health-alerts, check-notifications
- [ ] Remover userId do localStorage em errorReporting.ts
- [ ] Adicionar FK constraints em contact_relatives, trigger_usage_history
- [ ] Corrigir bug de atribuição de usuário em evolution-webhook
- [ ] Implementar validação de input (URLs, colunas, phones)

### Fase 2: Estabilidade (2-4 semanas)

- [ ] Adicionar timeouts (5-30s) em todas as chamadas fetch externas
- [ ] Implementar retry com exponential backoff para rate limits
- [ ] Corrigir race conditions em useAuth.tsx e useRealtimeNotifications
- [ ] Refatorar useDashboardStats para O(n) com Map lookup
- [ ] Consolidar useVAKAnalysis/useMetaprogramAnalysis em hook genérico
- [ ] Adicionar índices compostos ao banco de dados
- [ ] Implementar SSRF protection (whitelist de domínios)
- [ ] Adicionar error handling em useNLPAutoAnalysis

### Fase 3: Performance e Qualidade (1-2 meses)

- [ ] Implementar caching para dados de perfis sociais
- [ ] Adicionar rate limiting nas edge functions
- [ ] Implementar CSP e security headers
- [ ] Adicionar webhook idempotency keys
- [ ] Migrar error reporting para backend real
- [ ] Adicionar audit logging
- [ ] Corrigir TypeScript types para generated columns (readonly)
- [ ] Adicionar JSONB schema validation

### Fase 4: Compliance e Long-term (Ongoing)

- [ ] Política de retenção de dados (LGPD/GDPR)
- [ ] Mecanismo de exclusão de dados (LGPD)
- [ ] Monitoramento e alertas de segurança
- [ ] Testes de penetração regulares
- [ ] Rotação periódica de credenciais

---

## MÉTRICAS DA AUDITORIA

| Métrica | Valor |
|---------|-------|
| Edge Functions analisadas | 26/26 (100%) |
| Migrações SQL revisadas | 31/31 (100%) |
| React Hooks auditados | 95+ |
| Páginas verificadas | 14/14 (100%) |
| Tabelas inspecionadas | 50+ |
| Integrações externas mapeadas | 7 |
| Issues CRÍTICOS encontrados | 12 |
| Issues ALTOS encontrados | 10 |
| Issues MÉDIOS encontrados | 12 |
| Issues BAIXOS encontrados | 8 |
| **Total de issues** | **42** |
| Cobertura RLS | 95% (excelente) |
| Cobertura Error Boundaries | 85% (bom) |
| Auth Protection em rotas | 100% (excelente) |

---

*Relatório gerado em 17/03/2026 - Auditoria completa do repositório SINGU*
