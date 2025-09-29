-- Script para popular o sistema com dados de teste
-- Execute este script no Editor SQL do Supabase

-- IMPORTANTE: Baseado na migração 20250827000022_member_types_final.sql
-- A tabela subscription_plans usa o campo 'name' (não 'plan_title')
-- E os valores de recurrence são: 'monthly', 'semestral', 'annual' (não 'Mensal', 'Anual')

-- 1. Criar planos de assinatura de exemplo
INSERT INTO subscription_plans (name, description, price, recurrence, permissions, is_active) VALUES
('Anuidade Pastor 2025', 'Plano anual para pastores com acesso completo', 120.00, 'annual', '{"manage_events": true, "manage_news": true, "manage_media": true}', true),
('Anuidade Membro Regular', 'Plano básico anual para membros', 60.00, 'annual', '{}', true),
('Contribuição Mensal Básica', 'Plano mensal para membros regulares', 35.00, 'monthly', '{}', true);

-- 2. Criar relacionamentos entre tipos de membro existentes e planos
-- Associar Pastor ao plano Pastor
INSERT INTO member_type_subscriptions (member_type_id, subscription_plan_id)
SELECT 
    mt.id as member_type_id,
    sp.id as subscription_plan_id
FROM member_types mt, subscription_plans sp 
WHERE mt.name = 'Pastor' AND sp.plan_title = 'Anuidade Pastor 2025';

-- Associar Administrador ao plano Pastor (admin tem acesso total)
INSERT INTO member_type_subscriptions (member_type_id, subscription_plan_id)
SELECT 
    mt.id as member_type_id,
    sp.id as subscription_plan_id
FROM member_types mt, subscription_plans sp 
WHERE mt.name = 'Administrador' AND sp.plan_title = 'Anuidade Pastor 2025';

-- 3. Criar mais tipos de membro para demonstração
INSERT INTO member_types (name, description, sort_order, is_active) VALUES
('Diácono', 'Diácono da igreja local', 2, true),
('Membro', 'Membro regular da congregação', 3, true),
('Evangelista', 'Ministro evangelista', 4, true);

-- 4. Associar novos tipos aos planos apropriados
-- Diácono -> Plano Diácono
INSERT INTO member_type_subscriptions (member_type_id, subscription_plan_id)
SELECT 
    mt.id as member_type_id,
    sp.id as subscription_plan_id
FROM member_types mt, subscription_plans sp 
WHERE mt.name = 'Diácono' AND sp.plan_title = 'Contribuição Mensal Diácono';

-- Membro -> Plano Membro Regular
INSERT INTO member_type_subscriptions (member_type_id, subscription_plan_id)
SELECT 
    mt.id as member_type_id,
    sp.id as subscription_plan_id
FROM member_types mt, subscription_plans sp 
WHERE mt.name = 'Membro' AND sp.plan_title = 'Anuidade Membro Regular';

-- Evangelista -> Plano Pastor (mesmo nível de acesso)
INSERT INTO member_type_subscriptions (member_type_id, subscription_plan_id)
SELECT 
    mt.id as member_type_id,
    sp.id as subscription_plan_id
FROM member_types mt, subscription_plans sp 
WHERE mt.name = 'Evangelista' AND sp.plan_title = 'Anuidade Pastor 2025';

-- 5. Verificar se os dados foram inseridos corretamente
SELECT 
    mt.name as tipo_membro,
    sp.plan_title as plano,
    sp.price as valor,
    sp.recurrence as recorrencia
FROM member_types mt
JOIN member_type_subscriptions mts ON mt.id = mts.member_type_id
JOIN subscription_plans sp ON mts.subscription_plan_id = sp.id
ORDER BY mt.sort_order;