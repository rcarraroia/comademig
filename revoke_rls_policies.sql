-- Script para revogar políticas RLS e permitir acesso público
-- Execute este script no Editor SQL do Supabase

-- 1. REVOGAR todas as políticas da tabela subscription_plans
DROP POLICY IF EXISTS "Admins can manage subscription plans" ON subscription_plans;
DROP POLICY IF EXISTS "Users can view subscription plans" ON subscription_plans;
DROP POLICY IF EXISTS "Allow public read of active subscription plans" ON subscription_plans;
DROP POLICY IF EXISTS "Public can read active plans" ON subscription_plans;

-- 2. REVOGAR todas as políticas da tabela member_type_subscriptions
DROP POLICY IF EXISTS "Admins can manage member type subscriptions" ON member_type_subscriptions;
DROP POLICY IF EXISTS "Users can view member type subscriptions" ON member_type_subscriptions;
DROP POLICY IF EXISTS "Allow public read of member type subscriptions" ON member_type_subscriptions;
DROP POLICY IF EXISTS "Public can read relationships" ON member_type_subscriptions;

-- 3. REVOGAR todas as políticas da tabela member_types (se houver)
DROP POLICY IF EXISTS "Admins can manage member types" ON member_types;
DROP POLICY IF EXISTS "Users can view member types" ON member_types;
DROP POLICY IF EXISTS "Public can read member types" ON member_types;

-- 4. CRIAR políticas APENAS para administradores
CREATE POLICY "Admin only - subscription plans" ON subscription_plans
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.cargo = 'Administrador'
        )
    );

CREATE POLICY "Admin only - member type subscriptions" ON member_type_subscriptions
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.cargo = 'Administrador'
        )
    );

CREATE POLICY "Admin only - member types" ON member_types
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.cargo = 'Administrador'
        )
    );

-- 5. DESABILITAR RLS temporariamente para teste
ALTER TABLE subscription_plans DISABLE ROW LEVEL SECURITY;
ALTER TABLE member_type_subscriptions DISABLE ROW LEVEL SECURITY;
ALTER TABLE member_types DISABLE ROW LEVEL SECURITY;

-- 6. Verificar se as tabelas estão acessíveis agora
SELECT 'subscription_plans' as tabela, COUNT(*) as registros FROM subscription_plans
UNION ALL
SELECT 'member_types' as tabela, COUNT(*) as registros FROM member_types
UNION ALL
SELECT 'member_type_subscriptions' as tabela, COUNT(*) as registros FROM member_type_subscriptions;

-- 7. Testar query unificada
SELECT 
    mt.name as tipo_membro,
    sp.plan_title as plano,
    sp.price as valor,
    sp.recurrence as recorrencia
FROM member_types mt
JOIN member_type_subscriptions mts ON mt.id = mts.member_type_id
JOIN subscription_plans sp ON mts.subscription_plan_id = sp.id
WHERE mt.is_active = true
ORDER BY mt.sort_order;