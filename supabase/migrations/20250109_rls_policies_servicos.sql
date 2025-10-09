-- ============================================================================
-- MIGRATION: RLS Policies para tabela servicos
-- Data: 2025-01-09
-- Descrição: Configurar políticas de segurança para acesso aos serviços
-- ============================================================================

-- 1. Ativar RLS na tabela servicos
ALTER TABLE servicos ENABLE ROW LEVEL SECURITY;

-- 2. Policy: Todos podem ver serviços ativos (SELECT público)
CREATE POLICY "Serviços ativos são públicos"
  ON servicos
  FOR SELECT
  USING (is_active = true);

-- 3. Policy: Admin pode ver todos os serviços (ativos e inativos)
CREATE POLICY "Admin vê todos os serviços"
  ON servicos
  FOR SELECT
  USING (
    auth.jwt() ->> 'tipo_membro' IN ('super_admin', 'admin')
  );

-- 4. Policy: Apenas admin pode criar serviços
CREATE POLICY "Apenas admin pode criar serviços"
  ON servicos
  FOR INSERT
  WITH CHECK (
    auth.jwt() ->> 'tipo_membro' IN ('super_admin', 'admin')
  );

-- 5. Policy: Apenas admin pode atualizar serviços
CREATE POLICY "Apenas admin pode atualizar serviços"
  ON servicos
  FOR UPDATE
  USING (
    auth.jwt() ->> 'tipo_membro' IN ('super_admin', 'admin')
  )
  WITH CHECK (
    auth.jwt() ->> 'tipo_membro' IN ('super_admin', 'admin')
  );

-- 6. Policy: Apenas super_admin pode deletar serviços
CREATE POLICY "Apenas super_admin pode deletar serviços"
  ON servicos
  FOR DELETE
  USING (
    auth.jwt() ->> 'tipo_membro' = 'super_admin'
  );

-- 7. Ativar RLS na tabela servico_exigencias
ALTER TABLE servico_exigencias ENABLE ROW LEVEL SECURITY;

-- 8. Policy: Todos podem ver exigências de serviços ativos
CREATE POLICY "Exigências de serviços ativos são públicas"
  ON servico_exigencias
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM servicos 
      WHERE servicos.id = servico_exigencias.servico_id 
      AND servicos.is_active = true
    )
  );

-- 9. Policy: Admin pode ver todas as exigências
CREATE POLICY "Admin vê todas as exigências"
  ON servico_exigencias
  FOR SELECT
  USING (
    auth.jwt() ->> 'tipo_membro' IN ('super_admin', 'admin')
  );

-- 10. Policy: Apenas admin pode gerenciar exigências
CREATE POLICY "Apenas admin pode gerenciar exigências"
  ON servico_exigencias
  FOR ALL
  USING (
    auth.jwt() ->> 'tipo_membro' IN ('super_admin', 'admin')
  )
  WITH CHECK (
    auth.jwt() ->> 'tipo_membro' IN ('super_admin', 'admin')
  );

-- 11. Validar que RLS está ativo
DO $$
BEGIN
  -- Verificar servicos
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'servicos' 
    AND rowsecurity = true
  ) THEN
    RAISE EXCEPTION 'RLS não está ativo na tabela servicos!';
  END IF;
  
  -- Verificar servico_exigencias
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'servico_exigencias' 
    AND rowsecurity = true
  ) THEN
    RAISE EXCEPTION 'RLS não está ativo na tabela servico_exigencias!';
  END IF;
  
  RAISE NOTICE '✅ RLS policies configuradas com sucesso para servicos e servico_exigencias!';
END $$;
