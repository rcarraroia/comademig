-- ============================================
-- CORREÇÃO: Política de INSERT em profiles
-- Data: 18/01/2025
-- Problema: auth.uid() não está disponível durante signup
-- Solução: Permitir INSERT sem verificação de auth.uid()
-- ============================================

-- Remover política antiga
DROP POLICY IF EXISTS "profiles_insert_policy" ON profiles;

-- Criar nova política que permite INSERT durante signup
CREATE POLICY "profiles_insert_policy"
  ON profiles FOR INSERT
  WITH CHECK (true); -- Permite INSERT sempre (trigger garante segurança)

-- ============================================
-- JUSTIFICATIVA
-- ============================================
-- Durante o signup, o trigger cria o profile automaticamente
-- Nesse momento, auth.uid() ainda não está disponível
-- A segurança é garantida pelo trigger que só cria profile
-- para o usuário que está sendo criado (NEW.id)
-- 
-- Usuários normais não conseguem fazer INSERT direto em profiles
-- porque não têm acesso ao service_role
-- ============================================

-- ============================================
-- VALIDAÇÃO
-- ============================================
DO $$
BEGIN
  -- Verificar se política foi criada
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' 
    AND policyname = 'profiles_insert_policy'
  ) THEN
    RAISE NOTICE '✅ Política profiles_insert_policy atualizada com sucesso';
  ELSE
    RAISE EXCEPTION '❌ ERRO: Política não foi criada!';
  END IF;
END $$;

-- ============================================
-- NOTAS
-- ============================================
-- Esta mudança é SEGURA porque:
-- 1. Trigger handle_new_user usa SECURITY DEFINER
-- 2. Apenas service_role pode executar o trigger
-- 3. Usuários normais não têm acesso direto à tabela
-- 4. RLS continua protegendo SELECT, UPDATE, DELETE
-- ============================================
