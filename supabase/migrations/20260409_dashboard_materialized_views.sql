-- ============================================================================
-- SINGU CRM — Materialized Views + Queries de Dashboard
-- Migration 2026-04-09 — KPIs e dashboards de gestão por processos
--
-- Aplicar via SQL Editor do Supabase Dashboard:
-- https://supabase.com/dashboard/project/rqodmqosrotmtrjnnjul/sql/new
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. mv_user_weekly_stats — métricas semanais por vendedor
-- ----------------------------------------------------------------------------
DROP MATERIALIZED VIEW IF EXISTS public.mv_user_weekly_stats CASCADE;

CREATE MATERIALIZED VIEW public.mv_user_weekly_stats AS
SELECT
  user_id,
  date_trunc('week', created_at) AS week,
  COUNT(*) AS total_interactions,
  COUNT(DISTINCT contact_id) AS unique_contacts,
  COUNT(*) FILTER (WHERE type = 'call') AS calls,
  COUNT(*) FILTER (WHERE type = 'whatsapp') AS whatsapp_msgs,
  COUNT(*) FILTER (WHERE type = 'email') AS emails,
  COUNT(*) FILTER (WHERE type = 'meeting') AS meetings,
  COUNT(*) FILTER (WHERE type = 'note') AS notes,
  COUNT(*) FILTER (WHERE follow_up_required = true) AS followups_created,
  COUNT(*) FILTER (WHERE sentiment = 'positive') AS positive_count,
  COUNT(*) FILTER (WHERE sentiment = 'negative') AS negative_count,
  COUNT(*) FILTER (WHERE sentiment = 'neutral') AS neutral_count,
  ROUND(
    AVG(CASE
      WHEN sentiment = 'positive' THEN 1.0
      WHEN sentiment = 'negative' THEN -1.0
      ELSE 0.0
    END)::numeric,
    3
  ) AS avg_sentiment_score,
  COUNT(*) FILTER (WHERE initiated_by = 'us') AS outbound_count,
  COUNT(*) FILTER (WHERE initiated_by = 'them') AS inbound_count
FROM public.interactions
WHERE created_at >= now() - interval '90 days'
GROUP BY user_id, date_trunc('week', created_at);

CREATE UNIQUE INDEX idx_mv_user_weekly_stats_pk
  ON public.mv_user_weekly_stats (user_id, week);

CREATE INDEX idx_mv_user_weekly_stats_week
  ON public.mv_user_weekly_stats (week DESC);

COMMENT ON MATERIALIZED VIEW public.mv_user_weekly_stats IS
'Stats agregados semanais por user. Refresh nightly via pg_cron. Janela: 90 dias.';

-- ----------------------------------------------------------------------------
-- 2. mv_rfm_distribution — distribuição RFM por user e segmento
-- ----------------------------------------------------------------------------
DROP MATERIALIZED VIEW IF EXISTS public.mv_rfm_distribution CASCADE;

CREATE MATERIALIZED VIEW public.mv_rfm_distribution AS
SELECT
  user_id,
  segment,
  COUNT(*) AS contact_count,
  SUM(monetary_value) AS total_value,
  AVG(monetary_value) AS avg_value,
  AVG(frequency_count) AS avg_frequency,
  AVG(recency_days) AS avg_recency_days,
  MAX(calculated_at) AS last_calculated
FROM public.rfm_analysis
GROUP BY user_id, segment;

CREATE UNIQUE INDEX idx_mv_rfm_distribution_pk
  ON public.mv_rfm_distribution (user_id, segment);

COMMENT ON MATERIALIZED VIEW public.mv_rfm_distribution IS
'Distribuição RFM por user e segmento. Refresh nightly.';

-- ----------------------------------------------------------------------------
-- 3. mv_pipeline_funnel — funil de pipeline por user e estágio
-- ----------------------------------------------------------------------------
-- Pressupõe tabela contacts com coluna relationship_stage
DROP MATERIALIZED VIEW IF EXISTS public.mv_pipeline_funnel CASCADE;

CREATE MATERIALIZED VIEW public.mv_pipeline_funnel AS
SELECT
  user_id,
  COALESCE(relationship_stage, 'unknown') AS stage,
  COUNT(*) AS contact_count,
  AVG(relationship_score) AS avg_score,
  COUNT(*) FILTER (WHERE updated_at > now() - interval '30 days') AS active_30d
FROM public.contacts
GROUP BY user_id, COALESCE(relationship_stage, 'unknown');

CREATE UNIQUE INDEX idx_mv_pipeline_funnel_pk
  ON public.mv_pipeline_funnel (user_id, stage);

-- ----------------------------------------------------------------------------
-- 4. mv_health_alerts_summary — alertas abertos por user e severidade
-- ----------------------------------------------------------------------------
DROP MATERIALIZED VIEW IF EXISTS public.mv_health_alerts_summary CASCADE;

CREATE MATERIALIZED VIEW public.mv_health_alerts_summary AS
SELECT
  user_id,
  severity,
  COUNT(*) AS open_count,
  COUNT(*) FILTER (WHERE created_at > now() - interval '7 days') AS new_7d,
  AVG(EXTRACT(EPOCH FROM (resolved_at - created_at))/3600)::numeric(10,2) AS avg_resolution_hours
FROM public.health_alerts
WHERE resolved_at IS NULL OR resolved_at > now() - interval '30 days'
GROUP BY user_id, severity;

CREATE UNIQUE INDEX idx_mv_health_alerts_summary_pk
  ON public.mv_health_alerts_summary (user_id, severity);

