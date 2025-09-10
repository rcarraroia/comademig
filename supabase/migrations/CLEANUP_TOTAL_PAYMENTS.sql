-- ============================================================================
-- LIMPEZA TOTAL DO SISTEMA DE PAGAMENTOS
-- EXECUTE ESTE SCRIPT NO EDITOR SQL DO SUPABASE
-- ============================================================================

-- 1. REMOVER TODAS AS POLÍTICAS RLS RELACIONADAS A PAGAMENTOS
DROP POLICY IF EXISTS "asaas_cobrancas_select_policy" ON asaas_cobrancas;
DROP POLICY IF EXISTS "asaas_cobrancas_insert_policy" ON asaas_cobrancas;
DROP POLICY IF EXISTS "asaas_cobrancas_update_policy" ON asaas_cobrancas;
DROP POLICY IF EXISTS "asaas_cobrancas_delete_policy" ON asaas_cobrancas;
DROP POLICY IF EXISTS "asaas_cobrancas_insert_emergency" ON asaas_cobrancas;
DROP POLICY IF EXISTS "Allow service_role insert for filiacao" ON asaas_cobrancas;
DROP POLICY IF EXISTS "Allow service_role select for filiacao" ON asaas_cobrancas;
DROP POLICY IF EXISTS "Allow service_role update for filiacao" ON asaas_cobrancas;
DROP POLICY IF EXISTS "Only service role can delete cobrancas" ON asaas_cobrancas;
DROP POLICY IF EXISTS "Sistema pode atualizar cobranças" ON asaas_cobrancas;
DROP POLICY IF EXISTS "Sistema pode inserir cobranças" ON asaas_cobrancas;
DROP POLICY IF EXISTS "Users can insert their own cobrancas" ON asaas_cobrancas;
DROP POLICY IF EXISTS "Users can update their own cobrancas" ON asaas_cobrancas;
DROP POLICY IF EXISTS "Users can view their own cobrancas" ON asaas_cobrancas;
DROP POLICY IF EXISTS "Usuários podem ver suas próprias cobranças" ON asaas_cobrancas;

-- Políticas para asaas_webhooks
DROP POLICY IF EXISTS "Enable read access for all users" ON asaas_webhooks;
DROP POLICY IF EXISTS "Enable insert for service role only" ON asaas_webhooks;
DROP POLICY IF EXISTS "Enable update for service role only" ON asaas_webhooks;

-- Políticas para user_subscriptions
DROP POLICY IF EXISTS "Users can view own subscriptions" ON user_subscriptions;
DROP POLICY IF EXISTS "Users can insert own subscriptions" ON user_subscriptions;
DROP POLICY IF EXISTS "Users can update own subscriptions" ON user_subscriptions;

-- 2. REMOVER TABELAS RELACIONADAS A PAGAMENTOS
DROP TABLE IF EXISTS asaas_cobrancas CASCADE;
DROP TABLE IF EXISTS asaas_webhooks CASCADE;
DROP TABLE IF EXISTS user_subscriptions CASCADE;
DROP TABLE IF EXISTS subscription_plans CASCADE;

-- 3. REMOVER COLUNAS RELACIONADAS A PAGAMENTOS EM OUTRAS TABELAS
-- Verificar se existem colunas relacionadas em affiliates
ALTER TABLE affiliates DROP COLUMN IF EXISTS asaas_wallet_id CASCADE;

-- Verificar se existem colunas relacionadas em referrals
ALTER TABLE referrals DROP COLUMN IF EXISTS asaas_payment_id CASCADE;
ALTER TABLE referrals DROP COLUMN IF EXISTS charge_id CASCADE;

-- 4. REMOVER FUNÇÕES/TRIGGERS RELACIONADOS (se existirem)
DROP FUNCTION IF EXISTS handle_payment_webhook() CASCADE;
DROP FUNCTION IF EXISTS process_asaas_payment() CASCADE;
DROP FUNCTION IF EXISTS update_payment_status() CASCADE;
DROP FUNCTION IF EXISTS calculate_affiliate_commission() CASCADE;

-- 5. REMOVER TIPOS CUSTOMIZADOS (se existirem)
DROP TYPE IF EXISTS payment_status CASCADE;
DROP TYPE IF EXISTS billing_type CASCADE;
DROP TYPE IF EXISTS subscription_status CASCADE;

-- 6. VERIFICAR TABELAS RESTANTES
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%payment%' 
OR table_name LIKE '%asaas%' 
OR table_name LIKE '%subscription%'
OR table_name LIKE '%cobranca%';

-- 7. VERIFICAR POLÍTICAS RESTANTES
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE policyname LIKE '%payment%' 
OR policyname LIKE '%asaas%' 
OR policyname LIKE '%subscription%'
OR policyname LIKE '%cobranca%';

-- ============================================================================
-- SCRIPT EXECUTADO COM SUCESSO!
-- Todas as tabelas, políticas e funções relacionadas a pagamentos foram removidas.
-- ============================================================================