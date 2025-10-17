-- ============================================
-- FIX: Trigger handle_new_user com tratamento de erro
-- ============================================
-- Data: 2025-01-19
-- Problema: Trigger está falhando silenciosamente
-- Solução: Adicionar logs e tratamento de erro
-- ============================================

-- Recriar função com tratamento de erro e logs
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  -- Log para debug
  RAISE LOG 'handle_new_user: Iniciando para user_id=%', NEW.id;
  
  BEGIN
    -- Tentar inserir profile
    INSERT INTO public.profiles (
      id, 
      nome_completo, 
      status, 
      tipo_membro
    )
    VALUES (
      NEW.id,
      COALESCE(
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'nome_completo', 
        NEW.email
      ),
      'pendente',
      'membro'
    );
    
    RAISE LOG 'handle_new_user: Profile criado com sucesso para user_id=%', NEW.id;
    
  EXCEPTION WHEN OTHERS THEN
    -- Log do erro
    RAISE LOG 'handle_new_user: ERRO ao criar profile para user_id=%: % %', 
      NEW.id, SQLERRM, SQLSTATE;
    
    -- Re-raise o erro para que o signup falhe
    RAISE;
  END;
  
  RETURN NEW;
END;
$$;

-- Recriar trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_new_user();

-- Log de sucesso
DO $$
BEGIN
  RAISE NOTICE '✅ Trigger handle_new_user recriado com logs e tratamento de erro';
  RAISE NOTICE '📋 Agora os erros serão logados e visíveis';
END $$;
