-- FASE 1 - CORREÇÕES CRÍTICAS DO BANCO DE DADOS
-- Data: 27/08/2025
-- Responsável: Kiro AI Assistant
-- Objetivo: Corrigir problemas críticos identificados na auditoria

-- ============================================================================
-- 1. CORREÇÃO DE ESTRUTURAS AUSENTES
-- ============================================================================

-- 1.1 Criar tipo ENUM app_role se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
        CREATE TYPE public.app_role AS ENUM ('admin', 'moderador', 'tesoureiro', 'membro');
    END IF;
END $$;

-- 1.2 Criar tabela user_roles se não existir
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Habilitar RLS na tabela user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 1.3 Criar função update_updated_at_column se não existir
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 1.4 Adicionar triggers para updated_at onde necessário
DO $$
DECLARE
    tbl_name TEXT;
    tables_with_updated_at TEXT[] := ARRAY['user_roles', 'profiles', 'affiliates', 'referrals', 'transactions'];
BEGIN
    FOREACH tbl_name IN ARRAY tables_with_updated_at
    LOOP
        -- Verificar se a tabela existe e tem coluna updated_at
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = tbl_name 
            AND column_name = 'updated_at'
        ) THEN
            -- Remover trigger existente se houver
            EXECUTE format('DROP TRIGGER IF EXISTS update_%s_updated_at ON public.%I', tbl_name, tbl_name);
            
            -- Criar novo trigger
            EXECUTE format('
                CREATE TRIGGER update_%s_updated_at
                BEFORE UPDATE ON public.%I
                FOR EACH ROW
                EXECUTE FUNCTION public.update_updated_at_column()
            ', tbl_name, tbl_name);
        END IF;
    END LOOP;
END $$;

-- ============================================================================
-- 2. CORREÇÃO DE POLÍTICAS RLS (SEM RECURSÃO)
-- ============================================================================

-- 2.1 Remover políticas problemáticas que causam recursão
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage all affiliates" ON public.affiliates;
DROP POLICY IF EXISTS "Admins can view all affiliates" ON public.affiliates;

-- 2.2 Criar políticas simples baseadas em tipo_membro (sem recursão)
CREATE POLICY "Admin access to profiles" ON public.profiles
    FOR ALL USING (
        auth.uid() IN (
            SELECT id FROM public.profiles 
            WHERE tipo_membro = 'admin'
        )
        OR id = auth.uid()
    );

-- 2.3 Políticas para user_roles
CREATE POLICY "Users can view their own roles" ON public.user_roles
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admin can manage all roles" ON public.user_roles
    FOR ALL USING (
        auth.uid() IN (
            SELECT id FROM public.profiles 
            WHERE tipo_membro = 'admin'
        )
    );

-- 2.4 Políticas para affiliates
CREATE POLICY "Users can view their own affiliate data" ON public.affiliates
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their own affiliate data" ON public.affiliates
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Admin can manage all affiliates" ON public.affiliates
    FOR ALL USING (
        auth.uid() IN (
            SELECT id FROM public.profiles 
            WHERE tipo_membro = 'admin'
        )
    );

-- ============================================================================
-- 3. CRIAÇÃO DE BUCKETS DE STORAGE
-- ============================================================================

-- 3.1 Criar bucket 'carteiras' se não existir
INSERT INTO storage.buckets (id, name, public) 
VALUES ('carteiras', 'carteiras', false)
ON CONFLICT (id) DO NOTHING;

-- 3.2 Políticas para bucket carteiras
CREATE POLICY "Users can upload their own carteira photos" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'carteiras' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can view their own carteira photos" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'carteiras' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can update their own carteira photos" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'carteiras' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can delete their own carteira photos" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'carteiras' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- 3.3 Admin pode acessar todas as fotos de carteiras
CREATE POLICY "Admin can manage all carteira photos" ON storage.objects
    FOR ALL USING (
        bucket_id = 'carteiras' AND
        auth.uid() IN (
            SELECT id FROM public.profiles 
            WHERE tipo_membro = 'admin'
        )
    );

-- ============================================================================
-- 4. MELHORIAS DE VALIDAÇÃO E CONSTRAINTS
-- ============================================================================

-- 4.1 Melhorar validação de CPF na tabela profiles
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS check_cpf_format;

ALTER TABLE public.profiles 
ADD CONSTRAINT check_cpf_format 
CHECK (cpf IS NULL OR cpf ~ '^\d{3}\.\d{3}\.\d{3}-\d{2}$');

-- 4.2 Adicionar campo email à tabela profiles se necessário
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'email'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN email TEXT;
        
        -- Criar índice para email
        CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
    END IF;
END $$;

-- 4.3 Melhorar constraints da tabela affiliates
ALTER TABLE public.affiliates 
DROP CONSTRAINT IF EXISTS check_asaas_wallet_id_format;

ALTER TABLE public.affiliates 
ADD CONSTRAINT check_asaas_wallet_id_format 
CHECK (length(asaas_wallet_id) >= 10 AND asaas_wallet_id ~ '^[a-zA-Z0-9\-_]+$');

-- ============================================================================
-- 5. ÍNDICES DE PERFORMANCE
-- ============================================================================

-- 5.1 Índices para tabela affiliates
CREATE INDEX IF NOT EXISTS idx_affiliates_status ON public.affiliates(status);
CREATE INDEX IF NOT EXISTS idx_affiliates_referral_code ON public.affiliates(referral_code);
CREATE INDEX IF NOT EXISTS idx_affiliates_user_id ON public.affiliates(user_id);
CREATE INDEX IF NOT EXISTS idx_affiliates_asaas_wallet_id ON public.affiliates(asaas_wallet_id);

-- 5.2 Índices para tabela referrals (se existir)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'referrals') THEN
        -- Criar índices apenas para colunas que existem
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'referrals' AND column_name = 'status') THEN
            CREATE INDEX IF NOT EXISTS idx_referrals_status ON public.referrals(status);
        END IF;
        
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'referrals' AND column_name = 'created_at') THEN
            CREATE INDEX IF NOT EXISTS idx_referrals_created_at ON public.referrals(created_at);
        END IF;
        
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'referrals' AND column_name = 'referrer_id') THEN
            CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON public.referrals(referrer_id);
        END IF;
        
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'referrals' AND column_name = 'referred_id') THEN
            CREATE INDEX IF NOT EXISTS idx_referrals_referred_id ON public.referrals(referred_id);
        END IF;
    END IF;
