-- ============================================
-- MIGRAÇÃO: Adicionar suporte para pagamento inicial
-- Data: 18/01/2025
-- Objetivo: Separar pagamento inicial de assinatura recorrente
-- ============================================

-- Adicionar coluna para armazenar ID do pagamento inicial (primeira mensalidade)
ALTER TABLE user_subscriptions 
ADD COLUMN IF NOT EXISTS initial_payment_id TEXT;

-- Criar índice para melhorar performance de buscas
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_initial_payment_id 
ON user_subscriptions(initial_payment_id);

-- Adicionar comentário explicativo
COMMENT ON COLUMN user_subscriptions.initial_payment_id IS 
'ID do pagamento único inicial (primeira mensalidade). Diferente do asaas_subscription_id que é usado para renovações.';

-- ============================================
-- VALIDAÇÃO
-- ============================================
DO $$
DECLARE
  col_exists BOOLEAN;
  idx_exists BOOLEAN;
BEGIN
  -- Verificar se coluna foi criada
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'user_subscriptions' 
    AND column_name = 'initial_payment_id'
  ) INTO col_exists;
  
  IF col_exists THEN
    RAISE NOTICE '✅ Coluna initial_payment_id criada com sucesso';
  ELSE
    RAISE EXCEPTION '❌ ERRO: Coluna initial_payment_id não foi criada!';
  END IF;
  
  -- Verificar se índice foi criado
  SELECT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE schemaname = 'public' 
    AND tablename = 'user_subscriptions' 
    AND indexname = 'idx_user_subscriptions_initial_payment_id'
  ) INTO idx_exists;
  
  IF idx_exists THEN
    RAISE NOTICE '✅ Índice idx_user_subscriptions_initial_payment_id criado com sucesso';
  ELSE
    RAISE EXCEPTION '❌ ERRO: Índice não foi criado!';
  END IF;
END $$;

-- ============================================
-- NOTAS
-- ============================================
-- Esta migração é NÃO DESTRUTIVA:
-- - Adiciona apenas uma nova coluna (nullable)
-- - Não afeta dados existentes
-- - Compatível com código atual
-- - Pode ser revertida facilmente se necessário

-- Para reverter (se necessário):
-- DROP INDEX IF EXISTS idx_user_subscriptions_initial_payment_id;
-- ALTER TABLE user_subscriptions DROP COLUMN IF EXISTS initial_payment_id;
