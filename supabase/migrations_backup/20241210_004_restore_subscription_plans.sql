-- =====================================================
-- MIGRAÇÃO 004: Restauração dos Planos de Assinatura
-- Data: 10/12/2024
-- Descrição: Restaura planos corretos com relacionamento member_type_id
-- Sistema: COMADEMIG - Convenção de Ministros das Assembleias de Deus em MG
-- =====================================================

-- PASSO 1: Verificar se os planos corretos já existem
DO $$
DECLARE
    plans_with_member_type_count INTEGER;
    total_plans_count INTEGER;
BEGIN
    -- Contar planos com member_type_id
    SELECT COUNT(*) INTO plans_with_member_type_count
    FROM subscription_plans 
    WHERE member_type_id IS NOT NULL;
    
    -- Contar total de planos
    SELECT COUNT(*) INTO total_plans_count
    FROM subscription_plans;
    
    RAISE NOTICE 'Planos com member_type_id: %', plans_with_member_type_count;
    RAISE NOTICE 'Total de planos: %', total_plans_count;
    
    -- Se já temos planos corretos, não fazer nada
    IF plans_with_member_type_count > 0 THEN
        RAISE NOTICE 'Planos corretos já existem. Migração desnecessária.';
        RETURN;
    END IF;
    
    -- Se temos planos genéricos (sem member_type_id), remover
    IF total_plans_count > 0 AND plans_with_member_type_count = 0 THEN
        RAISE NOTICE 'Removendo planos genéricos incorretos...';
        TRUNCATE TABLE subscription_plans RESTART IDENTITY CASCADE;
    END IF;
    
    RAISE NOTICE 'Iniciando restauração dos planos corretos...';
END $$;

-- PASSO 2: Verificar se member_types existem
DO $$
DECLARE
    member_types_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO member_types_count FROM member_types WHERE is_active = true;
    
    IF member_types_count = 0 THEN
        RAISE EXCEPTION 'ERRO: Nenhum member_type ativo encontrado. Execute migração de member_types primeiro.';
    END IF;
    
    RAISE NOTICE 'Member types ativos encontrados: %', member_types_count;
END $$;

-- PASSO 3: Restaurar planos MENSAIS (1 mês)
INSERT INTO subscription_plans (
    member_type_id,
    name,
    price,
    recurrence,
    duration_months,
    is_active,
    sort_order,
    features
)
SELECT 
    mt.id,
    mt.name || ' - Mensal',
    CASE mt.name
        WHEN 'Bispo' THEN 10.00
        WHEN 'Pastor' THEN 15.00
        WHEN 'Diácono' THEN 8.00
        WHEN 'Membro' THEN 5.00
        WHEN 'Evangelista' THEN 12.00
        WHEN 'Administrador' THEN 0.00
        ELSE 10.00
    END,
    'monthly',
    1,
    true,
    1,
    '{"certidoes": 5, "suporte": "email", "carteira_digital": true}'::jsonb
FROM member_types mt
WHERE mt.is_active = true
AND NOT EXISTS (
    SELECT 1 FROM subscription_plans sp 
    WHERE sp.member_type_id = mt.id AND sp.duration_months = 1
)
ON CONFLICT (member_type_id, duration_months) DO NOTHING;

-- PASSO 4: Restaurar planos SEMESTRAIS (6 meses)
INSERT INTO subscription_plans (
    member_type_id,
    name,
    price,
    recurrence,
    duration_months,
    is_active,
    sort_order,
    features
)
SELECT 
    mt.id,
    mt.name || ' - Semestral',
    CASE mt.name
        WHEN 'Bispo' THEN 55.00
        WHEN 'Pastor' THEN 85.00
        WHEN 'Diácono' THEN 45.00
        WHEN 'Membro' THEN 28.00
        WHEN 'Evangelista' THEN 68.00
        WHEN 'Administrador' THEN 0.00
        ELSE 55.00
    END,
    'monthly',
    6,
    true,
    2,
    '{"certidoes": 30, "suporte": "telefone", "carteira_digital": true, "desconto_eventos": 0.1}'::jsonb
FROM member_types mt
WHERE mt.is_active = true
AND NOT EXISTS (
    SELECT 1 FROM subscription_plans sp 
    WHERE sp.member_type_id = mt.id AND sp.duration_months = 6
)
ON CONFLICT (member_type_id, duration_months) DO NOTHING;

-- PASSO 5: Restaurar planos ANUAIS (12 meses)
INSERT INTO subscription_plans (
    member_type_id,
    name,
    price,
    recurrence,
    duration_months,
    is_active,
    sort_order,
    features
)
SELECT 
    mt.id,
    mt.name || ' - Anual',
    CASE mt.name
        WHEN 'Bispo' THEN 100.00
        WHEN 'Pastor' THEN 150.00
        WHEN 'Diácono' THEN 85.00
        WHEN 'Membro' THEN 50.00
        WHEN 'Evangelista' THEN 120.00
        WHEN 'Administrador' THEN 0.00
        ELSE 100.00
    END,
    'monthly',
    12,
    true,
    3,
    '{"certidoes": 100, "suporte": "prioritario", "carteira_digital": true, "desconto_eventos": 0.2, "acesso_premium": true}'::jsonb
FROM member_types mt
WHERE mt.is_active = true
AND NOT EXISTS (
    SELECT 1 FROM subscription_plans sp 
    WHERE sp.member_type_id = mt.id AND sp.duration_months = 12
)
ON CONFLICT (member_type_id, duration_months) DO NOTHING;

-- PASSO 6: Verificar resultado da restauração
SELECT 
    'Planos restaurados por member_type:' as info,
    mt.name as member_type,
    COUNT(sp.id) as total_plans,
    STRING_AGG(sp.duration_months::text || ' meses', ', ' ORDER BY sp.duration_months) as durações
FROM member_types mt
LEFT JOIN subscription_plans sp ON mt.id = sp.member_type_id
WHERE mt.is_active = true
GROUP BY mt.id, mt.name
ORDER BY mt.name;

-- PASSO 7: Verificar total geral
SELECT 
    COUNT(*) as total_plans_restored,
    COUNT(DISTINCT member_type_id) as member_types_with_plans,
    MIN(price) as min_price,
    MAX(price) as max_price
FROM subscription_plans;

-- PASSO 8: Verificar se user_subscriptions precisam ser corrigidas
DO $$
DECLARE
    orphaned_subscriptions INTEGER;
BEGIN
    SELECT COUNT(*) INTO orphaned_subscriptions
    FROM user_subscriptions us
    WHERE NOT EXISTS (
        SELECT 1 FROM subscription_plans sp 
        WHERE sp.id = us.subscription_plan_id
    );
    
    IF orphaned_subscriptions > 0 THEN
        RAISE WARNING 'ATENÇÃO: % assinaturas de usuário órfãs encontradas. Considere executar migração de correção.', orphaned_subscriptions;
    ELSE
        RAISE NOTICE 'Todas as assinaturas de usuário estão vinculadas a planos válidos.';
    END IF;
END $$;

-- =====================================================
-- FIM DA MIGRAÇÃO 004 - RESTAURAÇÃO DE PLANOS
-- 
-- ✅ Planos mensais, semestrais e anuais restaurados
-- ✅ Relacionamento member_type_id correto
-- ✅ Preços diferenciados por cargo
-- ✅ Features completas por duração
-- ✅ Verificação de integridade incluída
-- =====================================================