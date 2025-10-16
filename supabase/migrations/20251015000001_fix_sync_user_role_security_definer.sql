-- ============================================
-- CORREÇÃO DEFINITIVA: sync_user_role_to_metadata
-- ============================================
-- Data: 2025-10-15
-- Problema: Signup falha com erro 42501 (RLS violation)
-- Causa: Função sync_user_role_to_metadata tenta UPDATE em auth.users sem SECURITY DEFINER
-- Solução: Adicionar SECURITY DEFINER para bypass RLS
-- Referência: Erro identificado em análise completa de RLS
-- ============================================

-- Recriar função com SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.sync_user_role_to_metadata()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER  -- ✅ Permite bypass de RLS em auth.users
SET search_path = public, auth  -- ✅ Acesso ao schema auth
AS $$
BEGIN
  -- Atualizar app_metadata no auth.users com o tipo_membro
  UPDATE auth.users
  SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) 
      || jsonb_build_object('user_role', NEW.tipo_membro)
  WHERE id = NEW.id;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log do erro mas não falha o INSERT do profile
    RAISE WARNING 'Erro ao sincronizar user_role para auth.users: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- ============================================
-- VALIDAÇÃO
-- ============================================

-- Verificar que função foi atualizada corretamente
DO $$
DECLARE
  has_security_definer boolean;
BEGIN
  SELECT prosecdef INTO has_security_definer
  FROM pg_proc
  WHERE proname = 'sync_user_role_to_metadata';
  
  IF has_security_definer THEN
    RAISE NOTICE '✅ Função sync_user_role_to_metadata tem SECURITY DEFINER';
  ELSE
    RAISE WARNING '❌ Função sync_user_role_to_metadata NÃO tem SECURITY DEFINER!';
  END IF;
END $$;

-- Mostrar status da função
SELECT 
  proname as nome_funcao,
  prosecdef as security_definer,
  CASE 
    WHEN prosecdef THEN '✅ Correção aplicada'
    ELSE '❌ Correção NÃO aplicada'
  END as status
FROM pg_proc
WHERE proname = 'sync_user_role_to_metadata';

-- ============================================
-- RESULTADO ESPERADO
-- ============================================

-- Após aplicar esta migração:
-- ✅ Signup funcionará normalmente
-- ✅ Profile será criado em profiles
-- ✅ user_role será sincronizado em auth.users.raw_app_meta_data
-- ✅ Sem erro 42501 (RLS violation)

-- TESTE:
-- 1. Acessar /filiacao
-- 2. Preencher formulário
-- 3. Submeter
-- 4. Verificar que conta é criada sem erro
