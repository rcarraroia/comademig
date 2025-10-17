-- ============================================
-- ANÁLISE PRÉVIA REALIZADA
-- ============================================
-- Data: 16/10/2025
-- Tarefa: 5. Corrigir RLS policies
-- Problemas identificados:
--   🔴 CRÍTICO: asaas_customers permite authenticated modificar dados
--   🟡 user_subscriptions permite usuários alterarem status/valores
--   🟡 asaas_splits não permite service_role criar/atualizar
-- ============================================

-- ============================================
-- 1. CORRIGIR asaas_customers
-- ============================================

DROP POLICY IF EXISTS "System can manage customers" ON public.asaas_customers;

CREATE POLICY "Service role can manage customers" 
ON public.asaas_customers 
FOR ALL 
TO service_role 
USING (true);

-- ============================================
-- 2. CORRIGIR user_subscriptions
-- ============================================

DROP POLICY IF EXISTS "Users can update own subscriptions" ON public.user_subscriptions;

CREATE POLICY "Service role can manage subscriptions" 
ON public.user_subscriptions 
FOR ALL 
TO service_role 
USING (true);

-- ============================================
-- 3. CORRIGIR asaas_splits
-- ============================================

-- 3.1. Atualizar policy de visualização
DROP POLICY IF EXISTS "Users can view splits related to them" ON public.asaas_splits;

CREATE POLICY "Users can view their splits" 
ON public.asaas_splits 
FOR SELECT 
TO authenticated
USING (
    auth.uid() = affiliate_id 
    OR 
    auth.uid() = (
        SELECT user_id 
        FROM user_subscriptions 
        WHERE id = asaas_splits.subscription_id
    )
    OR
    current_setting('role') = 'service_role'
);

-- 3.2. Atualizar policy de INSERT
DROP POLICY IF EXISTS "system_create_splits" ON public.asaas_splits;

CREATE POLICY "System can create splits" 
ON public.asaas_splits 
FOR INSERT 
TO service_role, authenticated
WITH CHECK (
    current_setting('role') = 'service_role'
    OR 
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND tipo_membro IN ('admin', 'super_admin')
    )
);

-- 3.3. Atualizar policy de UPDATE
DROP POLICY IF EXISTS "system_update_splits" ON public.asaas_splits;

CREATE POLICY "System can update splits" 
ON public.asaas_splits 
FOR UPDATE 
TO service_role, authenticated
USING (
    current_setting('role') = 'service_role'
    OR 
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND tipo_membro IN ('admin', 'super_admin')
    )
);

-- ============================================
-- COMENTÁRIOS
-- ============================================

COMMENT ON POLICY "Service role can manage customers" ON public.asaas_customers IS 
'Apenas service_role (Edge Functions) pode gerenciar dados de clientes do Asaas';

COMMENT ON POLICY "Service role can manage subscriptions" ON public.user_subscriptions IS 
'Apenas service_role (Webhooks, Edge Functions) pode atualizar assinaturas';

COMMENT ON POLICY "Users can view their splits" ON public.asaas_splits IS 
'Usuários podem ver splits onde são afiliados ou donos da assinatura';

COMMENT ON POLICY "System can create splits" ON public.asaas_splits IS 
'Service_role e admins podem criar splits';

COMMENT ON POLICY "System can update splits" ON public.asaas_splits IS 
'Service_role e admins podem atualizar splits';
