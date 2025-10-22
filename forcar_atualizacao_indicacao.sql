-- ============================================
-- FORÇAR ATUALIZAÇÃO DA INDICAÇÃO
-- ============================================

-- 1. Ver estado atual
SELECT 
  ar.id,
  ar.status,
  ar.referral_code,
  p.nome_completo as indicado,
  a.display_name as afiliado,
  ac.status as status_cobranca,
  ac.service_type
FROM affiliate_referrals ar
LEFT JOIN profiles p ON p.id = ar.referred_user_id
LEFT JOIN affiliates a ON a.id = ar.affiliate_id
LEFT JOIN asaas_cobrancas ac ON ac.user_id = ar.referred_user_id
WHERE ar.referral_code = '2AE24DCA'
ORDER BY ar.created_at DESC;

-- 2. Atualizar FORÇADAMENTE
UPDATE affiliate_referrals
SET status = 'confirmed'
WHERE referral_code = '2AE24DCA'
  AND status = 'pending';

-- 3. Verificar resultado
SELECT 
  ar.id,
  ar.status,
  ar.referral_code,
  p.nome_completo as indicado,
  a.display_name as afiliado
FROM affiliate_referrals ar
LEFT JOIN profiles p ON p.id = ar.referred_user_id
LEFT JOIN affiliates a ON a.id = ar.affiliate_id
WHERE ar.referral_code = '2AE24DCA'
ORDER BY ar.created_at DESC;
