-- ============================================
-- ADD: Colunas faltantes em asaas_cobrancas
-- ============================================

-- Adicionar coluna billing_type se não existir
ALTER TABLE asaas_cobrancas 
ADD COLUMN IF NOT EXISTS billing_type TEXT;
-- Adicionar coluna service_type se não existir
ALTER TABLE asaas_cobrancas 
ADD COLUMN IF NOT EXISTS service_type TEXT;
-- Adicionar coluna service_data se não existir
ALTER TABLE asaas_cobrancas 
ADD COLUMN IF NOT EXISTS service_data JSONB DEFAULT '{}'::jsonb;
-- Adicionar coluna payment_date se não existir
ALTER TABLE asaas_cobrancas 
ADD COLUMN IF NOT EXISTS payment_date TIMESTAMP WITH TIME ZONE;
-- Comentários
COMMENT ON COLUMN asaas_cobrancas.billing_type IS 'Tipo de cobrança: PIX, CREDIT_CARD, BOLETO';
COMMENT ON COLUMN asaas_cobrancas.service_type IS 'Tipo de serviço: servico, certidao, regularizacao, etc';
COMMENT ON COLUMN asaas_cobrancas.service_data IS 'Dados do serviço e formulário em JSON';
COMMENT ON COLUMN asaas_cobrancas.payment_date IS 'Data de confirmação do pagamento';
