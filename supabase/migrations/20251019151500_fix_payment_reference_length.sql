-- ============================================
-- FIX: Aumentar tamanho do campo payment_reference
-- ============================================
-- Problema: payment_reference VARCHAR(20) é muito curto
-- IDs do Asaas têm 20 caracteres exatos, causando erro
-- Solução: Aumentar para VARCHAR(100)

ALTER TABLE solicitacoes_servicos 
ALTER COLUMN payment_reference TYPE VARCHAR(100);

-- Comentário
COMMENT ON COLUMN solicitacoes_servicos.payment_reference IS 'Referência do pagamento no Asaas (até 100 caracteres)';
