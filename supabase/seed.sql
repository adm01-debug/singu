-- ==============================================
-- Singu Development Seed Data
-- ==============================================
-- Run with: supabase db reset (applies migrations + seed)
-- Idempotent: uses ON CONFLICT DO NOTHING
-- ==============================================

-- Fixed UUIDs for reproducible dev environment
-- User IDs (must match auth.users if testing with real auth)
DO $$
DECLARE
  user1_id UUID := 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d';
  user2_id UUID := 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e';

  company1_id UUID := 'c0000001-0000-4000-a000-000000000001';
  company2_id UUID := 'c0000002-0000-4000-a000-000000000002';
  company3_id UUID := 'c0000003-0000-4000-a000-000000000003';

  contact1_id UUID := 'd0000001-0000-4000-a000-000000000001';
  contact2_id UUID := 'd0000002-0000-4000-a000-000000000002';
  contact3_id UUID := 'd0000003-0000-4000-a000-000000000003';
  contact4_id UUID := 'd0000004-0000-4000-a000-000000000004';
  contact5_id UUID := 'd0000005-0000-4000-a000-000000000005';

  interaction1_id UUID := 'e0000001-0000-4000-a000-000000000001';
  interaction2_id UUID := 'e0000002-0000-4000-a000-000000000002';
  interaction3_id UUID := 'e0000003-0000-4000-a000-000000000003';
  interaction4_id UUID := 'e0000004-0000-4000-a000-000000000004';
  interaction5_id UUID := 'e0000005-0000-4000-a000-000000000005';

  alert1_id UUID := 'f0000001-0000-4000-a000-000000000001';
  alert2_id UUID := 'f0000002-0000-4000-a000-000000000002';
  alert3_id UUID := 'f0000003-0000-4000-a000-000000000003';
  alert4_id UUID := 'f0000004-0000-4000-a000-000000000004';

BEGIN

-- ==============================================
-- 1. Create test users in auth.users
-- ==============================================
INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token)
VALUES
  (user1_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
   'carlos@singu.dev', crypt('password123', gen_salt('bf')), NOW(),
   '{"first_name": "Carlos", "last_name": "Oliveira"}'::jsonb, NOW(), NOW(), '', ''),
  (user2_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
   'mariana@singu.dev', crypt('password123', gen_salt('bf')), NOW(),
   '{"first_name": "Mariana", "last_name": "Santos"}'::jsonb, NOW(), NOW(), '', '')
ON CONFLICT (id) DO NOTHING;

