-- ============================================
-- MIGRAÇÃO: Adicionar campos de auditoria para Payment First Flow
-- Data: 2026-01-22
-- Objetivo: Adicionar campos de auditoria às tabelas existentes
-- ============================================

-- Adicionar campos de auditoria à tabela profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS payment_confirmed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS registration_flow_version TEXT DEFAULT 'legacy';

-- Adicionar campos de auditoria à tabela user_subscriptions
ALTER TABLE user_subscriptions 
ADD COLUMN IF NOT EXISTS asaas_payment_id TEXT,
ADD COLUMN IF NOT EXISTS processing_context JSONB DEFAULT '{}';

-- Comentários para documentação
COMMENT ON COLUMN profiles.payment_confirmed_at IS 'Timestamp de quando o pagamento foi confirmado (apenas para novo fluxo)';
COMMENT ON COLUMN profiles.registration_flow_version IS 'Versão do fluxo de registro: legacy (antigo) ou payment-first (novo)';
COMMENT ON COLUMN user_subscriptions.asaas_payment_id IS 'ID do pagamento inicial no Asaas (diferente do asaas_subscription_id)';
COMMENT ON COLUMN user_subscriptions.processing_context IS 'Contexto de processamento em JSON (affiliate_code, retry_count, etc)';

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_profiles_payment_confirmed_at ON profiles(payment_confirmed_at);
CREATE INDEX IF NOT EXISTS idx_profiles_registration_flow_version ON profiles(registration_flow_version);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_asaas_payment_id ON user_subscriptions(asaas_payment_id);

-- Atualizar registros existentes para marcar como fluxo legacy
UPDATE profiles 
SET registration_flow_version = 'legacy' 
WHERE registration_flow_version IS NULL;

-- Tornar o campo registration_flow_version NOT NULL após atualização
ALTER TABLE profiles 
ALTER COLUMN registration_flow_version SET NOT NULL;