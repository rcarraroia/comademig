-- ============================================================================
-- MIGRAÇÃO: Criação das Tabelas de Integração Asaas
-- Data: 2025-03-10
-- Descrição: Cria todas as tabelas necessárias para integração completa com Asaas
-- ============================================================================

-- 1. TABELA: asaas_customers
-- Armazena dados dos clientes criados no Asaas
CREATE TABLE public.asaas_customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    asaas_customer_id VARCHAR(255) UNIQUE NOT NULL,
    
    -- Dados do cliente
    name VARCHAR(255) NOT NULL,
    cpf_cnpj VARCHAR(20) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    mobile_phone VARCHAR(20),
    
    -- Endereço
    address TEXT,
    address_number VARCHAR(10),
    complement VARCHAR(255),
    province VARCHAR(100),
    postal_code VARCHAR(10),
    city VARCHAR(100),
    state VARCHAR(2),
    country VARCHAR(50) DEFAULT 'Brasil',
    
    -- Metadados
    external_reference VARCHAR(255),
    notification_disabled BOOLEAN DEFAULT FALSE,
    additional_emails TEXT,
    municipal_inscription VARCHAR(50),
    state_inscription VARCHAR(50),
    observations TEXT,
    group_name VARCHAR(100),
    company VARCHAR(255),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. TABELA: asaas_cobrancas
-- Armazena cobranças criadas no Asaas
CREATE TABLE public.asaas_cobrancas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    asaas_id VARCHAR(255) UNIQUE NOT NULL,
    customer_id VARCHAR(255) NOT NULL,
    
    -- Dados básicos da cobrança
    valor DECIMAL(10,2) NOT NULL,
    net_value DECIMAL(10,2),
    original_value DECIMAL(10,2),
    descricao TEXT NOT NULL,
    forma_pagamento VARCHAR(20) CHECK (forma_pagamento IN ('PIX', 'CREDIT_CARD', 'BOLETO', 'DEBIT_CARD', 'TRANSFER', 'DEPOSIT')),
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    
    -- Datas
    data_vencimento DATE NOT NULL,
    original_due_date DATE,
    data_pagamento TIMESTAMP WITH TIME ZONE,
    client_payment_date TIMESTAMP WITH TIME ZONE,
    
    -- URLs e códigos de pagamento
    url_pagamento TEXT,
    invoice_url TEXT,
    invoice_number VARCHAR(50),
    linha_digitavel TEXT,
    nosso_numero VARCHAR(50),
    qr_code_pix TEXT,
    pix_copy_paste TEXT,
    pix_expiration_date TIMESTAMP WITH TIME ZONE,
    
    -- Dados do cartão (quando aplicável)
    credit_card_number VARCHAR(20),
    credit_card_brand VARCHAR(20),
    credit_card_token VARCHAR(255),
    
    -- Metadados de serviço
    service_type VARCHAR(20) CHECK (service_type IN ('filiacao', 'certidao', 'regularizacao', 'evento', 'taxa_anual')),
    service_data JSONB,
    
    -- Referências
    referencia_id VARCHAR(255),
    external_reference VARCHAR(255),
    installment_number INTEGER,
    
    -- Flags
    deleted BOOLEAN DEFAULT FALSE,
    anticipated BOOLEAN DEFAULT FALSE,
    anticipable BOOLEAN DEFAULT FALSE,
    postal_service BOOLEAN DEFAULT FALSE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. TABELA: asaas_subscriptions
-- Armazena assinaturas recorrentes do Asaas
CREATE TABLE public.asaas_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    asaas_subscription_id VARCHAR(255) UNIQUE NOT NULL,
    customer_id VARCHAR(255) NOT NULL,
    
    -- Dados da assinatura
    billing_type VARCHAR(20) NOT NULL CHECK (billing_type IN ('PIX', 'CREDIT_CARD', 'BOLETO', 'DEBIT_CARD')),
    value DECIMAL(10,2) NOT NULL,
    cycle VARCHAR(20) NOT NULL CHECK (cycle IN ('WEEKLY', 'BIWEEKLY', 'MONTHLY', 'BIMONTHLY', 'QUARTERLY', 'SEMIANNUALLY', 'YEARLY')),
    description TEXT,
    
    -- Status e datas
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'EXPIRED')),
    next_due_date DATE,
    end_date DATE,
    
    -- Configurações
    max_payments INTEGER,
    
    -- Metadados
    service_type VARCHAR(20) CHECK (service_type IN ('filiacao', 'taxa_anual')),
    service_data JSONB,
    external_reference VARCHAR(255),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. TABELA: asaas_splits
