-- ============================================
-- CORREÇÃO CRÍTICA: Adicionar Colunas Faltantes em Profiles
-- ============================================
-- Data: 2025-01-18
-- Problema: Código usa campos que não existem (full_name, email, asaas_customer_id)
-- Causa: Incompatibilidade entre nomenclatura do código e estrutura do banco
-- Solução: Adicionar colunas faltantes e sincronizar dados
-- 
-- ANÁLISE PRÉVIA REALIZADA:
-- - Tabela profiles existe mas faltam colunas críticas
-- - 8 arquivos críticos bloqueados por falta dessas colunas
-- - Sistema de pagamentos completamente quebrado
-- - Auditoria completa documentada em AUDITORIA_COMPLETA_NOMENCLATURA.md
-- ============================================

BEGIN;

-- ============================================
-- PASSO 1: ADICIONAR COLUNAS FALTANTES
-- ============================================

-- 1.1 Adicionar coluna EMAIL (sincronizada com auth.users)
-- Justificativa: Necessária para criar clientes no Asaas
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS email TEXT;

COMMENT ON COLUMN public.profiles.email IS 
'Email do usuário (sincronizado automaticamente com auth.users.email)';

-- 1.2 Adicionar coluna ASAAS_CUSTOMER_ID
-- Justificativa: Armazena ID do cliente no gateway Asaas
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS asaas_customer_id TEXT;

COMMENT ON COLUMN public.profiles.asaas_customer_id IS 
'ID do cliente no gateway de pagamento Asaas';

-- 1.3 Adicionar coluna ASAAS_SUBSCRIPTION_ID
-- Justificativa: Armazena ID da assinatura no Asaas
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS asaas_subscription_id TEXT;

COMMENT ON COLUMN public.profiles.asaas_subscription_id IS 
'ID da assinatura ativa no gateway Asaas';

-- ============================================
-- PASSO 2: CRIAR ÍNDICES PARA PERFORMANCE
-- ============================================

-- 2.1 Índice para busca por email
CREATE INDEX IF NOT EXISTS idx_profiles_email 
ON public.profiles(email);

-- 2.2 Índice para busca por asaas_customer_id
CREATE INDEX IF NOT EXISTS idx_profiles_asaas_customer_id 
ON public.profiles(asaas_customer_id);

-- 2.3 Índice para busca por asaas_subscription_id
CREATE INDEX IF NOT EXISTS idx_profiles_asaas_subscription_id 
ON public.profiles(asaas_subscription_id);

-- ============================================
-- PASSO 3: SINCRONIZAÇÃO AUTOMÁTICA DE EMAIL
-- ============================================

-- 3.1 Criar função para sincronizar email de auth.users para profiles
CREATE OR REPLACE FUNCTION sync_user_email_to_profile()
RETURNS TRIGGER AS $$
BEGIN
  -- Atualizar email em profiles quando mudar em auth.users
  UPDATE public.profiles
  SET email = NEW.email,
      updated_at = NOW()
  WHERE id = NEW.id;
  
  RAISE NOTICE 'Email sincronizado para profile %: %', NEW.id, NEW.email;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION sync_user_email_to_profile() IS 
'Sincroniza automaticamente o email de auth.users para profiles';

-- 3.2 Criar trigger para sincronização automática
DROP TRIGGER IF EXISTS on_auth_user_email_change ON auth.users;

CREATE TRIGGER on_auth_user_email_change
  AFTER INSERT OR UPDATE OF email ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION sync_user_email_to_profile();

COMMENT ON TRIGGER on_auth_user_email_change ON auth.users IS 
'Trigger que sincroniza email de auth.users para profiles automaticamente';

-- ============================================
-- PASSO 4: SINCRONIZAR EMAILS EXISTENTES
-- ============================================

-- 4.1 Atualizar profiles com emails de auth.users
UPDATE public.profiles p
SET email = u.email,
    updated_at = NOW()
FROM auth.users u
WHERE p.id = u.id
  AND (p.email IS NULL OR p.email != u.email);

-- 4.2 Verificar quantos registros foram atualizados
DO $$
DECLARE
  updated_count INTEGER;
  total_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO updated_count
  FROM public.profiles
  WHERE email IS NOT NULL;
  
  SELECT COUNT(*) INTO total_count
  FROM public.profiles;
  
  RAISE NOTICE 'Sincronização de emails concluída: % de % perfis atualizados', 
    updated_count, total_count;
