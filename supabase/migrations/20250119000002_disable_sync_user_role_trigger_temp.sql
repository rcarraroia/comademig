-- ============================================
-- SOLUÇÃO TEMPORÁRIA: Desabilitar trigger problemático
-- ============================================
-- Data: 2025-01-19
-- Problema: sync_user_role_trigger está causando "Database error creating new user"
-- Causa: Trigger tenta UPDATE em auth.users e falha
-- Solução TEMPORÁRIA: Desabilitar trigger para permitir cadastros
-- ============================================

-- Desabilitar o trigger problemático
DROP TRIGGER IF EXISTS sync_user_role_trigger ON profiles;

-- Log
DO $$
BEGIN
  RAISE NOTICE '✅ Trigger sync_user_role_trigger DESABILITADO temporariamente';
  RAISE NOTICE '⚠️ IMPORTANTE: Cadastros agora funcionarão normalmente';
  RAISE NOTICE '📋 PRÓXIMO PASSO: Corrigir a função sync_user_role_to_metadata';
  RAISE NOTICE '   para que não falhe ao tentar atualizar auth.users';
END $$;

-- ============================================
-- NOTA: Este é um FIX TEMPORÁRIO
-- ============================================
-- A função sync_user_role_to_metadata ainda existe
-- mas não será executada automaticamente.
--
-- IMPACTO:
-- - ✅ Cadastros funcionarão normalmente
-- - ⚠️ app_metadata NÃO será sincronizado automaticamente
-- - ⚠️ Políticas RLS que dependem de app_metadata podem não funcionar
--
-- SOLUÇÃO DEFINITIVA (implementar depois):
-- 1. Corrigir função para ter EXCEPTION WHEN OTHERS
-- 2. Adicionar SECURITY DEFINER correto
-- 3. Reabilitar trigger
-- ============================================
