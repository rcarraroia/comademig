-- ============================================
-- MIGRAÇÃO: Adicionar asaas_wallet_id em affiliates
-- ============================================
-- Data: 2025-10-13
-- Objetivo: Permitir que afiliados recebam splits via Asaas
-- Impacto: Adiciona coluna para armazenar Wallet ID do Asaas
-- ============================================

-- Adicionar coluna asaas_wallet_id na tabela affiliates
ALTER TABLE affiliates 
ADD COLUMN IF NOT EXISTS asaas_wallet_id TEXT;

-- Adicionar comentário na coluna
COMMENT ON COLUMN affiliates.asaas_wallet_id IS 'ID da carteira (wallet) do afiliado no Asaas para receber splits';

-- Criar índice para melhorar performance de buscas
CREATE INDEX IF NOT EXISTS idx_affiliates_asaas_wallet_id 
ON affiliates(asaas_wallet_id) 
WHERE asaas_wallet_id IS NOT NULL;

-- Log de auditoria
DO $$
BEGIN
  RAISE NOTICE 'Coluna asaas_wallet_id adicionada à tabela affiliates';
END $$;