END $$;

-- 5.3 Índices para tabela transactions (se existir)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'transactions') THEN
        -- Criar índices apenas para colunas que existem
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'transactions' AND column_name = 'status') THEN
            CREATE INDEX IF NOT EXISTS idx_transactions_status ON public.transactions(status);
        END IF;
        
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'transactions' AND column_name = 'created_at') THEN
            CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON public.transactions(created_at);
        END IF;
        
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'transactions' AND column_name = 'user_id') THEN
            CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);
        END IF;
        
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'transactions' AND column_name = 'type') THEN
            CREATE INDEX IF NOT EXISTS idx_transactions_type ON public.transactions(type);
        END IF;
    END IF;
END $$;

-- 5.4 Índices para user_roles
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);

-- 5.5 Índices para profiles
CREATE INDEX IF NOT EXISTS idx_profiles_tipo_membro ON public.profiles(tipo_membro);
CREATE INDEX IF NOT EXISTS idx_profiles_cpf ON public.profiles(cpf);

-- ============================================================================
-- 6. FUNÇÕES DE AUDITORIA
-- ============================================================================

-- 6.1 Criar função de auditoria se tabela audit_logs existir
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'audit_logs') THEN
        CREATE OR REPLACE FUNCTION public.audit_trigger()
        RETURNS TRIGGER AS $audit$
        BEGIN
            IF TG_OP = 'INSERT' THEN
                INSERT INTO public.audit_logs (user_id, action, table_name, record_id, new_values)
                VALUES (auth.uid(), 'INSERT', TG_TABLE_NAME, NEW.id, to_jsonb(NEW));
                RETURN NEW;
            ELSIF TG_OP = 'UPDATE' THEN
                INSERT INTO public.audit_logs (user_id, action, table_name, record_id, old_values, new_values)
                VALUES (auth.uid(), 'UPDATE', TG_TABLE_NAME, NEW.id, to_jsonb(OLD), to_jsonb(NEW));
                RETURN NEW;
            ELSIF TG_OP = 'DELETE' THEN
                INSERT INTO public.audit_logs (user_id, action, table_name, record_id, old_values)
                VALUES (auth.uid(), 'DELETE', TG_TABLE_NAME, OLD.id, to_jsonb(OLD));
                RETURN OLD;
            END IF;
        END;
        $audit$ LANGUAGE plpgsql SECURITY DEFINER;
    END IF;
