-- ============================================================================
-- SISTEMA DE TIPOS DE MEMBRO E ASSINATURAS - VERSÃO FINAL
-- Data: 27/08/2025
-- Versão: 1.0 - Testada e validada
-- ============================================================================

-- 1. CRIAR TABELA DE TIPOS DE MEMBRO
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.member_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_by UUID REFERENCES auth.users(id),
    
    CONSTRAINT member_types_name_check CHECK (length(trim(name)) > 0)
);

-- Habilitar RLS
ALTER TABLE public.member_types ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Admins can manage member types" ON public.member_types
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Users can view active member types" ON public.member_types
    FOR SELECT TO authenticated
    USING (is_active = true);

-- 2. CRIAR TABELA DE PLANOS DE ASSINATURA
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.subscription_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
    recurrence VARCHAR(20) NOT NULL CHECK (recurrence IN ('monthly', 'semestral', 'annual')),
    permissions JSONB NOT NULL DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_by UUID REFERENCES auth.users(id),
    
    CONSTRAINT subscription_plans_name_check CHECK (length(trim(name)) > 0)
);

-- Habilitar RLS
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Admins can manage subscription plans" ON public.subscription_plans
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Users can view active subscription plans" ON public.subscription_plans
    FOR SELECT TO authenticated
    USING (is_active = true);

-- 3. CRIAR TABELA DE RELACIONAMENTOS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.member_type_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_type_id UUID NOT NULL REFERENCES member_types(id) ON DELETE CASCADE,
    subscription_plan_id UUID NOT NULL REFERENCES subscription_plans(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_by UUID REFERENCES auth.users(id),
    
    UNIQUE(member_type_id, subscription_plan_id)
);

-- Habilitar RLS
ALTER TABLE public.member_type_subscriptions ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Admins can manage member type subscriptions" ON public.member_type_subscriptions
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Users can view member type subscriptions" ON public.member_type_subscriptions
    FOR SELECT TO authenticated
    USING (true);

-- 4. CRIAR TABELA DE ASSINATURAS ATIVAS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.user_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    subscription_plan_id UUID NOT NULL REFERENCES subscription_plans(id),
    member_type_id UUID NOT NULL REFERENCES member_types(id),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled', 'pending')),
    payment_id VARCHAR(255),
    started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Users can view their own subscriptions" ON public.user_subscriptions
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all subscriptions" ON public.user_subscriptions
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- 5. ATUALIZAR TABELA PROFILES
-- ============================================================================

DO $$
BEGIN
    -- Adicionar member_type_id se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'member_type_id'
    ) THEN
        ALTER TABLE public.profiles 
        ADD COLUMN member_type_id UUID REFERENCES member_types(id);
    END IF;
    
    -- Adicionar subscription_source se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'subscription_source'
    ) THEN
        ALTER TABLE public.profiles 
        ADD COLUMN subscription_source VARCHAR(20) DEFAULT 'manual';
        
        ALTER TABLE public.profiles 
        ADD CONSTRAINT check_subscription_source 
        CHECK (subscription_source IN ('manual', 'filiacao'));
    END IF;
END $$;

