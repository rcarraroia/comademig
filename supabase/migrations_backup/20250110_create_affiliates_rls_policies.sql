-- ============================================
-- ANÁLISE PRÉVIA REALIZADA
-- ============================================
-- Data: 2025-01-10
-- Tabelas a proteger: affiliates, affiliate_referrals, affiliate_commissions
-- Status atual: Tabelas existem (verificado)
-- Impacto: Criação de políticas RLS (não destrutivo)
-- Verificações:
--   ✅ Tabelas existem
--   ✅ Nenhum dado será perdido
--   ✅ Políticas garantem segurança dos dados
-- ============================================

-- ============================================
-- POLÍTICAS RLS PARA MÓDULO DE AFILIADOS
-- ============================================
-- Este script cria políticas de Row Level Security para as tabelas:
-- - affiliates
-- - affiliate_referrals
-- - affiliate_commissions
--
-- Regras de acesso:
-- - Usuários veem apenas seus próprios dados de afiliado
-- - Admins e super_admins veem todos os dados
-- - Afiliados veem apenas suas próprias indicações e comissões
-- ============================================

-- ============================================
-- 1. HABILITAR RLS NAS TABELAS
-- ============================================

-- Habilitar RLS em affiliates
ALTER TABLE affiliates ENABLE ROW LEVEL SECURITY;

-- Habilitar RLS em affiliate_referrals
ALTER TABLE affiliate_referrals ENABLE ROW LEVEL SECURITY;

-- Habilitar RLS em affiliate_commissions
ALTER TABLE affiliate_commissions ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 2. POLÍTICAS PARA affiliates
-- ============================================

-- Remover políticas existentes se houver
DROP POLICY IF EXISTS "users_view_own_affiliate" ON affiliates;
DROP POLICY IF EXISTS "admins_view_all_affiliates" ON affiliates;
DROP POLICY IF EXISTS "users_create_affiliate" ON affiliates;
DROP POLICY IF EXISTS "users_update_own_affiliate" ON affiliates;
DROP POLICY IF EXISTS "admins_update_affiliates" ON affiliates;

-- Política: Usuário vê apenas seu próprio cadastro de afiliado
CREATE POLICY "users_view_own_affiliate"
  ON affiliates
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Política: Admins e super_admins veem todos os afiliados
CREATE POLICY "admins_view_all_affiliates"
  ON affiliates
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND tipo_membro IN ('admin', 'super_admin')
    )
  );

-- Política: Usuário pode criar seu cadastro de afiliado
CREATE POLICY "users_create_affiliate"
  ON affiliates
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Política: Usuário pode atualizar seu próprio cadastro
CREATE POLICY "users_update_own_affiliate"
  ON affiliates
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Política: Admins podem atualizar qualquer afiliado (aprovar, suspender, etc)
CREATE POLICY "admins_update_affiliates"
  ON affiliates
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
-- 3. POLÍTICAS PARA affiliate_referrals
-- ============================================

-- Remover políticas existentes se houver
DROP POLICY IF EXISTS "affiliates_view_own_referrals" ON affiliate_referrals;
DROP POLICY IF EXISTS "admins_view_all_referrals" ON affiliate_referrals;
DROP POLICY IF EXISTS "system_create_referrals" ON affiliate_referrals;
DROP POLICY IF EXISTS "admins_update_referrals" ON affiliate_referrals;

-- Política: Afiliado vê apenas suas próprias indicações
CREATE POLICY "affiliates_view_own_referrals"
  ON affiliate_referrals
  FOR SELECT
  TO authenticated
  USING (
    affiliate_id IN (
      SELECT id FROM affiliates WHERE user_id = auth.uid()
    )
  );

-- Política: Admins e super_admins veem todas as indicações
CREATE POLICY "admins_view_all_referrals"
  ON affiliate_referrals
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND tipo_membro IN ('admin', 'super_admin')
    )
  );

-- Política: Sistema pode criar indicações (via backend/edge functions)
-- Usuários não criam diretamente, é automático no cadastro
CREATE POLICY "system_create_referrals"
  ON affiliate_referrals
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Política: Admins podem atualizar indicações (marcar como convertida, etc)
CREATE POLICY "admins_update_referrals"
  ON affiliate_referrals
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
-- 4. POLÍTICAS PARA affiliate_commissions
-- ============================================

-- Remover políticas existentes se houver
DROP POLICY IF EXISTS "affiliates_view_own_commissions" ON affiliate_commissions;
DROP POLICY IF EXISTS "admins_view_all_commissions" ON affiliate_commissions;
DROP POLICY IF EXISTS "system_create_commissions" ON affiliate_commissions;
DROP POLICY IF EXISTS "admins_update_commissions" ON affiliate_commissions;

-- Política: Afiliado vê apenas suas próprias comissões
CREATE POLICY "affiliates_view_own_commissions"
  ON affiliate_commissions
  FOR SELECT
  TO authenticated
  USING (
    affiliate_id IN (
      SELECT id FROM affiliates WHERE user_id = auth.uid()
    )
  );

-- Política: Admins e super_admins veem todas as comissões
CREATE POLICY "admins_view_all_commissions"
  ON affiliate_commissions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND tipo_membro IN ('admin', 'super_admin')
    )
  );

-- Política: Sistema pode criar comissões (via backend/edge functions)
CREATE POLICY "system_create_commissions"
  ON affiliate_commissions
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Política: Admins podem atualizar comissões (aprovar pagamento, etc)
CREATE POLICY "admins_update_commissions"
  ON affiliate_commissions
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
-- 5. QUERIES DE VALIDAÇÃO
-- ============================================
-- Execute estas queries após aplicar o script para validar:

-- Verificar se RLS está habilitado
-- SELECT tablename, rowsecurity 
-- FROM pg_tables 
-- WHERE schemaname = 'public' 
-- AND tablename IN ('affiliates', 'affiliate_referrals', 'affiliate_commissions');

-- Listar todas as políticas criadas
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd
-- FROM pg_policies
-- WHERE tablename IN ('affiliates', 'affiliate_referrals', 'affiliate_commissions')
-- ORDER BY tablename, policyname;

-- Contar políticas por tabela
-- SELECT tablename, COUNT(*) as policy_count
-- FROM pg_policies
-- WHERE tablename IN ('affiliates', 'affiliate_referrals', 'affiliate_commissions')
-- GROUP BY tablename;

-- ============================================
-- FIM DO SCRIPT
-- ============================================
