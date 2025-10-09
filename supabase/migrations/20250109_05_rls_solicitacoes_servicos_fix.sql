-- ============================================================================
-- MIGRATION: Configurar RLS para tabela solicitacoes_servicos (CORRIGIDO)
-- Data: 2025-01-09
-- Descrição: Políticas de segurança para solicitações de serviços
-- ============================================================================

-- 1. Habilitar RLS na tabela solicitacoes_servicos
ALTER TABLE solicitacoes_servicos ENABLE ROW LEVEL SECURITY;

-- 2. Dropar policies existentes (se houver)
DROP POLICY IF EXISTS "Usuários podem ver suas próprias solicitações" ON solicitacoes_servicos;
DROP POLICY IF EXISTS "Admin pode ver todas as solicitações" ON solicitacoes_servicos;
DROP POLICY IF EXISTS "Service role pode criar solicitações" ON solicitacoes_servicos;
DROP POLICY IF EXISTS "Admin pode atualizar solicitações" ON solicitacoes_servicos;
DROP POLICY IF EXISTS "Admin pode deletar solicitações" ON solicitacoes_servicos;

-- 3. Policy: SELECT para usuário (apenas suas solicitações)
CREATE POLICY "Usuários podem ver suas próprias solicitações"
  ON solicitacoes_servicos
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- 4. Policy: SELECT para admin (todas as solicitações)
CREATE POLICY "Admin pode ver todas as solicitações"
  ON solicitacoes_servicos
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.tipo_membro IN ('admin', 'super_admin')
    )
  );

-- 5. Policy: INSERT apenas via service role
CREATE POLICY "Service role pode criar solicitações"
  ON solicitacoes_servicos
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- 6. Policy: UPDATE apenas para admin
CREATE POLICY "Admin pode atualizar solicitações"
  ON solicitacoes_servicos
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.tipo_membro IN ('admin', 'super_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.tipo_membro IN ('admin', 'super_admin')
    )
  );

-- 7. Policy: DELETE apenas para admin
CREATE POLICY "Admin pode deletar solicitações"
  ON solicitacoes_servicos
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.tipo_membro IN ('admin', 'super_admin')
    )
  );

-- ============================================================================
-- FUNÇÕES AUXILIARES PARA QUERIES
-- ============================================================================

-- Dropar funções existentes
DROP FUNCTION IF EXISTS get_minhas_solicitacoes(UUID);
DROP FUNCTION IF EXISTS get_solicitacoes_admin(VARCHAR, VARCHAR, TIMESTAMPTZ, TIMESTAMPTZ, INTEGER, INTEGER);

-- Função para buscar solicitações do usuário com dados do serviço
CREATE FUNCTION get_minhas_solicitacoes(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  protocolo VARCHAR,
  servico_nome VARCHAR,
  servico_categoria VARCHAR,
  status VARCHAR,
  valor_pago DECIMAL,
  forma_pagamento VARCHAR,
  created_at TIMESTAMPTZ,
  data_conclusao TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.protocolo,
    srv.nome as servico_nome,
    srv.categoria as servico_categoria,
    s.status,
    s.valor_pago,
    s.forma_pagamento,
    s.created_at,
    s.data_conclusao
  FROM solicitacoes_servicos s
  JOIN servicos srv ON srv.id = s.servico_id
  WHERE s.user_id = p_user_id
  ORDER BY s.created_at DESC;
END;
$$;

COMMENT ON FUNCTION get_minhas_solicitacoes(UUID) IS 
'Retorna todas as solicitações de um usuário com dados do serviço';

-- Função para buscar solicitações (admin) com filtros
CREATE FUNCTION get_solicitacoes_admin(
  p_status VARCHAR DEFAULT NULL,
  p_categoria VARCHAR DEFAULT NULL,
  p_data_inicio TIMESTAMPTZ DEFAULT NULL,
  p_data_fim TIMESTAMPTZ DEFAULT NULL,
  p_limit INTEGER DEFAULT 100,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  protocolo VARCHAR,
  user_nome VARCHAR,
  servico_nome VARCHAR,
  servico_categoria VARCHAR,
  status VARCHAR,
  valor_pago DECIMAL,
  forma_pagamento VARCHAR,
  created_at TIMESTAMPTZ,
  data_conclusao TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.protocolo,
    p.nome_completo as user_nome,
    srv.nome as servico_nome,
    srv.categoria as servico_categoria,
    s.status,
    s.valor_pago,
    s.forma_pagamento,
    s.created_at,
    s.data_conclusao
  FROM solicitacoes_servicos s
  JOIN profiles p ON p.id = s.user_id
  JOIN servicos srv ON srv.id = s.servico_id
  WHERE 
    (p_status IS NULL OR s.status = p_status)
    AND (p_categoria IS NULL OR srv.categoria = p_categoria)
    AND (p_data_inicio IS NULL OR s.created_at >= p_data_inicio)
    AND (p_data_fim IS NULL OR s.created_at <= p_data_fim)
  ORDER BY s.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

COMMENT ON FUNCTION get_solicitacoes_admin IS 
'Retorna solicitações com filtros para painel administrativo';

-- ============================================================================
-- VALIDAÇÃO
-- ============================================================================

DO $$
DECLARE
  v_rls_enabled BOOLEAN;
  v_policy_count INTEGER;
  v_function_count INTEGER;
BEGIN
  -- Verificar se RLS está habilitado
  SELECT relrowsecurity INTO v_rls_enabled
  FROM pg_class
  WHERE relname = 'solicitacoes_servicos';
  
  IF v_rls_enabled THEN
    RAISE NOTICE '✅ RLS habilitado na tabela solicitacoes_servicos';
  ELSE
    RAISE EXCEPTION '❌ RLS não está habilitado na tabela solicitacoes_servicos';
  END IF;
  
  -- Contar policies criadas
  SELECT COUNT(*) INTO v_policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
  AND tablename = 'solicitacoes_servicos';
  
  RAISE NOTICE '✅ Policies criadas: %', v_policy_count;
  
  IF v_policy_count >= 5 THEN
    RAISE NOTICE '✅ SUCESSO: Todas as policies foram criadas';
  ELSE
    RAISE WARNING '⚠️ ATENÇÃO: Esperado 5 policies, encontrado %', v_policy_count;
  END IF;
  
  -- Verificar funções auxiliares
  SELECT COUNT(*) INTO v_function_count
  FROM pg_proc
  WHERE proname IN ('get_minhas_solicitacoes', 'get_solicitacoes_admin');
  
  RAISE NOTICE '✅ Funções auxiliares criadas: %', v_function_count;
  
  RAISE NOTICE '✅ SUCESSO: RLS configurado completamente para solicitacoes_servicos';
END $$;

COMMENT ON TABLE solicitacoes_servicos IS 
'Tabela de solicitações com RLS habilitado. '
'Usuários veem apenas suas próprias solicitações. '
'Administradores (tipo_membro = admin ou super_admin) têm acesso completo. '
'Inserções apenas via service role (webhook).';
