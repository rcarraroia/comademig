-- ============================================================================
-- LIMPEZA: Remover dados órfãos antes de adicionar Foreign Key
-- ============================================================================
-- Problema: Existem user_subscriptions com subscription_plan_id inválidos
-- Solução: Identificar e corrigir/remover registros órfãos

-- 1. ANÁLISE: Identificar registros órfãos
DO $$
DECLARE
    orphan_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO orphan_count
    FROM user_subscriptions us
    LEFT JOIN subscription_plans sp ON us.subscription_plan_id = sp.id
    WHERE us.subscription_plan_id IS NOT NULL 
    AND sp.id IS NULL;
    
    RAISE NOTICE '⚠️ Encontrados % registros órfãos em user_subscriptions', orphan_count;
END $$;

-- 2. MOSTRAR os registros órfãos (para auditoria)
SELECT 
    us.id,
    us.user_id,
    us.subscription_plan_id as "plan_id_invalido",
    us.member_type_id,
    us.status,
    us.created_at,
    p.nome_completo as "usuario"
FROM user_subscriptions us
LEFT JOIN subscription_plans sp ON us.subscription_plan_id = sp.id
LEFT JOIN profiles p ON us.user_id = p.id
WHERE us.subscription_plan_id IS NOT NULL 
AND sp.id IS NULL
ORDER BY us.created_at DESC;

-- 3. OPÇÃO A: Deletar registros órfãos (CUIDADO!)
-- Descomente apenas se tiver certeza que pode deletar
/*
DELETE FROM user_subscriptions
WHERE subscription_plan_id IN (
    SELECT us.subscription_plan_id
    FROM user_subscriptions us
    LEFT JOIN subscription_plans sp ON us.subscription_plan_id = sp.id
    WHERE us.subscription_plan_id IS NOT NULL 
    AND sp.id IS NULL
);
*/

-- 4. OPÇÃO B: Setar subscription_plan_id como NULL (mais seguro)
-- Mantém o registro mas remove a referência inválida
UPDATE user_subscriptions
SET subscription_plan_id = NULL
WHERE subscription_plan_id IN (
    SELECT us.subscription_plan_id
    FROM user_subscriptions us
    LEFT JOIN subscription_plans sp ON us.subscription_plan_id = sp.id
    WHERE us.subscription_plan_id IS NOT NULL 
    AND sp.id IS NULL
);

-- 5. Verificar se ainda há órfãos
DO $$
DECLARE
    remaining_orphans INTEGER;
BEGIN
    SELECT COUNT(*) INTO remaining_orphans
    FROM user_subscriptions us
    LEFT JOIN subscription_plans sp ON us.subscription_plan_id = sp.id
    WHERE us.subscription_plan_id IS NOT NULL 
    AND sp.id IS NULL;
    
    IF remaining_orphans > 0 THEN
        RAISE EXCEPTION '❌ Ainda existem % registros órfãos!', remaining_orphans;
    ELSE
        RAISE NOTICE '✅ Todos os registros órfãos foram corrigidos!';
    END IF;
END $$;
