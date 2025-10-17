-- ============================================
-- CORREÇÃO DEFINITIVA: Remover Políticas Permissivas
-- ============================================
-- Data: 2025-10-14
-- Problema: Política "Public can read public profiles" expõe todos os dados
-- Causa: USING (true) permite acesso total
-- Solução: Remover TODAS as políticas antigas e manter apenas as corretas
-- ============================================

-- BEGIN;

-- ============================================
-- REMOVER POLÍTICAS PROBLEMÁTICAS
-- ============================================

-- CRÍTICO: Esta política expõe TODOS os dados!
DROP POLICY IF EXISTS "Public can read public profiles" ON profiles;

-- CRÍTICO: Esta política permite inserção sem restrição!
DROP POLICY IF EXISTS "Service role can insert profiles" ON profiles;

-- Remover políticas duplicadas/antigas
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view and update their own profile." ON profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles." ON profiles;
DROP POLICY IF EXISTS "Prevent super_admin deletion" ON profiles;

-- Remover outras políticas antigas que podem existir
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON profiles;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- ============================================
-- MANTER APENAS AS POLÍTICAS CORRETAS
-- ============================================

-- As políticas corretas já existem:
-- ✅ profiles_select_policy (SELECT com auth.uid() IS NOT NULL)
-- ✅ profiles_insert_policy (INSERT permite signUp)
-- ✅ profiles_update_policy (UPDATE próprio ou admin)
-- ✅ profiles_delete_policy (DELETE apenas admin)

-- Não precisamos recriar, apenas garantir que RLS está habilitado
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- ============================================
-- FORÇAR RELOAD DO CACHE
-- ============================================

NOTIFY pgrst, 'reload schema';

-- ============================================
-- VALIDAÇÃO OBRIGATÓRIA
-- ============================================

-- TESTE 1: Não autenticado (anon)
-- SET ROLE anon;
-- SELECT COUNT(*) FROM profiles; -- DEVE retornar 0

-- TESTE 2: Usuário comum
-- SET ROLE authenticated;
-- SELECT set_config('request.jwt.claims', '{"sub":"474d62fe-d9b9-4e90-88f9-e0b0beb44042"}', true);
-- SELECT COUNT(*) FROM profiles; -- DEVE retornar 1

-- TESTE 3: Admin
-- SELECT set_config('request.jwt.claims', '{"sub":"c2e01b5c-f6af-4906-94e3-ea7cdf1ec02a","app_metadata":{"user_role":"super_admin"}}', true);
-- SELECT COUNT(*) FROM profiles; -- DEVE retornar 3

-- TESTE 4: Verificar políticas restantes
-- SELECT policyname, cmd FROM pg_policies WHERE tablename = 'profiles' ORDER BY policyname;
-- DEVE mostrar apenas 4 políticas:
-- - profiles_delete_policy
-- - profiles_insert_policy
-- - profiles_select_policy
-- - profiles_update_policy

-- SE TESTE 1 RETORNAR 0:
-- COMMIT;

-- SE TESTE 1 RETORNAR > 0:
-- ROLLBACK;

-- ============================================
-- RESULTADO ESPERADO
-- ============================================

-- Após COMMIT:
-- ✅ Apenas 4 políticas ativas (profiles_*)
-- ✅ Usuário não autenticado: BLOQUEADO
-- ✅ Usuário comum: Vê apenas próprio perfil
-- ✅ Admin: Vê todos os perfis
-- ✅ Registro (signUp): FUNCIONA