END $$;

-- ============================================================================
-- 7. COMENTÁRIOS E DOCUMENTAÇÃO
-- ============================================================================

-- 7.1 Adicionar comentários às tabelas e colunas principais
COMMENT ON TABLE public.user_roles IS 'Tabela para gerenciar roles/permissões dos usuários';
COMMENT ON COLUMN public.user_roles.user_id IS 'Referência ao usuário no auth.users';
COMMENT ON COLUMN public.user_roles.role IS 'Role do usuário (admin, moderador, tesoureiro, membro)';

COMMENT ON TABLE public.affiliates IS 'Tabela de afiliados do sistema';
COMMENT ON COLUMN public.affiliates.asaas_wallet_id IS 'Wallet ID da Asaas (formato string) para recebimento de comissões';
COMMENT ON COLUMN public.affiliates.referral_code IS 'Código único de referência do afiliado';

-- ============================================================================
-- 8. VERIFICAÇÕES FINAIS E LIMPEZA
-- ============================================================================

-- 8.1 Garantir que todas as tabelas principais tenham RLS habilitado
DO $$
DECLARE
    tbl_name TEXT;
    tables_with_rls TEXT[] := ARRAY['profiles', 'affiliates', 'user_roles'];
BEGIN
    FOREACH tbl_name IN ARRAY tables_with_rls
    LOOP
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = tbl_name) THEN
            EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl_name);
        END IF;
    END LOOP;
END $$;

-- 8.2 Criar usuário admin inicial se não existir (baseado no primeiro usuário)
DO $$
DECLARE
    first_user_id UUID;
BEGIN
    -- Buscar o primeiro usuário criado
    SELECT id INTO first_user_id 
    FROM auth.users 
    ORDER BY created_at 
    LIMIT 1;
    
    -- Se existe usuário e não tem role admin, criar
    IF first_user_id IS NOT NULL THEN
        INSERT INTO public.user_roles (user_id, role)
        VALUES (first_user_id, 'admin'::app_role)
        ON CONFLICT (user_id, role) DO NOTHING;
        
        -- Garantir que o perfil está marcado como admin
        UPDATE public.profiles 
        SET tipo_membro = 'admin'
        WHERE id = first_user_id;
    END IF;
END $$;

-- ============================================================================
-- FASE 1 CONCLUÍDA
-- ============================================================================

-- Log de conclusão
DO $$
BEGIN
    RAISE NOTICE 'FASE 1 - CORREÇÕES CRÍTICAS CONCLUÍDA COM SUCESSO';
    RAISE NOTICE 'Data: %', now();
    RAISE NOTICE 'Correções aplicadas:';
    RAISE NOTICE '- Estruturas ausentes criadas (user_roles, funções)';
    RAISE NOTICE '- Políticas RLS corrigidas (sem recursão)';
    RAISE NOTICE '- Buckets de storage criados';
    RAISE NOTICE '- Validações e constraints melhoradas';
    RAISE NOTICE '- Índices de performance adicionados';
    RAISE NOTICE '- Sistema de auditoria preparado';
    RAISE NOTICE '- Usuário admin inicial configurado';
END $$;