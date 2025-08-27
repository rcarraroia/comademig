-- Verificação final e limpeza do sistema
-- Data: 27/08/2025
-- Objetivo: Verificar se todas as correções foram aplicadas corretamente

-- 1. Verificar se todas as tabelas críticas existem
DO $$
DECLARE
    missing_tables TEXT[] := ARRAY[]::TEXT[];
BEGIN
    -- Verificar tabelas essenciais
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_roles') THEN
        missing_tables := array_append(missing_tables, 'user_roles');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'affiliates') THEN
        missing_tables := array_append(missing_tables, 'affiliates');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') THEN
        missing_tables := array_append(missing_tables, 'profiles');
    END IF;
    
    IF array_length(missing_tables, 1) > 0 THEN
        RAISE EXCEPTION 'Tabelas ausentes: %', array_to_string(missing_tables, ', ');
    ELSE
        RAISE NOTICE 'Todas as tabelas críticas estão presentes';
    END IF;
END $$;

-- 2. Verificar se o tipo app_role existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
        RAISE EXCEPTION 'Tipo app_role não encontrado';
    ELSE
        RAISE NOTICE 'Tipo app_role configurado corretamente';
    END IF;
END $$;

-- 3. Verificar se a função update_updated_at_column existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
        RAISE EXCEPTION 'Função update_updated_at_column não encontrada';
    ELSE
        RAISE NOTICE 'Função update_updated_at_column configurada corretamente';
    END IF;
END $$;

-- 4. Verificar buckets de storage
DO $$
DECLARE
    missing_buckets TEXT[] := ARRAY[]::TEXT[];
BEGIN
    IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'carteiras') THEN
        missing_buckets := array_append(missing_buckets, 'carteiras');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'certificados') THEN
        missing_buckets := array_append(missing_buckets, 'certificados');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'certidoes') THEN
        missing_buckets := array_append(missing_buckets, 'certidoes');
    END IF;
    
    IF array_length(missing_buckets, 1) > 0 THEN
        RAISE WARNING 'Buckets ausentes: %', array_to_string(missing_buckets, ', ');
    ELSE
        RAISE NOTICE 'Todos os buckets de storage estão configurados';
    END IF;
END $$;

-- 5. Verificar políticas RLS críticas
DO $$
DECLARE
    policy_count INTEGER;
BEGIN
    -- Contar políticas na tabela user_roles
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies 
    WHERE tablename = 'user_roles';
    
    IF policy_count < 3 THEN
        RAISE WARNING 'Políticas RLS insuficientes para user_roles: %', policy_count;
    ELSE
        RAISE NOTICE 'Políticas RLS para user_roles: % configuradas', policy_count;
    END IF;
END $$;

-- 6. Verificar administradores configurados
DO $$
DECLARE
    admin_count INTEGER;
    admin_users TEXT;
BEGIN
    SELECT COUNT(*) INTO admin_count 
    FROM public.user_roles ur
    JOIN auth.users u ON ur.user_id = u.id
    WHERE ur.role = 'admin'::app_role;
    
    SELECT string_agg(u.email, ', ') INTO admin_users
    FROM public.user_roles ur
    JOIN auth.users u ON ur.user_id = u.id
    WHERE ur.role = 'admin'::app_role;
    
    RAISE NOTICE 'Administradores configurados: % (emails: %)', admin_count, COALESCE(admin_users, 'nenhum');
END $$;

-- 7. Verificar integridade da tabela affiliates
DO $$
DECLARE
    constraint_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'check_asaas_wallet_id_format'
    ) INTO constraint_exists;
    
    IF constraint_exists THEN
        RAISE NOTICE 'Constraint check_asaas_wallet_id_format configurada corretamente';
    ELSE
        RAISE WARNING 'Constraint check_asaas_wallet_id_format não encontrada';
    END IF;
END $$;

-- 8. Limpeza de políticas duplicadas ou problemáticas
-- Remover políticas que podem causar conflito
DROP POLICY IF EXISTS "Enable read access for all users" ON public.profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.profiles;
DROP POLICY IF EXISTS "Enable update for users based on email" ON public.profiles;

-- 9. Garantir que RLS está habilitado em todas as tabelas críticas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- 10. Relatório final de status
DO $$
DECLARE
    total_users INTEGER;
    total_profiles INTEGER;
    total_admins INTEGER;
    total_affiliates INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_users FROM auth.users;
    SELECT COUNT(*) INTO total_profiles FROM public.profiles;
    SELECT COUNT(*) INTO total_admins FROM public.user_roles WHERE role = 'admin'::app_role;
    SELECT COUNT(*) INTO total_affiliates FROM public.affiliates;
    
    RAISE NOTICE '=== RELATÓRIO FINAL DE STATUS ===';
    RAISE NOTICE 'Total de usuários: %', total_users;
    RAISE NOTICE 'Total de perfis: %', total_profiles;
    RAISE NOTICE 'Total de administradores: %', total_admins;
    RAISE NOTICE 'Total de afiliados: %', total_affiliates;
    RAISE NOTICE '=== CORREÇÕES APLICADAS COM SUCESSO ===';
END $$;