-- ============================================
-- CORREÇÃO: Atualizar indicações pendentes que já foram pagas
-- ============================================
-- Data: 2025-10-21
-- Problema: Indicações criadas mas não confirmadas pelo webhook
-- Solução: Confirmar indicações que têm pagamento confirmado
-- ============================================

-- Primeiro, remover o constraint que está bloqueando
ALTER TABLE affiliate_referrals 
DROP CONSTRAINT IF EXISTS affiliate_referrals_status_check;

-- Adicionar constraint com valores corretos
ALTER TABLE affiliate_referrals
ADD CONSTRAINT affiliate_referrals_status_check 
CHECK (status IN ('pending', 'confirmed', 'cancelled'));

-- Atualizar indicações pendentes que têm pagamento confirmado
UPDATE affiliate_referrals ar
SET 
  status = 'confirmed'
WHERE ar.status = 'pending'
  AND EXISTS (
    -- Verificar se usuário indicado tem cobrança confirmada
    SELECT 1 
    FROM asaas_cobrancas ac
    WHERE ac.user_id = ar.referred_user_id
      AND ac.status IN ('CONFIRMED', 'RECEIVED')
      AND ac.service_type = 'filiacao'
  );