-- Armazena configurações de split de pagamentos para afiliados
CREATE TABLE public.asaas_splits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cobranca_id UUID NOT NULL REFERENCES asaas_cobrancas(id) ON DELETE CASCADE,
    affiliate_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Dados do split
    percentage DECIMAL(5,2), -- Percentual da comissão (ex: 10.50)
    fixed_value DECIMAL(10,2), -- Valor fixo alternativo
    wallet_id VARCHAR(255) NOT NULL, -- ID da carteira no Asaas para receber
    total_value DECIMAL(10,2), -- Valor total calculado
    
    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'AWAITING_CREDIT', 'CREDITED', 'CANCELLED')),
    asaas_split_id VARCHAR(255), -- ID do split no Asaas
    
    -- Valores calculados
    commission_amount DECIMAL(10,2), -- Valor da comissão calculado
    processed_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadados
    refusal_reason TEXT,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. HABILITAR RLS (Row Level Security)
ALTER TABLE public.asaas_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asaas_cobrancas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asaas_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asaas_splits ENABLE ROW LEVEL SECURITY;

-- 6. POLÍTICAS RLS PARA asaas_customers
CREATE POLICY "Users can view their own customers" ON public.asaas_customers
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can manage customers" ON public.asaas_customers
    FOR ALL USING (
        auth.jwt() ->> 'role' = 'service_role' OR
        auth.jwt() ->> 'role' = 'authenticated'
    );

-- 7. POLÍTICAS RLS PARA asaas_cobrancas
CREATE POLICY "Users can view their own cobrancas" ON public.asaas_cobrancas
    FOR SELECT USING (
        auth.uid() = user_id OR 
        auth.jwt() ->> 'role' = 'service_role'
    );

CREATE POLICY "System can manage cobrancas" ON public.asaas_cobrancas
    FOR INSERT WITH CHECK (
        auth.jwt() ->> 'role' = 'service_role' OR
        auth.uid() = user_id
    );

CREATE POLICY "System can update cobrancas" ON public.asaas_cobrancas
    FOR UPDATE USING (
        auth.jwt() ->> 'role' = 'service_role' OR
        auth.uid() = user_id
    );

-- 8. POLÍTICAS RLS PARA asaas_subscriptions
CREATE POLICY "Users can view their own subscriptions" ON public.asaas_subscriptions
    FOR SELECT USING (
        auth.uid() = user_id OR 
        auth.jwt() ->> 'role' = 'service_role'
    );

CREATE POLICY "System can manage subscriptions" ON public.asaas_subscriptions
    FOR ALL USING (
        auth.jwt() ->> 'role' = 'service_role'
    );

-- 9. POLÍTICAS RLS PARA asaas_splits
CREATE POLICY "Users can view splits related to them" ON public.asaas_splits
    FOR SELECT USING (
        auth.uid() = affiliate_id OR
        auth.uid() = (SELECT user_id FROM asaas_cobrancas WHERE id = cobranca_id) OR
        auth.jwt() ->> 'role' = 'service_role'
    );

CREATE POLICY "System can manage splits" ON public.asaas_splits
    FOR ALL USING (
        auth.jwt() ->> 'role' = 'service_role'
    );

-- 10. TRIGGERS PARA UPDATED_AT
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_asaas_customers_updated_at 
    BEFORE UPDATE ON public.asaas_customers 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_asaas_cobrancas_updated_at 
    BEFORE UPDATE ON public.asaas_cobrancas 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_asaas_subscriptions_updated_at 
    BEFORE UPDATE ON public.asaas_subscriptions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_asaas_splits_updated_at 
    BEFORE UPDATE ON public.asaas_splits 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 11. ÍNDICES PARA PERFORMANCE
