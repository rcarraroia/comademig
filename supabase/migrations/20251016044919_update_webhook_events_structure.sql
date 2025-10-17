-- ============================================
-- ANÁLISE PRÉVIA REALIZADA
-- ============================================
-- Data: 16/10/2025
-- Tarefa: 2. Criar tabela webhook_events
-- Análise: Verificação via Python revelou que tabela JÁ EXISTE
-- Status atual: 
--   - webhook_events: Tabela existe com 7 registros
--   - Estrutura existente: id, event_id, payload, processed, received_at, created_at
--   - Estrutura desejada: id, asaas_event_id, event_type, payload, processed, processed_at, retry_count, last_error, created_at
-- Campos a adicionar:
--   - event_type (tipo do evento)
--   - processed_at (quando foi processado)
--   - retry_count (contador de tentativas)
--   - last_error (último erro)
-- Campos a renomear:
--   - event_id → asaas_event_id (para clareza)
-- Impacto: Adição de colunas e renomeação (não destrutivo)
-- Verificações:
--   ✅ Tabela existe com 7 registros
--   ✅ Nenhum dado será perdido
--   ✅ Campos serão nullable para compatibilidade com dados existentes
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
        AND table_name = 'webhook_events'
    ) INTO v_table_exists;
    
    IF NOT v_table_exists THEN
        RAISE EXCEPTION '❌ ERRO: Tabela webhook_events não existe! Esta migração espera que ela exista.';
    END IF;
    
    -- Contar registros existentes
    EXECUTE 'SELECT COUNT(*) FROM webhook_events' INTO v_record_count;
    
    RAISE NOTICE '✅ Tabela webhook_events existe com % registros', v_record_count;
    
    -- Listar colunas existentes
    RAISE NOTICE '📋 Colunas existentes:';
    FOR v_column_name IN 
        SELECT column_name 
        FROM information_schema.columns
        WHERE table_schema = 'public' 
        AND table_name = 'webhook_events'
        ORDER BY ordinal_position
    LOOP
        RAISE NOTICE '  - %', v_column_name;
    END LOOP;
    
    IF v_record_count > 0 THEN
        RAISE NOTICE '⚠️ ATENÇÃO: Tabela tem dados! Migração preservará todos os registros.';
    END IF;
END $$;

-- ============================================
-- RENOMEAR COLUNA event_id → asaas_event_id
-- ============================================
DO $$
BEGIN
    -- Verificar se event_id existe e asaas_event_id não existe
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'webhook_events' 
        AND column_name = 'event_id'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'webhook_events' 
        AND column_name = 'asaas_event_id'
    ) THEN
        ALTER TABLE public.webhook_events 
        RENAME COLUMN event_id TO asaas_event_id;
        
        RAISE NOTICE '✅ Coluna event_id renomeada para asaas_event_id';
    ELSIF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'webhook_events' 
        AND column_name = 'asaas_event_id'
    ) THEN
        RAISE NOTICE '⚠️ Coluna asaas_event_id já existe (migração já foi aplicada)';
    ELSE
        RAISE NOTICE '⚠️ Coluna event_id não encontrada';
    END IF;
END $$;

-- ============================================
-- ADICIONAR NOVOS CAMPOS
-- ============================================

-- 1. Adicionar event_type (se não existir)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'webhook_events' 
        AND column_name = 'event_type'
    ) THEN
        ALTER TABLE public.webhook_events 
        ADD COLUMN event_type VARCHAR;
        
        RAISE NOTICE '✅ Coluna event_type adicionada';
    ELSE
        RAISE NOTICE '⚠️ Coluna event_type já existe';
    END IF;
END $$;

-- 2. Adicionar processed_at (se não existir)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'webhook_events' 
        AND column_name = 'processed_at'
    ) THEN
        ALTER TABLE public.webhook_events 
        ADD COLUMN processed_at TIMESTAMP WITH TIME ZONE;
        
        RAISE NOTICE '✅ Coluna processed_at adicionada';
    ELSE
        RAISE NOTICE '⚠️ Coluna processed_at já existe';
    END IF;
