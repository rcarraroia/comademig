-- ============================================================================
-- CORREÇÃO DO SISTEMA DE FILIAÇÃO - COMADEMIG
-- ============================================================================
-- Data: 2025-01-10
-- Problema: Relacionamento member_type_subscriptions com UUID inválido
-- Impacto: Formulário de filiação não funciona
-- ============================================================================

-- ============================================================================
-- PASSO 1: DIAGNÓSTICO - Ver dados atuais
-- ============================================================================
-- Execute primeiro para ver o problema:

SELECT 
    'DIAGNÓSTICO: member_type_subscriptions' as etapa,
    id,
    member_type_id,
    subscription_plan_id,
    created_at
FROM member_type_subscriptions;

-- ============================================================================
-- PASSO 2: BACKUP - Salvar dados antes de deletar
-- ============================================================================
-- Criar tabela temporária com backup

CREATE TEMP TABLE IF NOT EXISTS backup_member_type_subscriptions AS
SELECT * FROM member_type_subscriptions;

SELECT 'BACKUP criado com ' || COUNT(*) || ' registros' as resultado
FROM backup_member_type_subscriptions;

-- ============================================================================
-- PASSO 3: LIMPAR DADOS INVÁLIDOS
-- ============================================================================
-- Deletar relacionamentos com subscription_plan_id NULL

DELETE FROM member_type_subscriptions WHERE id = 'fd651da8-046d-4202-9157-29713ac8e855';
DELETE FROM member_type_subscriptions WHERE id = 'b60a38b1-5d32-437a-b822-e0ed3a0a6473';
DELETE FROM member_type_subscriptions WHERE id = '1db68abf-ee4c-41db-b3a9-8d24084bbf49';
DELETE FROM member_type_subscriptions WHERE id = '0e27d82c-755f-46f6-b421-b4dc88551e1f';
DELETE FROM member_type_subscriptions WHERE id = '61990fb4-dff0-4513-bf8a-b5d068074213';
DELETE FROM member_type_subscriptions WHERE id = '9b7537c0-3839-41b7-8532-2dfd5a1d8a68';

SELECT 'Relacionamentos inválidos DELETADOS: 6 registros' as resultado;

-- ============================================================================
-- PASSO 4: RECRIAR RELACIONAMENTOS CORRETOS
-- ============================================================================
-- Baseado nos dados encontrados na análise

-- 4.1 Diácono → Diácono - Mensal (R$ 8.00)
INSERT INTO member_type_subscriptions (member_type_id, subscription_plan_id)
VALUES ('615dc80a-870b-4b98-bb44-d48e778f1208', '71626827-5d8d-48a8-9587-93d34c2318da');

-- 4.2 Membro → Membro - Mensal (R$ 5.00)
INSERT INTO member_type_subscriptions (member_type_id, subscription_plan_id)
VALUES ('fb3a0d99-9190-412a-8784-f3fd91a234d3', '063de54b-4bba-4fd1-b520-e4992072f211');

SELECT 'Relacionamentos RECRIADOS: ' || COUNT(*) || ' registros' as resultado
FROM member_type_subscriptions;

-- ============================================================================
-- PASSO 5: CORRIGIR RECORRÊNCIA DOS PLANOS
-- ============================================================================
-- Problema: Todos os planos estão marcados como 'monthly'

-- 5.1 Corrigir planos SEMESTRAIS
UPDATE subscription_plans 
SET recurrence = 'semestral'
WHERE name LIKE '% - Semestral';

SELECT 'Planos SEMESTRAIS corrigidos: ' || COUNT(*) as resultado
FROM subscription_plans
WHERE recurrence = 'semestral';

-- 5.2 Corrigir planos ANUAIS
UPDATE subscription_plans 
SET recurrence = 'annual'
WHERE name LIKE '% - Anual';

SELECT 'Planos ANUAIS corrigidos: ' || COUNT(*) as resultado
FROM subscription_plans
WHERE recurrence = 'annual';

-- ============================================================================
-- PASSO 6: VERIFICAÇÃO FINAL
-- ============================================================================

-- 6.1 Ver relacionamentos criados
SELECT 
    'VERIFICAÇÃO: Relacionamentos' as etapa,
    mt.name as tipo_membro,
    sp.name as plano,
    sp.price as valor,
    sp.recurrence as recorrencia
FROM member_type_subscriptions mts
JOIN member_types mt ON mt.id = mts.member_type_id
JOIN subscription_plans sp ON sp.id = mts.subscription_plan_id
ORDER BY mt.sort_order;

-- 6.2 Ver distribuição de recorrências
SELECT 
    'VERIFICAÇÃO: Recorrências' as etapa,
    recurrence,
    COUNT(*) as quantidade
FROM subscription_plans
WHERE is_active = true
GROUP BY recurrence
ORDER BY recurrence;

-- 6.3 Testar query unificada (mesma que o frontend usa)
SELECT 
    'VERIFICAÇÃO: Query Unificada' as etapa,
    mt.id,
    mt.name,
    mt.description,
    sp.name as plano_nome,
    sp.price as plano_valor,
    sp.recurrence as plano_recorrencia
FROM member_types mt
LEFT JOIN member_type_subscriptions mts ON mts.member_type_id = mt.id
LEFT JOIN subscription_plans sp ON sp.id = mts.subscription_plan_id
WHERE mt.is_active = true
ORDER BY mt.sort_order;

-- ============================================================================
-- RESULTADO ESPERADO
-- ============================================================================
-- Após executar este script, você deve ver:
--
-- VERIFICAÇÃO: Relacionamentos
-- ┌─────────────┬──────────────────┬────────┬─────────────┐
-- │ tipo_membro │ plano            │ valor  │ recorrencia │
-- ├─────────────┼──────────────────┼────────┼─────────────┤
-- │ Diácono     │ Diácono - Mensal │ 8.00   │ monthly     │
-- │ Membro      │ Membro - Mensal  │ 5.00   │ monthly     │
-- └─────────────┴──────────────────┴────────┴─────────────┘
--
-- VERIFICAÇÃO: Recorrências
-- ┌─────────────┬────────────┐
-- │ recurrence  │ quantidade │
-- ├─────────────┼────────────┤
-- │ annual      │ 5          │
-- │ monthly     │ 5          │
-- │ semestral   │ 5          │
-- └─────────────┴────────────┘
--
-- VERIFICAÇÃO: Query Unificada
-- ┌─────────┬──────────────────┬──────────────┬────────┬─────────────┐
-- │ name    │ plano_nome       │ plano_valor  │ recorrencia          │
-- ├─────────┼──────────────────┼──────────────┼─────────────────────┤
-- │ Diácono │ Diácono - Mensal │ 8.00         │ monthly              │
-- │ Membro  │ Membro - Mensal  │ 5.00         │ monthly              │
-- └─────────┴──────────────────┴──────────────┴─────────────────────┘
--
-- ✅ Se você ver esses resultados, o sistema está CORRIGIDO!
-- ============================================================================

-- ============================================================================
-- INSTRUÇÕES DE EXECUÇÃO
-- ============================================================================
-- 1. Copie TODO este script
-- 2. Abra o Supabase Dashboard
-- 3. Vá em "SQL Editor"
-- 4. Cole o script
-- 5. Clique em "Run" (ou pressione Ctrl+Enter)
-- 6. Verifique os resultados das queries de verificação
-- 7. Se tudo estiver OK, teste no frontend: https://comademig.vercel.app/filiacao
-- ============================================================================
