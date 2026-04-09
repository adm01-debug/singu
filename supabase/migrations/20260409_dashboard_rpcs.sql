-- ============================================================================
-- SINGU CRM — RPCs (Stored Functions) para Dashboards
-- Migration 2026-04-09
-- ============================================================================

-- ----------------------------------------------------------------------------
-- get_team_weekly_ranking — usado pelo Dashboard Tático
-- Retorna ranking do time, mas só pra admins/gestores
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_team_weekly_ranking()
RETURNS TABLE (
  user_id uuid,
  full_name text,
  total_interactions bigint,
  unique_contacts bigint,
  avg_sentiment_score numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Apenas admins veem todos
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true
  ) THEN
    RAISE EXCEPTION 'unauthorized: admin role required';
  END IF;

  RETURN QUERY
  SELECT
    p.id AS user_id,
    p.full_name,
    s.total_interactions,
    s.unique_contacts,
    s.avg_sentiment_score
  FROM public.mv_user_weekly_stats s
  JOIN public.profiles p ON p.id = s.user_id
  WHERE s.week = date_trunc('week', now())
  ORDER BY s.total_interactions DESC
  LIMIT 20;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_team_weekly_ranking() TO authenticated;

-- ----------------------------------------------------------------------------
-- get_north_star_metrics — usado pelo Dashboard Estratégico
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_north_star_metrics()
RETURNS TABLE (
  metric text,
  current_value numeric,
  target_value numeric,
  trend_pct numeric,
  unit text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total_active_contacts numeric;
  v_total_customers numeric;
  v_total_lost numeric;
  v_total_interactions_30d numeric;
  v_total_interactions_60d numeric;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true
  ) THEN
    RAISE EXCEPTION 'unauthorized: admin role required';
  END IF;

  -- Contatos por estágio
  SELECT COUNT(*) INTO v_total_active_contacts
  FROM public.contacts
  WHERE relationship_stage NOT IN ('lost', 'unknown');

  SELECT COUNT(*) INTO v_total_customers
  FROM public.contacts
  WHERE relationship_stage = 'customer';

  SELECT COUNT(*) INTO v_total_lost
  FROM public.contacts
  WHERE relationship_stage = 'lost';

  -- Interações últimos 30 dias vs 30-60 dias atrás
  SELECT COUNT(*) INTO v_total_interactions_30d
  FROM public.interactions
  WHERE created_at > now() - interval '30 days';

  SELECT COUNT(*) INTO v_total_interactions_60d
  FROM public.interactions
  WHERE created_at BETWEEN now() - interval '60 days' AND now() - interval '30 days';

  RETURN QUERY
  VALUES
    (
      'Contatos Ativos',
      v_total_active_contacts,
      v_total_active_contacts * 1.2,
      CASE WHEN v_total_lost > 0 THEN ((v_total_active_contacts - v_total_lost) / GREATEST(v_total_lost,1)) * 100 ELSE 0 END,
      'count'
    ),
    (
      'Total Clientes',
      v_total_customers,
      v_total_customers * 1.5,
      0::numeric,
      'count'
    ),
    (
      'Interações 30d',
      v_total_interactions_30d,
      v_total_interactions_60d * 1.1,
      CASE WHEN v_total_interactions_60d > 0
           THEN ((v_total_interactions_30d - v_total_interactions_60d)::numeric / v_total_interactions_60d) * 100
           ELSE 0
      END,
      'count'
    ),
    (
      'Taxa Churn (estim.)',
      CASE WHEN v_total_active_contacts > 0
           THEN (v_total_lost::numeric / v_total_active_contacts) * 100
           ELSE 0
      END,
      2::numeric,
      0::numeric,
      '%'
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_north_star_metrics() TO authenticated;

-- ----------------------------------------------------------------------------
-- get_module_adoption — usado pelo Dashboard Estratégico
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_module_adoption()
RETURNS TABLE (
  module text,
  active_users bigint,
  total_users bigint,
  adoption_pct numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total_users bigint;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true
  ) THEN
    RAISE EXCEPTION 'unauthorized: admin role required';
  END IF;

  SELECT COUNT(*) INTO v_total_users FROM public.profiles;

  RETURN QUERY
  WITH module_users AS (
    SELECT 'DISC Analyzer' AS module,
           COUNT(DISTINCT user_id) AS active_users
    FROM public.disc_analysis_history
    WHERE created_at > now() - interval '7 days'

    UNION ALL

    SELECT 'Lux Intelligence', COUNT(DISTINCT user_id)
    FROM public.lux_intelligence
    WHERE started_at > now() - interval '30 days'

    UNION ALL

    SELECT 'RFM', COUNT(DISTINCT user_id)
    FROM public.rfm_analysis
    WHERE calculated_at > now() - interval '30 days'

    UNION ALL

    SELECT 'WhatsApp', COUNT(DISTINCT user_id)
    FROM public.whatsapp_messages
    WHERE timestamp > now() - interval '7 days'
  )
  SELECT
    mu.module,
    mu.active_users,
    v_total_users,
    CASE WHEN v_total_users > 0
         THEN (mu.active_users::numeric / v_total_users) * 100
         ELSE 0
    END AS adoption_pct
  FROM module_users mu
  ORDER BY mu.active_users DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_module_adoption() TO authenticated;

-- ----------------------------------------------------------------------------
-- get_integration_costs — placeholder, deve ser preenchido manualmente
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.integration_costs (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  integration     text NOT NULL,
  monthly_cost    numeric NOT NULL DEFAULT 0,
  events_count    bigint NOT NULL DEFAULT 0,
  attributed_revenue numeric NOT NULL DEFAULT 0,
  measured_at     date NOT NULL DEFAULT current_date,
  created_at      timestamptz DEFAULT now()
);

ALTER TABLE public.integration_costs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_only_integration_costs" ON public.integration_costs;
CREATE POLICY "admin_only_integration_costs"
  ON public.integration_costs
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE OR REPLACE FUNCTION public.get_integration_costs()
RETURNS TABLE (
  integration text,
  monthly_cost numeric,
  events_count bigint,
  attributed_revenue numeric,
  roi numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true
  ) THEN
    RAISE EXCEPTION 'unauthorized: admin role required';
  END IF;

  RETURN QUERY
  SELECT
    ic.integration,
    ic.monthly_cost,
    ic.events_count,
    ic.attributed_revenue,
    CASE WHEN ic.monthly_cost > 0
         THEN ic.attributed_revenue / ic.monthly_cost
         ELSE 0
    END AS roi
  FROM public.integration_costs ic
  WHERE ic.measured_at = (
    SELECT MAX(measured_at) FROM public.integration_costs ic2
    WHERE ic2.integration = ic.integration
  )
  ORDER BY (
    CASE WHEN ic.monthly_cost > 0
         THEN ic.attributed_revenue / ic.monthly_cost
         ELSE 0
    END
  ) DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_integration_costs() TO authenticated;

-- ----------------------------------------------------------------------------
-- Seed inicial de integration_costs (rodar uma vez)
-- ----------------------------------------------------------------------------
INSERT INTO public.integration_costs (integration, monthly_cost, events_count, attributed_revenue) VALUES
  ('Lovable AI', 800, 12000, 65000),
  ('Firecrawl', 200, 400, 80000),
  ('EnrichLayer', 300, 800, 80000),
  ('ElevenLabs', 150, 200, 0),
  ('Evolution API', 50, 0, 0)
ON CONFLICT DO NOTHING;
