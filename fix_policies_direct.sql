-- CORREÇÃO DIRETA DAS POLÍTICAS RLS
-- Execute no painel do Supabase (não precisa estar logado na aplicação)

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

-- 3. Verificar se a política foi criada
SELECT 
  policyname, 
  cmd, 
  with_check
FROM pg_policies 
WHERE tablename = 'notifications' 
AND schemaname = 'public'
AND cmd = 'INSERT';

-- 4. Criar notificação de teste diretamente (usando seu ID)
INSERT INTO public.notifications (user_id, title, message, type, read)
VALUES (
  'c2e01b5c-f6af-4906-94e3-ea7cdf1ec02a',  -- Seu ID (Renato Carraro)
  'Interface Admin Funcionando!', 
  'A interface admin de notificações foi implementada com sucesso. Teste agora em /dashboard/admin/notifications', 
  'success', 
  false
);

-- 5. Verificar se a notificação foi criada
SELECT 
  id, title, message, created_at, user_id
FROM public.notifications 
WHERE title LIKE '%Interface Admin%'
ORDER BY created_at DESC
LIMIT 1;