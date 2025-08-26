-- RECRIAR POLÍTICAS SIMPLES DO ZERO
-- Remover TODAS as políticas existentes e criar versões ultra-simples

-- 1. LIMPAR TODAS AS POLÍTICAS EXISTENTES
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles simple" ON public.profiles;
DROP POLICY IF EXISTS "Usuários podem ver seus próprios perfis" ON public.profiles;
DROP POLICY IF EXISTS "Usuários podem atualizar seus próprios perfis" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

DROP POLICY IF EXISTS "Admins can manage user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage roles simple" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;

-- 2. DESABILITAR RLS TEMPORARIAMENTE
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles DISABLE ROW LEVEL SECURITY;

-- 3. CRIAR POLÍTICAS ULTRA-SIMPLES (SEM RECURSÃO)
-- Reabilitar RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Política simples para profiles - qualquer usuário autenticado pode ver seu próprio perfil
CREATE POLICY "simple_own_profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

-- Política simples para profiles - qualquer usuário autenticado pode atualizar seu próprio perfil  
CREATE POLICY "simple_update_profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Política simples para user_roles - qualquer usuário autenticado pode ver suas próprias roles
CREATE POLICY "simple_own_roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

-- 4. VERIFICAR SE FUNCIONOU
SELECT 'Políticas ultra-simples criadas!' as resultado;