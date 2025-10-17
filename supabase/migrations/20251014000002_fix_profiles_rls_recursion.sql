-- ============================================
-- CORREÇÃO: Recursão Infinita nas Políticas RLS
-- ============================================
-- Data: 2025-10-14
-- Problema: Políticas de admin causam recursão infinita
-- Causa: Política consulta a própria tabela profiles
-- Solução: Usar função auxiliar ou simplificar lógica
--
-- ERRO DETECTADO:
-- "infinite recursion detected in policy for relation profiles"
-- ============================================

-- IMPORTANTE: Executar em TRANSAÇÃO
-- BEGIN;

-- ============================================
-- PASSO 1: REMOVER POLÍTICAS COM RECURSÃO
-- ============================================

DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;

-- ============================================
-- SOLUÇÃO DEFINITIVA: USAR app_metadata NO JWT
-- ============================================

-- ESTRATÉGIA: Armazenar role no app_metadata do auth.users
-- Isso permite verificar role sem consultar profiles (sem recursão)

-- ============================================
-- PASSO 2: CRIAR TRIGGER PARA SINCRONIZAR ROLE
-- ============================================

-- Função que atualiza app_metadata quando tipo_membro muda
CREATE OR REPLACE FUNCTION sync_user_role_to_metadata()
RETURNS TRIGGER AS $$
BEGIN
  -- Atualizar app_metadata no auth.users com o tipo_membro
  UPDATE auth.users
  SET raw_app_meta_data = 
    COALESCE(raw_app_meta_data, '{}'::jsonb) || 
    jsonb_build_object('user_role', NEW.tipo_membro)
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger que executa após INSERT ou UPDATE em profiles
DROP TRIGGER IF EXISTS sync_user_role_trigger ON profiles;
CREATE TRIGGER sync_user_role_trigger
  AFTER INSERT OR UPDATE OF tipo_membro ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION sync_user_role_to_metadata();

-- ============================================
-- PASSO 3: SINCRONIZAR ROLES EXISTENTES
-- ============================================

-- Atualizar app_metadata para todos os usuários existentes
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
-- PASSO 4: RECRIAR POLÍTICAS USANDO app_metadata
-- ============================================

-- POLÍTICA ADMIN: Ver todos os perfis (usando app_metadata)
CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'user_role') IN ('admin', 'super_admin')
  );

-- POLÍTICA ADMIN: Atualizar todos os perfis (usando app_metadata)
CREATE POLICY "Admins can update all profiles"
  ON profiles FOR UPDATE
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'user_role') IN ('admin', 'super_admin')
  );

-- ============================================
-- VALIDAÇÃO
-- ============================================

-- Testar se função funciona
-- SELECT is_admin(); -- Deve retornar true/false sem erro

-- Testar acesso
-- SELECT COUNT(*) FROM profiles; -- Admin deve ver todos, usuário comum apenas 1

-- SE TUDO OK:
-- COMMIT;

-- SE HOUVER PROBLEMA:
-- ROLLBACK;

-- ============================================
-- ROLLBACK (SE NECESSÁRIO)
-- ============================================

/*
BEGIN;

DROP FUNCTION IF EXISTS is_admin();
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;

-- Voltar para políticas anteriores (se necessário)

COMMIT;
*/
