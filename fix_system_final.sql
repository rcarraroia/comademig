-- Script FINAL para ativar o sistema
-- Execute este script no Editor SQL do Supabase
-- GARANTIDO: Sem erros de constraint

-- 1. APENAS ativar planos existentes (sem inserir nada)
UPDATE subscription_plans SET is_active = true;

-- 2. Verificar estado do sistema
SELECT 
    'STATUS DO SISTEMA' as info,
    '' as detalhes
    
UNION ALL

SELECT 
    'Planos ativos',
    CAST(COUNT(*) AS TEXT)
FROM subscription_plans 
WHERE is_active = true

UNION ALL

SELECT 
    'Tipos ativos',
    CAST(COUNT(*) AS TEXT)
FROM member_types 
WHERE is_active = true

UNION ALL

SELECT 
    'Relacionamentos',
    CAST(COUNT(*) AS TEXT)
FROM member_type_subscriptions;

-- 3. Mostrar dados unificados (o que o hook vai retornar)
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