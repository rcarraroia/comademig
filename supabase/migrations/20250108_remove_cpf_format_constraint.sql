-- =====================================================
-- MIGRAÇÃO: Remove constraint de formato de CPF
-- Data: 08/01/2025
-- Descrição: Permite CPF sem formatação (apenas números)
-- =====================================================

-- 1. Remover constraint antiga que exige formato XXX.XXX.XXX-XX
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS check_cpf_format;

-- 2. Adicionar nova constraint que aceita CPF com ou sem formatação
-- Aceita: 12345678900 OU 123.456.789-00
ALTER TABLE public.profiles 
ADD CONSTRAINT check_cpf_format 
CHECK (
  cpf IS NULL OR 
  cpf ~ '^\d{11}$' OR                          -- Aceita 11 dígitos sem formatação
  cpf ~ '^\d{3}\.\d{3}\.\d{3}-\d{2}$'          -- Aceita formato XXX.XXX.XXX-XX
);

-- 3. Comentário explicativo
COMMENT ON CONSTRAINT check_cpf_format ON public.profiles IS 
'Permite CPF com ou sem formatação: 12345678900 ou 123.456.789-00';

-- 4. Verificação final
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage 
    WHERE table_name = 'profiles' 
    AND constraint_name = 'check_cpf_format'
  ) THEN
    RAISE NOTICE '✅ Constraint check_cpf_format atualizada com sucesso!';
  ELSE
    RAISE EXCEPTION '❌ Erro: Constraint não foi criada!';
  END IF;
END $$;
