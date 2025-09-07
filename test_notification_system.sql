-- TESTE DO SISTEMA DE NOTIFICAÇÕES
-- Execute no painel do Supabase

-- 1. Verificar políticas existentes
SELECT 
  policyname, 
  cmd, 
  with_check
FROM pg_policies 
WHERE tablename = 'notifications' 
AND schemaname = 'public'
ORDER BY cmd;

-- 2. Criar notificação de teste para você (Renato Carraro)
INSERT INTO public.notifications (user_id, title, message, type, read)
VALUES (
  'c2e01b5c-f6af-4906-94e3-ea7cdf1ec02a',  -- Seu ID
  'Interface Admin Funcionando!', 
  'A interface admin de notificações foi implementada com sucesso. Acesse /dashboard/admin/notifications para testar!', 
  'success', 
  false
);

-- 3. Criar mais uma notificação de teste
INSERT INTO public.notifications (user_id, title, message, type, read)
VALUES (
  'c2e01b5c-f6af-4906-94e3-ea7cdf1ec02a',  -- Seu ID
  'Sistema Pronto para Uso', 
  'Agora você pode enviar notificações para todos os usuários através do painel admin!', 
  'info', 
  false
);

-- 4. Verificar se as notificações foram criadas
SELECT 
  id, 
  title, 
  message, 
  type,
  read,
  created_at
FROM public.notifications 
WHERE user_id = 'c2e01b5c-f6af-4906-94e3-ea7cdf1ec02a'
ORDER BY created_at DESC
LIMIT 5;

-- 5. Contar total de notificações não lidas para você
SELECT COUNT(*) as notificacoes_nao_lidas
FROM public.notifications 
WHERE user_id = 'c2e01b5c-f6af-4906-94e3-ea7cdf1ec02a'
AND read = false;