-- ============================================
-- FORCE FIX: payment_reference para TEXT sem limite
-- ============================================

-- Dropar constraint se existir
ALTER TABLE solicitacoes_servicos 
ALTER COLUMN payment_reference TYPE TEXT;
-- Garantir que não há limite
COMMENT ON COLUMN solicitacoes_servicos.payment_reference IS 'Referência do pagamento (TEXT sem limite)';
