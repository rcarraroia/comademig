-- ============================================================
-- SOLUÇÃO URGENTE: TRANSFORMAR SEU USUÁRIO EM ADMIN
-- ============================================================
-- Execute este script no SQL Editor do Supabase
-- ============================================================

-- OPÇÃO 1: Se você souber seu user_id
UPDATE public.profiles
SET 
  tipo_membro = 'admin',
  cargo = 'Administrador',
  status = 'ativo',
  updated_at = NOW()
WHERE id = 'SEU_USER_ID_AQUI';  -- ⚠️ Substituir pelo seu ID

-- OPÇÃO 2: Se você souber apenas o email (MAIS FÁCIL)
UPDATE public.profiles
SET 
  tipo_membro = 'admin',
  cargo = 'Administrador',
  status = 'ativo',
  updated_at = NOW()
WHERE id = (
  SELECT id FROM auth.users WHERE email = 'rcarrarocoach@gmail.com'
);

-- Verificar se funcionou:
SELECT 
  p.id,
  p.nome_completo,
  p.tipo_membro,
  p.cargo,
  p.status,
  u.email
FROM public.profiles p
JOIN auth.users u ON u.id = p.id
WHERE u.email = 'rcarrarocoach@gmail.com';

-- ============================================================
-- RESULTADO ESPERADO:
-- tipo_membro: admin
-- cargo: Administrador
-- status: ativo
-- ============================================================
