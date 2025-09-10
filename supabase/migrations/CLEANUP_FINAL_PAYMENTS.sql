-- ============================================================================
-- LIMPEZA FINAL - REMOVER ÚLTIMAS REFERÊNCIAS A PAGAMENTOS
-- ============================================================================

-- 1. REMOVER POLÍTICAS RESTANTES DA TABELA member_type_subscriptions
DROP POLICY IF EXISTS "Admins can manage member type subscriptions" ON member_type_subscriptions;
DROP POLICY IF EXISTS "Allow public read access to member_type_subscriptions" ON member_type_subscriptions;
DROP POLICY IF EXISTS "Users can view member type subscriptions" ON member_type_subscriptions;

-- 2. REMOVER A TABELA member_type_subscriptions COMPLETAMENTE
DROP TABLE IF EXISTS member_type_subscriptions CASCADE;

-- 3. REMOVER COLUNAS RELACIONADAS A PAGAMENTOS EM OUTRAS TABELAS
-- Baseado na consulta que encontrou essas colunas:

-- Remover coluna de referência de plano de assinatura
ALTER TABLE member_type_subscriptions DROP COLUMN IF EXISTS subscription_plan_id CASCADE;

-- Remover coluna de origem de assinatura em profiles
ALTER TABLE profiles DROP COLUMN IF EXISTS subscription_source CASCADE;

-- Remover referências de pagamento em solicitações
ALTER TABLE solicitacoes_certidoes DROP COLUMN IF EXISTS payment_reference CASCADE;
ALTER TABLE solicitacoes_regularizacao DROP COLUMN IF EXISTS payment_reference CASCADE;

-- Remover referência de pagamento Asaas em transações
ALTER TABLE transactions DROP COLUMN IF EXISTS asaas_payment_id CASCADE;

-- 4. VERIFICAR SE RESTARAM REFERÊNCIAS
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND (table_name LIKE '%payment%' 
     OR table_name LIKE '%asaas%' 
     OR table_name LIKE '%subscription%'
     OR table_name LIKE '%cobranca%');

-- 5. VERIFICAR POLÍTICAS RESTANTES
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE policyname LIKE '%payment%' 
   OR policyname LIKE '%asaas%' 
   OR policyname LIKE '%subscription%'
   OR policyname LIKE '%cobranca%';

-- 6. VERIFICAR COLUNAS RESTANTES
SELECT table_name, column_name 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND (column_name LIKE '%payment%' 
     OR column_name LIKE '%asaas%' 
     OR column_name LIKE '%subscription%'
     OR column_name LIKE '%cobranca%');

-- ============================================================================
-- LIMPEZA FINAL CONCLUÍDA!
-- ============================================================================