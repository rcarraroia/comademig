-- Sistema de Pagamentos COMADEMIG - Políticas RLS Simplificadas
-- Data: 2025-01-09
-- Descrição: Políticas de Row Level Security básicas para o sistema de pagamentos

-- =====================================================
-- HABILITAR RLS EM TODAS AS TABELAS
-- =====================================================

ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_splits ENABLE ROW LEVEL SECURITY;
ALTER TABLE asaas_webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_commissions ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- POLÍTICAS PARA payment_transactions
-- =====================================================

-- Usuários podem ver apenas seus próprios pagamentos
CREATE POLICY "Users can view own payments" ON payment_transactions
    FOR SELECT USING (auth.uid() = user_id);

-- Usuários podem inserir seus próprios pagamentos
CREATE POLICY "Users can insert own payments" ON payment_transactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Usuários podem atualizar seus próprios pagamentos
CREATE POLICY "Users can update own payments" ON payment_transactions
    FOR UPDATE USING (auth.uid() = user_id);

-- Sistema pode gerenciar todos os pagamentos (via service role)
CREATE POLICY "Service role can manage all payments" ON payment_transactions
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- =====================================================
-- POLÍTICAS PARA payment_splits
-- =====================================================

-- Usuários podem ver splits de seus pagamentos
CREATE POLICY "Users can view own payment splits" ON payment_splits
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM payment_transactions 
            WHERE payment_transactions.id = payment_splits.payment_id 
            AND payment_transactions.user_id = auth.uid()
        )
    );

-- Sistema pode gerenciar todos os splits (via service role)
CREATE POLICY "Service role can manage all payment splits" ON payment_splits
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- =====================================================
-- POLÍTICAS PARA asaas_webhooks
-- =====================================================

-- Apenas sistema pode gerenciar webhooks (via service role)
CREATE POLICY "Service role can manage all webhooks" ON asaas_webhooks
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- =====================================================
-- POLÍTICAS PARA affiliate_commissions
-- =====================================================

-- Afiliados podem ver suas próprias comissões
CREATE POLICY "Affiliates can view own commissions" ON affiliate_commissions
    FOR SELECT USING (auth.uid() = affiliate_id);

-- Usuários podem ver comissões relacionadas aos seus pagamentos
CREATE POLICY "Users can view commissions from their payments" ON affiliate_commissions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM payment_transactions 
            WHERE payment_transactions.id = affiliate_commissions.payment_id 
            AND payment_transactions.user_id = auth.uid()
        )
    );

-- Sistema pode gerenciar todas as comissões (via service role)
CREATE POLICY "Service role can manage all commissions" ON affiliate_commissions
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- =====================================================
-- VALIDAÇÃO DAS POLÍTICAS
-- =====================================================

-- Verificar se RLS está habilitado em todas as tabelas
DO $$
DECLARE
    table_name TEXT;
    rls_enabled BOOLEAN;
    policy_count INTEGER;
BEGIN
    FOR table_name IN VALUES ('payment_transactions'), ('payment_splits'), ('asaas_webhooks'), ('affiliate_commissions')
    LOOP
        -- Verificar se RLS está habilitado
        SELECT relrowsecurity INTO rls_enabled
        FROM pg_class 
        WHERE relname = table_name;
        
        IF NOT rls_enabled THEN
            RAISE EXCEPTION 'RLS não está habilitado para a tabela %', table_name;
        END IF;
        
        -- Contar políticas
        SELECT COUNT(*) INTO policy_count
        FROM pg_policies 
        WHERE tablename = table_name;
        
        RAISE NOTICE 'Tabela %: RLS habilitado, % políticas criadas', table_name, policy_count;
    END LOOP;
    
    RAISE NOTICE 'SUCCESS: Políticas RLS básicas configuradas com sucesso para as 4 tabelas do sistema de pagamentos!';
    RAISE NOTICE 'NOTA: Políticas administrativas podem ser adicionadas posteriormente quando a estrutura de roles estiver disponível.';
END $$;