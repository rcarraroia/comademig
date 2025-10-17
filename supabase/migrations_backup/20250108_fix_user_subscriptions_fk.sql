-- ============================================================================
-- CORREÇÃO: Adicionar Foreign Key entre user_subscriptions e subscription_plans
-- ============================================================================
-- Problema: Supabase não consegue fazer JOIN automático sem FK definida
-- Solução: Adicionar constraint de foreign key

-- 1. Verificar se já existe a constraint (evitar erro se já existir)
DO $$ 
BEGIN
    -- Remover constraint antiga se existir
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'user_subscriptions_subscription_plan_id_fkey'
        AND table_name = 'user_subscriptions'
    ) THEN
        ALTER TABLE user_subscriptions 
        DROP CONSTRAINT user_subscriptions_subscription_plan_id_fkey;
    END IF;
END $$;

-- 2. Adicionar a Foreign Key correta
ALTER TABLE user_subscriptions
ADD CONSTRAINT user_subscriptions_subscription_plan_id_fkey
FOREIGN KEY (subscription_plan_id)
REFERENCES subscription_plans(id)
ON DELETE RESTRICT
ON UPDATE CASCADE;

-- 3. Criar índice para melhorar performance das queries
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_subscription_plan_id 
ON user_subscriptions(subscription_plan_id);

-- 4. Validar que a FK foi criada
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'user_subscriptions_subscription_plan_id_fkey'
        AND table_name = 'user_subscriptions'
    ) THEN
        RAISE EXCEPTION 'Foreign key não foi criada corretamente!';
    END IF;
    
    RAISE NOTICE '✅ Foreign key criada com sucesso!';
END $$;
