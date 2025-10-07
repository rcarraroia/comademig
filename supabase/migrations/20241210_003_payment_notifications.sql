-- =====================================================
-- MIGRAÇÃO 003: Sistema de Notificações de Pagamento
-- Data: 10/12/2024
-- Descrição: Cria sistema de notificações para webhooks do Asaas
-- Sistema: COMADEMIG - Convenção de Ministros das Assembleias de Deus em MG
-- =====================================================

-- PASSO 0: Verificar dependências obrigatórias
DO $$
BEGIN
    -- Verificar se tabela profiles existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles' AND table_schema = 'public') THEN
        RAISE EXCEPTION 'ERRO: Tabela profiles não existe. Execute migração anterior primeiro.';
    END IF;
    
    -- Verificar se tabela financial_transactions existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'financial_transactions' AND table_schema = 'public') THEN
        RAISE EXCEPTION 'ERRO: Tabela financial_transactions não existe. Execute migração 002 primeiro.';
    END IF;
    
    RAISE NOTICE 'Dependências verificadas com sucesso.';
END $$;

-- PASSO 1: Criar tabela de notificações de pagamento
CREATE TABLE IF NOT EXISTS payment_notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    payment_id TEXT NOT NULL, -- ID do pagamento no Asaas (asaas_id da tabela asaas_cobrancas)
    type TEXT NOT NULL CHECK (type IN ('payment_confirmed', 'payment_overdue', 'payment_cancelled', 'payment_refunded')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    read BOOLEAN DEFAULT FALSE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_payment_notifications_user_id ON payment_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_notifications_read ON payment_notifications(read);
CREATE INDEX IF NOT EXISTS idx_payment_notifications_created_at ON payment_notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payment_notifications_type ON payment_notifications(type);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_payment_notifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER payment_notifications_updated_at
    BEFORE UPDATE ON payment_notifications
    FOR EACH ROW
    EXECUTE FUNCTION update_payment_notifications_updated_at();

-- Políticas RLS
ALTER TABLE payment_notifications ENABLE ROW LEVEL SECURITY;

-- PASSO 12: Políticas RLS - Notificações de pagamento
DROP POLICY IF EXISTS "Users can view own notifications" ON payment_notifications;
CREATE POLICY "Users can view own notifications" ON payment_notifications
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.id = payment_notifications.user_id
        )
    );

DROP POLICY IF EXISTS "Users can update own notifications" ON payment_notifications;
CREATE POLICY "Users can update own notifications" ON payment_notifications
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.id = payment_notifications.user_id
        )
    );

DROP POLICY IF EXISTS "Users can delete own notifications" ON payment_notifications;
CREATE POLICY "Users can delete own notifications" ON payment_notifications
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.id = payment_notifications.user_id
        )
    );

DROP POLICY IF EXISTS "Admins can view all notifications" ON payment_notifications;
CREATE POLICY "Admins can view all notifications" ON payment_notifications
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND (profiles.cargo = 'Administrador' OR profiles.tipo_membro = 'Administrador')
        )
    );

DROP POLICY IF EXISTS "System can insert notifications" ON payment_notifications;
CREATE POLICY "System can insert notifications" ON payment_notifications
    FOR INSERT WITH CHECK (true);

