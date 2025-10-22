-- ============================================
-- CORREÇÃO MANUAL: Atualizar indicação pendente
-- ============================================
-- Data: 2025-10-21
-- Problema: Indicação foi criada mas não foi confirmada pelo webhook
-- Solução: Atualizar manualmente para 'confirmed'
-- ============================================

-- 1. Verificar indicação atual
SELECT 
  ar.id,
  ar.affiliate_id,
  ar.referred_user_id,
  ar.referral_code,
  ar.status,
  ar.created_at,
  ar.confirmed_at,
  p.nome_completo as indicado_nome,
  a.display_name as afiliado_nome
FROM affiliate_referrals ar
LEFT JOIN profiles p ON p.id = ar.referred_user_id
LEFT JOIN affiliates a ON a.id = ar.affiliate_id
WHERE ar.status = 'pending'
ORDER BY ar.created_at DESC;

-- 2. Atualizar para 'confirmed'
UPDATE affiliate_referrals
SET 
  status = 'confirmed',
  confirmed_at = NOW()
WHERE status = 'pending'
  AND referred_user_id IN (
    SELECT id FROM profiles 
    WHERE nome_completo ILIKE '%Teste Afiliado%'
    OR email ILIKE '%testeafiliado%'
  );

-- 3. Verificar resultado
SELECT 
  ar.id,
  ar.affiliate_id,
  ar.referred_user_id,
  ar.referral_code,
  ar.status,
  ar.created_at,
  ar.confirmed_at,
  p.nome_completo as indicado_nome,
  a.display_name as afiliado_nome
FROM affiliate_referrals ar
LEFT JOIN profiles p ON p.id = ar.referred_user_id
LEFT JOIN affiliates a ON a.id = ar.affiliate_id
WHERE ar.referred_user_id IN (
  SELECT id FROM profiles 
  WHERE nome_completo ILIKE '%Teste Afiliado%'
  OR email ILIKE '%testeafiliado%'
)
ORDER BY ar.created_at DESC;
