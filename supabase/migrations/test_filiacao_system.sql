-- ============================================================================
-- SCRIPT DE TESTE - SISTEMA DE FILIAÇÃO
-- ============================================================================
-- Data: 2025-01-10
-- Objetivo: Validar que o sistema de filiação está funcionando
-- Execute APÓS fix_filiacao_system.sql e fix_filiacao_rls_policies.sql
-- ============================================================================

-- ============================================================================
-- TESTE 1: Verificar Tipos de Membro Ativos
-- ============================================================================

SELECT 
    '✅ TESTE 1: Tipos de Membro Ativos' as teste,
    id,
    name,
    description,
    sort_order,
    is_active
FROM member_types
WHERE is_active = true
ORDER BY sort_order;

-- Resultado esperado: 2 registros (Diácono, Membro)

-- ============================================================================
-- TESTE 2: Verificar Planos de Assinatura Ativos
-- ============================================================================

SELECT 
    '✅ TESTE 2: Planos de Assinatura Ativos' as teste,
    name,
    price,
    recurrence,
    is_active
FROM subscription_plans
WHERE is_active = true
ORDER BY 
    CASE recurrence
        WHEN 'monthly' THEN 1
        WHEN 'semestral' THEN 2
        WHEN 'annual' THEN 3
    END,
    price;

-- Resultado esperado: 15 registros
-- 5 monthly, 5 semestral, 5 annual

-- ============================================================================
-- TESTE 3: Verificar Relacionamentos Tipo ↔ Plano
-- ============================================================================

SELECT 
    '✅ TESTE 3: Relacionamentos Tipo ↔ Plano' as teste,
    mt.name as tipo_membro,
    sp.name as plano,
    sp.price as valor,
    sp.recurrence as recorrencia
FROM member_type_subscriptions mts
JOIN member_types mt ON mt.id = mts.member_type_id
JOIN subscription_plans sp ON sp.id = mts.subscription_plan_id
ORDER BY mt.sort_order;

-- Resultado esperado: 2 registros
-- Diácono → Diácono - Mensal (R$ 8.00)
-- Membro → Membro - Mensal (R$ 5.00)

-- ============================================================================
-- TESTE 4: Simular Query do Frontend (Query Unificada)
-- ============================================================================

SELECT 
    '✅ TESTE 4: Query Unificada (Frontend)' as teste,
    mt.id,
    mt.name,
    mt.description,
    mt.sort_order,
    mt.is_active,
    -- Dados do plano (desnormalizados)
    sp.id as plan_id,
    sp.name as plan_name,
    sp.price as plan_value,
    sp.recurrence as plan_recurrence,
    sp.plan_id_gateway,
    sp.description as plan_description
FROM member_types mt
LEFT JOIN member_type_subscriptions mts ON mts.member_type_id = mt.id
LEFT JOIN subscription_plans sp ON sp.id = mts.subscription_plan_id
WHERE mt.is_active = true
ORDER BY mt.sort_order;

-- Resultado esperado: 2 registros COM dados de plano preenchidos
-- Se plan_id for NULL, o problema persiste!

-- ============================================================================
-- TESTE 5: Verificar Distribuição de Recorrências
-- ============================================================================

SELECT 
    '✅ TESTE 5: Distribuição de Recorrências' as teste,
    recurrence,
    COUNT(*) as quantidade,
    STRING_AGG(name, ', ' ORDER BY price) as planos
FROM subscription_plans
WHERE is_active = true
GROUP BY recurrence
ORDER BY 
    CASE recurrence
        WHEN 'monthly' THEN 1
        WHEN 'semestral' THEN 2
        WHEN 'annual' THEN 3
    END;

-- Resultado esperado:
-- monthly: 5 planos
-- semestral: 5 planos
-- annual: 5 planos

-- ============================================================================
-- TESTE 6: Verificar Políticas RLS
-- ============================================================================

SELECT 
    '✅ TESTE 6: Políticas RLS' as teste,
    tablename,
    policyname,
    cmd as operacao,
    CASE 
        WHEN roles::text LIKE '%public%' THEN '🌐 Público'
        WHEN roles::text LIKE '%authenticated%' THEN '🔐 Autenticado'
        WHEN roles::text LIKE '%service_role%' THEN '⚙️ Service Role'
        ELSE roles::text
    END as acesso
FROM pg_policies
WHERE tablename IN (
    'member_types',
    'subscription_plans',
    'member_type_subscriptions'
)
ORDER BY tablename, policyname;

-- Resultado esperado: Pelo menos 6 políticas
-- member_types: 2 (leitura pública + admins)
-- subscription_plans: 2 (leitura pública + admins)
-- member_type_subscriptions: 2 (leitura pública + admins)

-- ============================================================================
-- TESTE 7: Verificar Integridade dos Dados
-- ============================================================================

-- 7.1 Verificar se há tipos sem planos
SELECT 
    '⚠️ TESTE 7.1: Tipos SEM Planos' as teste,
    mt.name as tipo_sem_plano
FROM member_types mt
LEFT JOIN member_type_subscriptions mts ON mts.member_type_id = mt.id
WHERE mt.is_active = true
AND mts.id IS NULL;

-- Resultado esperado: 0 registros (todos os tipos devem ter plano)

-- 7.2 Verificar se há planos órfãos
SELECT 
    '⚠️ TESTE 7.2: Planos Órfãos' as teste,
    sp.name as plano_orfao
FROM subscription_plans sp
LEFT JOIN member_type_subscriptions mts ON mts.subscription_plan_id = sp.id
WHERE sp.is_active = true
AND mts.id IS NULL;

