-- Script para DESABILITAR RLS COMPLETAMENTE
-- Execute este script no Editor SQL do Supabase

-- 1. REMOVER todas as políticas existentes
DROP POLICY IF EXISTS "Allow anonymous read subscription_plans" ON subscription_plans;
DROP POLICY IF EXISTS "Allow anonymous read member_type_subscriptions" ON member_type_subscriptions;
DROP POLICY IF EXISTS "Allow anonymous read member_types" ON member_types;
DROP POLICY IF EXISTS "Admin only - subscription plans" ON subscription_plans;
DROP POLICY IF EXISTS "Admin only - member type subscriptions" ON member_type_subscriptions;
DROP POLICY IF EXISTS "Admin only - member types" ON member_types;

-- 2. DESABILITAR RLS COMPLETAMENTE (acesso total)
ALTER TABLE subscription_plans DISABLE ROW LEVEL SECURITY;
ALTER TABLE member_type_subscriptions DISABLE ROW LEVEL SECURITY;
ALTER TABLE member_types DISABLE ROW LEVEL SECURITY;

-- 3. VERIFICAR se as tabelas estão acessíveis
SELECT 'subscription_plans' as tabela, COUNT(*) as registros FROM subscription_plans
UNION ALL
SELECT 'member_types' as tabela, COUNT(*) as registros FROM member_types  
UNION ALL
SELECT 'member_type_subscriptions' as tabela, COUNT(*) as registros FROM member_type_subscriptions;

-- 4. TESTAR query que o hook usa
SELECT 
    mt.id,
    mt.name,
    mt.description,
    mt.sort_order,
    mt.is_active,
    mts.id as rel_id,
    sp.id as plan_id,
    sp.plan_title,
    sp.price,
    sp.recurrence
FROM member_types mt
LEFT JOIN member_type_subscriptions mts ON mt.id = mts.member_type_id
LEFT JOIN subscription_plans sp ON mts.subscription_plan_id = sp.id
WHERE mt.is_active = true
ORDER BY mt.sort_order;