-- =====================================================
-- MIGRAÇÃO: Unificação de Tipos de Membro e Assinaturas
-- Data: 2025-01-26
-- Descrição: Adiciona constraints e estrutura para unificação
-- =====================================================

-- 1. CRIAR TABELA subscription_plans SE NÃO EXISTIR
-- =====================================================

-- Verificar se a tabela subscription_plans já existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'subscription_plans') THEN
        CREATE TABLE public.subscription_plans (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            plan_title VARCHAR(255) NOT NULL,
            description TEXT,
            price DECIMAL(10,2) NOT NULL CHECK (price >= 25.00),
            recurrence VARCHAR(20) NOT NULL CHECK (recurrence IN ('Mensal', 'Anual')),
            plan_id_gateway VARCHAR(255),
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            created_by UUID REFERENCES auth.users(id)
        );
        RAISE NOTICE 'Tabela subscription_plans criada com sucesso';
    ELSE
        RAISE NOTICE 'Tabela subscription_plans já existe';
    END IF;
END $$;

-- 2. ADICIONAR CONSTRAINTS DE UNICIDADE
-- =====================================================

-- Constraint de unicidade para member_types.name (se não existir)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'unique_member_type_name' 
        AND table_name = 'member_types'
    ) THEN
        ALTER TABLE member_types ADD CONSTRAINT unique_member_type_name UNIQUE (name);
    END IF;
END $$;

-- Constraint de unicidade para subscription_plans.plan_title
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'unique_plan_title' 
        AND table_name = 'subscription_plans'
    ) THEN
        ALTER TABLE subscription_plans ADD CONSTRAINT unique_plan_title UNIQUE (plan_title);
    END IF;
END $$;

-- 3. ADICIONAR CONSTRAINTS DE VALIDAÇÃO
-- =====================================================

-- Constraint de valor mínimo para subscription_plans.price (já incluída na criação da tabela)
-- Constraint de recorrência válida (já incluída na criação da tabela)
-- Estas constraints são aplicadas automaticamente quando a tabela é criada

-- 4. AJUSTAR TABELA member_type_subscriptions EXISTENTE
-- =====================================================

-- A tabela member_type_subscriptions existe mas não tem a coluna subscription_plan_id
DO $$
BEGIN
    -- Verificar se a coluna subscription_plan_id já existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'member_type_subscriptions' 
        AND column_name = 'subscription_plan_id'
    ) THEN
        -- Adicionar a coluna subscription_plan_id
        ALTER TABLE public.member_type_subscriptions 
        ADD COLUMN subscription_plan_id UUID REFERENCES subscription_plans(id) ON DELETE CASCADE;
        
        RAISE NOTICE 'Coluna subscription_plan_id adicionada à tabela member_type_subscriptions';
    ELSE
        RAISE NOTICE 'Coluna subscription_plan_id já existe em member_type_subscriptions';
    END IF;
    
    -- Verificar se a constraint de unicidade já existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'member_type_subscriptions' 
        AND constraint_name = 'member_type_subscriptions_member_type_id_subscription_plan_id_key'
    ) THEN
        -- Adicionar constraint de unicidade
        ALTER TABLE public.member_type_subscriptions 
        ADD CONSTRAINT member_type_subscriptions_unique_relationship 
        UNIQUE(member_type_id, subscription_plan_id);
        
        RAISE NOTICE 'Constraint de unicidade adicionada à member_type_subscriptions';
    ELSE
        RAISE NOTICE 'Constraint de unicidade já existe em member_type_subscriptions';
    END IF;
END $$;

-- 5. CRIAR ÍNDICES PARA PERFORMANCE
-- =====================================================

-- Índices para member_types
CREATE INDEX IF NOT EXISTS idx_member_types_active_order ON member_types(is_active, sort_order);
CREATE INDEX IF NOT EXISTS idx_member_types_name_unique ON member_types(name);

-- Índices para subscription_plans
CREATE INDEX IF NOT EXISTS idx_subscription_plans_active ON subscription_plans(is_active);
CREATE INDEX IF NOT EXISTS idx_subscription_plans_recurrence ON subscription_plans(recurrence);
CREATE INDEX IF NOT EXISTS idx_subscription_plans_price ON subscription_plans(price);
CREATE INDEX IF NOT EXISTS idx_subscription_plans_title_unique ON subscription_plans(plan_title);

