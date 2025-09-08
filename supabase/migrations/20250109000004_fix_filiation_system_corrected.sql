-- ============================================================================
-- CORREÇÃO DO SISTEMA DE FILIAÇÃO
-- Data: 09/01/2025
-- Objetivo: Corrigir problemas no fluxo de filiação e integração com pagamentos
-- ============================================================================

-- 1. VERIFICAR E CORRIGIR ESTRUTURA DE TABELAS EXISTENTES
-- ============================================================================

-- Verificar se user_subscriptions tem todas as colunas necessárias
DO $$
BEGIN
    -- Adicionar payment_reference se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'user_subscriptions' 
        AND column_name = 'payment_reference'
    ) THEN
        ALTER TABLE public.user_subscriptions 
        ADD COLUMN payment_reference VARCHAR(255);
        
        COMMENT ON COLUMN public.user_subscriptions.payment_reference IS 'Referência do pagamento (ID da cobrança Asaas)';
    END IF;
    
    -- Adicionar auto_renew se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'user_subscriptions' 
        AND column_name = 'auto_renew'
    ) THEN
        ALTER TABLE public.user_subscriptions 
        ADD COLUMN auto_renew BOOLEAN DEFAULT true;
    END IF;
    
    -- Corrigir constraint de status se necessário
    ALTER TABLE public.user_subscriptions 
    DROP CONSTRAINT IF EXISTS user_subscriptions_status_check;
    
    ALTER TABLE public.user_subscriptions 
    ADD CONSTRAINT user_subscriptions_status_check 
    CHECK (status IN ('active', 'expired', 'cancelled', 'pending'));
END $$;

-- 2. CORRIGIR POLÍTICAS RLS PARA PERMITIR INSERÇÃO VIA FILIAÇÃO
-- ============================================================================

-- Política para permitir que usuários criem suas próprias assinaturas
DROP POLICY IF EXISTS "Users can create their own subscriptions" ON public.user_subscriptions;
CREATE POLICY "Users can create their own subscriptions" ON public.user_subscriptions
    FOR INSERT 
    WITH CHECK (user_id = auth.uid());

-- Política para permitir que sistema atualize assinaturas via webhook
DROP POLICY IF EXISTS "System can update subscriptions" ON public.user_subscriptions;
CREATE POLICY "System can update subscriptions" ON public.user_subscriptions
    FOR UPDATE 
    USING (true);

-- 3. CRIAR FUNÇÃO PARA PROCESSAR FILIAÇÃO
-- ============================================================================

CREATE OR REPLACE FUNCTION public.process_filiation(
    p_user_id UUID,
    p_member_type_id UUID,
    p_subscription_plan_id UUID,
    p_payment_reference VARCHAR DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_subscription_id UUID;
    v_member_type_name TEXT;
    v_plan_name TEXT;
    v_result JSON;
BEGIN
    -- Verificar se o usuário existe
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = p_user_id) THEN
        RAISE EXCEPTION 'Usuário não encontrado';
    END IF;
    
    -- Verificar se member_type existe
    SELECT name INTO v_member_type_name 
    FROM public.member_types 
    WHERE id = p_member_type_id AND is_active = true;
    
    IF v_member_type_name IS NULL THEN
        RAISE EXCEPTION 'Tipo de membro não encontrado ou inativo';
    END IF;
    
    -- Verificar se subscription_plan existe
    SELECT name INTO v_plan_name 
    FROM public.subscription_plans 
    WHERE id = p_subscription_plan_id AND is_active = true;
    
    IF v_plan_name IS NULL THEN
        RAISE EXCEPTION 'Plano de assinatura não encontrado ou inativo';
    END IF;
    
    -- Verificar se já existe assinatura ativa para o usuário
    IF EXISTS (
        SELECT 1 FROM public.user_subscriptions 
        WHERE user_id = p_user_id AND status = 'active'
    ) THEN
        RAISE EXCEPTION 'Usuário já possui assinatura ativa';
    END IF;
    
    -- Criar assinatura
    INSERT INTO public.user_subscriptions (
        user_id,
        subscription_plan_id,
        member_type_id,
        status,
        payment_reference,
        started_at,
        expires_at
    ) VALUES (
        p_user_id,
        p_subscription_plan_id,
        p_member_type_id,
        CASE WHEN p_payment_reference IS NOT NULL THEN 'active' ELSE 'pending' END,
        p_payment_reference,
        now(),
        now() + INTERVAL '1 year'  -- Padrão de 1 ano, pode ser ajustado
    )
    RETURNING id INTO v_subscription_id;
    
    -- Atualizar profile com member_type_id
    UPDATE public.profiles 
    SET 
        member_type_id = p_member_type_id,
        subscription_source = 'filiacao',
        updated_at = now()
    WHERE id = p_user_id;
    
    -- Criar log de auditoria
    INSERT INTO public.member_system_audit (
        table_name,
        record_id,
        action,
        new_values,
        user_id
    ) VALUES (
        'user_subscriptions',
        v_subscription_id,
        'INSERT',
        json_build_object(
            'user_id', p_user_id,
            'member_type', v_member_type_name,
            'plan', v_plan_name,
            'payment_reference', p_payment_reference
        ),
        p_user_id
    );
    
    -- Retornar resultado
    v_result := json_build_object(
        'success', true,
        'subscription_id', v_subscription_id,
        'member_type', v_member_type_name,
        'plan', v_plan_name,
        'status', CASE WHEN p_payment_reference IS NOT NULL THEN 'active' ELSE 'pending' END
    );
    
    RETURN v_result;
    
