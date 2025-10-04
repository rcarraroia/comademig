-- Tarefa 1.2: Aplica políticas de segurança (RLS) na tabela 'profiles'

-- 1. Habilita RLS na tabela 'profiles' (se ainda não estiver habilitado)
-- O comando é seguro para ser re-executado.
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2. Remove a política pública perigosa, se existir.
-- Isso impede que usuários anônimos leiam todos os perfis.
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;

-- 3. Remove políticas antigas para garantir um estado limpo antes de criar as novas
DROP POLICY IF EXISTS "Users can view their own profile." ON public.profiles;
DROP POLICY IF EXISTS "Users can view and update their own profile." ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles." ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles." ON public.profiles;

-- 4. Cria política para que usuários possam ver e editar seus próprios perfis
CREATE POLICY "Users can view and update their own profile."
ON public.profiles FOR ALL
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 5. Cria política para que administradores possam gerenciar todos os perfis
-- Depende da função get_user_roles() criada na migração anterior.
CREATE POLICY "Admins can manage all profiles."
ON public.profiles FOR ALL
USING (
  (get_user_roles(auth.uid()) @> ARRAY['admin'])
)
WITH CHECK (
  (get_user_roles(auth.uid()) @> ARRAY['admin'])
);

-- Confirmação de que o script foi criado.
-- A execução real deve ser feita manualmente no painel do Supabase.