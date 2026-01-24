-- ============================================
-- FORÇAR CONFIRMAÇÃO DE INDICAÇÃO ESPECÍFICA
-- ============================================
-- Data: 2025-10-21
-- Problema: Indicação com código 2AE24DCA ainda está pendente
-- Solução: Atualizar diretamente pelo código
-- ============================================

-- Atualizar indicação específica
UPDATE affiliate_referrals
SET status = 'confirmed'
WHERE referral_code = '2AE24DCA'
  AND status = 'pending';
-- Atualizar TODAS as indicações pendentes que têm pagamento confirmado
-- (para garantir que não fique nenhuma pendente)
UPDATE affiliate_referrals ar
SET status = 'confirmed'
FROM asaas_cobrancas ac
WHERE ar.referred_user_id = ac.user_id
  AND ar.status = 'pending'
  AND ac.status IN ('CONFIRMED', 'RECEIVED')
  AND ac.service_type = 'filiacao';
