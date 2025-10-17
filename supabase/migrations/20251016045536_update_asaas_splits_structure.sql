-- ============================================
-- ANÁLISE PRÉVIA REALIZADA
-- ============================================
-- Data: 16/10/2025
-- Tarefa: 4. Atualizar tabela asaas_splits
-- Análise: Verificação via Python e revisão de migrações anteriores
-- Status atual: 
--   - asaas_splits: Tabela existe com 0 registros
--   - Estrutura existente: id, cobranca_id, affiliate_id, percentage, fixed_value, wallet_id, total_value, status, asaas_split_id, commission_amount, processed_at, refusal_reason, error_message, retry_count, created_at, updated_at
-- Campos a adicionar:
--   - subscription_id (referência para user_subscriptions)
--   - payment_id (ID da cobrança no Asaas)
--   - recipient_type (tipo do destinatário: renum, affiliate, comademig)
--   - recipient_name (nome do destinatário)
-- Ajustes necessários:
--   - Tornar affiliate_id nullable (nem todo split tem afiliado)
--   - Ajustar constraint de status
--   - Adicionar UNIQUE em asaas_split_id
-- Impacto: Adição de colunas e ajustes (não destrutivo)
-- Verificações:
--   ✅ Tabela existe e está vazia (0 registros)
--   ✅ Nenhum dado será perdido
--   ✅ Campos serão nullable para compatibilidade
--   ✅ Migração é reversível
-- ============================================

-- ============================================
-- VERIFICAÇÃO DO ESTADO ATUAL
-- ============================================
DO $$
DECLARE
    v_table_exists BOOLEAN;
    v_record_count INTEGER;
    v_column_name TEXT;
BEGIN
    -- Verificar se tabela existe
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'asaas_splits'
    ) INTO v_table_exists;
    
    IF NOT v_table_exists THEN
        RAISE EXCEPTION '❌ ERRO: Tabela asaas_splits não existe! Esta migração espera que ela exista.';
    END IF;
    
    -- Contar registros existentes
    EXECUTE 'SELECT COUNT(*) FROM asaas_splits' INTO v_record_count;
    
    RAISE NOTICE '✅ Tabela asaas_splits existe com % registros', v_record_count;
    
    -- Listar colunas existentes
    RAISE NOTICE '📋 Colunas existentes:';
    FOR v_column_name IN 
        SELECT column_name 
        FROM information_schema.columns
        WHERE table_schema = 'public' 
        AND table_name = 'asaas_splits'
        ORDER BY ordinal_position
    LOOP
        RAISE NOTICE '  - %', v_column_name;
    END LOOP;
END $$;

-- ============================================
-- ADICIONAR NOVOS CAMPOS
-- ============================================

-- 1. Adicionar subscription_id (se não existir)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'asaas_splits' 
        AND column_name = 'subscription_id'
    ) THEN
        ALTER TABLE public.asaas_splits 
        ADD COLUMN subscription_id UUID REFERENCES user_subscriptions(id) ON DELETE CASCADE;
        
        RAISE NOTICE '✅ Coluna subscription_id adicionada';
    ELSE
        RAISE NOTICE '⚠️ Coluna subscription_id já existe';
    END IF;
END $$;

-- 2. Adicionar payment_id (se não existir)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'asaas_splits' 
        AND column_name = 'payment_id'
    ) THEN
        ALTER TABLE public.asaas_splits 
        ADD COLUMN payment_id VARCHAR;
        
        RAISE NOTICE '✅ Coluna payment_id adicionada';
    ELSE
        RAISE NOTICE '⚠️ Coluna payment_id já existe';
    END IF;
END $$;

-- 3. Adicionar recipient_type (se não existir)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'asaas_splits' 
        AND column_name = 'recipient_type'
    ) THEN
        ALTER TABLE public.asaas_splits 
        ADD COLUMN recipient_type VARCHAR;
        
        RAISE NOTICE '✅ Coluna recipient_type adicionada';
    ELSE
        RAISE NOTICE '⚠️ Coluna recipient_type já existe';
    END IF;
END $$;

-- 4. Adicionar recipient_name (se não existir)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'asaas_splits' 
        AND column_name = 'recipient_name'
    ) THEN
        ALTER TABLE public.asaas_splits 
        ADD COLUMN recipient_name VARCHAR;
        
        RAISE NOTICE '✅ Coluna recipient_name adicionada';
    ELSE
        RAISE NOTICE '⚠️ Coluna recipient_name já existe';
    END IF;
END $$;

-- ============================================
-- AJUSTAR CONSTRAINTS EXISTENTES
-- ============================================

