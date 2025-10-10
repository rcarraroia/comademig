-- =====================================================
-- RESTAURAR SUPER ADMIN
-- Data: 09/01/2025
-- Descrição: Restaura usuário como super_admin
-- =====================================================

-- 1. Atualizar seu usuário para super_admin
UPDATE public.profiles 
SET tipo_membro = 'super_admin'
WHERE id = (
  SELECT id FROM auth.users 
  WHERE email = 'rcarrarocoach@gmail.com'
);

-- 2. Verificar se foi atualizado
DO $$
DECLARE
  v_tipo_atual TEXT;
  v_nome TEXT;
BEGIN
  -- Buscar dados do usuário
  SELECT p.tipo_membro, p.nome_completo
  INTO v_tipo_atual, v_nome
  FROM public.profiles p
  INNER JOIN auth.users u ON u.id = p.id
  WHERE u.email = 'rcarrarocoach@gmail.com';
  
  IF v_tipo_atual = 'super_admin' THEN
    RAISE NOTICE '✅ SUCESSO! Usuário % restaurado como SUPER_ADMIN', v_nome;
  ELSE
    RAISE WARNING '⚠️ ATENÇÃO! Usuário % está como: %', v_nome, v_tipo_atual;
  END IF;
END $$;

-- 3. Listar todos os super admins
SELECT 
  p.nome_completo,
  p.tipo_membro,
  u.email,
  p.created_at
FROM public.profiles p
INNER JOIN auth.users u ON u.id = p.id
WHERE p.tipo_membro = 'super_admin'
ORDER BY p.created_at;
