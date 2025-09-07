-- VERIFICAÇÃO COMPLETA DAS POLÍTICAS E PERMISSÕES
-- Execute no painel do Supabase

-- 1. Ver políticas atuais da tabela notifications
SELECT 
  policyname, 
  cmd, 
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'notifications' 
AND schemaname = 'public';

-- 2. Verificar usuário atual
SELECT 
  auth.uid() as current_user_id,
  CASE 
    WHEN auth.uid() IS NULL THEN 'Não logado'
    ELSE 'Logado'
  END as status_login;

-- 3. Se logado, verificar dados do perfil
SELECT 
  p.id,
  p.nome_completo,
  p.tipo_membro,
  p.status
FROM public.profiles p 
WHERE p.id = auth.uid();

-- 4. Verificar todos os tipos de membro na tabela profiles
SELECT DISTINCT 
  tipo_membro, 
  COUNT(*) as quantidade
FROM public.profiles 
WHERE tipo_membro IS NOT NULL
GROUP BY tipo_membro
ORDER BY quantidade DESC;

-- 5. Verificar se usuário atual pode criar notificação
-- (Teste sem executar - apenas verificar política)
EXPLAIN (FORMAT TEXT) 
INSERT INTO public.notifications (user_id, title, message, type) 
VALUES (auth.uid(), 'Teste', 'Teste', 'info');

-- 6. Verificar se existe usuário admin
SELECT 
  id, 
  nome_completo, 
  tipo_membro, 
  status
FROM public.profiles 
WHERE tipo_membro ILIKE '%admin%' 
   OR status ILIKE '%admin%'
LIMIT 5;