-- 1. Tornar affiliate_id nullable (remover NOT NULL)
DO $$
BEGIN
    -- Verificar se affiliate_id é NOT NULL
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'asaas_splits' 
        AND column_name = 'affiliate_id'
        AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE public.asaas_splits 
        ALTER COLUMN affiliate_id DROP NOT NULL;
        
        RAISE NOTICE '✅ Constraint NOT NULL removida de affiliate_id';
    ELSE
        RAISE NOTICE '⚠️ affiliate_id já é nullable';
    END IF;
END $$;

-- 2. Atualizar constraint de status
DO $$
BEGIN
    -- Remover constraint antiga se existir
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_schema = 'public' 
        AND table_name = 'asaas_splits' 
        AND constraint_name = 'asaas_splits_status_check'
    ) THEN
        ALTER TABLE public.asaas_splits 
        DROP CONSTRAINT asaas_splits_status_check;
        
        RAISE NOTICE '⚠️ Constraint antiga de status removida';
    END IF;
    
    -- Adicionar constraint atualizada
    ALTER TABLE public.asaas_splits 
    ADD CONSTRAINT asaas_splits_status_check 
    CHECK (status IN ('pending', 'done', 'refused', 'cancelled', 'PENDING', 'AWAITING_CREDIT', 'CREDITED', 'CANCELLED'));
    
    RAISE NOTICE '✅ Constraint de status adicionada/atualizada';
END $$;

-- 3. Adicionar constraint UNIQUE em asaas_split_id (se não existir)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'asaas_splits_asaas_split_id_key'
        AND conrelid = 'public.asaas_splits'::regclass
    ) THEN
        ALTER TABLE public.asaas_splits 
        ADD CONSTRAINT asaas_splits_asaas_split_id_key UNIQUE (asaas_split_id);
        
        RAISE NOTICE '✅ Constraint UNIQUE adicionada em asaas_split_id';
    ELSE
        RAISE NOTICE '⚠️ Constraint UNIQUE em asaas_split_id já existe';
    END IF;
END $$;

-- 4. Adicionar constraint para recipient_type
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_schema = 'public' 
        AND table_name = 'asaas_splits' 
        AND constraint_name = 'asaas_splits_recipient_type_check'
    ) THEN
        ALTER TABLE public.asaas_splits 
        ADD CONSTRAINT asaas_splits_recipient_type_check 
        CHECK (recipient_type IS NULL OR recipient_type IN ('renum', 'affiliate', 'comademig'));
        
        RAISE NOTICE '✅ Constraint de recipient_type adicionada';
    ELSE
        RAISE NOTICE '⚠️ Constraint de recipient_type já existe';
    END IF;
END $$;

-- ============================================
-- CRIAR ÍNDICES NECESSÁRIOS
-- ============================================

-- 1. Índice para subscription_id (busca por assinatura)
CREATE INDEX IF NOT EXISTS idx_asaas_splits_subscription_id 
ON public.asaas_splits(subscription_id);

-- 2. Índice para payment_id (busca por pagamento)
CREATE INDEX IF NOT EXISTS idx_asaas_splits_payment_id 
ON public.asaas_splits(payment_id);

-- 3. Índice para status (filtros por status)
CREATE INDEX IF NOT EXISTS idx_asaas_splits_status 
ON public.asaas_splits(status);

-- 4. Índice para recipient_type (filtros por tipo)
CREATE INDEX IF NOT EXISTS idx_asaas_splits_recipient_type 
ON public.asaas_splits(recipient_type);

-- 5. Índice composto para consultas comuns (subscription + status)
CREATE INDEX IF NOT EXISTS idx_asaas_splits_subscription_status 
ON public.asaas_splits(subscription_id, status);

-- ============================================
-- ADICIONAR COMENTÁRIOS EXPLICATIVOS
-- ============================================

COMMENT ON TABLE public.asaas_splits IS 
'Registro de splits de pagamento configurados para divisão entre COMADEMIG, RENUM e afiliados';

COMMENT ON COLUMN public.asaas_splits.subscription_id IS 
'Referência para a assinatura em user_subscriptions';

COMMENT ON COLUMN public.asaas_splits.payment_id IS 
'ID da cobrança no Asaas (para splits de pagamentos específicos)';

COMMENT ON COLUMN public.asaas_splits.recipient_type IS 
'Tipo do destinatário: renum (RENUM), affiliate (Afiliado), comademig (COMADEMIG)';

COMMENT ON COLUMN public.asaas_splits.recipient_name IS 
'Nome do destinatário do split';