-- ----------------------------------------------------------------------------
-- 5. mv_disc_distribution — distribuição DISC dos contatos por user
-- ----------------------------------------------------------------------------
DROP MATERIALIZED VIEW IF EXISTS public.mv_disc_distribution CASCADE;

CREATE MATERIALIZED VIEW public.mv_disc_distribution AS
WITH latest_disc AS (
  SELECT DISTINCT ON (contact_id)
    user_id,
    contact_id,
    primary_profile,
    blend_profile,
    confidence
  FROM public.disc_analysis_history
  ORDER BY contact_id, created_at DESC
)
SELECT
  user_id,
  primary_profile,
  COUNT(*) AS contact_count,
  AVG(confidence) AS avg_confidence
FROM latest_disc
WHERE primary_profile IS NOT NULL
GROUP BY user_id, primary_profile;

CREATE UNIQUE INDEX idx_mv_disc_distribution_pk
  ON public.mv_disc_distribution (user_id, primary_profile);

-- ----------------------------------------------------------------------------
-- 6. RLS nas materialized views (acesso só ao próprio user_id)
-- ----------------------------------------------------------------------------
-- Postgres não suporta RLS direto em MV, então criamos VIEWS por cima:

CREATE OR REPLACE VIEW public.v_my_weekly_stats AS
SELECT * FROM public.mv_user_weekly_stats WHERE user_id = auth.uid();

CREATE OR REPLACE VIEW public.v_my_rfm_distribution AS
SELECT * FROM public.mv_rfm_distribution WHERE user_id = auth.uid();

CREATE OR REPLACE VIEW public.v_my_pipeline_funnel AS
SELECT * FROM public.mv_pipeline_funnel WHERE user_id = auth.uid();

CREATE OR REPLACE VIEW public.v_my_health_alerts_summary AS
SELECT * FROM public.mv_health_alerts_summary WHERE user_id = auth.uid();

CREATE OR REPLACE VIEW public.v_my_disc_distribution AS
SELECT * FROM public.mv_disc_distribution WHERE user_id = auth.uid();

-- Garantir que as views são lidas pelo authenticated role
GRANT SELECT ON public.v_my_weekly_stats TO authenticated;
GRANT SELECT ON public.v_my_rfm_distribution TO authenticated;
GRANT SELECT ON public.v_my_pipeline_funnel TO authenticated;
GRANT SELECT ON public.v_my_health_alerts_summary TO authenticated;
GRANT SELECT ON public.v_my_disc_distribution TO authenticated;

-- ----------------------------------------------------------------------------
-- 7. Função de refresh — chamada por pg_cron
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.refresh_dashboard_materialized_views()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_user_weekly_stats;
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_rfm_distribution;
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_pipeline_funnel;
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_health_alerts_summary;
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_disc_distribution;

  INSERT INTO public.materialized_view_refresh_log (refreshed_at, status)
  VALUES (now(), 'success');
EXCEPTION WHEN OTHERS THEN
  INSERT INTO public.materialized_view_refresh_log (refreshed_at, status, error_message)
  VALUES (now(), 'error', SQLERRM);
  RAISE;
END;
$$;

-- Tabela de log de refresh
CREATE TABLE IF NOT EXISTS public.materialized_view_refresh_log (
  id            bigserial PRIMARY KEY,
  refreshed_at  timestamptz NOT NULL DEFAULT now(),
  status        text NOT NULL,
  error_message text
);

ALTER TABLE public.materialized_view_refresh_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "admin_only_view_refresh_log" ON public.materialized_view_refresh_log;
CREATE POLICY "admin_only_view_refresh_log"
  ON public.materialized_view_refresh_log
  FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- ----------------------------------------------------------------------------
-- 8. Agendamento via pg_cron (requer extensão pg_cron habilitada)
-- ----------------------------------------------------------------------------
-- Habilita pg_cron se ainda não estiver
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

-- Refresh diário às 03:00 UTC (00:00 horário Brasília)
SELECT cron.schedule(
  'refresh-dashboard-mvs',
  '0 3 * * *',
  $$SELECT public.refresh_dashboard_materialized_views();$$
);

-- ----------------------------------------------------------------------------
-- 9. Primeira execução manual (popula as MVs imediatamente)
-- ----------------------------------------------------------------------------
SELECT public.refresh_dashboard_materialized_views();

-- ----------------------------------------------------------------------------
-- 10. QUERIES DE VALIDAÇÃO (para o frontend usar)
-- ----------------------------------------------------------------------------

-- Operacional — minha semana atual
-- SELECT * FROM v_my_weekly_stats WHERE week = date_trunc('week', now());

-- Operacional — minhas últimas 12 semanas
-- SELECT * FROM v_my_weekly_stats ORDER BY week DESC LIMIT 12;

-- Tático — distribuição RFM
-- SELECT * FROM v_my_rfm_distribution ORDER BY total_value DESC;

-- Tático — pipeline funnel
-- SELECT * FROM v_my_pipeline_funnel ORDER BY
--   CASE stage
--     WHEN 'unknown' THEN 0 WHEN 'cold' THEN 1 WHEN 'warm' THEN 2
--     WHEN 'hot' THEN 3 WHEN 'customer' THEN 4 WHEN 'lost' THEN 5
--   END;

-- Estratégico (admin) — top 10 vendedores da semana
-- SELECT
--   p.full_name,
--   s.total_interactions,
--   s.unique_contacts,
--   s.avg_sentiment_score
-- FROM mv_user_weekly_stats s
-- JOIN profiles p ON p.id = s.user_id
-- WHERE s.week = date_trunc('week', now())
-- ORDER BY s.total_interactions DESC
-- LIMIT 10;
