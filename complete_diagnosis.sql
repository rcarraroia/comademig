-- DIAGNÓSTICO COMPLETO DO SISTEMA DE NOTIFICAÇÕES
-- Execute no painel do Supabase

-- 1. Verificar usuário atual (deve retornar um UUID se logado)
SELECT auth.uid() as current_user_id;

-- 2. Verificar usuários existentes
SELECT id, email, created_at FROM auth.users ORDER BY created_at DESC;

-- 3. Verificar profiles existentes
SELECT id, nome_completo, status FROM public.profiles ORDER BY created_at DESC;

-- 4. Verificar notificações existentes
SELECT COUNT(*) as total_notifications FROM public.notifications;

-- 5. Se auth.uid() for null, criar notificações para todos os usuários
INSERT INTO public.notifications (user_id, title, message, type, read)
SELECT 
  p.id,
  'Sistema de Notificações Ativo',
  'O sistema de notificações está funcionando! Esta é uma mensagem de teste.',
  'success',
  false
FROM public.profiles p
WHERE p.status = 'ativo'
ON CONFLICT DO NOTHING;

-- 6. Criar mais algumas notificações de teste
INSERT INTO public.notifications (user_id, title, message, type, read, action_url)
SELECT 
  p.id,
  'Bem-vindo ao COMADEMIG',
  'Sua conta foi criada com sucesso. Explore todas as funcionalidades disponíveis.',
  'info',
  false,
  '/dashboard'
FROM public.profiles p
LIMIT 2
ON CONFLICT DO NOTHING;

-- 7. Verificar notificações criadas
SELECT 
  n.id,
  n.title,
  n.message,
  n.type,
  n.read,
  n.created_at,
  p.nome_completo as usuario
FROM public.notifications n
JOIN public.profiles p ON n.user_id = p.id
ORDER BY n.created_at DESC
LIMIT 10;