COMMENT ON COLUMN public.asaas_splits.wallet_id IS 
'ID da carteira no Asaas que receberá o split';

COMMENT ON COLUMN public.asaas_splits.percentage IS 
'Percentual do split (ex: 20.00 para 20%)';

COMMENT ON COLUMN public.asaas_splits.fixed_value IS 
'Valor fixo do split (alternativa ao percentual)';

COMMENT ON COLUMN public.asaas_splits.status IS 
'Status do split: pending, done, refused, cancelled';

COMMENT ON COLUMN public.asaas_splits.refusal_reason IS 
'Motivo da recusa do split (se status = refused)';

COMMENT ON COLUMN public.asaas_splits.asaas_split_id IS 
'ID do split no Asaas (para rastreamento)';

-- ============================================
-- VALIDAÇÃO FINAL
-- ============================================
DO $$
DECLARE
    v_campos_adicionados INTEGER := 0;
    v_indices_criados INTEGER := 0;
    v_constraints_criados INTEGER := 0;
    v_record_count INTEGER;
BEGIN
    -- Verificar campos adicionados
    SELECT COUNT(*) INTO v_campos_adicionados
    FROM information_schema.columns
    WHERE table_schema = 'public' 
    AND table_name = 'asaas_splits'
    AND column_name IN ('subscription_id', 'payment_id', 'recipient_type', 'recipient_name');
    
    -- Verificar índices criados
    SELECT COUNT(*) INTO v_indices_criados
    FROM pg_indexes
    WHERE schemaname = 'public' 
    AND tablename = 'asaas_splits'
    AND indexname IN (
        'idx_asaas_splits_subscription_id',
        'idx_asaas_splits_payment_id',
        'idx_asaas_splits_status',
        'idx_asaas_splits_recipient_type',
        'idx_asaas_splits_subscription_status'
    );
    
    -- Verificar constraints criados
    SELECT COUNT(*) INTO v_constraints_criados
    FROM information_schema.table_constraints
    WHERE constraint_schema = 'public' 
    AND table_name = 'asaas_splits'
    AND constraint_name IN (
        'asaas_splits_status_check',
        'asaas_splits_recipient_type_check',
        'asaas_splits_asaas_split_id_key'
    );
    
    -- Contar registros (para garantir que nenhum foi perdido)
    SELECT COUNT(*) INTO v_record_count FROM asaas_splits;
    
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'VALIDAÇÃO FINAL';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ Campos adicionados: %/4', v_campos_adicionados;
    RAISE NOTICE '✅ Índices criados: %/5', v_indices_criados;
    RAISE NOTICE '✅ Constraints criados: %/3', v_constraints_criados;
    RAISE NOTICE '✅ Registros preservados: %', v_record_count;
    RAISE NOTICE '';
    
    IF v_campos_adicionados < 4 THEN
        RAISE WARNING '⚠️ Alguns campos não foram adicionados!';
    END IF;
    
    IF v_indices_criados < 5 THEN
        RAISE WARNING '⚠️ Alguns índices não foram criados!';
    END IF;
    
    IF v_constraints_criados < 3 THEN
        RAISE WARNING '⚠️ Alguns constraints não foram criados!';
    END IF;
    
    IF v_campos_adicionados = 4 AND v_indices_criados = 5 AND v_constraints_criados = 3 THEN
        RAISE NOTICE '🎉 MIGRAÇÃO CONCLUÍDA COM SUCESSO!';
        RAISE NOTICE '✅ Tabela asaas_splits atualizada e pronta para uso';
    END IF;
END $$;

-- ============================================
-- NOTAS
-- ============================================
-- Esta migração é NÃO DESTRUTIVA:
-- - Adiciona apenas novas colunas (nullable)
-- - Não afeta dados existentes (tabela está vazia)
-- - Compatível com código atual
-- - Pode ser revertida facilmente se necessário
--
-- Campos adicionados:
-- 1. subscription_id: Referência para user_subscriptions
-- 2. payment_id: ID da cobrança no Asaas
-- 3. recipient_type: Tipo do destinatário (renum, affiliate, comademig)
-- 4. recipient_name: Nome do destinatário
--
-- Ajustes realizados:
-- - affiliate_id tornado nullable (nem todo split tem afiliado)
-- - Constraint de status atualizada
-- - UNIQUE adicionado em asaas_split_id
-- - Constraint para recipient_type
--
-- Índices criados para otimizar:
-- - Buscas por assinatura
-- - Buscas por pagamento
-- - Filtros por status
-- - Filtros por tipo de destinatário
-- - Consultas combinadas (subscription + status)
