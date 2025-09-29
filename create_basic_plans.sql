-- Script para criar planos básicos do zero
-- Execute este script no Editor SQL do Supabase

-- 1. Criar planos básicos (a tabela está vazia)
INSERT INTO subscription_plans (plan_title, description, price, recurrence, is_active) VALUES
('Anuidade Pastor 2025', 'Plano anual para pastores com acesso completo', 120.00, 'Anual', true),
('Anuidade Membro Regular', 'Plano básico anual para membros', 60.00, 'Anual', true),
('Contribuição Mensal Básica', 'Plano mensal para membros regulares', 35.00, 'Mensal', true);

-- 2. Criar relacionamentos básicos
-- Pastor -> Anuidade Pastor 2025
INSERT INTO member_type_subscriptions (member_type_id, subscription_plan_id)
SELECT 
    mt.id as member_type_id,
    sp.id as subscription_plan_id
FROM member_types mt, subscription_plans sp 
WHERE mt.name = 'Pastor' AND sp.plan_title = 'Anuidade Pastor 2025';

-- Administrador -> Anuidade Pastor 2025
INSERT INTO member_type_subscriptions (member_type_id, subscription_plan_id)
SELECT 
    mt.id as member_type_id,
    sp.id as subscription_plan_id
FROM member_types mt, subscription_plans sp 
WHERE mt.name = 'Administrador' AND sp.plan_title = 'Anuidade Pastor 2025';

-- Membro -> Anuidade Membro Regular
INSERT INTO member_type_subscriptions (member_type_id, subscription_plan_id)
SELECT 
    mt.id as member_type_id,
    sp.id as subscription_plan_id
FROM member_types mt, subscription_plans sp 
WHERE mt.name = 'Membro' AND sp.plan_title = 'Anuidade Membro Regular';

-- Evangelista -> Anuidade Pastor 2025
INSERT INTO member_type_subscriptions (member_type_id, subscription_plan_id)
SELECT 
    mt.id as member_type_id,
    sp.id as subscription_plan_id
FROM member_types mt, subscription_plans sp 
WHERE mt.name = 'Evangelista' AND sp.plan_title = 'Anuidade Pastor 2025';

-- Diácono -> Contribuição Mensal Básica
INSERT INTO member_type_subscriptions (member_type_id, subscription_plan_id)
SELECT 
    mt.id as member_type_id,
    sp.id as subscription_plan_id
FROM member_types mt, subscription_plans sp 
WHERE mt.name = 'Diácono' AND sp.plan_title = 'Contribuição Mensal Básica';

-- 3. Verificar resultado
SELECT 
    mt.name as tipo_membro,
    sp.plan_title as plano,
    sp.price as valor,
    sp.recurrence as recorrencia
FROM member_types mt
JOIN member_type_subscriptions mts ON mt.id = mts.member_type_id
JOIN subscription_plans sp ON mts.subscription_plan_id = sp.id
WHERE mt.is_active = true AND sp.is_active = true
ORDER BY mt.sort_order;