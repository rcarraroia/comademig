-- ============================================
-- ANÁLISE PRÉVIA REALIZADA
-- ============================================
-- Data: 16/10/2025
-- Tarefa: 3. Atualizar tabela user_subscriptions
-- Análise: Verificação via Python e revisão de migrações anteriores
-- Status atual: 
--   - user_subscriptions: Tabela existe com 0 registros
--   - Campos já adicionados em migrações anteriores:
--     * initial_payment_id (migração 20250118000002)
--     * asaas_subscription_id (migração 20250110)
-- Campos a adicionar:
--   - asaas_customer_id (ID do cliente no Asaas)
--   - billing_type (Tipo de cobrança)
--   - cycle (Ciclo de cobrança)
--   - value (Valor da assinatura)
-- Impacto: Adição de novas colunas e constraints (não destrutivo)
-- Verificações:
--   ✅ Tabela existe e está em uso
--   ✅ Nenhum dado será perdido
--   ✅ Campos serão nullable para compatibilidade
--   ✅ Constraints serão adicionados com validação
-- ============================================

-- ============================================
-- VERIFICAÇÃO DO ESTADO ATUAL
-- ============================================
DO $$
DECLARE
    v_table_exists BOOLEAN;
    v_column_count INTEGER;
BEGIN
    -- Verificar se tabela existe
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'user_subscriptions'
    ) INTO v_table_exists;
    
    IF NOT v_table_exists THEN
        RAISE EXCEPTION '❌ ERRO: Tabela user_subscriptions não existe!';
    END IF;
    
    -- Contar colunas existentes
    SELECT COUNT(*) INTO v_column_count
    FROM information_schema.columns
    WHERE table_schema = 'public' 
    AND table_name = 'user_subscriptions';
    
    RAISE NOTICE '✅ Tabela user_subscriptions existe com % colunas', v_column_count;
    
    -- Listar colunas existentes
    RAISE NOTICE '📋 Colunas existentes:';
    FOR v_column_count IN 
        SELECT column_name 
        FROM information_schema.columns
        WHERE table_schema = 'public' 
        AND table_name = 'user_subscriptions'
        ORDER BY ordinal_position
    LOOP
        RAISE NOTICE '  - %', v_column_count;
    END LOOP;
END $$;

-- ============================================
-- ADICIONAR NOVOS CAMPOS
-- ============================================

-- 1. Adicionar asaas_customer_id (se não existir)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'user_subscriptions' 
        AND column_name = 'asaas_customer_id'
    ) THEN
        ALTER TABLE public.user_subscriptions 
        ADD COLUMN asaas_customer_id TEXT;
        
        RAISE NOTICE '✅ Coluna asaas_customer_id adicionada';
    ELSE
        RAISE NOTICE '⚠️ Coluna asaas_customer_id já existe';
    END IF;
END $$;

-- 2. Adicionar billing_type (se não existir)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'user_subscriptions' 
        AND column_name = 'billing_type'
    ) THEN
        ALTER TABLE public.user_subscriptions 
        ADD COLUMN billing_type TEXT;
        
        RAISE NOTICE '✅ Coluna billing_type adicionada';
    ELSE
        RAISE NOTICE '⚠️ Coluna billing_type já existe';
    END IF;
END $$;

-- 3. Adicionar cycle (se não existir)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'user_subscriptions' 
        AND column_name = 'cycle'
    ) THEN
        ALTER TABLE public.user_subscriptions 
        ADD COLUMN cycle TEXT;
        
        RAISE NOTICE '✅ Coluna cycle adicionada';
    ELSE
        RAISE NOTICE '⚠️ Coluna cycle já existe';
    END IF;
END $$;

-- 4. Adicionar value (se não existir)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'user_subscriptions' 
        AND column_name = 'value'
    ) THEN
        ALTER TABLE public.user_subscriptions 
        ADD COLUMN value DECIMAL(10, 2);
        
        RAISE NOTICE '✅ Coluna value adicionada';
    ELSE
        RAISE NOTICE '⚠️ Coluna value já existe';
    END IF;