-- Resultado esperado: 13 registros (planos sem tipo associado ainda)
-- Isso é OK - nem todos os planos precisam estar associados

-- 7.3 Verificar se há UUIDs inválidos
SELECT 
    '❌ TESTE 7.3: UUIDs Inválidos' as teste,
    id,
    member_type_id,
    subscription_plan_id
FROM member_type_subscriptions
WHERE 
    member_type_id IS NULL 
    OR subscription_plan_id IS NULL
    OR member_type_id::text = 'None'
    OR subscription_plan_id::text = 'None';

-- Resultado esperado: 0 registros (nenhum UUID inválido)

-- ============================================================================
-- TESTE 8: Simular Fluxo de Filiação
-- ============================================================================

-- 8.1 Usuário seleciona "Diácono"
SELECT 
    '✅ TESTE 8.1: Seleção de Tipo (Diácono)' as teste,
    mt.id as member_type_id,
    mt.name as member_type_name,
    sp.id as plan_id,
    sp.name as plan_name,
    sp.price as plan_price,
    sp.recurrence as plan_recurrence,
    -- Calcular desconto PIX (5%)
    ROUND(sp.price * 0.05, 2) as pix_discount,
    ROUND(sp.price * 0.95, 2) as pix_final_price
FROM member_types mt
JOIN member_type_subscriptions mts ON mts.member_type_id = mt.id
JOIN subscription_plans sp ON sp.id = mts.subscription_plan_id
WHERE mt.name = 'Diácono'
AND mt.is_active = true;

-- Resultado esperado: 1 registro
-- Diácono - Mensal: R$ 8.00 → PIX: R$ 7.60 (desconto R$ 0.40)

-- 8.2 Usuário seleciona "Membro"
SELECT 
    '✅ TESTE 8.2: Seleção de Tipo (Membro)' as teste,
    mt.id as member_type_id,
    mt.name as member_type_name,
    sp.id as plan_id,
    sp.name as plan_name,
    sp.price as plan_price,
    sp.recurrence as plan_recurrence,
    -- Calcular desconto PIX (5%)
    ROUND(sp.price * 0.05, 2) as pix_discount,
    ROUND(sp.price * 0.95, 2) as pix_final_price
FROM member_types mt
JOIN member_type_subscriptions mts ON mts.member_type_id = mt.id
JOIN subscription_plans sp ON sp.id = mts.subscription_plan_id
WHERE mt.name = 'Membro'
AND mt.is_active = true;

-- Resultado esperado: 1 registro
-- Membro - Mensal: R$ 5.00 → PIX: R$ 4.75 (desconto R$ 0.25)

-- ============================================================================
-- TESTE 9: Verificar Estrutura das Tabelas
-- ============================================================================

SELECT 
    '✅ TESTE 9: Estrutura das Tabelas' as teste,
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name IN (
    'member_types',
    'subscription_plans',
    'member_type_subscriptions',
    'user_subscriptions'
)
AND table_schema = 'public'
ORDER BY table_name, ordinal_position;

-- Resultado esperado: Lista completa de colunas de cada tabela

-- ============================================================================
-- TESTE 10: Resumo Final
-- ============================================================================

SELECT 
    '📊 RESUMO FINAL' as teste,
    'Tipos Ativos' as item,
    COUNT(*) as quantidade
FROM member_types
WHERE is_active = true

UNION ALL

SELECT 
    '📊 RESUMO FINAL',
    'Planos Ativos',
    COUNT(*)
FROM subscription_plans
WHERE is_active = true

UNION ALL

SELECT 
    '📊 RESUMO FINAL',
    'Relacionamentos',
    COUNT(*)
FROM member_type_subscriptions

UNION ALL

SELECT 
    '📊 RESUMO FINAL',
    'Políticas RLS',
    COUNT(*)
FROM pg_policies
WHERE tablename IN (
    'member_types',
    'subscription_plans',
    'member_type_subscriptions',
    'user_subscriptions',
    'profiles'
);

-- ============================================================================
-- CRITÉRIOS DE SUCESSO
-- ============================================================================
-- ✅ TESTE 1: Deve retornar 2 tipos ativos
-- ✅ TESTE 2: Deve retornar 15 planos (5 de cada recorrência)
-- ✅ TESTE 3: Deve retornar 2 relacionamentos
-- ✅ TESTE 4: Deve retornar 2 registros COM plan_id preenchido
-- ✅ TESTE 5: Deve mostrar 5 monthly, 5 semestral, 5 annual
-- ✅ TESTE 6: Deve mostrar pelo menos 6 políticas
-- ✅ TESTE 7.1: Deve retornar 0 (nenhum tipo sem plano)
-- ✅ TESTE 7.3: Deve retornar 0 (nenhum UUID inválido)
-- ✅ TESTE 8.1: Deve calcular desconto PIX corretamente
-- ✅ TESTE 8.2: Deve calcular desconto PIX corretamente
--
-- Se TODOS os testes passarem, o sistema está FUNCIONANDO! 🎉
-- ============================================================================

-- ============================================================================
-- PRÓXIMO PASSO: TESTAR NO FRONTEND
-- ============================================================================
-- 1. Abra: https://comademig.vercel.app/filiacao
-- 2. Selecione "Diácono" ou "Membro"
-- 3. Verifique se aparece o valor do plano
-- 4. Clique em "Prosseguir com a Filiação"
-- 5. Verifique se o formulário abre
-- 6. Preencha os dados
-- 7. Escolha método de pagamento
-- 8. Submeta o formulário
-- 9. Verifique se o pagamento é processado
-- ============================================================================
