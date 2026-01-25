-- Post-Migration Cleanup
-- Remove campos e estruturas temporárias após migração completa
-- Requirements: 9.4

-- Função para verificar se migração está completa
CREATE OR REPLACE FUNCTION check_migration_complete()
RETURNS BOOLEAN AS $$
DECLARE
    rollout_percentage INTEGER;
    is_enabled BOOLEAN;
BEGIN
    -- Verificar se Payment First Flow está em 100%
    SELECT ff.rollout_percentage, ff.is_enabled 
    INTO rollout_percentage, is_enabled
    FROM feature_flags ff 
    WHERE ff.name = 'payment_first_flow';
    
    -- Retornar true se estiver 100% ativo
    RETURN (rollout_percentage = 100 AND is_enabled = TRUE);
END;
$$ LANGUAGE plpgsql;

-- Função para limpar dados temporários
CREATE OR REPLACE FUNCTION cleanup_temporary_data()
RETURNS TEXT AS $$
DECLARE
    cleanup_count INTEGER := 0;
    result_text TEXT := '';
BEGIN
    -- Verificar se migração está completa
    IF NOT check_migration_complete() THEN
        RETURN 'ERRO: Migração não está 100% completa. Limpeza cancelada.';
    END IF;
    
    -- Limpar registros antigos de pending_subscriptions que foram processados
    DELETE FROM pending_subscriptions 
    WHERE status = 'completed' 
    AND created_at < NOW() - INTERVAL '30 days';
    
    GET DIAGNOSTICS cleanup_count = ROW_COUNT;
    result_text := result_text || 'Removidos ' || cleanup_count || ' registros antigos de pending_subscriptions. ';
    
    -- Limpar registros antigos de pending_completions que foram processados
    DELETE FROM pending_completions 
    WHERE status = 'completed' 
    AND created_at < NOW() - INTERVAL '30 days';
    
    GET DIAGNOSTICS cleanup_count = ROW_COUNT;
    result_text := result_text || 'Removidos ' || cleanup_count || ' registros antigos de pending_completions. ';
    
    -- Limpar logs antigos (manter apenas últimos 90 dias)
    DELETE FROM payment_first_flow_logs 
    WHERE created_at < NOW() - INTERVAL '90 days';
    
    GET DIAGNOSTICS cleanup_count = ROW_COUNT;
    result_text := result_text || 'Removidos ' || cleanup_count || ' logs antigos. ';
    
    -- Limpar feature flags temporárias
    DELETE FROM feature_flags 
    WHERE name IN (
        'payment_first_flow_beta',
        'payment_first_flow_test',
        'legacy_payment_flow_fallback'
    );
    
    GET DIAGNOSTICS cleanup_count = ROW_COUNT;
    result_text := result_text || 'Removidas ' || cleanup_count || ' feature flags temporárias. ';
    
    RETURN result_text || 'Limpeza concluída com sucesso.';
END;
$$ LANGUAGE plpgsql;

-- Função para otimizar tabelas após limpeza
CREATE OR REPLACE FUNCTION optimize_tables_post_cleanup()
RETURNS TEXT AS $$
BEGIN
    -- Atualizar estatísticas das tabelas principais
    ANALYZE profiles;
    ANALYZE user_subscriptions;
    ANALYZE asaas_cobrancas;
    ANALYZE pending_subscriptions;
    ANALYZE pending_completions;
    ANALYZE payment_first_flow_logs;
    ANALYZE feature_flags;
    
    -- Vacuum para recuperar espaço
    VACUUM (ANALYZE) pending_subscriptions;
    VACUUM (ANALYZE) pending_completions;
    VACUUM (ANALYZE) payment_first_flow_logs;
    
    RETURN 'Otimização de tabelas concluída.';
END;
$$ LANGUAGE plpgsql;

-- Adicionar índices para performance pós-migração
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_payment_confirmed_at 
ON profiles(payment_confirmed_at) 
WHERE payment_confirmed_at IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_subscriptions_processing_context 
ON user_subscriptions(processing_context) 
WHERE processing_context IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payment_first_flow_logs_cleanup 
ON payment_first_flow_logs(created_at, event_type) 
WHERE created_at > NOW() - INTERVAL '90 days';

-- Criar view para monitoramento pós-migração
CREATE OR REPLACE VIEW post_migration_stats AS
SELECT 
    'profiles' as table_name,
    COUNT(*) as total_records,
    COUNT(*) FILTER (WHERE payment_confirmed_at IS NOT NULL) as payment_first_flow_records,
    COUNT(*) FILTER (WHERE payment_confirmed_at IS NULL) as legacy_records,
    ROUND(
        (COUNT(*) FILTER (WHERE payment_confirmed_at IS NOT NULL)::DECIMAL / COUNT(*)) * 100, 
        2
    ) as payment_first_flow_percentage
FROM profiles
WHERE status = 'ativo'

UNION ALL

SELECT 
    'user_subscriptions' as table_name,
    COUNT(*) as total_records,
    COUNT(*) FILTER (WHERE processing_context IS NOT NULL) as payment_first_flow_records,
    COUNT(*) FILTER (WHERE processing_context IS NULL) as legacy_records,
    ROUND(
        (COUNT(*) FILTER (WHERE processing_context IS NOT NULL)::DECIMAL / COUNT(*)) * 100, 
        2
    ) as payment_first_flow_percentage
FROM user_subscriptions

UNION ALL

SELECT 
    'pending_subscriptions' as table_name,
    COUNT(*) as total_records,
    COUNT(*) FILTER (WHERE status = 'completed') as completed_records,
    COUNT(*) FILTER (WHERE status = 'pending') as pending_records,
    ROUND(
        (COUNT(*) FILTER (WHERE status = 'completed')::DECIMAL / NULLIF(COUNT(*), 0)) * 100, 
        2
    ) as completion_percentage
