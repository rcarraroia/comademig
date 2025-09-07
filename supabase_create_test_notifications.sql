-- Script para criar notificações de teste
-- Execute no painel do Supabase

-- Primeiro, vamos verificar se há usuários na tabela profiles
SELECT 
  id, 
  nome_completo, 
  email,
  status
FROM auth.users 
LIMIT 5;

-- Verificar profiles
SELECT 
  id, 
  nome_completo, 
  status
FROM public.profiles 
LIMIT 5;

-- Criar notificações de teste para todos os usuários ativos
INSERT INTO public.notifications (user_id, title, message, type, read)
SELECT 
  p.id,
  'Bem-vindo ao Sistema de Notificações!',
  'O sistema de notificações foi implementado com sucesso. Agora você receberá atualizações importantes diretamente aqui.',
  'success',
  false
FROM public.profiles p
WHERE p.status = 'ativo'
ON CONFLICT DO NOTHING;

-- Criar algumas notificações específicas de teste
INSERT INTO public.notifications (user_id, title, message, type, read, action_url)
SELECT 
  p.id,
  'Pagamento Pendente',
  'Você possui um pagamento pendente. Clique para regularizar sua situação.',
  'warning',
  false,
  '/dashboard/financeiro'
FROM public.profiles p
WHERE p.status = 'ativo'
LIMIT 3
ON CONFLICT DO NOTHING;

INSERT INTO public.notifications (user_id, title, message, type, read, action_url)
SELECT 
  p.id,
  'Novo Evento Disponível',
  'Um novo evento foi adicionado ao sistema. Confira e faça sua inscrição!',
  'info',
  false,
  '/dashboard/eventos'
FROM public.profiles p
WHERE p.status = 'ativo'
LIMIT 2
ON CONFLICT DO NOTHING;

-- Verificar se as notificações foram criadas
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

-- Contar notificações por usuário
SELECT 
  p.nome_completo,
  COUNT(n.id) as total_notifications,
  COUNT(CASE WHEN n.read = false THEN 1 END) as unread_count
FROM public.profiles p
LEFT JOIN public.notifications n ON p.id = n.user_id
GROUP BY p.id, p.nome_completo
ORDER BY total_notifications DESC;