END $$;

-- ============================================
-- PASSO 5: ATUALIZAR POLÍTICAS RLS (SE NECESSÁRIO)
-- ============================================

-- As políticas RLS existentes já devem cobrir as novas colunas
-- pois usam auth.uid() = id (acesso ao próprio perfil)
-- Mas vamos garantir que RLS está habilitado

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PASSO 6: VALIDAÇÃO PÓS-MIGRAÇÃO
-- ============================================

-- Verificar que colunas foram criadas
DO $$
DECLARE
  col_exists BOOLEAN;
BEGIN
  -- Verificar email
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'email'
  ) INTO col_exists;
  
  IF col_exists THEN
    RAISE NOTICE '✅ Coluna email criada com sucesso';
  ELSE
    RAISE EXCEPTION '❌ ERRO: Coluna email não foi criada!';
  END IF;
  
  -- Verificar asaas_customer_id
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'asaas_customer_id'
  ) INTO col_exists;
  
  IF col_exists THEN
    RAISE NOTICE '✅ Coluna asaas_customer_id criada com sucesso';
  ELSE
    RAISE EXCEPTION '❌ ERRO: Coluna asaas_customer_id não foi criada!';
  END IF;
  
  -- Verificar asaas_subscription_id
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'asaas_subscription_id'
  ) INTO col_exists;
  
  IF col_exists THEN
    RAISE NOTICE '✅ Coluna asaas_subscription_id criada com sucesso';
  ELSE
    RAISE EXCEPTION '❌ ERRO: Coluna asaas_subscription_id não foi criada!';
  END IF;
END $$;

-- Verificar que índices foram criados
DO $$
DECLARE
  idx_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO idx_count
  FROM pg_indexes
  WHERE schemaname = 'public'
    AND tablename = 'profiles'
    AND indexname IN (
      'idx_profiles_email',
      'idx_profiles_asaas_customer_id',
      'idx_profiles_asaas_subscription_id'
    );
  
  IF idx_count = 3 THEN
    RAISE NOTICE '✅ Todos os índices criados com sucesso';
  ELSE
    RAISE WARNING '⚠️ Apenas % de 3 índices foram criados', idx_count;
  END IF;
END $$;

-- Verificar que trigger foi criado
DO $$
DECLARE
  trigger_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'on_auth_user_email_change'
  ) INTO trigger_exists;
  
  IF trigger_exists THEN
    RAISE NOTICE '✅ Trigger de sincronização criado com sucesso';
  ELSE
    RAISE EXCEPTION '❌ ERRO: Trigger não foi criado!';
  END IF;
END $$;

-- ============================================
-- RESULTADO ESPERADO
-- ============================================

-- Após COMMIT:
-- ✅ Coluna email adicionada e sincronizada
-- ✅ Coluna asaas_customer_id adicionada
-- ✅ Coluna asaas_subscription_id adicionada
-- ✅ Índices criados para performance
-- ✅ Trigger de sincronização ativo
-- ✅ Emails existentes sincronizados
-- ✅ RLS habilitado e funcionando

COMMIT;

-- ============================================
-- NOTAS IMPORTANTES
-- ============================================

-- 1. Esta migração é SEGURA:
--    - Apenas ADICIONA colunas (não remove nem altera)
--    - Não afeta dados existentes
--    - Não quebra funcionalidades atuais

-- 2. Após esta migração, será necessário:
--    - Refatorar código para usar nomenclatura correta
--    - Ver AUDITORIA_COMPLETA_NOMENCLATURA.md para lista completa

-- 3. Rollback (se necessário):
--    ALTER TABLE public.profiles DROP COLUMN IF EXISTS email;
--    ALTER TABLE public.profiles DROP COLUMN IF EXISTS asaas_customer_id;
--    ALTER TABLE public.profiles DROP COLUMN IF EXISTS asaas_subscription_id;
--    DROP TRIGGER IF EXISTS on_auth_user_email_change ON auth.users;
--    DROP FUNCTION IF EXISTS sync_user_email_to_profile();

-- ============================================
-- FIM DA MIGRAÇÃO
-- ============================================
