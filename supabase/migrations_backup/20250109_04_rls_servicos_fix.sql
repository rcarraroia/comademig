-- ============================================================================
-- MIGRATION: Configurar RLS para tabela servicos (CORRIGIDO)
-- Data: 2025-01-09
-- Descrição: Políticas de segurança para acesso aos serviços
-- ============================================================================

-- 1. Habilitar RLS na tabela servicos
ALTER TABLE servicos ENABLE ROW LEVEL SECURITY;

-- 2. Dropar policies existentes (se houver)
DROP POLICY IF EXISTS "Usuários podem ver serviços ativos" ON servicos;
DROP POLICY IF EXISTS "Admin pode ver todos os serviços" ON servicos;
DROP POLICY IF EXISTS "Admin pode criar serviços" ON servicos;
DROP POLICY IF EXISTS "Admin pode atualizar serviços" ON servicos;
DROP POLICY IF EXISTS "Admin pode deletar serviços" ON servicos;

-- 3. Policy: SELECT para serviços ativos (público)
CREATE POLICY "Usuários podem ver serviços ativos"
  ON servicos
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- 4. Policy: SELECT para admin (todos os serviços)
CREATE POLICY "Admin pode ver todos os serviços"
  ON servicos
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.tipo_membro IN ('admin', 'super_admin')
    )
  );

-- 5. Policy: INSERT para admin
CREATE POLICY "Admin pode criar serviços"
  ON servicos
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.tipo_membro IN ('admin', 'super_admin')
    )
  );

-- 6. Policy: UPDATE para admin
CREATE POLICY "Admin pode atualizar serviços"
  ON servicos
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

-- 7. Policy: DELETE para admin
CREATE POLICY "Admin pode deletar serviços"
  ON servicos
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
-- VALIDAÇÃO
-- ============================================================================

DO $$
DECLARE
  v_rls_enabled BOOLEAN;
  v_policy_count INTEGER;
BEGIN
  -- Verificar se RLS está habilitado
  SELECT relrowsecurity INTO v_rls_enabled
  FROM pg_class
  WHERE relname = 'servicos';
  
  IF v_rls_enabled THEN
    RAISE NOTICE '✅ RLS habilitado na tabela servicos';
  ELSE
    RAISE EXCEPTION '❌ RLS não está habilitado na tabela servicos';
  END IF;
  
  -- Contar policies criadas
  SELECT COUNT(*) INTO v_policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
  AND tablename = 'servicos';
  
  RAISE NOTICE '✅ Policies criadas: %', v_policy_count;
  
  IF v_policy_count >= 5 THEN
    RAISE NOTICE '✅ SUCESSO: Todas as policies foram criadas';
  ELSE
    RAISE WARNING '⚠️ ATENÇÃO: Esperado 5 policies, encontrado %', v_policy_count;
  END IF;
  
  RAISE NOTICE '✅ SUCESSO: RLS configurado para servicos';
END $$;

COMMENT ON TABLE servicos IS 
'Tabela de serviços com RLS habilitado. '
'Usuários comuns veem apenas serviços ativos. '
'Administradores (tipo_membro = admin ou super_admin) têm acesso completo.';