-- Índices para asaas_customers
CREATE INDEX idx_asaas_customers_user_id ON public.asaas_customers(user_id);
CREATE INDEX idx_asaas_customers_asaas_id ON public.asaas_customers(asaas_customer_id);
CREATE INDEX idx_asaas_customers_cpf_cnpj ON public.asaas_customers(cpf_cnpj);
CREATE INDEX idx_asaas_customers_email ON public.asaas_customers(email);

-- Índices para asaas_cobrancas
CREATE INDEX idx_asaas_cobrancas_user_id ON public.asaas_cobrancas(user_id);
CREATE INDEX idx_asaas_cobrancas_asaas_id ON public.asaas_cobrancas(asaas_id);
CREATE INDEX idx_asaas_cobrancas_customer_id ON public.asaas_cobrancas(customer_id);
CREATE INDEX idx_asaas_cobrancas_status ON public.asaas_cobrancas(status);
CREATE INDEX idx_asaas_cobrancas_service_type ON public.asaas_cobrancas(service_type);
CREATE INDEX idx_asaas_cobrancas_data_vencimento ON public.asaas_cobrancas(data_vencimento);
CREATE INDEX idx_asaas_cobrancas_created_at ON public.asaas_cobrancas(created_at);

-- Índices para asaas_subscriptions
CREATE INDEX idx_asaas_subscriptions_user_id ON public.asaas_subscriptions(user_id);
CREATE INDEX idx_asaas_subscriptions_asaas_id ON public.asaas_subscriptions(asaas_subscription_id);
CREATE INDEX idx_asaas_subscriptions_customer_id ON public.asaas_subscriptions(customer_id);
CREATE INDEX idx_asaas_subscriptions_status ON public.asaas_subscriptions(status);
CREATE INDEX idx_asaas_subscriptions_next_due_date ON public.asaas_subscriptions(next_due_date);

-- Índices para asaas_splits
CREATE INDEX idx_asaas_splits_cobranca_id ON public.asaas_splits(cobranca_id);
CREATE INDEX idx_asaas_splits_affiliate_id ON public.asaas_splits(affiliate_id);
CREATE INDEX idx_asaas_splits_status ON public.asaas_splits(status);
CREATE INDEX idx_asaas_splits_wallet_id ON public.asaas_splits(wallet_id);

-- Índices para asaas_webhooks (já existe, mas garantindo)
CREATE INDEX IF NOT EXISTS idx_asaas_webhooks_payment_id ON public.asaas_webhooks(asaas_payment_id);
CREATE INDEX IF NOT EXISTS idx_asaas_webhooks_processed ON public.asaas_webhooks(processed);
CREATE INDEX IF NOT EXISTS idx_asaas_webhooks_event_type ON public.asaas_webhooks(event_type);

-- 12. COMENTÁRIOS PARA DOCUMENTAÇÃO
COMMENT ON TABLE public.asaas_customers IS 'Clientes criados no Asaas para cada usuário do sistema';
COMMENT ON TABLE public.asaas_cobrancas IS 'Cobranças criadas no Asaas para pagamentos de serviços';
COMMENT ON TABLE public.asaas_subscriptions IS 'Assinaturas recorrentes criadas no Asaas';
COMMENT ON TABLE public.asaas_splits IS 'Configurações de split de pagamentos para afiliados';

COMMENT ON COLUMN public.asaas_cobrancas.service_type IS 'Tipo de serviço: filiacao, certidao, regularizacao, evento, taxa_anual';
COMMENT ON COLUMN public.asaas_cobrancas.service_data IS 'Dados específicos do serviço em formato JSON';
COMMENT ON COLUMN public.asaas_splits.percentage IS 'Percentual de comissão (0.00 a 100.00)';
COMMENT ON COLUMN public.asaas_splits.wallet_id IS 'ID da carteira Asaas do afiliado para receber comissão';

-- ============================================================================
-- MIGRAÇÃO CONCLUÍDA COM SUCESSO!
-- 
-- Tabelas criadas:
-- - asaas_customers: Clientes do Asaas
-- - asaas_cobrancas: Cobranças do Asaas  
-- - asaas_subscriptions: Assinaturas recorrentes
-- - asaas_splits: Splits para afiliados
--
-- Recursos implementados:
-- - Políticas RLS para segurança
-- - Triggers para updated_at
-- - Índices para performance
-- - Constraints para integridade
-- ============================================================================