-- ============================================
-- CORREÇÃO URGENTE: FORÇAR AUTENTICAÇÃO
-- ============================================
-- Data: 2025-10-14
-- Problema: Políticas permitem acesso sem autenticação
-- Causa: auth.jwt() retorna NULL e é tratado como permissivo
-- Solução: Adicionar verificação explícita de autenticação
-- ============================================

-- BEGIN;

-- ============================================
-- REMOVER POLÍTICAS PROBLEMÁTICAS
-- ============================================

DROP POLICY IF EXISTS "profiles_select_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_delete_policy" ON profiles;

-- ============================================
-- CRIAR POLÍTICAS COM VERIFICAÇÃO DE AUTENTICAÇÃO
-- ============================================

-- POLÍTICA SELECT: Quem pode VER perfis?
-- IMPORTANTE: Primeiro verifica se está autenticado!
CREATE POLICY "profiles_select_policy" ON profiles
  FOR SELECT
  USING (
    -- OBRIGATÓRIO: Usuário DEVE estar autenticado
    auth.uid() IS NOT NULL
    AND
    (
      -- Condição 1: Vê seu próprio perfil
      auth.uid() = id
      OR
      -- Condição 2: É admin
      COALESCE((auth.jwt() -> 'app_metadata' ->> 'user_role'), '') = 'admin'
      OR
      -- Condição 3: É super-admin
      COALESCE((auth.jwt() -> 'app_metadata' ->> 'user_role'), '') = 'super_admin'
    )
  );

-- POLÍTICA INSERT: Quem pode CRIAR perfis?
CREATE POLICY "profiles_insert_policy" ON profiles
  FOR INSERT
  WITH CHECK (
    -- OBRIGATÓRIO: Usuário DEVE estar autenticado
    auth.uid() IS NOT NULL
    AND
    -- Só pode criar seu próprio perfil
    auth.uid() = id
  );

-- POLÍTICA UPDATE: Quem pode ATUALIZAR perfis?
CREATE POLICY "profiles_update_policy" ON profiles
  FOR UPDATE
  USING (
    -- OBRIGATÓRIO: Usuário DEVE estar autenticado
    auth.uid() IS NOT NULL
    AND
    (
      -- Pode atualizar próprio perfil
      auth.uid() = id
      OR
      -- Admin pode atualizar qualquer perfil
      COALESCE((auth.jwt() -> 'app_metadata' ->> 'user_role'), '') = 'admin'
      OR
      -- Super-admin pode atualizar qualquer perfil
      COALESCE((auth.jwt() -> 'app_metadata' ->> 'user_role'), '') = 'super_admin'
    )
  )
  WITH CHECK (
    -- Mesmas regras para validação
    auth.uid() IS NOT NULL
    AND
    (
      auth.uid() = id
      OR
      COALESCE((auth.jwt() -> 'app_metadata' ->> 'user_role'), '') = 'admin'
      OR
      COALESCE((auth.jwt() -> 'app_metadata' ->> 'user_role'), '') = 'super_admin'
    )
  );

-- POLÍTICA DELETE: Quem pode DELETAR perfis?
CREATE POLICY "profiles_delete_policy" ON profiles
  FOR DELETE
  USING (
    -- OBRIGATÓRIO: Usuário DEVE estar autenticado
    auth.uid() IS NOT NULL
    AND
    -- Apenas admin pode deletar
    COALESCE((auth.jwt() -> 'app_metadata' ->> 'user_role'), '') = 'admin'
    -- E não pode deletar super-admin
    AND tipo_membro != 'super_admin'
  );

-- ============================================
-- GARANTIR QUE RLS ESTÁ HABILITADO
-- ============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- ============================================
-- VALIDAÇÃO
-- ============================================

-- TESTE 1: Não autenticado
-- SET ROLE anon;
-- SELECT COUNT(*) FROM profiles; -- Esperado: 0

-- TESTE 2: Autenticado comum
-- SET ROLE authenticated;
-- SELECT set_config('request.jwt.claims', '{"sub":"474d62fe-d9b9-4e90-88f9-e0b0beb44042"}', true);
-- SELECT COUNT(*) FROM profiles; -- Esperado: 1

-- TESTE 3: Admin
-- SELECT set_config('request.jwt.claims', '{"sub":"c2e01b5c-f6af-4906-94e3-ea7cdf1ec02a","app_metadata":{"user_role":"super_admin"}}', true);
-- SELECT COUNT(*) FROM profiles; -- Esperado: 3

-- SE TUDO OK:
-- COMMIT;

-- SE FALHAR:
-- ROLLBACK;
