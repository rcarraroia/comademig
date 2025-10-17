-- ============================================
-- MIGRAÇÃO DE DADOS: asaas_subscriptions → user_subscriptions
-- ============================================
-- Data: 2025-10-16
-- Objetivo: Migrar dados da tabela antiga para a nova estrutura
-- Status: Tabelas vazias - script preparado para uso futuro
-- ============================================

-- ANÁLISE PRÉVIA REALIZADA:
-- ✅ asaas_subscriptions: 0 registros
-- ✅ user_subscriptions: 0 registros
-- ✅ Nenhuma sobreposição detectada
-- ✅ Migração segura

-- ============================================
-- FUNÇÃO DE MIGRAÇÃO
-- ============================================

CREATE OR REPLACE FUNCTION migrate_asaas_subscriptions_to_user_subscriptions()
RETURNS TABLE (
  migrated_count INTEGER,
  skipped_count INTEGER,
  error_count INTEGER
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_migrated INTEGER := 0;
  v_skipped INTEGER := 0;
  v_errors INTEGER := 0;
  v_record RECORD;
BEGIN
  -- Log início da migração
  RAISE NOTICE 'Iniciando migração de asaas_subscriptions para user_subscriptions';
  
  -- Iterar sobre registros da tabela antiga
  FOR v_record IN 
    SELECT * FROM asaas_subscriptions
    WHERE user_id IS NOT NULL
  LOOP
    BEGIN
      -- Verificar se já existe registro para este usuário
      IF EXISTS (
        SELECT 1 FROM user_subscriptions 
        WHERE user_id = v_record.user_id
      ) THEN
        -- Registro já existe - pular
        v_skipped := v_skipped + 1;
        RAISE NOTICE 'Pulando user_id % - já existe em user_subscriptions', v_record.user_id;
        CONTINUE;
      END IF;
      
      -- Inserir na nova tabela
      INSERT INTO user_subscriptions (
        user_id,
        plan_id,
        asaas_subscription_id,
        asaas_customer_id,
        status,
        billing_type,
        cycle,
        value,
        next_due_date,
        started_at,
        ended_at,
        created_at,
        updated_at
      ) VALUES (
        v_record.user_id,
        v_record.plan_id,
        v_record.asaas_subscription_id,
        v_record.asaas_customer_id,
        COALESCE(v_record.status, 'pending'),
        COALESCE(v_record.billing_type, 'CREDIT_CARD'),
        COALESCE(v_record.cycle, 'MONTHLY'),
        v_record.value,
        v_record.next_due_date,
        v_record.started_at,
        v_record.ended_at,
        COALESCE(v_record.created_at, NOW()),
        NOW()
      );
      
      v_migrated := v_migrated + 1;
      RAISE NOTICE 'Migrado user_id %', v_record.user_id;
      
    EXCEPTION WHEN OTHERS THEN
      v_errors := v_errors + 1;
      RAISE WARNING 'Erro ao migrar user_id %: %', v_record.user_id, SQLERRM;
    END;
  END LOOP;
  
  -- Log final
  RAISE NOTICE 'Migração concluída: % migrados, % pulados, % erros', v_migrated, v_skipped, v_errors;
  
  -- Retornar estatísticas
  RETURN QUERY SELECT v_migrated, v_skipped, v_errors;
END;
$$;

-- ============================================
-- COMENTÁRIOS
-- ============================================

COMMENT ON FUNCTION migrate_asaas_subscriptions_to_user_subscriptions() IS 
'Migra dados de asaas_subscriptions para user_subscriptions.
Pula registros duplicados e registra erros.
Retorna: (migrated_count, skipped_count, error_count)';

-- ============================================
-- INSTRUÇÕES DE USO
-- ============================================

-- Para executar a migração manualmente:
-- SELECT * FROM migrate_asaas_subscriptions_to_user_subscriptions();

-- Para verificar resultado:
-- SELECT COUNT(*) as total_antigo FROM asaas_subscriptions;
-- SELECT COUNT(*) as total_novo FROM user_subscriptions;

-- ============================================
-- VALIDAÇÃO PÓS-MIGRAÇÃO
-- ============================================

-- Verificar se há dados para migrar
DO $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count FROM asaas_subscriptions;
  
  IF v_count = 0 THEN
    RAISE NOTICE '✅ Nenhum dado para migrar - tabela asaas_subscriptions está vazia';
  ELSE
    RAISE NOTICE '⚠️ Encontrados % registros em asaas_subscriptions', v_count;
    RAISE NOTICE 'Execute: SELECT * FROM migrate_asaas_subscriptions_to_user_subscriptions();';
  END IF;
END $$;
