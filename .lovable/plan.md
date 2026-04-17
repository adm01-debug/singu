
Análise rápida do estado atual:

**Já existe** (visto em memórias e código):
- `useEdgeFunctionActions.ts`: `enrichLinkedIn` (EnrichLayer), `firecrawlScrape`, `scrapeProfile`, `analyzeSocialBehavior`, `detectSocialEvents`
- `mem://features/data-enrichment-architecture` — Firecrawl + EnrichLayer
- `mem://features/lux-intelligence-module` — varredura profunda (redes sociais, CNPJ, stakeholders)
- `mem://features/intent-data-module` — pixel first-party + signals 10 tipos + scores 0-100 (cobre buying signals + visitor identification)
- `mem://features/lead-scoring-system` — 4 dimensões com Intent
- `mem://features/companies-management-and-visualization` — CompanyEnrichedCard com view 360°
- `mem://features/contacts-management-and-intelligence-details` — 117 colunas, intelligence hooks
- LGPD compliance module

**Cobertura por item pedido:**
| Pedido | Status |
|---|---|
| Auto-enrichment de leads | ✅ EnrichLayer + Firecrawl + Lux |
| Company intelligence (funding/headcount/tech) | ✅ Firecrawl + Lux + view companies_completo |
| Buying signals (intent/news) | ✅ Intent Data Module |
| People intelligence (job changes) | ⚠️ Lux detecta eventos sociais, mas falta tracking estruturado de mudanças |
| Website visitor identification | ✅ Pixel first-party do Intent Module |
| Email finder/verifier | ❌ **Gap real** — não existe |
| Phone validation | ⚠️ Só validação de formato (min 8 dígitos), sem verificação de linha ativa |

**Conclusão:** 5 de 7 itens já estão prontos. Os 2 gaps reais são **Email Finder/Verifier** e **Phone Validation server-side**. Não vou recriar o que existe — implemento apenas os gaps + um hub unificador.

## Plano: Email Finder/Verifier + Phone Validation + Hub de Enriquecimento

### 1. Schema (migração)
- `email_verifications` — email, status (valid/invalid/risky/unknown/catchall), score 0-100, mx_found, smtp_check, disposable, role_account, free_provider, verified_at, provider, raw, contact_id, user_id + RLS
- `phone_validations` — phone_e164, status (valid/invalid/unreachable/unknown), line_type (mobile/landline/voip), country, carrier, is_active, validated_at, provider, raw, contact_id, user_id + RLS
- `email_finder_results` — domain, full_name, email_found, confidence 0-100, sources jsonb, contact_id, user_id + RLS
- `people_intelligence_events` — contact_id, event_type (job_change/promotion/company_change/title_change), old_value, new_value, source, detected_at, user_id + RLS
- Índices em `(user_id, contact_id)`, `(email)`, `(phone_e164)`

### 2. Edge Functions (3 novas, padrão Deno.serve + JWT + rate-limit + Zod)
- `email-verifier` — heurística local (regex, MX lookup via DNS, blocklist disposable, role accounts) + persistência em `email_verifications`. Sem provider externo (gratuito).
- `email-finder` — recebe `{firstName, lastName, domain}` → gera permutações comuns (first.last@, first@, f.last@, etc.) → valida cada uma via `email-verifier` → retorna a de maior score
- `phone-validator` — usa `libphonenumber-js` (já no projeto provavelmente, senão adiciono) para parsing + validação de formato/país/tipo de linha. Persiste em `phone_validations`.
- Trigger DB: ao inserir contato com email/phone → enfileira validação automática (via `pg_cron` chamando edge function batch a cada 5min)

### 3. People Intelligence (job changes)
- Edge function `people-intel-detector` — compara snapshot atual de `role_title`/`company_id` do contato com último em `people_intelligence_events`. Se diferente, registra evento.
- Trigger em `contacts` UPDATE: quando `role_title` ou `company_id` mudam, insere automaticamente em `people_intelligence_events`.
- Hook `usePeopleIntelligenceEvents(contactId)` para timeline na UI.

### 4. Hooks (TanStack Query, sem useEffect)
- `useEmailVerification(email)` — staleTime 24h
- `usePhoneValidation(phone)` — staleTime 7d
- `useEmailFinder()` — mutation
- `useEnrichmentActions()` — wraps invocações (verify, find, validate-phone, detect-people-changes)
- `usePeopleIntelligenceEvents(contactId)` — staleTime 1h

### 5. UI
- **Hub `/enrichment`** (rota lazy + sidebar item "Enriquecimento" abaixo de Lead Scoring)
  - 4 cards: Email Verifier, Email Finder, Phone Validator, People Intel feed
  - Stats: total verificados, % válidos, créditos gastos, últimas detecções
- **`EmailVerifierWidget`** — input email → badge status + score + razões
- **`EmailFinderWidget`** — inputs nome+domínio → lista emails encontrados ranqueados
- **`PhoneValidatorWidget`** — input phone → tipo linha, país, carrier
- **`PeopleIntelTimeline`** — feed cronológico de mudanças
- **Integração em ContatoDetalhe.tsx**: badge de validação ao lado de email/phone + accordion "People Intelligence" mostrando histórico
- **Botão "Validar tudo"** em ContatoDetalhe que dispara verify+phone-validate em paralelo

### 6. pg_cron (background sweep)
- Job diário 04:00 UTC: revalida emails com `verified_at < now() - 30d`
- Job diário 04:30 UTC: roda `people-intel-detector` em batch para contatos modificados nas últimas 24h

### 7. Memória
- Criar `mem://features/email-phone-validation-suite`
- Criar `mem://features/people-intelligence-tracking`
- Atualizar `mem://index.md` adicionando os dois novos itens

### 8. Validação E2E
- Criar contato teste com email "test@gmail.com" + phone "+5511999999999"
- Disparar email-verifier → conferir status `valid`, score, mx_found
- Disparar email-finder com "João Silva" + "acme.com" → conferir permutações
- Disparar phone-validator → conferir line_type=mobile, country=BR
- Atualizar role_title do contato → conferir trigger insere evento
- Abrir hub `/enrichment` e validar widgets renderizando

### Não fazer
- Não recriar Lux Intelligence, Intent Module, EnrichLayer, Firecrawl ou companies_completo (já existem e cobrem auto-enrichment, company intel, buying signals, visitor ID)
- Não usar APIs pagas (Clearbit/Apollo/ZoomInfo/Hunter) — implementação 100% server-side com heurísticas + DNS + libphonenumber, gratuita e sem dependência externa
- Não criar produtos/propostas
- Não tocar em `src/integrations/supabase/client.ts` ou `types.ts`
