-- ANÁLISE COMPLETA DO SISTEMA EXISTENTE
-- Execute no painel do Supabase para entender a estrutura atual

-- 1. Verificar todas as tabelas existentes
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- 2. Verificar estrutura da tabela auth.users
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'users' 
AND table_schema = 'auth'
ORDER BY ordinal_position;

-- 3. Verificar estrutura da tabela profiles
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 4. Verificar se existe tabela notifications
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'notifications' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 5. Verificar políticas RLS existentes
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 6. Verificar dados de exemplo na tabela profiles
SELECT id, email, created_at
FROM auth.users 
LIMIT 3;

-- 7. Verificar dados na tabela profiles
SELECT * FROM public.profiles LIMIT 3;

-- 8. Verificar se há notificações existentes
SELECT COUNT(*) as total_notifications FROM public.notifications;

-- 9. Verificar usuário atual
SELECT auth.uid() as current_user_id;