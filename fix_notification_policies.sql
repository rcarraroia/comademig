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

-- 4. Testar se agora pode criar notificação (como admin)
INSERT INTO public.notifications (user_id, title, message, type, read)
VALUES (
  auth.uid(), 
  'Teste Admin - Política Corrigida', 
  'Se você está vendo esta notificação, a política RLS foi corrigida com sucesso!', 
  'success', 
  false
);

-- 5. Verificar se a notificação foi criada
SELECT 
  id, title, message, created_at
FROM public.notifications 
WHERE title LIKE '%Teste Admin%'
ORDER BY created_at DESC
LIMIT 1;