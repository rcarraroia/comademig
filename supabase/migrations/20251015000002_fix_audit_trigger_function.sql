-- ============================================
-- CORREÇÃO: audit_trigger_function
-- ============================================
-- Data: 2025-10-15
-- Problema: Trigger usa auth.uid() que é NULL durante signup
-- Causa: INSERT em user_activity_log falha quando user_id é NULL
-- Solução: Usar COALESCE(auth.uid(), NEW.id) para signup
-- ============================================

CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO user_activity_log (
      user_id,
      action,
      table_name,
      record_id,
      new_values
    ) VALUES (
      COALESCE(auth.uid(), NEW.id),  -- Usa NEW.id se auth.uid() for NULL (signup)
      TG_OP,
      TG_TABLE_NAME,
      NEW.id,
      to_jsonb(NEW)
    );
    RETURN NEW;
    
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO user_activity_log (
      user_id,
      action,
      table_name,
      record_id,
      old_values,
      new_values
    ) VALUES (
      COALESCE(auth.uid(), NEW.id),  -- Usa NEW.id se auth.uid() for NULL
      TG_OP,
      TG_TABLE_NAME,
      NEW.id,
      to_jsonb(OLD),
      to_jsonb(NEW)
    );
    RETURN NEW;
    
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO user_activity_log (
      user_id,
      action,
      table_name,
      record_id,
      old_values
    ) VALUES (
      COALESCE(auth.uid(), OLD.id),  -- Usa OLD.id se auth.uid() for NULL
      TG_OP,
      TG_TABLE_NAME,
      OLD.id,
      to_jsonb(OLD)
    );
    RETURN OLD;
  END IF;
END;
$$;

-- ============================================
-- VALIDAÇÃO
-- ============================================

-- Verificar que função foi atualizada
SELECT 
  proname,
  prosecdef as security_definer,
  CASE 
    WHEN prosrc LIKE '%COALESCE(auth.uid()%' THEN '✅ Correção aplicada'
    ELSE '❌ Correção NÃO aplicada'
  END as status
FROM pg_proc
WHERE proname = 'audit_trigger_function';

-- ============================================
-- RESULTADO ESPERADO
-- ============================================

-- Após aplicar esta migração:
-- ✅ Signup funcionará normalmente
-- ✅ Audit log será criado com user_id correto
-- ✅ Durante signup: user_id = NEW.id (ID do profile)
-- ✅ Durante operações normais: user_id = auth.uid()
