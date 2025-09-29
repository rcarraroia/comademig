-- Script para permitir acesso ANÔNIMO às tabelas
-- Execute este script no Editor SQL do Supabase

-- 1. GARANTIR que RLS está desabilitado
ALTER TABLE subscription_plans DISABLE ROW LEVEL SECURITY;
ALTER TABLE member_type_subscriptions DISABLE ROW LEVEL SECURITY;
ALTER TABLE member_types DISABLE ROW LEVEL SECURITY;

-- 2. CRIAR políticas para acesso ANÔNIMO (público)
CREATE POLICY "Allow anonymous read subscription_plans" ON subscription_plans
    FOR SELECT TO anon
    USING (true);

CREATE POLICY "Allow anonymous read member_type_subscriptions" ON member_type_subscriptions
    FOR SELECT TO anon
    USING (true);

CREATE POLICY "Allow anonymous read member_types" ON member_types
    FOR SELECT TO anon
    USING (true);

-- 3. REABILITAR RLS com políticas públicas
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_type_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_types ENABLE ROW LEVEL SECURITY;

-- 4. VERIFICAR se funcionou - esta query deve retornar dados
SELECT 
    'TESTE ACESSO ANÔNIMO' as status,
    COUNT(*) as total_planos
FROM subscription_plans;

-- 5. TESTAR query unificada para usuário anônimo
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