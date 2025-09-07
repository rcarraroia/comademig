-- SCRIPT DE DIAGNÓSTICO - NOTIFICAÇÕES
-- Execute no painel do Supabase para verificar o estado atual

-- 1. Verificar se a tabela notifications existe
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'notifications' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Contar total de notificações
SELECT COUNT(*) as total_notifications FROM public.notifications;

-- 3. Contar notificações não lidas
SELECT COUNT(*) as unread_notifications FROM public.notifications WHERE read = false;

-- 4. Ver todas as notificações (limitado a 10)
SELECT id, user_id, title, message, read, created_at 
FROM public.notifications 
ORDER BY created_at DESC 
LIMIT 10;

-- 5. Verificar políticas RLS
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'notifications';

-- 6. Verificar se RLS está habilitado
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'notifications';

-- 7. Testar se o usuário atual pode ver notificações
SELECT auth.uid() as current_user_id;

-- 8. Ver notificações do usuário atual (se houver)
SELECT id, title, message, read, created_at 
FROM public.notifications 
WHERE user_id = auth.uid()
ORDER BY created_at DESC;