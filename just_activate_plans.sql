-- Script APENAS para ativar planos existentes
-- Os planos existem mas podem estar inativos ou bloqueados por RLS

-- 1. Ativar TODOS os planos (mesmo que já estejam ativos)
UPDATE subscription_plans SET is_active = true;

-- 2. Verificar se funcionou
SELECT 
    plan_title,
    price,
    recurrence,
    is_active,
    created_at
FROM subscription_plans
ORDER BY created_at;

-- 3. Se os planos existem, mostrar os relacionamentos
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