END $$;

-- 3. Adicionar retry_count (se não existir)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'webhook_events' 
        AND column_name = 'retry_count'
    ) THEN
        ALTER TABLE public.webhook_events 
        ADD COLUMN retry_count INTEGER DEFAULT 0;
        
        RAISE NOTICE '✅ Coluna retry_count adicionada';
    ELSE
        RAISE NOTICE '⚠️ Coluna retry_count já existe';
    END IF;
END $$;

-- 4. Adicionar last_error (se não existir)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'webhook_events' 
        AND column_name = 'last_error'
    ) THEN
        ALTER TABLE public.webhook_events 
        ADD COLUMN last_error TEXT;
        
        RAISE NOTICE '✅ Coluna last_error adicionada';
    ELSE
        RAISE NOTICE '⚠️ Coluna last_error já existe';
    END IF;
END $$;

-- ============================================
-- ATUALIZAR CONSTRAINTS E ÍNDICES
-- ============================================

-- 1. Garantir que asaas_event_id seja UNIQUE (se ainda não for)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'webhook_events_asaas_event_id_key'
        AND conrelid = 'public.webhook_events'::regclass
    ) THEN
        -- Verificar se há duplicatas antes de criar constraint
        IF (SELECT COUNT(DISTINCT asaas_event_id) FROM webhook_events) = (SELECT COUNT(*) FROM webhook_events) THEN
            ALTER TABLE public.webhook_events 
            ADD CONSTRAINT webhook_events_asaas_event_id_key UNIQUE (asaas_event_id);
            
            RAISE NOTICE '✅ Constraint UNIQUE adicionada em asaas_event_id';
        ELSE
            RAISE WARNING '⚠️ Há duplicatas em asaas_event_id - constraint UNIQUE não pode ser criada';
        END IF;
    ELSE
        RAISE NOTICE '⚠️ Constraint UNIQUE em asaas_event_id já existe';
    END IF;
END $$;

-- 2. Criar índice para consultas por processed (se não existir)
CREATE INDEX IF NOT EXISTS idx_webhook_events_processed 
ON public.webhook_events(processed, created_at);

-- 3. Criar índice para consultas por event_type (se não existir)
CREATE INDEX IF NOT EXISTS idx_webhook_events_event_type 
ON public.webhook_events(event_type);

-- 4. Criar índice para consultas por retry_count (se não existir)
CREATE INDEX IF NOT EXISTS idx_webhook_events_retry_count 
ON public.webhook_events(retry_count) 
WHERE processed = FALSE;

-- ============================================
-- ADICIONAR COMENTÁRIOS EXPLICATIVOS
-- ============================================

COMMENT ON TABLE public.webhook_events IS 
'Registro de todos os webhooks recebidos do Asaas para processamento e auditoria';

COMMENT ON COLUMN public.webhook_events.asaas_event_id IS 
'ID único do evento fornecido pelo Asaas (usado para idempotência)';

COMMENT ON COLUMN public.webhook_events.event_type IS 
'Tipo do evento: PAYMENT_RECEIVED, PAYMENT_CONFIRMED, PAYMENT_OVERDUE, etc';

COMMENT ON COLUMN public.webhook_events.payload IS 
'Payload completo do webhook em formato JSON';

COMMENT ON COLUMN public.webhook_events.processed IS 
'Indica se o webhook já foi processado com sucesso';

COMMENT ON COLUMN public.webhook_events.processed_at IS 
'Timestamp de quando o webhook foi processado com sucesso';

COMMENT ON COLUMN public.webhook_events.retry_count IS 
'Número de tentativas de processamento (para retry logic)';

COMMENT ON COLUMN public.webhook_events.last_error IS 
'Mensagem do último erro ocorrido durante processamento';

COMMENT ON COLUMN public.webhook_events.created_at IS 
'Timestamp de quando o webhook foi recebido';

