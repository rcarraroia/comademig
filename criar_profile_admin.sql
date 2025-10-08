-- ============================================================
-- CRIAR PROFILE PARA USUÁRIO ADMIN
-- ============================================================
-- INSTRUÇÕES:
-- 1. Abra o painel do Supabase (https://supabase.com/dashboard)
-- 2. Vá em SQL Editor
-- 3. Cole este script
-- 4. ANTES DE EXECUTAR: Substitua 'SEU_USER_ID_AQUI' pelo ID real
-- 5. Execute o script
-- ============================================================

-- PASSO 1: Descobrir o ID do usuário
-- Execute esta query primeiro para ver seu user_id:
SELECT id, email, created_at 
FROM auth.users 
WHERE email = 'rcarrarocoach@gmail.com';

-- PASSO 2: Copie o ID retornado e substitua abaixo

-- PASSO 3: Criar o profile
INSERT INTO public.profiles (
  id,
  nome_completo,
  email,
  tipo_membro,
  cargo,
  status,
  created_at,
  updated_at
) VALUES (
  'SEU_USER_ID_AQUI',  -- ⚠️ SUBSTITUIR pelo ID do PASSO 1
  'Renato Carraro',
  'rcarrarocoach@gmail.com',
  'admin',             -- ✅ Tipo admin
  'Administrador',
  'ativo',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  tipo_membro = 'admin',
  cargo = 'Administrador',
  status = 'ativo',
  updated_at = NOW();

-- PASSO 4: Verificar se foi criado
SELECT id, nome_completo, tipo_membro, cargo, status
FROM public.profiles
WHERE email = 'rcarrarocoach@gmail.com';

-- ============================================================
-- RESULTADO ESPERADO:
-- Deve mostrar 1 registro com tipo_membro = 'admin'
-- ============================================================
