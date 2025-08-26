-- CORRIGIR POLÍTICAS RLS - REMOVER RECURSÃO INFINITA
-- O problema é que as políticas estão criando dependência circular

-- 1. Remover políticas problemáticas
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage user roles" ON public.user_roles;

-- 2. Criar políticas simples SEM recursão
-- Permitir usuários verem seus próprios perfis (já existe, mas vamos recriar)
DROP POLICY IF EXISTS "Usuários podem ver seus próprios perfis" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

-- Permitir usuários atualizarem seus próprios perfis
DROP POLICY IF EXISTS "Usuários podem atualizar seus próprios perfis" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Permitir usuários verem suas próprias roles (já existe, mas vamos recriar)
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

-- 3. Criar política de admin SIMPLES para profiles (sem recursão)
CREATE POLICY "Admins can view all profiles simple" ON public.profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = auth.uid() 
      AND p.tipo_membro = 'admin'
    )
  );

-- 4. Criar política de admin SIMPLES para user_roles (sem recursão)  
CREATE POLICY "Admins can manage roles simple" ON public.user_roles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = auth.uid() 
      AND p.tipo_membro = 'admin'
    )
  );

-- 5. Verificar se funcionou
SELECT 'Políticas RLS corrigidas com sucesso!' as resultado;