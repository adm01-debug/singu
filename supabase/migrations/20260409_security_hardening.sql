-- ============================================================================
-- SINGU CRM — Hardening de Segurança — Migration 2026-04-09
-- Rode esse SQL no Supabase Dashboard → SQL Editor → New Query → Run
-- Projeto: rqodmqosrotmtrjnnjul
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Adicionar coluna is_admin em profiles (se ainda não existir)
-- ----------------------------------------------------------------------------
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS is_admin boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.profiles.is_admin IS
'Admin role flag. Used by external-data edge function to gate write operations.';

-- ----------------------------------------------------------------------------
-- 2. Tabela de auditoria do external-data (CRÍTICO: rastreia INSERT/UPDATE/DELETE
--    no banco externo)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.external_data_audit_log (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  operation   text NOT NULL CHECK (operation IN ('select','insert','update','delete','distinct','schema','list_tables')),
  table_name  text NOT NULL,
  payload     jsonb,
  outcome     text NOT NULL CHECK (outcome IN ('success','denied','error')),
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_external_data_audit_user
  ON public.external_data_audit_log (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_external_data_audit_outcome
  ON public.external_data_audit_log (outcome, created_at DESC)
  WHERE outcome IN ('denied','error');

ALTER TABLE public.external_data_audit_log ENABLE ROW LEVEL SECURITY;

-- Apenas admins podem ler o audit log
DROP POLICY IF EXISTS "admin_only_select_audit" ON public.external_data_audit_log;
CREATE POLICY "admin_only_select_audit"
  ON public.external_data_audit_log
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- ----------------------------------------------------------------------------
-- 3. Marcar SEU usuário como admin (SUBSTITUA O E-MAIL ABAIXO)
-- ----------------------------------------------------------------------------
-- ⚠️ IMPORTANTE: troque 'SEU_EMAIL@dominio.com' pelo seu e-mail real antes de rodar
UPDATE public.profiles
SET is_admin = true
WHERE id IN (
  SELECT id FROM auth.users
  WHERE email = 'SEU_EMAIL@dominio.com'
);

-- ----------------------------------------------------------------------------
-- 4. AUDITORIA: tabelas em public SEM RLS habilitado
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
-- 5. AUDITORIA: tabelas com RLS habilitado mas SEM nenhuma policy
--    (todas queries serão silenciosamente bloqueadas — pode ser intencional ou bug)
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
-- 6. AUDITORIA: extensions instaladas em public (boa prática: mover para schema dedicado)
-- ----------------------------------------------------------------------------
SELECT
  extname,
  nspname AS schema,
  CASE WHEN nspname = 'public' THEN '⚠️ MOVE TO DEDICATED SCHEMA' ELSE '✅' END AS status
FROM pg_extension e
JOIN pg_namespace n ON n.oid = e.extnamespace
ORDER BY nspname, extname;

-- ----------------------------------------------------------------------------
-- 7. AUDITORIA: contagem total de policies por tabela (verificação de cobertura)
-- ----------------------------------------------------------------------------
SELECT
  tablename,
  COUNT(*) FILTER (WHERE cmd = 'SELECT') AS select_policies,
  COUNT(*) FILTER (WHERE cmd = 'INSERT') AS insert_policies,
  COUNT(*) FILTER (WHERE cmd = 'UPDATE') AS update_policies,
  COUNT(*) FILTER (WHERE cmd = 'DELETE') AS delete_policies,
  COUNT(*) AS total_policies
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;
