-- CORREÇÃO DAS POLÍTICAS RLS PARA NOTIFICAÇÕES
-- Execute no painel do Supabase

-- 1. Remover política atual que está bloqueando
DROP POLICY IF EXISTS "System can create notifications" ON public.notifications;

-- 2. Criar política correta para admins criarem notificações
CREATE POLICY "Admins can create notifications" 
  ON public.notifications 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.tipo_membro = 'admin'
    )
  );

-- 3. Verificar se a política foi criada corretamente
SELECT 
  policyname, 
  cmd, 
  with_check
FROM pg_policies 
WHERE tablename = 'notifications' 
AND schemaname = 'public'
AND cmd = 'INSERT';

-- 4. Verificar se auth.uid() está funcionando
SELECT 
  auth.uid() as current_user_id,
  CASE 
    WHEN auth.uid() IS NULL THEN 'Não logado - Execute este script logado no painel'
    ELSE 'Logado - Política deve funcionar agora'
  END as status_auth;

-- 5. Se quiser testar manualmente, use este comando (substitua o UUID pelo seu ID):
-- INSERT INTO public.notifications (user_id, title, message, type, read)
-- VALUES (
--   'c2e01b5c-f6af-4906-94e3-ea7cdf1ec02a',  -- Seu ID de usuário
--   'Teste Admin - Política Corrigida', 
--   'Se você está vendo esta notificação, a política RLS foi corrigida com sucesso!', 
--   'success', 
--   false
-- );