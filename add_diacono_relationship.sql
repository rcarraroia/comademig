-- Script para associar Diácono ao plano Contribuição Mensal Básica
-- Execute este script no Editor SQL do Supabase

-- 1. Criar relacionamento para Diácono
INSERT INTO member_type_subscriptions (member_type_id, subscription_plan_id)
SELECT 
    mt.id as member_type_id,
    sp.id as subscription_plan_id
FROM member_types mt, subscription_plans sp 
WHERE mt.name = 'Diácono' AND sp.plan_title = 'Contribuição Mensal Básica';

-- 2. Verificar resultado final - todos os tipos devem ter planos
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

-- 3. Verificar se ainda há tipos sem plano
SELECT 
    mt.name as tipo_sem_plano
FROM member_types mt
LEFT JOIN member_type_subscriptions mts ON mt.id = mts.member_type_id
WHERE mts.id IS NULL AND mt.is_active = true;