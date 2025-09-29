-- Script para popular o sistema com dados de teste
-- Execute este script no Editor SQL do Supabase

-- PROBLEMA IDENTIFICADO: Planos existem mas não estão ativos e sem relacionamentos
-- SOLUÇÃO: Ativar planos existentes e criar relacionamentos

-- 1. Ativar todos os planos de assinatura
UPDATE subscription_plans SET is_active = true WHERE is_active = false;

-- 2. Criar relacionamentos entre tipos de membro e planos
-- Primeiro, vamos ver os IDs disponíveis e criar os relacionamentos

-- Relacionar Pastor com Anuidade Pastor 2025
INSERT INTO member_type_subscriptions (member_type_id, subscription_plan_id)
SELECT 
    mt.id as member_type_id,
    sp.id as subscription_plan_id
FROM member_types mt, subscription_plans sp 
WHERE mt.name = 'Pastor' AND sp.plan_title = 'Anuidade Pastor 2025'
ON CONFLICT DO NOTHING;

-- Relacionar Administrador com Anuidade Pastor 2025
INSERT INTO member_type_subscriptions (member_type_id, subscription_plan_id)
SELECT 
    mt.id as member_type_id,
    sp.id as subscription_plan_id
FROM member_types mt, subscription_plans sp 
WHERE mt.name = 'Administrador' AND sp.plan_title = 'Anuidade Pastor 2025'
ON CONFLICT DO NOTHING;

-- Relacionar Membro com Anuidade Membro Regular
INSERT INTO member_type_subscriptions (member_type_id, subscription_plan_id)
SELECT 
    mt.id as member_type_id,
    sp.id as subscription_plan_id
FROM member_types mt, subscription_plans sp 
WHERE mt.name = 'Membro' AND sp.plan_title = 'Anuidade Membro Regular'
ON CONFLICT DO NOTHING;

-- Relacionar Evangelista com Anuidade Pastor 2025
INSERT INTO member_type_subscriptions (member_type_id, subscription_plan_id)
SELECT 
    mt.id as member_type_id,
    sp.id as subscription_plan_id
FROM member_types mt, subscription_plans sp 
WHERE mt.name = 'Evangelista' AND sp.plan_title = 'Anuidade Pastor 2025'
ON CONFLICT DO NOTHING;

-- 3. Verificar se os relacionamentos foram criados
SELECT 
    mt.name as tipo_membro,
    sp.plan_title as plano,
    sp.price as valor,
    sp.recurrence as recorrencia,
    sp.is_active as plano_ativo
FROM member_types mt
JOIN member_type_subscriptions mts ON mt.id = mts.member_type_id
JOIN subscription_plans sp ON mts.subscription_plan_id = sp.id
ORDER BY mt.sort_order;

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