END $$;

-- ============================================
-- ADICIONAR/ATUALIZAR CONSTRAINTS
-- ============================================

-- 1. Constraint para status (verificar se já existe e atualizar se necessário)
DO $$
BEGIN
    -- Remover constraint antiga se existir
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_schema = 'public' 
        AND table_name = 'user_subscriptions' 
        AND constraint_name = 'user_subscriptions_status_check'
    ) THEN
        ALTER TABLE public.user_subscriptions 
        DROP CONSTRAINT user_subscriptions_status_check;
        
        RAISE NOTICE '⚠️ Constraint antiga de status removida';
    END IF;
    
    -- Adicionar constraint atualizada
    ALTER TABLE public.user_subscriptions 
    ADD CONSTRAINT user_subscriptions_status_check 
    CHECK (status IN ('active', 'expired', 'cancelled', 'pending'));
    
    RAISE NOTICE '✅ Constraint de status adicionada/atualizada';
END $$;

-- 2. Constraint para billing_type (valores válidos do Asaas)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_schema = 'public' 
        AND table_name = 'user_subscriptions' 
        AND constraint_name = 'user_subscriptions_billing_type_check'
    ) THEN
        ALTER TABLE public.user_subscriptions 
        ADD CONSTRAINT user_subscriptions_billing_type_check 
        CHECK (billing_type IS NULL OR billing_type IN ('BOLETO', 'CREDIT_CARD', 'PIX', 'UNDEFINED'));
        
        RAISE NOTICE '✅ Constraint de billing_type adicionada';
    ELSE
        RAISE NOTICE '⚠️ Constraint de billing_type já existe';
    END IF;
END $$;

-- 3. Constraint para cycle (valores válidos do Asaas)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_schema = 'public' 
        AND table_name = 'user_subscriptions' 
        AND constraint_name = 'user_subscriptions_cycle_check'
    ) THEN
        ALTER TABLE public.user_subscriptions 
        ADD CONSTRAINT user_subscriptions_cycle_check 
        CHECK (cycle IS NULL OR cycle IN ('WEEKLY', 'BIWEEKLY', 'MONTHLY', 'QUARTERLY', 'SEMIANNUALLY', 'YEARLY'));
        
        RAISE NOTICE '✅ Constraint de cycle adicionada';
    ELSE
        RAISE NOTICE '⚠️ Constraint de cycle já existe';
    END IF;
END $$;

-- 4. Constraint para value (deve ser positivo)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_schema = 'public' 
        AND table_name = 'user_subscriptions' 
        AND constraint_name = 'user_subscriptions_value_check'
    ) THEN
        ALTER TABLE public.user_subscriptions 
        ADD CONSTRAINT user_subscriptions_value_check 
        CHECK (value IS NULL OR value > 0);
        
        RAISE NOTICE '✅ Constraint de value adicionada';
    ELSE
        RAISE NOTICE '⚠️ Constraint de value já existe';
    END IF;
END $$;

-- ============================================
-- CRIAR ÍNDICES NECESSÁRIOS
-- ============================================

-- 1. Índice para asaas_customer_id (busca por cliente)
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_asaas_customer_id 
ON public.user_subscriptions(asaas_customer_id);

-- 2. Índice para billing_type (filtros por tipo de cobrança)
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_billing_type 
ON public.user_subscriptions(billing_type);

-- 3. Índice para cycle (filtros por ciclo)
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_cycle 
ON public.user_subscriptions(cycle);

-- 4. Índice composto para consultas comuns (status + expires_at)
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status_expires 
ON public.user_subscriptions(status, expires_at);

-- ============================================
-- ADICIONAR COMENTÁRIOS EXPLICATIVOS
-- ============================================

COMMENT ON COLUMN public.user_subscriptions.asaas_customer_id IS 
'ID do cliente no gateway Asaas';

