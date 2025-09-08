-- ============================================================================
-- CORREÇÃO DE POLÍTICAS RLS
-- Data: 09/01/2025
-- Objetivo: Corrigir políticas RLS que estão bloqueando operações necessárias
-- ============================================================================

-- 1. CORRIGIR POLÍTICAS DE USER_SUBSCRIPTIONS
-- ============================================================================

-- Remover políticas restritivas
DROP POLICY IF EXISTS "Users can view their own subscriptions" ON public.user_subscriptions;
DROP POLICY IF EXISTS "Users can create their own subscriptions" ON public.user_subscriptions;
DROP POLICY IF EXISTS "System can update subscriptions" ON public.user_subscriptions;
DROP POLICY IF EXISTS "Admins can manage all subscriptions" ON public.user_subscriptions;

-- Criar políticas mais permissivas
CREATE POLICY "Users can view their own subscriptions" ON public.user_subscriptions
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create their own subscriptions" ON public.user_subscriptions
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "System can manage subscriptions" ON public.user_subscriptions
    FOR ALL USING (true);

CREATE POLICY "Admins can manage all subscriptions" ON public.user_subscriptions
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
        OR user_id = auth.uid()
    );

-- 2. CRIAR FUNÇÃO PARA SETUP INICIAL DO ADMIN
-- ============================================================================

CREATE OR REPLACE FUNCTION public.setup_admin_subscription()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_admin_user_id UUID;
    v_admin_type_id UUID;
    v_admin_plan_id UUID;
    v_subscription_id UUID;
    v_result JSON;
BEGIN
    -- Buscar usuário admin
    SELECT user_id INTO v_admin_user_id
    FROM public.user_roles 
    WHERE role = 'admin'
    LIMIT 1;
    
    IF v_admin_user_id IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'Nenhum admin encontrado');
    END IF;
    
    -- Buscar tipo Administrador
    SELECT id INTO v_admin_type_id
    FROM public.member_types 
    WHERE name = 'Administrador'
    LIMIT 1;
    
    IF v_admin_type_id IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'Tipo Administrador não encontrado');
    END IF;
    
    -- Buscar plano gratuito
    SELECT id INTO v_admin_plan_id
    FROM public.subscription_plans 
    WHERE price = 0
    LIMIT 1;
    
    IF v_admin_plan_id IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'Plano gratuito não encontrado');
    END IF;
    
    -- Verificar se já existe assinatura
    SELECT id INTO v_subscription_id
    FROM public.user_subscriptions 
    WHERE user_id = v_admin_user_id;
    
    IF v_subscription_id IS NOT NULL THEN
        RETURN json_build_object(
            'success', true, 
            'message', 'Admin já possui assinatura',
            'subscription_id', v_subscription_id
        );
    END IF;
    
    -- Criar assinatura para admin
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
        v_admin_type_id,
        'active',
        now(),
        now() + INTERVAL '10 years'
    )
    RETURNING id INTO v_subscription_id;
    
    -- Atualizar profile
    UPDATE public.profiles 
    SET 
        member_type_id = v_admin_type_id,
        subscription_source = 'manual',
        status = 'ativo',
        updated_at = now()
    WHERE id = v_admin_user_id;
    
    RETURN json_build_object(
        'success', true,
        'message', 'Assinatura admin criada com sucesso',
        'subscription_id', v_subscription_id,
        'user_id', v_admin_user_id
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', SQLERRM
        );
END;
$$;

-- 3. EXECUTAR SETUP DO ADMIN
-- ============================================================================

SELECT public.setup_admin_subscription() as resultado;

-- 4. COMENTÁRIOS
-- ============================================================================

COMMENT ON FUNCTION public.setup_admin_subscription IS 'Configura assinatura inicial para usuário admin';

-- ============================================================================
-- SCRIPT DE CORREÇÃO RLS CONCLUÍDO
-- ============================================================================

SELECT 'Políticas RLS corrigidas e admin configurado!' as resultado;