-- ==============================================
-- 2. Profiles
-- ==============================================
INSERT INTO public.profiles (id, first_name, last_name, role_title, company_name, phone, preferences)
VALUES
  (user1_id, 'Carlos', 'Oliveira', 'Diretor Comercial', 'Singu CRM Ltda', '+55 11 99876-5432',
   '{"theme": "dark", "notifications": true, "language": "pt-BR"}'::jsonb),
  (user2_id, 'Mariana', 'Santos', 'Gerente de Vendas', 'Singu CRM Ltda', '+55 21 98765-4321',
   '{"theme": "light", "notifications": true, "language": "pt-BR"}'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- ==============================================
-- 3. Companies
-- ==============================================
INSERT INTO public.companies (id, user_id, name, industry, website, phone, email, address, city, state, tags, financial_health, employee_count, annual_revenue)
VALUES
  (company1_id, user1_id, 'Construtora Horizonte S.A.', 'Construcao Civil',
   'https://horizonteconstrutora.com.br', '+55 11 3456-7890', 'contato@horizonteconstrutora.com.br',
   'Av. Paulista, 1578, Sala 1204', 'Sao Paulo', 'SP',
   ARRAY['construcao', 'infraestrutura', 'grande-porte'], 'growing', '500-1000', 'R$ 150M'),

  (company2_id, user1_id, 'TechBrasil Solucoes Digitais Ltda', 'Tecnologia',
   'https://techbrasil.io', '+55 11 2345-6789', 'comercial@techbrasil.io',
   'Rua Funchal, 418, Conjunto 35', 'Sao Paulo', 'SP',
   ARRAY['saas', 'tecnologia', 'startup'], 'growing', '50-100', 'R$ 12M'),

  (company3_id, user2_id, 'Agro Serra Gauch Cooperativa', 'Agronegocio',
   'https://agroserragaucha.coop.br', '+55 54 3221-5678', 'vendas@agroserragaucha.coop.br',
   'Rod. RS-444, Km 12', 'Bento Goncalves', 'RS',
   ARRAY['agro', 'cooperativa', 'exportacao'], 'stable', '200-500', 'R$ 80M')
ON CONFLICT (id) DO NOTHING;

-- ==============================================
-- 4. Contacts
-- ==============================================
INSERT INTO public.contacts (id, user_id, company_id, first_name, last_name, role, role_title, email, phone, whatsapp, relationship_stage, relationship_score, sentiment, tags)
VALUES
  (contact1_id, user1_id, company1_id, 'Roberto', 'Mendes', 'decision_maker', 'Diretor de Compras',
   'roberto.mendes@horizonteconstrutora.com.br', '+55 11 99887-6543', '+55 11 99887-6543',
   'customer', 75, 'positive', ARRAY['vip', 'decisor']),

  (contact2_id, user1_id, company1_id, 'Fernanda', 'Almeida', 'buyer', 'Coordenadora de Suprimentos',
   'fernanda.almeida@horizonteconstrutora.com.br', '+55 11 98765-1234', '+55 11 98765-1234',
   'qualified_lead', 60, 'neutral', ARRAY['suprimentos', 'operacional']),

  (contact3_id, user1_id, company2_id, 'Lucas', 'Ferreira', 'owner', 'CEO & Co-founder',
   'lucas@techbrasil.io', '+55 11 97654-3210', '+55 11 97654-3210',
   'negotiation', 85, 'positive', ARRAY['founder', 'tech', 'influenciador']),

  (contact4_id, user2_id, company3_id, 'Ana Paula', 'Bianchi', 'manager', 'Gerente Comercial',
   'ana.bianchi@agroserragaucha.coop.br', '+55 54 99123-4567', '+55 54 99123-4567',
   'opportunity', 50, 'neutral', ARRAY['agro', 'exportacao']),

  (contact5_id, user2_id, company3_id, 'Giovanni', 'Rossetti', 'decision_maker', 'Presidente da Cooperativa',
   'giovanni@agroserragaucha.coop.br', '+55 54 99876-5432', '+55 54 99876-5432',
   'prospect', 30, 'neutral', ARRAY['presidencia', 'decisor'])
ON CONFLICT (id) DO NOTHING;

-- ==============================================
-- 5. Interactions
-- ==============================================
INSERT INTO public.interactions (id, user_id, contact_id, company_id, type, title, content, sentiment, tags, duration, initiated_by, follow_up_required, follow_up_date, created_at)
VALUES
  (interaction1_id, user1_id, contact1_id, company1_id, 'meeting', 'Reuniao de alinhamento Q1',
   'Discutimos o roadmap para o primeiro trimestre. Roberto mencionou interesse em expandir o contrato para incluir o modulo de gestao de obras. Proximo passo: enviar proposta atualizada.',
   'positive', ARRAY['proposta', 'expansao'], 3600, 'us', TRUE, '2026-04-02',
   NOW() - INTERVAL '3 days'),

  (interaction2_id, user1_id, contact2_id, company1_id, 'whatsapp', 'Follow-up orcamento materiais',
   'Fernanda confirmou recebimento do orcamento e disse que vai analisar com a diretoria na proxima semana.',
   'neutral', ARRAY['orcamento', 'follow-up'], NULL, 'them', FALSE, NULL,
   NOW() - INTERVAL '1 day'),

  (interaction3_id, user1_id, contact3_id, company2_id, 'call', 'Negociacao comercial - Plano Enterprise',
   'Lucas pediu desconto de 15% no plano enterprise para fechar ate o fim do mes. Vai conversar com o CFO e retorna quarta-feira.',
   'positive', ARRAY['negociacao', 'enterprise', 'desconto'], 1800, 'us', TRUE, '2026-03-28',
   NOW() - INTERVAL '2 days'),

  (interaction4_id, user2_id, contact4_id, company3_id, 'email', 'Apresentacao institucional enviada',
   'Enviei a apresentacao institucional e catalogo de produtos para Ana Paula. Ela mencionou que a cooperativa esta avaliando novos fornecedores para a safra 2026/2027.',
   'neutral', ARRAY['apresentacao', 'prospecao'], NULL, 'us', TRUE, '2026-04-05',
   NOW() - INTERVAL '5 days'),

  (interaction5_id, user2_id, contact5_id, company3_id, 'meeting', 'Almoco de relacionamento',
   'Almoco com Giovanni no restaurante Casa di Paolo. Conversamos sobre os desafios de exportacao da cooperativa e como nossa solucao pode ajudar na rastreabilidade. Muito receptivo.',
   'positive', ARRAY['relacionamento', 'almoco', 'exportacao'], 5400, 'us', FALSE, NULL,
   NOW() - INTERVAL '7 days')
ON CONFLICT (id) DO NOTHING;

-- ==============================================
-- 6. Alerts
-- ==============================================
INSERT INTO public.alerts (id, user_id, contact_id, type, priority, title, description, dismissed, expires_at, created_at)
VALUES
  (alert1_id, user1_id, contact1_id, 'follow_up', 'high',
   'Follow-up pendente: Roberto Mendes',
   'Voce prometeu enviar a proposta atualizada apos a reuniao de alinhamento Q1. Ja se passaram 3 dias.',
   FALSE, NOW() + INTERVAL '7 days', NOW() - INTERVAL '1 day'),

  (alert2_id, user1_id, contact3_id, 'opportunity', 'high',
   'Oportunidade de fechamento: TechBrasil Enterprise',
   'Lucas Ferreira retorna quarta-feira com resposta do CFO sobre o plano Enterprise. Prepare argumentos para contra-proposta caso pedam mais desconto.',
   FALSE, NOW() + INTERVAL '5 days', NOW()),

  (alert3_id, user2_id, contact4_id, 'no_contact', 'medium',
   'Sem contato ha 5 dias: Ana Paula Bianchi',
   'Nenhuma interacao registrada com Ana Paula desde o envio da apresentacao. Considere um follow-up por WhatsApp.',
   FALSE, NOW() + INTERVAL '10 days', NOW()),

  (alert4_id, user2_id, contact5_id, 'sentiment_drop', 'low',
   'Manter relacionamento: Giovanni Rossetti',
   'O almoco foi positivo mas Giovanni ainda esta em fase de prospeccao. Agende um novo encontro em 2 semanas para manter o momentum.',
   FALSE, NOW() + INTERVAL '14 days', NOW() - INTERVAL '2 days')
ON CONFLICT (id) DO NOTHING;

END $$;