-- Índices para member_type_subscriptions
CREATE INDEX IF NOT EXISTS idx_member_type_subs_lookup ON member_type_subscriptions(member_type_id, subscription_plan_id);
CREATE INDEX IF NOT EXISTS idx_member_type_subs_member_type ON member_type_subscriptions(member_type_id);
CREATE INDEX IF NOT EXISTS idx_member_type_subs_plan ON member_type_subscriptions(subscription_plan_id);

-- 6. HABILITAR RLS (ROW LEVEL SECURITY)
-- =====================================================

-- RLS para subscription_plans
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para subscription_plans
DROP POLICY IF EXISTS "Admins can manage subscription plans" ON public.subscription_plans;
CREATE POLICY "Admins can manage subscription plans" ON public.subscription_plans
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

DROP POLICY IF EXISTS "Users can view active subscription plans" ON public.subscription_plans;
CREATE POLICY "Users can view active subscription plans" ON public.subscription_plans
    FOR SELECT TO authenticated
    USING (is_active = true);

-- RLS para member_type_subscriptions
ALTER TABLE public.member_type_subscriptions ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para member_type_subscriptions
DROP POLICY IF EXISTS "Admins can manage member type subscriptions" ON public.member_type_subscriptions;
CREATE POLICY "Admins can manage member type subscriptions" ON public.member_type_subscriptions
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

DROP POLICY IF EXISTS "Users can view member type subscriptions" ON public.member_type_subscriptions;
CREATE POLICY "Users can view member type subscriptions" ON public.member_type_subscriptions
    FOR SELECT TO authenticated
    USING (true);

-- 7. TRIGGERS PARA UPDATED_AT
-- =====================================================

-- Função para atualizar updated_at (se não existir)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para subscription_plans
DROP TRIGGER IF EXISTS update_subscription_plans_updated_at ON subscription_plans;
CREATE TRIGGER update_subscription_plans_updated_at
    BEFORE UPDATE ON subscription_plans
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 8. COMENTÁRIOS PARA DOCUMENTAÇÃO
-- =====================================================

COMMENT ON TABLE public.subscription_plans IS 'Planos de assinatura unificados com tipos de membro - valor mínimo R$ 25,00';
COMMENT ON TABLE public.member_type_subscriptions IS 'Relacionamento 1:1 entre tipos de membro e planos de assinatura';

COMMENT ON COLUMN public.subscription_plans.plan_title IS 'Título único do plano de assinatura';
COMMENT ON COLUMN public.subscription_plans.price IS 'Valor da contribuição (mínimo R$ 25,00)';
COMMENT ON COLUMN public.subscription_plans.recurrence IS 'Frequência de cobrança: Mensal ou Anual';
COMMENT ON COLUMN public.subscription_plans.plan_id_gateway IS 'ID do plano no gateway de pagamento Asaas';

-- 9. VALIDAÇÃO DA MIGRAÇÃO
-- =====================================================

DO $$
DECLARE
    table_count INTEGER;
    constraint_count INTEGER;
BEGIN
    -- Verificar se as tabelas foram criadas
    SELECT COUNT(*) INTO table_count
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name IN ('subscription_plans', 'member_type_subscriptions');
    
    -- Verificar se as constraints foram criadas
    SELECT COUNT(*) INTO constraint_count
    FROM information_schema.table_constraints 
    WHERE constraint_name IN ('unique_member_type_name', 'unique_plan_title', 'min_price_check', 'valid_recurrence_check');
    
    IF table_count >= 2 AND constraint_count >= 2 THEN
        RAISE NOTICE 'SUCCESS: Migração de unificação aplicada com sucesso!';
        RAISE NOTICE 'Tabelas criadas: %', table_count;
        RAISE NOTICE 'Constraints aplicadas: %', constraint_count;
    ELSE
        RAISE EXCEPTION 'ERRO: Migração incompleta. Tabelas: %, Constraints: %', table_count, constraint_count;
    END IF;
END $$;