-- Script para limpar relacionamentos quebrados
-- Execute este script no Editor SQL do Supabase

-- 1. Identificar relacionamentos quebrados (onde subscription_plan_id não existe)
SELECT 
    mts.id as rel_id,
    mts.member_type_id,
    mts.subscription_plan_id,
    mt.name as member_type_name,
    sp.plan_title
FROM member_type_subscriptions mts
LEFT JOIN member_types mt ON mts.member_type_id = mt.id
LEFT JOIN subscription_plans sp ON mts.subscription_plan_id = sp.id
WHERE sp.id IS NULL;

-- 2. DELETAR relacionamentos quebrados
DELETE FROM member_type_subscriptions 
WHERE subscription_plan_id NOT IN (
    SELECT id FROM subscription_plans
);

-- 3. Verificar resultado - deve mostrar apenas relacionamentos válidos
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

-- 4. Verificar se Diácono precisa de relacionamento
SELECT 
    mt.name as tipo_sem_plano
FROM member_types mt
LEFT JOIN member_type_subscriptions mts ON mt.id = mts.member_type_id
WHERE mts.id IS NULL AND mt.is_active = true;