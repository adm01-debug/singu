---
name: Supabase Linter Baseline
description: Baseline de findings do supabase linter aceitos com justificativa. Zero CRITICAL/HIGH; apenas 3 WARNs documentados (extension in public + 2 buckets públicos intencionais).
type: constraint
---
**Auditoria executada na Rodada F (Etapa 1) — Excellence 10/10.**

**Resultado:** 0 CRITICAL, 0 HIGH, 3 WARN — todos aceitos com justificativa abaixo.

| # | Lint | Severidade | Justificativa |
|---|------|-----------|---------------|
| 1 | `0014_extension_in_public` | WARN | A extensão `unaccent` está no schema `public` para suportar `immutable_unaccent()` (usada por `search_contacts_unaccent`/`search_companies_unaccent`/`search_interactions_unaccent`). Migrar para schema `extensions` quebraria o `set search_path = public` das funções. Risco: nulo (extensão padrão Postgres). |
| 2 | `0025_public_bucket_allows_listing` (bucket `company-logos`) | WARN | Bucket público intencional para servir logos em listagens não autenticadas (cards, /lp/*). Já protegido por RLS de upload por owner em `{userId}/{companyId}/`. Listagem de URLs públicas não vaza dados sensíveis. |
| 3 | `0025_public_bucket_allows_listing` (bucket de avatares/ativos públicos) | WARN | Mesma justificativa: bucket de assets públicos servidos em UI não autenticada. RLS de upload garante owner-only. |

**Política:** novos findings CRITICAL/HIGH devem ser corrigidos imediatamente; novos WARN devem ser anexados a esta tabela com justificativa ou corrigidos.

**Comando para revalidação:** `supabase--linter` (sem argumentos).
