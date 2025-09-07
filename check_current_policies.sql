-- VERIFICAR POLÍTICAS ATUAIS DE NOTIFICAÇÕES
-- Execute no painel do Supabase

-- 1. Ver todas as políticas da tabela notifications
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

-- 2. Verificar se RLS está habilitado
SELECT 
  schemaname, 
  tablename, 
  rowsecurity 
FROM pg_tables 
WHERE tablename = 'notifications';

-- 3. Verificar usuário atual e seu tipo_membro
SELECT 
  auth.uid() as current_user_id,
  p.nome_completo,
  p.tipo_membro,
  p.status
FROM public.profiles p 
WHERE p.id = auth.uid();

-- 4. Testar inserção de notificação (vai falhar se política não permitir)
-- COMENTAR ESTA LINHA SE NÃO QUISER TESTAR:
-- INSERT INTO public.notifications (user_id, title, message, type) 
-- VALUES (auth.uid(), 'Teste Admin', 'Teste de criação por admin', 'info');

-- 5. Ver todos os tipos de membro existentes
SELECT DISTINCT tipo_membro, COUNT(*) as quantidade
FROM public.profiles 
WHERE tipo_membro IS NOT NULL
GROUP BY tipo_membro
ORDER BY quantidade DESC;

-- 6. Ver estrutura da tabela member_types (se existir)
SELECT * FROM public.member_types ORDER BY sort_order, name LIMIT 10;