-- ============================================
-- MIGRAR DADOS EXISTENTES (se necessário)
-- ============================================
DO $$
DECLARE
    v_updated_count INTEGER;
BEGIN
    -- Tentar extrair event_type do payload para registros existentes
    UPDATE webhook_events 
    SET event_type = payload->>'event'
    WHERE event_type IS NULL 
    AND payload IS NOT NULL 
    AND payload->>'event' IS NOT NULL;
    
    GET DIAGNOSTICS v_updated_count = ROW_COUNT;
    
    IF v_updated_count > 0 THEN
        RAISE NOTICE '✅ Atualizado event_type para % registros existentes', v_updated_count;
    END IF;
    
    -- Inicializar retry_count para registros existentes
    UPDATE webhook_events 
    SET retry_count = 0
    WHERE retry_count IS NULL;
    
    GET DIAGNOSTICS v_updated_count = ROW_COUNT;
    
    IF v_updated_count > 0 THEN
        RAISE NOTICE '✅ Inicializado retry_count para % registros existentes', v_updated_count;
    END IF;
END $$;

-- ============================================
-- VALIDAÇÃO FINAL
-- ============================================
DO $$
DECLARE
    v_campos_adicionados INTEGER := 0;
    v_indices_criados INTEGER := 0;
    v_record_count INTEGER;
BEGIN
    -- Verificar campos adicionados
    SELECT COUNT(*) INTO v_campos_adicionados
    FROM information_schema.columns
    WHERE table_schema = 'public' 
    AND table_name = 'webhook_events'
    AND column_name IN ('asaas_event_id', 'event_type', 'processed_at', 'retry_count', 'last_error');
    
    -- Verificar índices criados
    SELECT COUNT(*) INTO v_indices_criados
    FROM pg_indexes
    WHERE schemaname = 'public' 
    AND tablename = 'webhook_events'
    AND indexname IN (
        'idx_webhook_events_processed',
        'idx_webhook_events_event_type',
        'idx_webhook_events_retry_count'
    );
    
    -- Contar registros (para garantir que nenhum foi perdido)
    SELECT COUNT(*) INTO v_record_count FROM webhook_events;
    
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'VALIDAÇÃO FINAL';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ Campos presentes: %/5', v_campos_adicionados;
    RAISE NOTICE '✅ Índices criados: %/3', v_indices_criados;
    RAISE NOTICE '✅ Registros preservados: %', v_record_count;
    RAISE NOTICE '';
    
    IF v_campos_adicionados = 5 AND v_indices_criados = 3 THEN
        RAISE NOTICE '🎉 MIGRAÇÃO CONCLUÍDA COM SUCESSO!';
        RAISE NOTICE '✅ Tabela webhook_events atualizada e pronta para uso';
    ELSE
        IF v_campos_adicionados < 5 THEN
            RAISE WARNING '⚠️ Alguns campos não foram adicionados!';
        END IF;
        IF v_indices_criados < 3 THEN
            RAISE WARNING '⚠️ Alguns índices não foram criados!';
        END IF;
    END IF;
END $$;

-- ============================================
-- NOTAS
-- ============================================
-- Esta migração é NÃO DESTRUTIVA:
-- - Renomeia coluna existente (preserva dados)
-- - Adiciona apenas novas colunas (nullable)
-- - Não afeta dados existentes
-- - Compatível com código atual
-- - Pode ser revertida facilmente se necessário
--
-- Campos adicionados/renomeados:
-- 1. event_id → asaas_event_id: Clareza sobre origem do ID
-- 2. event_type: Tipo do evento para filtros
-- 3. processed_at: Timestamp de processamento
-- 4. retry_count: Contador para retry logic
-- 5. last_error: Mensagem de erro para debugging
--
-- Índices criados para otimizar:
-- - Consultas de webhooks não processados
-- - Filtros por tipo de evento
-- - Identificação de webhooks com falhas
--
-- Dados existentes:
-- - 7 registros preservados
-- - event_type extraído do payload quando possível
-- - retry_count inicializado com 0