-- 6. CRIAR TABELA DE AUDITORIA
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.member_system_audit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name VARCHAR(50) NOT NULL,
    record_id UUID NOT NULL,
    action VARCHAR(20) NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
    old_values JSONB,
    new_values JSONB,
    user_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.member_system_audit ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Admins can view audit logs" ON public.member_system_audit
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- 7. CRIAR ÍNDICES DE PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_member_types_active ON member_types(is_active, sort_order);
CREATE INDEX IF NOT EXISTS idx_member_types_name ON member_types(name);
CREATE INDEX IF NOT EXISTS idx_subscription_plans_active ON subscription_plans(is_active, sort_order);
CREATE INDEX IF NOT EXISTS idx_subscription_plans_recurrence ON subscription_plans(recurrence);
CREATE INDEX IF NOT EXISTS idx_member_type_subs_type ON member_type_subscriptions(member_type_id);
CREATE INDEX IF NOT EXISTS idx_member_type_subs_plan ON member_type_subscriptions(subscription_plan_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON user_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_expires_at ON user_subscriptions(expires_at);
CREATE INDEX IF NOT EXISTS idx_profiles_member_type ON profiles(member_type_id);
CREATE INDEX IF NOT EXISTS idx_audit_table_record ON member_system_audit(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_audit_user_id ON member_system_audit(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_created_at ON member_system_audit(created_at);

-- 8. CRIAR FUNÇÃO DE AUDITORIA
-- ============================================================================

CREATE OR REPLACE FUNCTION audit_member_system()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO member_system_audit (table_name, record_id, action, new_values, user_id)
        VALUES (TG_TABLE_NAME, NEW.id, 'INSERT', to_jsonb(NEW), auth.uid());
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO member_system_audit (table_name, record_id, action, old_values, new_values, user_id)
        VALUES (TG_TABLE_NAME, NEW.id, 'UPDATE', to_jsonb(OLD), to_jsonb(NEW), auth.uid());
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO member_system_audit (table_name, record_id, action, old_values, user_id)
        VALUES (TG_TABLE_NAME, OLD.id, 'DELETE', to_jsonb(OLD), auth.uid());
        RETURN OLD;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. CRIAR TRIGGERS DE AUDITORIA
-- ============================================================================

DROP TRIGGER IF EXISTS audit_member_types ON member_types;
CREATE TRIGGER audit_member_types 
    AFTER INSERT OR UPDATE OR DELETE ON member_types
    FOR EACH ROW EXECUTE FUNCTION audit_member_system();

DROP TRIGGER IF EXISTS audit_subscription_plans ON subscription_plans;
CREATE TRIGGER audit_subscription_plans 
    AFTER INSERT OR UPDATE OR DELETE ON subscription_plans
    FOR EACH ROW EXECUTE FUNCTION audit_member_system();

DROP TRIGGER IF EXISTS audit_user_subscriptions ON user_subscriptions;
CREATE TRIGGER audit_user_subscriptions 
    AFTER INSERT OR UPDATE OR DELETE ON user_subscriptions
    FOR EACH ROW EXECUTE FUNCTION audit_member_system();

-- 10. CRIAR TRIGGERS DE UPDATED_AT
-- ============================================================================

DROP TRIGGER IF EXISTS update_member_types_updated_at ON member_types;
CREATE TRIGGER update_member_types_updated_at
    BEFORE UPDATE ON member_types
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_subscription_plans_updated_at ON subscription_plans;
CREATE TRIGGER update_subscription_plans_updated_at
    BEFORE UPDATE ON subscription_plans
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_subscriptions_updated_at ON user_subscriptions;
CREATE TRIGGER update_user_subscriptions_updated_at
    BEFORE UPDATE ON user_subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- 11. INSERIR DADOS INICIAIS
-- ============================================================================

INSERT INTO public.member_types (name, description, sort_order, is_active) VALUES
    ('Membro', 'Membro regular da convenção', 0, true),
    ('Tesoureiro', 'Responsável pela gestão financeira', 1, true),
    ('Moderador', 'Moderador com permissões especiais', 2, true),
    ('Administrador', 'Administrador do sistema', 3, true)
ON CONFLICT (name) DO NOTHING;

-- 12. ADICIONAR COMENTÁRIOS
-- ============================================================================

COMMENT ON TABLE public.member_types IS 'Tipos de membro personalizáveis do sistema';
COMMENT ON TABLE public.subscription_plans IS 'Planos de assinatura com permissões configuráveis';
COMMENT ON TABLE public.member_type_subscriptions IS 'Relacionamento entre tipos de membro e assinaturas permitidas';
COMMENT ON TABLE public.user_subscriptions IS 'Assinaturas ativas dos usuários';
COMMENT ON TABLE public.member_system_audit IS 'Log de auditoria para o sistema de tipos e assinaturas';

-- ============================================================================
-- SCRIPT EXECUTADO COM SUCESSO
-- ============================================================================

SELECT 'Sistema de Tipos de Membro e Assinaturas criado com sucesso!' as resultado;