COMMENT ON COLUMN public.user_subscriptions.billing_type IS 
'Tipo de cobrança no Asaas: BOLETO, CREDIT_CARD, PIX, UNDEFINED';

COMMENT ON COLUMN public.user_subscriptions.cycle IS 
'Ciclo de cobrança: WEEKLY, BIWEEKLY, MONTHLY, QUARTERLY, SEMIANNUALLY, YEARLY';

COMMENT ON COLUMN public.user_subscriptions.value IS 
'Valor da assinatura em reais (BRL)';

-- ============================================
-- VALIDAÇÃO FINAL
-- ============================================
DO $$
DECLARE
    v_campos_adicionados INTEGER := 0;
    v_indices_criados INTEGER := 0;
    v_constraints_criados INTEGER := 0;
BEGIN
    -- Verificar campos adicionados
    SELECT COUNT(*) INTO v_campos_adicionados
    FROM information_schema.columns
    WHERE table_schema = 'public' 
    AND table_name = 'user_subscriptions'
    AND column_name IN ('asaas_customer_id', 'billing_type', 'cycle', 'value');
    
    -- Verificar índices criados
    SELECT COUNT(*) INTO v_indices_criados
    FROM pg_indexes
    WHERE schemaname = 'public' 
    AND tablename = 'user_subscriptions'
    AND indexname IN (
        'idx_user_subscriptions_asaas_customer_id',
        'idx_user_subscriptions_billing_type',
        'idx_user_subscriptions_cycle',
        'idx_user_subscriptions_status_expires'
    );
    
    -- Verificar constraints criados
    SELECT COUNT(*) INTO v_constraints_criados
    FROM information_schema.table_constraints
    WHERE constraint_schema = 'public' 
    AND table_name = 'user_subscriptions'
    AND constraint_name IN (
        'user_subscriptions_status_check',
        'user_subscriptions_billing_type_check',
        'user_subscriptions_cycle_check',
        'user_subscriptions_value_check'
    );
    
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'VALIDAÇÃO FINAL';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ Campos adicionados: %/4', v_campos_adicionados;
    RAISE NOTICE '✅ Índices criados: %/4', v_indices_criados;
    RAISE NOTICE '✅ Constraints criados: %/4', v_constraints_criados;
    RAISE NOTICE '';
    
    IF v_campos_adicionados < 4 THEN
        RAISE WARNING '⚠️ Alguns campos não foram adicionados!';
    END IF;
    
    IF v_indices_criados < 4 THEN
        RAISE WARNING '⚠️ Alguns índices não foram criados!';
    END IF;
    
    IF v_constraints_criados < 4 THEN
        RAISE WARNING '⚠️ Alguns constraints não foram criados!';
    END IF;
    
    IF v_campos_adicionados = 4 AND v_indices_criados = 4 AND v_constraints_criados = 4 THEN
        RAISE NOTICE '🎉 MIGRAÇÃO CONCLUÍDA COM SUCESSO!';
    END IF;
END $$;

-- ============================================
-- NOTAS
-- ============================================
-- Esta migração é NÃO DESTRUTIVA:
-- - Adiciona apenas novas colunas (nullable)
-- - Não afeta dados existentes
-- - Compatível com código atual
-- - Pode ser revertida facilmente se necessário
--
-- Campos adicionados:
-- 1. asaas_customer_id: Identifica o cliente no Asaas
-- 2. billing_type: Tipo de cobrança escolhido
-- 3. cycle: Frequência de cobrança
-- 4. value: Valor da assinatura
--
-- Constraints adicionados:
-- - status: Valores válidos (active, expired, cancelled, pending)
-- - billing_type: Valores válidos do Asaas
-- - cycle: Valores válidos do Asaas
-- - value: Deve ser positivo
--
-- Índices criados para otimizar:
-- - Buscas por cliente Asaas
-- - Filtros por tipo de cobrança
-- - Filtros por ciclo
-- - Consultas de status + expiração
