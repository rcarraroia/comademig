-- ============================================
-- CORREÇÃO FINAL: RLS que Permite Registro
-- ============================================
-- Data: 2025-10-14
-- Problema: Políticas anteriores bloqueiam registro de novos usuários
-- Causa: INSERT policy exige auth.uid() que não existe durante signUp
-- Solução: Permitir INSERT durante signUp, mas restringir SELECT
--
-- FLUXO DE REGISTRO:
-- 1. supabase.auth.signUp() cria usuário em auth.users
-- 2. Trigger automático cria perfil em profiles (INSERT sem auth.uid())
-- 3. Código faz UPDATE no perfil (com auth.uid())
--
-- REQUISITOS:
-- ✅ Bloquear SELECT sem autenticação
-- ✅ Permitir INSERT durante signUp (trigger)
-- ✅ Permitir UPDATE apenas do próprio perfil ou admin
-- ✅ Admin vê todos os perfis
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
-- CRIAR POLÍTICAS CORRETAS
-- ============================================

-- POLÍTICA SELECT: Quem pode VER perfis?
-- Regra: DEVE estar autenticado E (ver próprio OU ser admin/super-admin)
CREATE POLICY "profiles_select_policy" ON profiles
  FOR SELECT
  USING (
    -- OBRIGATÓRIO: Estar autenticado
    auth.uid() IS NOT NULL
    AND
    (
      -- Opção 1: Ver próprio perfil
      auth.uid() = id
      OR
      -- Opção 2: Ser admin
      COALESCE((auth.jwt() -> 'app_metadata' ->> 'user_role'), '') IN ('admin', 'super_admin')
    )
  );

-- POLÍTICA INSERT: Quem pode CRIAR perfis?
-- Regra: Permitir criação durante signUp (sem auth.uid()) OU usuário criar próprio
-- IMPORTANTE: Esta política permite o trigger do Supabase funcionar!
CREATE POLICY "profiles_insert_policy" ON profiles
  FOR INSERT
  WITH CHECK (
    -- Opção 1: Durante signUp (trigger automático - auth.uid() pode ser NULL)
    -- Opção 2: Usuário autenticado criando próprio perfil
    auth.uid() IS NULL  -- Permite trigger do Supabase
    OR
    auth.uid() = id     -- Ou usuário cria próprio perfil
  );

-- POLÍTICA UPDATE: Quem pode ATUALIZAR perfis?
-- Regra: Próprio perfil OU admin/super-admin
CREATE POLICY "profiles_update_policy" ON profiles
  FOR UPDATE
  USING (
    -- OBRIGATÓRIO: Estar autenticado
    auth.uid() IS NOT NULL
    AND
    (
      -- Opção 1: Atualizar próprio perfil
      auth.uid() = id
      OR
      -- Opção 2: Ser admin/super-admin
      COALESCE((auth.jwt() -> 'app_metadata' ->> 'user_role'), '') IN ('admin', 'super_admin')
    )
  )
  WITH CHECK (
    -- Mesmas regras para validação
    auth.uid() IS NOT NULL
    AND
    (
      auth.uid() = id
      OR
      COALESCE((auth.jwt() -> 'app_metadata' ->> 'user_role'), '') IN ('admin', 'super_admin')
    )
  );

-- POLÍTICA DELETE: Quem pode DELETAR perfis?
-- Regra: Apenas admin (super-admin não pode ser deletado)
CREATE POLICY "profiles_delete_policy" ON profiles
  FOR DELETE
  USING (
    -- OBRIGATÓRIO: Estar autenticado
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

-- TESTE 1: Não autenticado NÃO vê dados
-- SET ROLE anon;
-- SELECT COUNT(*) FROM profiles; -- Esperado: 0

-- TESTE 2: Não autenticado PODE inserir (signUp)
-- INSERT INTO profiles (id, nome_completo) VALUES ('test-id', 'Test User'); -- Esperado: Sucesso

-- TESTE 3: Autenticado vê próprio perfil
-- SET ROLE authenticated;
-- SELECT set_config('request.jwt.claims', '{"sub":"474d62fe-d9b9-4e90-88f9-e0b0beb44042"}', true);
-- SELECT COUNT(*) FROM profiles WHERE id = '474d62fe-d9b9-4e90-88f9-e0b0beb44042'; -- Esperado: 1

-- TESTE 4: Admin vê todos
-- SELECT set_config('request.jwt.claims', '{"sub":"c2e01b5c-f6af-4906-94e3-ea7cdf1ec02a","app_metadata":{"user_role":"super_admin"}}', true);
-- SELECT COUNT(*) FROM profiles; -- Esperado: 3

-- SE TODOS OS TESTES PASSAREM:
-- COMMIT;

-- SE FALHAR:
-- ROLLBACK;

-- ============================================
-- RESULTADO ESPERADO
-- ============================================

-- ✅ Usuário não autenticado: NÃO vê dados (SELECT bloqueado)
-- ✅ Registro (signUp): FUNCIONA (INSERT permitido)
-- ✅ Usuário comum: Vê apenas próprio perfil
-- ✅ Admin: Vê TODOS os perfis
-- ✅ Funcionalidades admin: FUNCIONANDO
