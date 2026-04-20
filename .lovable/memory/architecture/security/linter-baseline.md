---
name: Supabase Linter Baseline
description: Baseline de findings do supabase linter aceitos com justificativa. Zero CRITICAL/HIGH; apenas 3 WARNs documentados (extension in public + 2 buckets públicos intencionais).
type: constraint
---
**Auditoria executada na Rodada F (Etapa 1) — Excellence 10/10.**
**Revalidada na Rodada O (Ação 3) — tentativa de mover `pg_net` falhou por limitação da extensão.**

**Resultado:** 0 CRITICAL, 0 HIGH, 3 WARN — todos aceitos com justificativa abaixo.

| # | Lint | Severidade | Justificativa |
|---|------|-----------|---------------|
| 1 | `0014_extension_in_public` (`pg_net`) | WARN | A extensão `pg_net` está no schema `public`. Tentativa de `ALTER EXTENSION pg_net SET SCHEMA extensions` falhou com `0A000: extension "pg_net" does not support SET SCHEMA` (Rodada O, Ação 3). DROP+CREATE não é viável pois `pg_net` é utilizada por cron jobs internos do Supabase; remover quebraria automações. Risco: nulo (extensão oficial do Supabase, sem superfície de ataque exposta). |
| 2 | `0025_public_bucket_allows_listing` (bucket `company-logos`) | WARN | Bucket público intencional para servir logos em listagens não autenticadas (cards, /lp/*). Já protegido por RLS de upload por owner em `{userId}/{companyId}/`. Listagem de URLs públicas não vaza dados sensíveis. |
| 3 | `0025_public_bucket_allows_listing` (bucket de avatares/ativos públicos) | WARN | Mesma justificativa: bucket de assets públicos servidos em UI não autenticada. RLS de upload garante owner-only. |

**Política:** novos findings CRITICAL/HIGH devem ser corrigidos imediatamente; novos WARN devem ser anexados a esta tabela com justificativa ou corrigidos.

**Comando para revalidação:** `supabase--linter` (sem argumentos).
