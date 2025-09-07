-- ANÁLISE COMPLETA DO SISTEMA DE NOTIFICAÇÕES
-- Execute no painel do Supabase

-- 1. Verificar estrutura da tabela notifications
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'notifications' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Verificar políticas RLS da tabela notifications
SELECT 
  policyname, 
  permissive, 
  roles, 
  cmd, 
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'notifications' 
AND schemaname = 'public';

-- 3. Verificar estrutura da tabela profiles (para tipos de membro)
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND table_schema = 'public'
AND column_name IN ('tipo_membro', 'status', 'role')
ORDER BY ordinal_position;

-- 4. Verificar tipos de membro existentes
SELECT DISTINCT tipo_membro, COUNT(*) as quantidade
FROM public.profiles 
WHERE tipo_membro IS NOT NULL
GROUP BY tipo_membro
ORDER BY quantidade DESC;

-- 5. Verificar status dos usuários
SELECT DISTINCT status, COUNT(*) as quantidade
FROM public.profiles 
WHERE status IS NOT NULL
GROUP BY status
ORDER BY quantidade DESC;

-- 6. Verificar se existe tabela member_types
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'member_types' 
AND table_schema = 'public';

-- 7. Se existe, verificar estrutura da member_types
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'member_types' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 8. Verificar dados da member_types (se existir)
SELECT * FROM public.member_types LIMIT 10;

-- 9. Verificar se há admins no sistema
SELECT 
  p.id, 
  p.nome_completo, 
  p.status, 
  p.tipo_membro,
  CASE 
    WHEN p.tipo_membro = 'admin' THEN 'Admin por tipo_membro'
    WHEN p.status = 'admin' THEN 'Admin por status'
    ELSE 'Usuário comum'
  END as tipo_acesso
FROM public.profiles p
WHERE p.tipo_membro = 'admin' OR p.status = 'admin'
LIMIT 5;

-- 10. Verificar permissões para criar notificações
-- Testar se usuário atual pode inserir notificações
SELECT 
  'Pode inserir notificações' as teste,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE tablename = 'notifications' 
      AND cmd = 'INSERT'
      AND qual LIKE '%true%'
    ) THEN 'SIM - Política permite'
    ELSE 'NÃO - Política restrita'
  END as resultado;