-- ============================================
-- ANÁLISE PRÉVIA REALIZADA
-- ============================================
-- Data: 2025-01-10
-- Tabelas a proteger: asaas_splits, split_configurations, split_recipients
-- Status atual: Tabelas existem (verificado)
-- Impacto: Criação de políticas RLS (não destrutivo)
-- Verificações:
--   ✅ Tabelas existem
--   ✅ Nenhum dado será perdido
--   ✅ Políticas garantem segurança dos dados sensíveis
-- ============================================

-- ============================================
-- POLÍTICAS RLS PARA MÓDULO DE SPLIT
-- ============================================
-- Este script cria políticas de Row Level Security para as tabelas:
-- - asaas_splits
-- - split_configurations
-- - split_recipients
--
-- Regras de acesso:
-- - Apenas admins e super_admins podem ver splits
-- - Apenas super_admins podem gerenciar configurações de split
-- - Dados financeiros sensíveis protegidos
-- ============================================

-- ============================================
-- 1. HABILITAR RLS NAS TABELAS
-- ============================================

-- Habilitar RLS em asaas_splits
ALTER TABLE asaas_splits ENABLE ROW LEVEL SECURITY;

-- Habilitar RLS em split_configurations
ALTER TABLE split_configurations ENABLE ROW LEVEL SECURITY;

-- Habilitar RLS em split_recipients
ALTER TABLE split_recipients ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 2. POLÍTICAS PARA asaas_splits
-- ============================================

-- Remover políticas existentes se houver
DROP POLICY IF EXISTS "admins_view_splits" ON asaas_splits;
DROP POLICY IF EXISTS "system_create_splits" ON asaas_splits;
DROP POLICY IF EXISTS "system_update_splits" ON asaas_splits;

-- Política: Apenas admins e super_admins podem ver splits
CREATE POLICY "admins_view_splits"
  ON asaas_splits
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND tipo_membro IN ('admin', 'super_admin')
    )
  );

-- Política: Sistema pode criar splits (via edge functions)
CREATE POLICY "system_create_splits"
  ON asaas_splits
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND tipo_membro IN ('admin', 'super_admin')
    )
  );

-- Política: Sistema pode atualizar splits (processar, marcar erro, etc)
CREATE POLICY "system_update_splits"
  ON asaas_splits
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND tipo_membro IN ('admin', 'super_admin')
    )
  );

-- ============================================
-- 3. POLÍTICAS PARA split_configurations
-- ============================================

-- Remover políticas existentes se houver
DROP POLICY IF EXISTS "super_admins_view_configurations" ON split_configurations;
DROP POLICY IF EXISTS "super_admins_create_configurations" ON split_configurations;
DROP POLICY IF EXISTS "super_admins_update_configurations" ON split_configurations;
DROP POLICY IF EXISTS "super_admins_delete_configurations" ON split_configurations;

-- Política: Apenas super_admins podem ver configurações
CREATE POLICY "super_admins_view_configurations"
  ON split_configurations
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND tipo_membro = 'super_admin'
    )
  );

-- Política: Apenas super_admins podem criar configurações
CREATE POLICY "super_admins_create_configurations"
  ON split_configurations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND tipo_membro = 'super_admin'
    )
  );

-- Política: Apenas super_admins podem atualizar configurações
CREATE POLICY "super_admins_update_configurations"
  ON split_configurations
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND tipo_membro = 'super_admin'
    )
  );

-- Política: Apenas super_admins podem deletar configurações
CREATE POLICY "super_admins_delete_configurations"
  ON split_configurations
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND tipo_membro = 'super_admin'
    )
  );

-- ============================================
-- 4. POLÍTICAS PARA split_recipients
-- ============================================

-- Remover políticas existentes se houver
DROP POLICY IF EXISTS "super_admins_view_recipients" ON split_recipients;
DROP POLICY IF EXISTS "super_admins_create_recipients" ON split_recipients;
DROP POLICY IF EXISTS "super_admins_update_recipients" ON split_recipients;
DROP POLICY IF EXISTS "super_admins_delete_recipients" ON split_recipients;

-- Política: Apenas super_admins podem ver recipients
CREATE POLICY "super_admins_view_recipients"
  ON split_recipients
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND tipo_membro = 'super_admin'
    )
  );

-- Política: Apenas super_admins podem criar recipients
CREATE POLICY "super_admins_create_recipients"
  ON split_recipients
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND tipo_membro = 'super_admin'
    )
  );

-- Política: Apenas super_admins podem atualizar recipients
CREATE POLICY "super_admins_update_recipients"
  ON split_recipients
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND tipo_membro = 'super_admin'
    )
  );

-- Política: Apenas super_admins podem deletar recipients
CREATE POLICY "super_admins_delete_recipients"
  ON split_recipients
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND tipo_membro = 'super_admin'
    )
  );

-- ============================================
-- 5. QUERIES DE VALIDAÇÃO
-- ============================================
-- Execute estas queries após aplicar o script para validar:

-- Verificar se RLS está habilitado
-- SELECT tablename, rowsecurity 
-- FROM pg_tables 
-- WHERE schemaname = 'public' 
-- AND tablename IN ('asaas_splits', 'split_configurations', 'split_recipients');

-- Listar todas as políticas criadas
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd
-- FROM pg_policies
-- WHERE tablename IN ('asaas_splits', 'split_configurations', 'split_recipients')
-- ORDER BY tablename, policyname;

-- Contar políticas por tabela
-- SELECT tablename, COUNT(*) as policy_count
-- FROM pg_policies
-- WHERE tablename IN ('asaas_splits', 'split_configurations', 'split_recipients')
-- GROUP BY tablename;

-- Testar acesso como super_admin (deve funcionar)
-- SELECT * FROM split_configurations;
-- SELECT * FROM split_recipients;
-- SELECT * FROM asaas_splits LIMIT 5;

-- ============================================
-- FIM DO SCRIPT
-- ============================================
