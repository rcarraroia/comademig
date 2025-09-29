-- Script LIMPO - APENAS ativar planos
-- Execute este script no Editor SQL do Supabase
-- GARANTIDO: Sem erros de constraint

-- APENAS ativar planos existentes
UPDATE subscription_plans SET is_active = true;

-- Verificar resultado
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