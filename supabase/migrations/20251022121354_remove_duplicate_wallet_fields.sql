-- ============================================
-- REMOVER campos duplicados wallet_id e wallet_validated
-- ============================================
-- Data: 2025-10-22
-- Motivo: Campos criados por engano. O campo correto é asaas_wallet_id
-- Ação: Remover wallet_id e wallet_validated da tabela affiliates

-- Remover coluna wallet_id (se existir)
ALTER TABLE affiliates 
DROP COLUMN IF EXISTS wallet_id;

-- Remover coluna wallet_validated (se existir)
ALTER TABLE affiliates 
DROP COLUMN IF EXISTS wallet_validated;

-- Comentário explicativo
COMMENT ON TABLE affiliates IS 'Tabela de afiliados - usar asaas_wallet_id para carteira Asaas';