FROM pending_subscriptions

UNION ALL

SELECT 
    'payment_first_flow_logs' as table_name,
    COUNT(*) as total_records,
    COUNT(*) FILTER (WHERE event_type = 'registration_completed') as successful_registrations,
    COUNT(*) FILTER (WHERE event_type = 'registration_failed') as failed_registrations,
    ROUND(
        (COUNT(*) FILTER (WHERE event_type = 'registration_completed')::DECIMAL / 
         NULLIF(COUNT(*) FILTER (WHERE event_type IN ('registration_completed', 'registration_failed')), 0)) * 100, 
        2
    ) as success_rate_percentage
FROM payment_first_flow_logs
WHERE created_at > NOW() - INTERVAL '30 days';

-- Criar função para relatório de migração
CREATE OR REPLACE FUNCTION generate_migration_report()
RETURNS TABLE(
    metric_name TEXT,
    metric_value TEXT,
    description TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        'Migration Status'::TEXT as metric_name,
        CASE 
            WHEN check_migration_complete() THEN 'COMPLETE (100%)'
            ELSE 'INCOMPLETE'
        END as metric_value,
        'Status da migração Payment First Flow'::TEXT as description
    
    UNION ALL
    
    SELECT 
        'Total Active Users'::TEXT,
        COUNT(*)::TEXT,
        'Usuários ativos no sistema'::TEXT
    FROM profiles 
    WHERE status = 'ativo'
    
    UNION ALL
    
    SELECT 
        'Payment First Flow Users'::TEXT,
        COUNT(*)::TEXT,
        'Usuários criados via Payment First Flow'::TEXT
    FROM profiles 
    WHERE payment_confirmed_at IS NOT NULL
    
    UNION ALL
    
    SELECT 
        'Legacy Users'::TEXT,
        COUNT(*)::TEXT,
        'Usuários criados via fluxo antigo'::TEXT
    FROM profiles 
    WHERE payment_confirmed_at IS NULL AND status = 'ativo'
    
    UNION ALL
    
    SELECT 
        'Pending Subscriptions'::TEXT,
        COUNT(*)::TEXT,
        'Assinaturas ainda pendentes'::TEXT
    FROM pending_subscriptions 
    WHERE status = 'pending'
    
    UNION ALL
    
    SELECT 
        'Success Rate (30 days)'::TEXT,
        COALESCE(
            ROUND(
                (COUNT(*) FILTER (WHERE event_type = 'registration_completed')::DECIMAL / 
                 NULLIF(COUNT(*) FILTER (WHERE event_type IN ('registration_completed', 'registration_failed')), 0)) * 100, 
                2
            )::TEXT || '%',
            'N/A'
        ),
        'Taxa de sucesso dos últimos 30 dias'::TEXT
    FROM payment_first_flow_logs
    WHERE created_at > NOW() - INTERVAL '30 days'
    
    UNION ALL
    
    SELECT 
        'Average Processing Time'::TEXT,
        COALESCE(
            ROUND(
                AVG(EXTRACT(EPOCH FROM (completed_at - created_at)))::NUMERIC, 
                2
            )::TEXT || 's',
            'N/A'
        ),
        'Tempo médio de processamento'::TEXT
    FROM payment_first_flow_logs
    WHERE created_at > NOW() - INTERVAL '30 days' 
    AND completed_at IS NOT NULL;
END;
$$ LANGUAGE plpgsql;

-- Comentários para documentação
COMMENT ON FUNCTION check_migration_complete() IS 'Verifica se a migração Payment First Flow está 100% completa';
COMMENT ON FUNCTION cleanup_temporary_data() IS 'Remove dados temporários após migração completa';
COMMENT ON FUNCTION optimize_tables_post_cleanup() IS 'Otimiza tabelas após limpeza de dados';
COMMENT ON VIEW post_migration_stats IS 'Estatísticas de migração para monitoramento';
COMMENT ON FUNCTION generate_migration_report() IS 'Gera relatório completo da migração';

-- Inserir registro de migração
INSERT INTO payment_first_flow_logs (
    event_type,
    context,
    metadata,
    created_at
) VALUES (
    'migration_cleanup_prepared',
    'post_migration_cleanup',
    jsonb_build_object(
        'migration_file', '20260125000004_post_migration_cleanup.sql',
        'functions_created', ARRAY[
            'check_migration_complete',
            'cleanup_temporary_data', 
            'optimize_tables_post_cleanup',
            'generate_migration_report'
        ],
        'indexes_created', ARRAY[
            'idx_profiles_payment_confirmed_at',
            'idx_user_subscriptions_processing_context',
            'idx_payment_first_flow_logs_cleanup'
        ],
        'views_created', ARRAY['post_migration_stats']
    ),
    NOW()
);

-- Instruções de uso (como comentário)
/*
INSTRUÇÕES DE USO PÓS-MIGRAÇÃO:

1. Verificar se migração está completa:
   SELECT check_migration_complete();

2. Gerar relatório de migração:
   SELECT * FROM generate_migration_report();

3. Ver estatísticas de migração:
   SELECT * FROM post_migration_stats;

4. Executar limpeza de dados temporários (APENAS após 100% de migração):
   SELECT cleanup_temporary_data();

5. Otimizar tabelas após limpeza:
   SELECT optimize_tables_post_cleanup();

IMPORTANTE: 
- A função cleanup_temporary_data() só executa se a migração estiver 100% completa
- Sempre fazer backup antes de executar limpeza
- Monitorar sistema por 30 dias após limpeza
*/