
User wants autonomous execution. Roadmap 2.x ainda tem 2 itens grandes:
- 2.4 Lead Scoring Comportamental server-side (parcial — falta persistência server, decay, triggers)
- 2.6 Intent Data (zero — falta tabela, pixel first-party, aggregator, UI)

ABM acabou. Próximo lógico = Intent Data (mais novo, fecha o tripé Score+ABM+Intent). Lead Scoring server-side vem depois.

## Plano: Intent Data Module

### 1. Schema (migration)
- `intent_signals`: id, user_id, contact_id (nullable), company_id (nullable), external_company_id, signal_type ('page_view'|'email_open'|'email_click'|'form_submit'|'content_download'|'pricing_view'|'demo_request'|'social_engagement'|'search_query'|'competitor_mention'), signal_source, signal_value jsonb, weight int (1-10), occurred_at, created_at. Indexes em (user_id, occurred_at desc), (contact_id), (external_company_id), (signal_type)
- `intent_scores`: id, user_id, scope ('contact'|'account'), scope_id text, intent_score int (0-100), score_trend ('rising'|'stable'|'falling'), signal_count_30d int, top_signals jsonb, computed_at. Unique(user_id, scope, scope_id)
- `intent_tracking_pixels`: id, user_id, pixel_key text unique, domain text, active bool, created_at — para identificar fonte
- RLS por user_id, audit em intent_signals

### 2. Edge Functions
- **`intent-tracker`** (verify_jwt=false, público): recebe POST do pixel `{ pixel_key, signal_type, url, referrer, contact_email?, utm }`, valida pixel, registra em `intent_signals`. CORS aberto.
- **`intent-aggregator`**: agrega últimos 30d por contact/account → score (weighted sum normalizado), tendência (compara janela 0-15 vs 15-30), top 5 signals. Persiste em `intent_scores`. Cron diário + on-demand.
- **`intent-pixel-snippet`** (GET): retorna JS minificado do pixel parametrizado.

### 3. Hooks `src/hooks/useIntent.ts`
- `useIntentSignals(filters)`, `useIntentScore(scope, id)`, `useTopIntentAccounts()`, `useGeneratePixel`, `useTrackingPixels`, `useRefreshIntent`

### 4. UI
- **`/intent`**: hub com 4 KPIs (sinais 24h/7d, contas hot, score médio), tabela "Hot Accounts" ordenada por intent_score com trend badge, filtros por signal_type/período
- **`/intent/setup`**: gera pixel, mostra snippet `<script>` para copiar, lista domínios ativos
- **Widget `IntentSignalCard`**: usado em ContatoDetalhe e EmpresaDetalhe mostrando score + top signals
- Componentes em `src/components/intent/`: `IntentScoreBadge`, `IntentSignalsTimeline`, `HotAccountsTable`, `PixelSetupCard`, `IntentTrendChart` (recharts)

### 5. Integração ABM
- Bonus signals do intent já alimentam score de account quando rodar `abm-account-scorer` (intent dimension)

### 6. Navegação
- Sidebar: novo item "Intent Data" (ícone Radar) abaixo de ABM
- Rotas `/intent` e `/intent/setup` em App.tsx

### 7. Memória
- `mem://features/intent-data-module` + atualizar índice

### Não fazer
- Não criar tabela `products`/`proposals`
- Não tocar em ABM/Territory/Sequences existentes além de leitura
- Não implementar 3rd-party intent providers (Bombora/G2) — só first-party agora
