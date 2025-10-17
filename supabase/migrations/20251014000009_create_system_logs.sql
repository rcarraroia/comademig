-- ============================================
-- SISTEMA DE LOGS - Tabela system_logs
-- ============================================
-- Data: 2025-10-14
-- Objetivo: Criar tabela para logs técnicos (Edge Functions, erros, webhooks)
-- Fase: 1 (Mínima - Teste com 2 funções)
--
-- DECISÕES:
-- - Criar apenas system_logs (não alterar audit_logs)
-- - SEM limpeza automática (será manual se necessário)
-- - SEM página admin (por enquanto)
-- - Logs em apenas 2 funções inicialmente
-- ============================================

-- BEGIN;

-- ============================================
-- CRIAR TABELA system_logs
-- ============================================

CREATE TABLE IF NOT EXISTS system_logs (
  -- Identificação
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Nível e Origem
  level TEXT NOT NULL CHECK (level IN ('debug', 'info', 'warning', 'error', 'critical')),
  source TEXT NOT NULL, -- 'edge_function', 'webhook', 'frontend', 'backend'
  function_name TEXT, -- Nome da Edge Function (se aplicável)
  
  -- Contexto do Usuário
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT,
  request_id TEXT,
  
  -- Mensagem e Detalhes
  message TEXT NOT NULL,
  details JSONB DEFAULT '{}'::jsonb,
  
  -- Informações de Erro (se aplicável)
  error_message TEXT,
  error_stack TEXT,
  
  -- Metadata Adicional
  metadata JSONB DEFAULT '{}'::jsonb
);

-- ============================================
-- CRIAR ÍNDICES PARA PERFORMANCE
-- ============================================

-- Índice principal: busca por data (mais recente primeiro)
CREATE INDEX idx_system_logs_created_at ON system_logs(created_at DESC);

-- Índice para filtrar por nível (error, warning, etc)
CREATE INDEX idx_system_logs_level ON system_logs(level);

-- Índice para filtrar por origem
CREATE INDEX idx_system_logs_source ON system_logs(source);

-- Índice para filtrar por função específica
CREATE INDEX idx_system_logs_function_name ON system_logs(function_name) WHERE function_name IS NOT NULL;

-- Índice para buscar logs de usuário específico
CREATE INDEX idx_system_logs_user_id ON system_logs(user_id) WHERE user_id IS NOT NULL;

-- Índice composto para queries comuns (nível + data)
CREATE INDEX idx_system_logs_level_created_at ON system_logs(level, created_at DESC);

-- ============================================
-- HABILITAR RLS
-- ============================================

ALTER TABLE system_logs ENABLE ROW LEVEL SECURITY;

-- ============================================
-- CRIAR POLÍTICAS RLS
-- ============================================

-- POLÍTICA SELECT: Apenas admin/super-admin podem ver logs
CREATE POLICY "Admins can view system logs"
  ON system_logs FOR SELECT
  USING (
    -- Verificar se usuário é admin ou super-admin via app_metadata
    COALESCE((auth.jwt() -> 'app_metadata' ->> 'user_role'), '') IN ('admin', 'super_admin')
  );

-- POLÍTICA INSERT: Edge Functions usam service_role (bypassa RLS)
-- Não precisa de política explícita

-- SEM POLÍTICAS DE UPDATE/DELETE: Logs são imutáveis
-- Apenas admin pode deletar manualmente via SQL se necessário

-- ============================================
-- COMENTÁRIOS NA TABELA
-- ============================================

COMMENT ON TABLE system_logs IS 'Logs técnicos do sistema (Edge Functions, erros, webhooks)';
COMMENT ON COLUMN system_logs.level IS 'Nível do log: debug, info, warning, error, critical';
COMMENT ON COLUMN system_logs.source IS 'Origem do log: edge_function, webhook, frontend, backend';
COMMENT ON COLUMN system_logs.function_name IS 'Nome da Edge Function que gerou o log';
COMMENT ON COLUMN system_logs.message IS 'Mensagem descritiva do evento';
COMMENT ON COLUMN system_logs.details IS 'Detalhes adicionais em formato JSON';
COMMENT ON COLUMN system_logs.error_message IS 'Mensagem de erro (se aplicável)';
COMMENT ON COLUMN system_logs.error_stack IS 'Stack trace do erro (se aplicável)';
COMMENT ON COLUMN system_logs.metadata IS 'Metadata adicional (headers, IP, etc)';

-- ============================================
-- VALIDAÇÃO
-- ============================================

-- Verificar que tabela foi criada
SELECT 'system_logs table created' as status;

-- Verificar índices
SELECT indexname 
FROM pg_indexes 
WHERE tablename = 'system_logs'
ORDER BY indexname;

-- Verificar políticas RLS
SELECT policyname, cmd 
FROM pg_policies 
WHERE tablename = 'system_logs'
ORDER BY policyname;

-- COMMIT;

-- ============================================
-- NOTAS IMPORTANTES
-- ============================================

-- 1. LIMPEZA DE LOGS:
--    - NÃO há limpeza automática
--    - Admin pode deletar manualmente se necessário:
--      DELETE FROM system_logs WHERE created_at < NOW() - INTERVAL '30 days';

-- 2. ACESSO:
--    - Apenas admin/super-admin veem logs via SELECT
--    - Edge Functions inserem via service_role key (bypassa RLS)
--    - Logs são imutáveis (sem UPDATE)

-- 3. PERFORMANCE:
--    - Índices otimizados para queries comuns
--    - JSONB para flexibilidade sem perder performance

-- 4. PRÓXIMOS PASSOS:
--    - Criar logger.ts (função compartilhada)
--    - Adicionar logs em asaas-webhook
--    - Adicionar logs em test-asaas-connectivity
--    - Testar por 1 semana
--    - Se OK, expandir para outras funções
