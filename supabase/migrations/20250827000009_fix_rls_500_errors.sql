-- Corrigir políticas RLS que estão causando erro 500 na API REST
-- O problema é que as políticas podem ter condições que não funcionam no contexto da API

-- 1. Verificar e corrigir políticas da tabela profiles
-- Remover políticas problemáticas e criar versões funcionais

-- Remover políticas que podem estar causando conflito
DROP POLICY IF EXISTS "Admin access to profiles" ON public.profiles;
DROP POLICY IF EXISTS "admin_access" ON public.profiles;
DROP POLICY IF EXISTS "simple_own_profile" ON public.profiles;
DROP POLICY IF EXISTS "simple_update_profile" ON public.profiles;

-- Criar políticas simples e funcionais para profiles
CREATE POLICY "users_can_view_own_profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "users_can_update_own_profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "admins_can_view_all_profiles" ON public.profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "admins_can_update_all_profiles" ON public.profiles
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- 2. Corrigir políticas da tabela user_roles
-- Remover políticas problemáticas
DROP POLICY IF EXISTS "Admin can manage all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "admin_access" ON public.user_roles;
DROP POLICY IF EXISTS "simple_own_roles" ON public.user_roles;

-- Criar políticas funcionais para user_roles
CREATE POLICY "users_can_view_own_roles" ON public.user_roles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "admins_can_view_all_roles" ON public.user_roles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_roles ur2 
            WHERE ur2.user_id = auth.uid() AND ur2.role = 'admin'
        )
    );

CREATE POLICY "admins_can_manage_all_roles" ON public.user_roles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_roles ur2 
            WHERE ur2.user_id = auth.uid() AND ur2.role = 'admin'
        )
    );

-- 3. Verificar se as políticas foram criadas corretamente
DO $$
DECLARE
    policy_count INTEGER;
BEGIN
    -- Contar políticas em profiles
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies 
    WHERE tablename = 'profiles' AND schemaname = 'public';
    
    RAISE NOTICE 'Políticas em profiles: %', policy_count;
    
    -- Contar políticas em user_roles
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies 
    WHERE tablename = 'user_roles' AND schemaname = 'public';
    
    RAISE NOTICE 'Políticas em user_roles: %', policy_count;
END $$;

-- 4. Testar se as políticas funcionam
-- Simular consulta que o frontend faz
DO $$
DECLARE
    test_result INTEGER;
BEGIN
    -- Testar se consegue contar profiles (sem auth context)
    SELECT COUNT(*) INTO test_result FROM public.profiles;
    RAISE NOTICE 'Total profiles acessíveis: %', test_result;
    
    -- Testar se consegue contar user_roles
    SELECT COUNT(*) INTO test_result FROM public.user_roles;
    RAISE NOTICE 'Total user_roles acessíveis: %', test_result;
END $$;