EXCEPTION
    WHEN OTHERS THEN
        -- Log do erro
        INSERT INTO public.member_system_audit (
            table_name,
            record_id,
            action,
            new_values,
            user_id
        ) VALUES (
            'user_subscriptions',
            NULL,
            'ERROR',
            json_build_object(
                'error', SQLERRM,
                'user_id', p_user_id,
                'member_type_id', p_member_type_id,
                'subscription_plan_id', p_subscription_plan_id
            ),
            p_user_id
        );
        
        RETURN json_build_object(
            'success', false,
            'error', SQLERRM
        );
END;
$$;

-- 4. CRIAR FUNÇÃO PARA ATIVAR ASSINATURA VIA WEBHOOK
-- ============================================================================

CREATE OR REPLACE FUNCTION public.activate_subscription_by_payment(
    p_payment_reference VARCHAR,
    p_asaas_payment_id VARCHAR DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_subscription_id UUID;
    v_user_id UUID;
    v_result JSON;
BEGIN
    -- Buscar assinatura pendente pelo payment_reference
    SELECT id, user_id INTO v_subscription_id, v_user_id
    FROM public.user_subscriptions 
    WHERE payment_reference = p_payment_reference 
    AND status = 'pending';
    
    IF v_subscription_id IS NULL THEN
        RAISE EXCEPTION 'Assinatura não encontrada ou já ativa';
    END IF;
    
    -- Ativar assinatura
    UPDATE public.user_subscriptions 
    SET 
        status = 'active',
        started_at = now(),
        updated_at = now()
    WHERE id = v_subscription_id;
    
    -- Atualizar status do profile
    UPDATE public.profiles 
    SET 
        status = 'ativo',
        updated_at = now()
    WHERE id = v_user_id;
    
    -- Log de auditoria
    INSERT INTO public.member_system_audit (
        table_name,
        record_id,
        action,
        new_values,
        user_id
    ) VALUES (
        'user_subscriptions',
        v_subscription_id,
        'ACTIVATE',
        json_build_object(
            'payment_reference', p_payment_reference,
            'asaas_payment_id', p_asaas_payment_id,
            'activated_at', now()
        ),
        v_user_id
    );
    
    RETURN json_build_object(
        'success', true,
        'subscription_id', v_subscription_id,
        'user_id', v_user_id,
        'status', 'active'
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', SQLERRM
        );
END;
$$;

-- 5. CRIAR FUNÇÃO PARA VERIFICAR PERMISSÕES DE USUÁRIO
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_user_permissions(p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_permissions JSON;
    v_subscription RECORD;
BEGIN
    -- Buscar assinatura ativa do usuário
    SELECT 
        us.*,
        sp.permissions,
        mt.name as member_type_name
    INTO v_subscription
    FROM public.user_subscriptions us
    JOIN public.subscription_plans sp ON us.subscription_plan_id = sp.id
    JOIN public.member_types mt ON us.member_type_id = mt.id
    WHERE us.user_id = p_user_id 
    AND us.status = 'active'
    ORDER BY us.created_at DESC
    LIMIT 1;
    
    IF v_subscription IS NULL THEN
        -- Usuário sem assinatura ativa - permissões básicas
        v_permissions := json_build_object(
            'has_subscription', false,
            'member_type', null,
            'permissions', json_build_object()
        );
    ELSE
        -- Usuário com assinatura ativa
        v_permissions := json_build_object(
            'has_subscription', true,
            'member_type', v_subscription.member_type_name,
            'subscription_plan', v_subscription.subscription_plan_id,
            'permissions', COALESCE(v_subscription.permissions, json_build_object()),
            'expires_at', v_subscription.expires_at
        );
    END IF;
    
    RETURN v_permissions;
END;
$$;

-- 6. CRIAR ÍNDICES PARA PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_user_subscriptions_payment_ref 
ON public.user_subscriptions(payment_reference) 
WHERE payment_reference IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_status 
ON public.user_subscriptions(user_id, status);

-- 7. INSERIR DADOS DE TESTE (SE NECESSÁRIO)
-- ============================================================================

-- Verificar se há pelo menos um admin configurado
DO $$
DECLARE
    v_admin_user_id UUID;
    v_admin_member_type_id UUID;
    v_admin_plan_id UUID;
BEGIN
    -- Buscar primeiro usuário (assumindo que é admin)
    SELECT id INTO v_admin_user_id 
    FROM auth.users 
    ORDER BY created_at 
    LIMIT 1;
    
    IF v_admin_user_id IS NOT NULL THEN
        -- Buscar tipo "Administrador"
        SELECT id INTO v_admin_member_type_id 
        FROM public.member_types 
        WHERE name = 'Administrador';
        
        -- Buscar plano gratuito para admin
        SELECT id INTO v_admin_plan_id 
        FROM public.subscription_plans 
        WHERE price = 0 
        ORDER BY created_at 
        LIMIT 1;
        
        -- Se não existe assinatura para o admin, criar
        IF v_admin_member_type_id IS NOT NULL AND v_admin_plan_id IS NOT NULL THEN
            IF NOT EXISTS (
                SELECT 1 FROM public.user_subscriptions 
                WHERE user_id = v_admin_user_id
            ) THEN
                -- Criar assinatura admin
                INSERT INTO public.user_subscriptions (
                    user_id,
                    subscription_plan_id,
                    member_type_id,
                    status,
                    started_at,
                    expires_at
                ) VALUES (
                    v_admin_user_id,
                    v_admin_plan_id,
                    v_admin_member_type_id,
                    'active',
                    now(),
                    now() + INTERVAL '10 years'  -- Admin não expira
                );
                
                -- Atualizar profile
                UPDATE public.profiles 
                SET 
                    member_type_id = v_admin_member_type_id,
                    subscription_source = 'manual',
                    status = 'ativo'
                WHERE id = v_admin_user_id;
                
                -- Criar role de admin se não existir
                INSERT INTO public.user_roles (user_id, role)
                VALUES (v_admin_user_id, 'admin')
                ON CONFLICT (user_id, role) DO NOTHING;
            END IF;
        END IF;
    END IF;
END $$;

-- 8. COMENTÁRIOS E DOCUMENTAÇÃO
-- ============================================================================

COMMENT ON FUNCTION public.process_filiation IS 'Processa filiação completa: cria assinatura e atualiza profile';
COMMENT ON FUNCTION public.activate_subscription_by_payment IS 'Ativa assinatura quando pagamento é confirmado via webhook';
COMMENT ON FUNCTION public.get_user_permissions IS 'Retorna permissões do usuário baseadas na assinatura ativa';

-- ============================================================================
-- SCRIPT DE CORREÇÃO DO SISTEMA DE FILIAÇÃO CONCLUÍDO
-- ============================================================================

SELECT 'Sistema de filiação corrigido com sucesso!' as resultado,
       'Funções criadas: process_filiation, activate_subscription_by_payment, get_user_permissions' as funcoes,
       'Políticas RLS atualizadas para permitir filiação' as politicas;