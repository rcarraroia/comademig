-- DIAGNÓSTICO RÁPIDO DO SISTEMA DE NOTIFICAÇÕES
-- Execute no painel do Supabase

-- 1. Verificar usuário atual
SELECT auth.uid() as current_user_id;

-- 2. Verificar se há usuários na tabela profiles
SELECT COUNT(*) as total_users FROM public.profiles;

-- 3. Criar notificação de teste para usuário atual (se logado)
INSERT INTO public.notifications (user_id, title, message, type, read)
SELECT 
  auth.uid(),
  'Teste de Notificação',
  'Esta é uma notificação de teste para verificar se o sistema está funcionando.',
  'info',
  false
WHERE auth.uid() IS NOT NULL;

-- 4. Verificar notificações do usuário atual
SELECT 
  id, title, message, type, read, created_at
FROM public.notifications 
WHERE user_id = auth.uid()
ORDER BY created_at DESC;