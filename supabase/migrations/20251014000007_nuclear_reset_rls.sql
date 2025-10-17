-- ============================================
-- RESET NUCLEAR: Remover TUDO e Recriar
-- ============================================
-- Data: 2025-10-14
-- Problema: Políticas não estão sendo aplicadas
-- Solução: Remover TUDO e recriar do zero
-- ============================================

-- BEGIN;

-- ============================================
-- PASSO 1: DESABILITAR RLS TEMPORARIAMENTE
-- ============================================

ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- ============================================
-- PASSO 2: REMOVER TODAS AS POLÍTICAS (NUCLEAR)
-- ============================================

-- Buscar e remover TODAS as políticas existentes
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'profiles'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON profiles', pol.policyname);
        RAISE NOTICE 'Removida política: %', pol.policyname;
    END LOOP;
END $$;

-- ============================================
-- PASSO 3: REABILITAR RLS
-- ============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PASSO 4: CRIAR POLÍTICAS DO ZERO
-- ============================================

-- SELECT: Quem pode VER perfis?
CREATE POLICY "profiles_select_authenticated_only"
  ON profiles
  FOR SELECT
  USING (
    -- Regra 1: DEVE estar autenticado (auth.uid() não pode ser NULL)
    auth.uid() IS NOT NULL
    AND
    (
      -- Regra 2a: Ver próprio perfil
      auth.uid() = id
      OR
      -- Regra 2b: Ser admin ou super-admin
      COALESCE((auth.jwt() -> 'app_metadata' ->> 'user_role'), '') IN ('admin', 'super_admin')
    )
  );

-- INSERT: Quem pode CRIAR perfis?
CREATE POLICY "profiles_insert_signup_or_own"
  ON profiles
  FOR INSERT
  WITH CHECK (
    -- Permite INSERT sem autenticação (signUp trigger)
    -- OU usuário autenticado criando próprio perfil
    auth.uid() IS NULL
    OR
    auth.uid() = id
  );

-- UPDATE: Quem pode ATUALIZAR perfis?
CREATE POLICY "profiles_update_own_or_admin"
  ON profiles
  FOR UPDATE
  USING (
    auth.uid() IS NOT NULL
    AND
    (
      auth.uid() = id
      OR
      COALESCE((auth.jwt() -> 'app_metadata' ->> 'user_role'), '') IN ('admin', 'super_admin')
    )
  )
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND
    (
      auth.uid() = id
      OR
      COALESCE((auth.jwt() -> 'app_metadata' ->> 'user_role'), '') IN ('admin', 'super_admin')
    )
  );

-- DELETE: Quem pode DELETAR perfis?
CREATE POLICY "profiles_delete_admin_only"
  ON profiles
  FOR DELETE
  USING (
    auth.uid() IS NOT NULL
    AND
    COALESCE((auth.jwt() -> 'app_metadata' ->> 'user_role'), '') = 'admin'
    AND
    tipo_membro != 'super_admin'
  );

-- ============================================
-- PASSO 5: FORÇAR ATUALIZAÇÃO DE CACHE
-- ============================================

-- Forçar Supabase a recarregar políticas
NOTIFY pgrst, 'reload schema';

-- ============================================
-- VALIDAÇÃO OBRIGATÓRIA
-- ============================================

-- TESTE 1: Não autenticado
-- SET ROLE anon;
-- SELECT COUNT(*) FROM profiles; -- DEVE retornar 0

-- TESTE 2: Verificar políticas criadas
-- SELECT policyname, cmd FROM pg_policies WHERE tablename = 'profiles';

-- SE TESTE 1 RETORNAR 0:
-- COMMIT;

-- SE TESTE 1 RETORNAR > 0:
-- ROLLBACK;

-- ============================================
-- RESULTADO ESPERADO
-- ============================================

-- Após COMMIT:
-- ✅ 4 políticas criadas
-- ✅ RLS habilitado
-- ✅ Acesso não autenticado: BLOQUEADO
-- ✅ Registro (signUp): FUNCIONA
-- ✅ Admin: Vê todos
