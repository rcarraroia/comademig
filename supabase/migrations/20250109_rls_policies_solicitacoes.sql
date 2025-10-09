-- ============================================================================
-- MIGRATION: RLS Policies para tabela solicitacoes_servicos
-- Data: 2025-01-09
-- Descrição: Configurar políticas de segurança para solicitações
-- ============================================================================

-- 1. Ativar RLS na tabela solicitacoes_servicos
ALTER TABLE solicitacoes_servicos ENABLE ROW LEVEL SECURITY;

-- 2. Policy: Usuário vê apenas suas próprias solicitações
CREATE POLICY "Usuário vê apenas suas solicitações"
  ON solicitacoes_servicos
  FOR SELECT
  USING (
    auth.uid() = user_id
  );

-- 3. Policy: Admin vê todas as solicitações
CREATE POLICY "Admin vê todas as solicitações"
  ON solicitacoes_servicos
  FOR SELECT
  USING (
    auth.jwt() ->> 'tipo_membro' IN ('super_admin', 'admin')
  );

-- 4. Policy: Apenas service role pode inserir solicitações (via webhook)
-- Nota: Esta policy permite INSERT apenas para service_role (backend)
-- Usuários comuns NÃO podem inserir diretamente
CREATE POLICY "Apenas service role pode inserir solicitações"
  ON solicitacoes_servicos
  FOR INSERT
  WITH CHECK (
    auth.role() = 'service_role'
  );

-- 5. Policy: Apenas admin pode atualizar solicitações
CREATE POLICY "Apenas admin pode atualizar solicitações"
  ON solicitacoes_servicos
  FOR UPDATE
  USING (
    auth.jwt() ->> 'tipo_membro' IN ('super_admin', 'admin')
  )
  WITH CHECK (
    auth.jwt() ->> 'tipo_membro' IN ('super_admin', 'admin')
  );

-- 6. Policy: Ninguém pode deletar solicitações (soft delete apenas)
-- Não criar policy de DELETE = ninguém pode deletar

-- 7. Validar que RLS está ativo
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'solicitacoes_servicos' 
    AND rowsecurity = true
  ) THEN
    RAISE EXCEPTION 'RLS não está ativo na tabela solicitacoes_servicos!';
  END IF;
  
  RAISE NOTICE '✅ RLS policies configuradas com sucesso para solicitacoes_servicos!';
  RAISE NOTICE '⚠️ IMPORTANTE: Apenas service_role pode inserir solicitações (via webhook)';
  RAISE NOTICE '⚠️ Usuários comuns NÃO podem inserir diretamente';
END $$;
