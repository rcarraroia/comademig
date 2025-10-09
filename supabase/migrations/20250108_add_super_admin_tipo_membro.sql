-- =====================================================
-- MIGRAÇÃO: Adiciona super_admin ao tipo_membro
-- Data: 08/01/2025
-- Descrição: Permite tipo_membro = 'super_admin'
-- =====================================================

-- 1. Remover constraint antiga
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS check_tipo_membro_values;

-- 2. Adicionar nova constraint incluindo super_admin
ALTER TABLE public.profiles 
ADD CONSTRAINT check_tipo_membro_values 
CHECK (tipo_membro IN (
  'membro', 
  'pastor', 
  'pastora', 
  'moderador', 
  'admin', 
  'super_admin',  -- ← NOVO
  'visitante'
));

-- 3. Comentário explicativo
COMMENT ON CONSTRAINT check_tipo_membro_values ON public.profiles IS 
'Tipos de membro permitidos: membro, pastor, pastora, moderador, admin, super_admin, visitante';

-- 4. Atualizar seu usuário para super_admin
-- Substitua o email pelo seu email real
UPDATE public.profiles 
SET tipo_membro = 'super_admin'
WHERE id = (
  SELECT id FROM auth.users 
  WHERE email = 'rcarrarocoach@gmail.com'
);

-- 5. Adicionar proteção: Super admin não pode ser deletado
-- Remover policy antiga se existir
DROP POLICY IF EXISTS "Prevent super_admin deletion" ON public.profiles;

-- Criar policy que impede deletar super_admin
CREATE POLICY "Prevent super_admin deletion"
  ON public.profiles
  FOR DELETE
  TO authenticated
  USING (tipo_membro != 'super_admin');

-- 6. Verificação final
DO $$
DECLARE
  v_count INTEGER;
BEGIN
  -- Verificar se constraint foi criada
  IF EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage 
    WHERE table_name = 'profiles' 
    AND constraint_name = 'check_tipo_membro_values'
  ) THEN
    RAISE NOTICE '✅ Constraint check_tipo_membro_values atualizada!';
  ELSE
    RAISE EXCEPTION '❌ Erro: Constraint não foi criada!';
  END IF;

  -- Verificar se usuário foi atualizado
  SELECT COUNT(*) INTO v_count
  FROM public.profiles 
  WHERE tipo_membro = 'super_admin';
  
  IF v_count > 0 THEN
    RAISE NOTICE '✅ % usuário(s) com tipo super_admin', v_count;
  ELSE
    RAISE WARNING '⚠️ Nenhum usuário com tipo super_admin encontrado';
  END IF;
END $$;