-- Função para criar notificação de pagamento
CREATE OR REPLACE FUNCTION create_payment_notification(
    p_user_id UUID,
    p_payment_id TEXT,
    p_type TEXT,
    p_title TEXT,
    p_message TEXT,
    p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
    notification_id UUID;
BEGIN
    INSERT INTO payment_notifications (
        user_id,
        payment_id,
        type,
        title,
        message,
        metadata
    ) VALUES (
        p_user_id,
        p_payment_id,
        p_type,
        p_title,
        p_message,
        p_metadata
    ) RETURNING id INTO notification_id;
    
    RETURN notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- PASSO 14: Função para processar webhook de pagamento e criar notificações
CREATE OR REPLACE FUNCTION process_payment_webhook(
    p_payment_id TEXT,
    p_event TEXT,
    p_payment_data JSONB
)
RETURNS VOID AS $$
DECLARE
    v_user_id UUID;
    v_title TEXT;
    v_message TEXT;
    v_notification_type TEXT;
    v_amount DECIMAL;
    v_description TEXT;
BEGIN
    -- Buscar o usuário associado ao pagamento na tabela financial_transactions
    -- (tabela confirmada como existente na migração 002)
    SELECT user_id INTO v_user_id
    FROM financial_transactions
    WHERE asaas_payment_id = p_payment_id;
    
    -- Tentar buscar em asaas_cobrancas se existir (fallback seguro)
    IF v_user_id IS NULL THEN
        BEGIN
            SELECT user_id INTO v_user_id
            FROM asaas_cobrancas
            WHERE asaas_id = p_payment_id;
        EXCEPTION WHEN undefined_table THEN
            -- Tabela asaas_cobrancas não existe, continuar apenas com financial_transactions
            NULL;
        END;
    END IF;
    
    -- Se não encontrou o usuário em nenhuma tabela, sair
    IF v_user_id IS NULL THEN
        RETURN;
    END IF;
    
    -- Extrair dados do pagamento (compatível com estrutura Asaas)
    v_amount := COALESCE((p_payment_data->>'value')::DECIMAL, (p_payment_data->>'valor')::DECIMAL);
    v_description := COALESCE(p_payment_data->>'description', p_payment_data->>'descricao');
    
    -- Determinar tipo de notificação e mensagens baseado no evento
    CASE p_event
        WHEN 'PAYMENT_RECEIVED', 'PAYMENT_CONFIRMED' THEN
            v_notification_type := 'payment_confirmed';
            v_title := 'Pagamento Confirmado';
            v_message := format('Seu pagamento de R$ %.2f foi confirmado com sucesso.', v_amount);
            
        WHEN 'PAYMENT_OVERDUE' THEN
            v_notification_type := 'payment_overdue';
            v_title := 'Pagamento em Atraso';
            v_message := format('Seu pagamento de R$ %.2f está em atraso. Regularize sua situação.', v_amount);
            
        WHEN 'PAYMENT_DELETED', 'PAYMENT_REFUNDED' THEN
            v_notification_type := 'payment_cancelled';
            v_title := 'Pagamento Cancelado';
            v_message := format('Seu pagamento de R$ %.2f foi cancelado ou estornado.', v_amount);
            
        ELSE
            -- Evento não reconhecido, não criar notificação
            RETURN;
    END CASE;
    
    -- Criar a notificação
    PERFORM create_payment_notification(
        v_user_id,
        p_payment_id,
        v_notification_type,
        v_title,
        v_message,
        jsonb_build_object(
            'amount', v_amount,
            'description', v_description,
            'payment_method', COALESCE(p_payment_data->>'billingType', p_payment_data->>'forma_pagamento'),
            'due_date', COALESCE(p_payment_data->>'dueDate', p_payment_data->>'data_vencimento'),
            'invoice_url', COALESCE(p_payment_data->>'invoiceUrl', p_payment_data->>'invoice_url'),
            'bank_slip_url', COALESCE(p_payment_data->>'bankSlipUrl', p_payment_data->>'linha_digitavel'),
            'transaction_receipt_url', p_payment_data->>'transactionReceiptUrl'
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- PASSO 15: Comentários para documentação
COMMENT ON TABLE payment_notifications IS 'Notificações de pagamento para usuários do sistema COMADEMIG';
COMMENT ON FUNCTION create_payment_notification IS 'Cria uma nova notificação de pagamento para um usuário';
COMMENT ON FUNCTION process_payment_webhook IS 'Processa webhook de pagamento do Asaas e cria notificações apropriadas';

-- PASSO 16: Verificar resultado final
SELECT 
    'payment_notifications' as tabela,
    COUNT(*) as registros
FROM payment_notifications;

-- PASSO 17: Verificar se as funções foram criadas
SELECT 
    routine_name,
    routine_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('create_payment_notification', 'process_payment_webhook');

-- PASSO 18: Testar função com dados fictícios (verificação de integridade)
DO $$
DECLARE
    test_user_id UUID;
BEGIN
    -- Buscar um usuário existente para teste
    SELECT id INTO test_user_id FROM profiles LIMIT 1;
    
    IF test_user_id IS NOT NULL THEN
        -- Testar criação de notificação
        PERFORM create_payment_notification(
            test_user_id,
            'test_payment_123',
            'payment_confirmed',
            'Teste de Notificação',
            'Esta é uma notificação de teste do sistema.',
            '{"test": true, "amount": 100.00}'::jsonb
        );
        
        -- Remover notificação de teste
        DELETE FROM payment_notifications WHERE payment_id = 'test_payment_123';
        
        RAISE NOTICE 'Teste de função executado com sucesso.';
    ELSE
        RAISE NOTICE 'Nenhum usuário encontrado para teste, mas funções estão criadas.';
    END IF;
END $$;

-- =====================================================
-- FIM DA MIGRAÇÃO 003 - SISTEMA DE NOTIFICAÇÕES
-- 
-- ✅ Tabela payment_notifications criada
-- ✅ Políticas RLS configuradas (compatível com profiles)
-- ✅ Funções de processamento implementadas
-- ✅ Integração com asaas_cobrancas e financial_transactions
-- ✅ Triggers e índices para performance
-- ✅ Sistema pronto para webhooks do Asaas
-- =====================================================