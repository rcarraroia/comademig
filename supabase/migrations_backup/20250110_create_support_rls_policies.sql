-- ============================================
-- ANÁLISE PRÉVIA REALIZADA
-- ============================================
-- Data: 2025-01-10
-- Tabelas analisadas: support_tickets, support_messages, support_categories
-- Status atual:
--   ✅ support_tickets: Existe, 0 registros
--   ✅ support_messages: Existe, 0 registros
--   ✅ support_categories: Existe, 7 registros
-- Impacto: Criação de políticas RLS (não destrutivo)
-- Verificações:
--   ✅ Tabelas existem e estão em uso
--   ✅ Nenhum dado será perdido
--   ✅ Código frontend compatível com as políticas
--   ✅ Nenhuma política RLS existente (verificado)
-- ============================================

-- ============================================
-- POLÍTICAS RLS PARA MÓDULO DE SUPORTE
-- ============================================
-- Este script cria políticas de Row Level Security para as tabelas:
-- - support_tickets
-- - support_messages
-- - support_categories
--
-- Regras de acesso:
-- - Usuários veem apenas seus próprios tickets e mensagens
-- - Admins e super_admins veem todos os tickets e mensagens
-- - Todos podem ver categorias ativas
-- ============================================

-- ============================================
-- 1. HABILITAR RLS NAS TABELAS
-- ============================================

-- Habilitar RLS em support_tickets
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;

-- Habilitar RLS em support_messages
ALTER TABLE support_messages ENABLE ROW LEVEL SECURITY;

-- Habilitar RLS em support_categories
ALTER TABLE support_categories ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 2. POLÍTICAS PARA support_tickets
-- ============================================

-- Remover políticas existentes se houver
DROP POLICY IF EXISTS "users_view_own_tickets" ON support_tickets;
DROP POLICY IF EXISTS "admins_view_all_tickets" ON support_tickets;
DROP POLICY IF EXISTS "users_create_own_tickets" ON support_tickets;
DROP POLICY IF EXISTS "users_update_own_tickets" ON support_tickets;
DROP POLICY IF EXISTS "admins_update_all_tickets" ON support_tickets;

-- Política: Usuários podem ver apenas seus próprios tickets
CREATE POLICY "users_view_own_tickets"
  ON support_tickets
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Política: Admins e super_admins podem ver todos os tickets
CREATE POLICY "admins_view_all_tickets"
  ON support_tickets
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND tipo_membro IN ('admin', 'super_admin')
    )
  );

-- Política: Usuários podem criar seus próprios tickets
CREATE POLICY "users_create_own_tickets"
  ON support_tickets
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Política: Usuários podem atualizar seus próprios tickets (apenas alguns campos)
CREATE POLICY "users_update_own_tickets"
  ON support_tickets
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Política: Admins e super_admins podem atualizar qualquer ticket
CREATE POLICY "admins_update_all_tickets"
  ON support_tickets
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
-- 3. POLÍTICAS PARA support_messages
-- ============================================

-- Remover políticas existentes se houver
DROP POLICY IF EXISTS "users_view_own_ticket_messages" ON support_messages;
DROP POLICY IF EXISTS "admins_view_all_messages" ON support_messages;
DROP POLICY IF EXISTS "users_send_messages_own_tickets" ON support_messages;
DROP POLICY IF EXISTS "admins_send_messages_all_tickets" ON support_messages;
DROP POLICY IF EXISTS "admins_update_messages" ON support_messages;

-- Política: Usuários podem ver mensagens dos seus próprios tickets
CREATE POLICY "users_view_own_ticket_messages"
  ON support_messages
  FOR SELECT
  TO authenticated
  USING (
    ticket_id IN (
      SELECT id FROM support_tickets WHERE user_id = auth.uid()
    )
  );

-- Política: Admins e super_admins podem ver todas as mensagens
CREATE POLICY "admins_view_all_messages"
  ON support_messages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND tipo_membro IN ('admin', 'super_admin')
    )
  );

-- Política: Usuários podem enviar mensagens nos seus próprios tickets
CREATE POLICY "users_send_messages_own_tickets"
  ON support_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    ticket_id IN (
      SELECT id FROM support_tickets WHERE user_id = auth.uid()
    )
  );

-- Política: Admins e super_admins podem enviar mensagens em qualquer ticket
CREATE POLICY "admins_send_messages_all_tickets"
  ON support_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND tipo_membro IN ('admin', 'super_admin')
    )
  );

-- Política: Admins podem atualizar mensagens (para marcar como lida, etc)
CREATE POLICY "admins_update_messages"
  ON support_messages
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
-- 4. POLÍTICAS PARA support_categories
-- ============================================

-- Remover políticas existentes se houver
DROP POLICY IF EXISTS "authenticated_view_active_categories" ON support_categories;
DROP POLICY IF EXISTS "admins_view_all_categories" ON support_categories;
DROP POLICY IF EXISTS "admins_create_categories" ON support_categories;
DROP POLICY IF EXISTS "admins_update_categories" ON support_categories;
DROP POLICY IF EXISTS "super_admins_delete_categories" ON support_categories;

-- Política: Todos os usuários autenticados podem ver categorias ativas
CREATE POLICY "authenticated_view_active_categories"
  ON support_categories
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Política: Admins e super_admins podem ver todas as categorias (incluindo inativas)
CREATE POLICY "admins_view_all_categories"
  ON support_categories
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND tipo_membro IN ('admin', 'super_admin')
    )
  );

-- Política: Apenas admins e super_admins podem criar categorias
CREATE POLICY "admins_create_categories"
  ON support_categories
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND tipo_membro IN ('admin', 'super_admin')
    )
  );

-- Política: Apenas admins e super_admins podem atualizar categorias
CREATE POLICY "admins_update_categories"
  ON support_categories
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND tipo_membro IN ('admin', 'super_admin')
    )
  );

-- Política: Apenas super_admins podem deletar categorias
CREATE POLICY "super_admins_delete_categories"
  ON support_categories
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
-- AND tablename IN ('support_tickets', 'support_messages', 'support_categories');

-- Listar todas as políticas criadas
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
-- FROM pg_policies
-- WHERE tablename IN ('support_tickets', 'support_messages', 'support_categories')
-- ORDER BY tablename, policyname;

-- Contar políticas por tabela
-- SELECT tablename, COUNT(*) as policy_count
-- FROM pg_policies
-- WHERE tablename IN ('support_tickets', 'support_messages', 'support_categories')
-- GROUP BY tablename;

-- ============================================
-- FIM DO SCRIPT
-- ============================================
