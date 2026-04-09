-- ============================================================================
-- SINGU CRM — Hardening de Segurança — Migration 2026-04-09 (v2 corrigida)
-- 
-- DEPOIS DA AUDITORIA EXAUSTIVA: usa o sistema de RBAC já existente
-- (user_roles + has_role function) ao invés de criar coluna is_admin redundante.
-- 
-- Rode esse SQL no Supabase Dashboard → SQL Editor → New Query → Run
-- Projeto: rqodmqosrotmtrjnnjul
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Tabela de auditoria do external-data 
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.external_data_audit_log (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  operation   text NOT NULL CHECK (operation IN ('select','insert','update','delete','distinct','schema','list_tables')),
  table_name  text NOT NULL,
  payload     jsonb,
  outcome     text NOT NULL CHECK (outcome IN ('success','denied','error')),
  ip_address  inet,
  user_agent  text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_external_data_audit_user
  ON public.external_data_audit_log (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_external_data_audit_outcome
  ON public.external_data_audit_log (outcome, created_at DESC)
  WHERE outcome IN ('denied','error');

CREATE INDEX IF NOT EXISTS idx_external_data_audit_table
  ON public.external_data_audit_log (table_name, operation, created_at DESC);

ALTER TABLE public.external_data_audit_log ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- 2. RLS — só admins (via has_role já existente) podem ler o audit
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "admin_only_select_audit" ON public.external_data_audit_log;
CREATE POLICY "admin_only_select_audit"
  ON public.external_data_audit_log
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- INSERTs vêm da edge function via service_role (bypass RLS), então não precisamos
-- de policy de INSERT. Bloqueamos UPDATE e DELETE explicitamente:
DROP POLICY IF EXISTS "no_update_audit" ON public.external_data_audit_log;
CREATE POLICY "no_update_audit"
  ON public.external_data_audit_log
  FOR UPDATE
  TO authenticated
  USING (false);

DROP POLICY IF EXISTS "no_delete_audit" ON public.external_data_audit_log;
CREATE POLICY "no_delete_audit"
  ON public.external_data_audit_log
  FOR DELETE
  TO authenticated
  USING (false);

-- ----------------------------------------------------------------------------
-- 3. Marcar SEU usuário como admin (substitua o e-mail abaixo)
-- ----------------------------------------------------------------------------
-- ⚠️ IMPORTANTE: troque 'SEU_EMAIL@dominio.com' pelo seu e-mail real antes de rodar
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM auth.users
WHERE email = 'SEU_EMAIL@dominio.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 4. Verificação rápida — quem é admin agora?
-- ----------------------------------------------------------------------------
SELECT 
  u.email,
  ur.role,
  ur.id AS role_id,
  '✅ admin ativo' AS status
FROM public.user_roles ur
JOIN auth.users u ON u.id = ur.user_id
WHERE ur.role = 'admin';

-- ----------------------------------------------------------------------------
-- 5. AUDITORIA: tabelas em public sem RLS habilitado (CRÍTICO)
-- ----------------------------------------------------------------------------
SELECT
  schemaname,
  tablename,
  '⚠️ RLS DISABLED' AS warning
FROM pg_tables
WHERE schemaname = 'public'
  AND rowsecurity = false
ORDER BY tablename;

-- ----------------------------------------------------------------------------
-- 6. AUDITORIA: tabelas com RLS habilitado mas SEM nenhuma policy
-- ----------------------------------------------------------------------------
SELECT
  t.tablename,
  COUNT(p.policyname) AS num_policies,
  '⚠️ RLS ON, NO POLICIES' AS warning
FROM pg_tables t
LEFT JOIN pg_policies p
  ON p.schemaname = t.schemaname AND p.tablename = t.tablename
WHERE t.schemaname = 'public'
  AND t.rowsecurity = true
GROUP BY t.tablename
HAVING COUNT(p.policyname) = 0
ORDER BY t.tablename;

-- ----------------------------------------------------------------------------
-- 7. AUDITORIA: extensions instaladas em public
-- ----------------------------------------------------------------------------
SELECT
  extname,
  nspname AS schema,
  CASE WHEN nspname = 'public' THEN '⚠️ MOVE TO DEDICATED SCHEMA' ELSE '✅' END AS status
FROM pg_extension e
JOIN pg_namespace n ON n.oid = e.extnamespace
ORDER BY nspname, extname;

-- ----------------------------------------------------------------------------
-- 8. AUDITORIA: contagem de policies por tabela
-- ----------------------------------------------------------------------------
SELECT
  tablename,
  COUNT(*) FILTER (WHERE cmd = 'SELECT') AS sel,
  COUNT(*) FILTER (WHERE cmd = 'INSERT') AS ins,
  COUNT(*) FILTER (WHERE cmd = 'UPDATE') AS upd,
  COUNT(*) FILTER (WHERE cmd = 'DELETE') AS del,
  COUNT(*) AS total
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;
