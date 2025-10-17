-- ============================================
-- CORREÇÃO DEFINITIVA: RLS Completo com 3 Níveis
-- ============================================
-- Data: 2025-10-14
-- Objetivo: Implementar RLS que protege dados E mantém funcionalidades admin
-- Estratégia: Usar app_metadata (já sincronizado) para evitar recursão
--
-- ESTRUTURA DE PERMISSÕES:
-- 1. Usuários comuns: Veem apenas próprio perfil
-- 2. Admin: Vê TODOS os perfis + gerencia site
-- 3. Super-admin: Vê TODOS + configurações exclusivas
--
-- IMPORTANTE: app_metadata já foi sincronizado na migração 002
-- Trigger sync_user_role_trigger já está ativo
-- ============================================

-- BEGIN;

-- ============================================
-- PASSO 1: LIMPAR TODAS AS POLÍTICAS EXISTENTES
-- ============================================

DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON profiles;
DROP POLICY IF EXISTS "profiles_select_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_delete_policy" ON profiles;

-- ============================================
-- PASSO 2: CRIAR POLÍTICAS CORRETAS (SEM RECURSÃO)
-- ============================================

-- POLÍTICA SELECT: Quem pode VER perfis?
-- Lógica: Próprio perfil OU admin OU super-admin
CREATE POLICY "profiles_select_policy" ON profiles
  FOR SELECT
  USING (
    -- Condição 1: Usuário vê seu próprio perfil
    auth.uid() = id
    OR
    -- Condição 2: Usuário é admin (via app_metadata - SEM RECURSÃO)
    (auth.jwt() -> 'app_metadata' ->> 'user_role') = 'admin'
    OR
    -- Condição 3: Usuário é super-admin (via app_metadata - SEM RECURSÃO)
    (auth.jwt() -> 'app_metadata' ->> 'user_role') = 'super_admin'
  );

-- POLÍTICA INSERT: Quem pode CRIAR perfis?
-- Lógica: Apenas pode criar seu próprio perfil
CREATE POLICY "profiles_insert_policy" ON profiles
  FOR INSERT
  WITH CHECK (
    auth.uid() = id
  );

-- POLÍTICA UPDATE: Quem pode ATUALIZAR perfis?
-- Lógica: Próprio perfil OU admin OU super-admin
CREATE POLICY "profiles_update_policy" ON profiles
  FOR UPDATE
  USING (
    -- Pode atualizar próprio perfil
    auth.uid() = id
    OR
    -- Admin pode atualizar qualquer perfil
    (auth.jwt() -> 'app_metadata' ->> 'user_role') = 'admin'
    OR
    -- Super-admin pode atualizar qualquer perfil
    (auth.jwt() -> 'app_metadata' ->> 'user_role') = 'super_admin'
  )
  WITH CHECK (
    -- Mesmas regras para validação após update
    auth.uid() = id
    OR
    (auth.jwt() -> 'app_metadata' ->> 'user_role') = 'admin'
    OR
    (auth.jwt() -> 'app_metadata' ->> 'user_role') = 'super_admin'
  );

-- POLÍTICA DELETE: Quem pode DELETAR perfis?
-- Lógica: Apenas admin (super-admin não pode ser deletado)
CREATE POLICY "profiles_delete_policy" ON profiles
  FOR DELETE
  USING (
    -- Apenas admin pode deletar
    (auth.jwt() -> 'app_metadata' ->> 'user_role') = 'admin'
    -- E não pode deletar super-admin (proteção adicional)
    AND tipo_membro != 'super_admin'
  );

-- ============================================
-- PASSO 3: GARANTIR QUE RLS ESTÁ HABILITADO
-- ============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PASSO 4: VERIFICAR app_metadata ESTÁ SINCRONIZADO
-- ============================================

-- Garantir que todos os usuários existentes têm app_metadata atualizado
DO $$
DECLARE
  profile_record RECORD;
BEGIN
  FOR profile_record IN 
    SELECT id, tipo_membro FROM profiles WHERE tipo_membro IS NOT NULL
  LOOP
    UPDATE auth.users
    SET raw_app_meta_data = 
      COALESCE(raw_app_meta_data, '{}'::jsonb) || 
      jsonb_build_object('user_role', profile_record.tipo_membro)
    WHERE id = profile_record.id;
  END LOOP;
END $$;

-- ============================================
-- VALIDAÇÃO OBRIGATÓRIA ANTES DE COMMIT
-- ============================================

-- TESTE 1: Usuário não autenticado - BLOQUEADO
-- SET ROLE anon;
-- SELECT COUNT(*) FROM profiles; -- Esperado: 0 ou erro

-- TESTE 2: Usuário comum - Vê apenas próprio
-- SET ROLE authenticated;
-- SELECT set_config('request.jwt.claims', '{"sub":"474d62fe-d9b9-4e90-88f9-e0b0beb44042","app_metadata":{"user_role":"membro"}}', true);
-- SELECT COUNT(*) FROM profiles; -- Esperado: 1
-- SELECT COUNT(*) FROM profiles WHERE id != '474d62fe-d9b9-4e90-88f9-e0b0beb44042'; -- Esperado: 0

-- TESTE 3: Admin - Vê TODOS
-- SELECT set_config('request.jwt.claims', '{"sub":"c2e01b5c-f6af-4906-94e3-ea7cdf1ec02a","app_metadata":{"user_role":"super_admin"}}', true);
-- SELECT COUNT(*) FROM profiles; -- Esperado: 3

-- TESTE 4: Admin tenta deletar super-admin - BLOQUEADO
-- DELETE FROM profiles WHERE tipo_membro = 'super_admin'; -- Esperado: 0 rows

-- SE TODOS OS TESTES PASSAREM:
-- COMMIT;

-- SE QUALQUER TESTE FALHAR:
-- ROLLBACK;

-- ============================================
-- RESULTADO ESPERADO
-- ============================================

-- ✅ Usuário não autenticado: BLOQUEADO
-- ✅ Usuário comum: Vê apenas próprio perfil
-- ✅ Admin: Vê TODOS os perfis
-- ✅ Super-admin: Vê TODOS os perfis
-- ✅ Funcionalidades admin: FUNCIONANDO
-- ✅ Proteção super-admin: ATIVA

-- ============================================
-- ROLLBACK (SE NECESSÁRIO)
-- ============================================

/*
BEGIN;

-- Remover políticas
DROP POLICY IF EXISTS "profiles_select_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_delete_policy" ON profiles;

-- Restaurar políticas antigas (ATENÇÃO: Volta a expor dados!)
CREATE POLICY "Enable read access for authenticated users" ON profiles
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Enable update for users based on user_id" ON profiles
  FOR UPDATE USING (auth.uid() = id);

COMMIT;
*/
