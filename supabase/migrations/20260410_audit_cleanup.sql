-- ============================================================================
-- SINGU CRM — Cleanup pós auditoria 2026-04-09 (round 4)
-- 
-- 1. Garante coluna whatsapp_instances.user_id (mapeamento por owner)
-- 2. Mapeia instâncias atuais ao seu user (EDITE O EMAIL ABAIXO!)
-- 3. DELETA o contato POC criado pelo Claude durante teste de exploit
-- 4. Lista contatos órfãos pra revisão manual
-- ============================================================================

-- 1. Adicionar coluna user_id em whatsapp_instances
ALTER TABLE public.whatsapp_instances
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_whatsapp_instances_user_id 
  ON public.whatsapp_instances(user_id) WHERE user_id IS NOT NULL;

COMMENT ON COLUMN public.whatsapp_instances.user_id IS
'Owner da instância WhatsApp. evolution-webhook usa isso pra atribuir novos
contatos auto-criados. Se NULL, a função recusa criar órfãos.';

-- 2. Mapear instâncias ao seu user (⚠️ EDITE O EMAIL)
UPDATE public.whatsapp_instances
SET user_id = (SELECT id FROM auth.users WHERE email = 'SEU_EMAIL@dominio.com' LIMIT 1)
WHERE user_id IS NULL;

-- 3. DELETAR contato POC criado pelo exploit do Claude
DELETE FROM public.contacts
WHERE id = 'd905188c-beee-409b-85e8-ad0a37dc56b9'
RETURNING id, first_name, last_name, whatsapp;

-- 4. Auditoria: contatos órfãos pra revisão manual
SELECT id, first_name, last_name, whatsapp, user_id, created_at,
       '⚠️ revisar' AS warning
FROM public.contacts
WHERE first_name = 'WhatsApp'
  AND notes LIKE '%automaticamente via WhatsApp%'
  AND created_at >= '2026-01-01'
ORDER BY created_at DESC;
