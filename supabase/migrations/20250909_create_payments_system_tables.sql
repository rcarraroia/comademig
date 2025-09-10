-- Sistema de Pagamentos COMADEMIG - Migração Principal
-- Data: 2025-01-09
-- Descrição: Criação das tabelas principais do sistema de pagamentos integrado com Asaas

-- =====================================================
-- 1. TABELA: payment_transactions
-- =====================================================
CREATE TABLE IF NOT EXISTS payment_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    asaas_payment_id VARCHAR(255) UNIQUE,
    
    -- Dados básicos da transação
    amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
    description TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'received', 'overdue', 'refunded', 'received_in_cash', 'refund_requested', 'chargeback_requested', 'chargeback_dispute', 'awaiting_chargeback_reversal', 'dunning_requested', 'dunning_received', 'awaiting_risk_analysis')),
    
    -- Dados do pagamento
    payment_method VARCHAR(50) CHECK (payment_method IN ('BOLETO', 'CREDIT_CARD', 'DEBIT_CARD', 'PIX', 'UNDEFINED')),
    due_date DATE NOT NULL,
    payment_date TIMESTAMP WITH TIME ZONE,
    
    -- URLs e dados do Asaas
    invoice_url TEXT,
    bank_slip_url TEXT,
    pix_qr_code TEXT,
    pix_copy_paste TEXT,
    
    -- Metadados
    metadata JSONB DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 2. TABELA: payment_splits
-- =====================================================
CREATE TABLE IF NOT EXISTS payment_splits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id UUID NOT NULL REFERENCES payment_transactions(id) ON DELETE CASCADE,
    
    -- Dados do split
    wallet_id VARCHAR(255) NOT NULL, -- ID da carteira no Asaas
    fixed_value DECIMAL(10,2),
    percentage_value DECIMAL(5,2),
    total_value DECIMAL(10,2) NOT NULL CHECK (total_value > 0),
    
    -- Status do split
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'awaiting_credit', 'credited', 'cancelled')),
    
    -- Dados do destinatário
    recipient_name VARCHAR(255) NOT NULL,
    recipient_document VARCHAR(20) NOT NULL,
    recipient_email VARCHAR(255),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraint: deve ter valor fixo OU percentual, não ambos
    CONSTRAINT check_split_value CHECK (
        (fixed_value IS NOT NULL AND percentage_value IS NULL) OR
        (fixed_value IS NULL AND percentage_value IS NOT NULL)
    )
);

-- =====================================================
-- 3. TABELA: asaas_webhooks
-- =====================================================
CREATE TABLE IF NOT EXISTS asaas_webhooks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Dados do webhook
    event_type VARCHAR(100) NOT NULL,
    asaas_payment_id VARCHAR(255),
    
    -- Payload completo
    payload JSONB NOT NULL,
    
    -- Status do processamento
    processed BOOLEAN DEFAULT FALSE,
    processed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 4. TABELA: affiliate_commissions
-- =====================================================
CREATE TABLE IF NOT EXISTS affiliate_commissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Relacionamentos
    affiliate_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    payment_id UUID NOT NULL REFERENCES payment_transactions(id) ON DELETE CASCADE,
    referred_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Dados da comissão
    commission_rate DECIMAL(5,2) NOT NULL CHECK (commission_rate >= 0 AND commission_rate <= 100),
    commission_amount DECIMAL(10,2) NOT NULL CHECK (commission_amount >= 0),
    
    -- Status
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid', 'cancelled')),
    
    -- Dados de pagamento da comissão
    paid_at TIMESTAMP WITH TIME ZONE,
    payment_method VARCHAR(50),
    payment_reference VARCHAR(255),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 5. ÍNDICES PARA PERFORMANCE
-- =====================================================

-- Índices para payment_transactions
CREATE INDEX IF NOT EXISTS idx_payment_transactions_user_id ON payment_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_asaas_id ON payment_transactions(asaas_payment_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON payment_transactions(status);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_due_date ON payment_transactions(due_date);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_created_at ON payment_transactions(created_at);

-- Índices para payment_splits
CREATE INDEX IF NOT EXISTS idx_payment_splits_payment_id ON payment_splits(payment_id);
CREATE INDEX IF NOT EXISTS idx_payment_splits_wallet_id ON payment_splits(wallet_id);
CREATE INDEX IF NOT EXISTS idx_payment_splits_status ON payment_splits(status);

-- Índices para asaas_webhooks
CREATE INDEX IF NOT EXISTS idx_asaas_webhooks_event_type ON asaas_webhooks(event_type);
CREATE INDEX IF NOT EXISTS idx_asaas_webhooks_asaas_payment_id ON asaas_webhooks(asaas_payment_id);
CREATE INDEX IF NOT EXISTS idx_asaas_webhooks_processed ON asaas_webhooks(processed);
CREATE INDEX IF NOT EXISTS idx_asaas_webhooks_created_at ON asaas_webhooks(created_at);

-- Índices para affiliate_commissions
CREATE INDEX IF NOT EXISTS idx_affiliate_commissions_affiliate_id ON affiliate_commissions(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_commissions_payment_id ON affiliate_commissions(payment_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_commissions_referred_user_id ON affiliate_commissions(referred_user_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_commissions_status ON affiliate_commissions(status);

-- =====================================================
-- 6. TRIGGERS PARA UPDATED_AT
-- =====================================================

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para todas as tabelas
CREATE TRIGGER update_payment_transactions_updated_at
    BEFORE UPDATE ON payment_transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_splits_updated_at
    BEFORE UPDATE ON payment_splits
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_asaas_webhooks_updated_at
    BEFORE UPDATE ON asaas_webhooks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_affiliate_commissions_updated_at
    BEFORE UPDATE ON affiliate_commissions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 7. COMENTÁRIOS PARA DOCUMENTAÇÃO
-- =====================================================

COMMENT ON TABLE payment_transactions IS 'Tabela principal de transações de pagamento integradas com Asaas';
COMMENT ON TABLE payment_splits IS 'Configuração de divisão de pagamentos (split) para afiliados';
COMMENT ON TABLE asaas_webhooks IS 'Log de webhooks recebidos do Asaas para auditoria e reprocessamento';
COMMENT ON TABLE affiliate_commissions IS 'Controle de comissões para o programa de afiliados';

-- =====================================================
-- 8. VALIDAÇÃO DA MIGRAÇÃO
-- =====================================================

-- Verificar se todas as tabelas foram criadas
DO $$
DECLARE
    table_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO table_count
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name IN ('payment_transactions', 'payment_splits', 'asaas_webhooks', 'affiliate_commissions');
    
    IF table_count = 4 THEN
        RAISE NOTICE 'SUCCESS: Todas as 4 tabelas do sistema de pagamentos foram criadas com sucesso!';
    ELSE
        RAISE EXCEPTION 'ERRO: Apenas % de 4 tabelas foram criadas', table_count;
    END IF;
END $$;