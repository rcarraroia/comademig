-- ============================================
-- ANÁLISE PRÉVIA REALIZADA
-- ============================================
-- Data: 2025-01-10
-- Análise: Script Python executado
-- Status atual: 
--   - user_subscriptions: 0 registros, campo asaas_subscription_id NÃO EXISTE
--   - profiles: 2 registros, sem campos Asaas
-- Impacto: Adição de novas colunas (não destrutivo)
-- Verificações:
--   ✅ Tabelas existem
--   ✅ Nenhum dado será perdido
--   ✅ Sistema nunca foi usado em produção
--   ✅ Implementação segura
-- ============================================

-- Adicionar coluna para armazenar ID da assinatura do Asaas em user_subscriptions
ALTER TABLE user_subscriptions 
ADD COLUMN IF NOT EXISTS asaas_subscription_id TEXT;

-- Adicionar índice para melhorar performance de buscas
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_asaas_id 
ON user_subscriptions(asaas_subscription_id);

-- Adicionar comentário explicativo
COMMENT ON COLUMN user_subscriptions.asaas_subscription_id IS 
'ID da assinatura recorrente criada no gateway Asaas';

-- Opcional: Adicionar campos Asaas em profiles para facilitar consultas
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS asaas_customer_id TEXT,
ADD COLUMN IF NOT EXISTS asaas_subscription_id TEXT;

-- Adicionar índices
CREATE INDEX IF NOT EXISTS idx_profiles_asaas_customer 
ON profiles(asaas_customer_id);

CREATE INDEX IF NOT EXISTS idx_profiles_asaas_subscription 
ON profiles(asaas_subscription_id);

-- Adicionar comentários
COMMENT ON COLUMN profiles.asaas_customer_id IS 
'ID do cliente no gateway Asaas';

COMMENT ON COLUMN profiles.asaas_subscription_id IS 
'ID da assinatura ativa no gateway Asaas (referência rápida)';

-- Validação: Verificar que colunas foram criadas
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'user_subscriptions' 
        AND column_name = 'asaas_subscription_id'
    ) THEN
        RAISE NOTICE '✅ Coluna asaas_subscription_id adicionada em user_subscriptions';
    END IF;
    
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'asaas_customer_id'
    ) THEN
        RAISE NOTICE '✅ Coluna asaas_customer_id adicionada em profiles';
    END IF;
END $$;
