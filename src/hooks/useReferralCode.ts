import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Hook para gerenciar código de indicação de afiliados
 * Captura o código da URL e registra a indicação após o cadastro
 */
export function useReferralCode() {
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [affiliateInfo, setAffiliateInfo] = useState<{
    id: string;
    display_name: string;
  } | null>(null);

  // Capturar código de indicação da URL ao montar o componente
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('ref');

    if (code) {
      setReferralCode(code);
      // Salvar no localStorage para persistir durante o fluxo de cadastro
      localStorage.setItem('referral_code', code);
      validateReferralCode(code);
    } else {
      // Tentar recuperar do localStorage
      const savedCode = localStorage.getItem('referral_code');
      if (savedCode) {
        setReferralCode(savedCode);
        validateReferralCode(savedCode);
      }
    }
  }, []);

  // Validar se o código de indicação existe e está ativo
  const validateReferralCode = async (code: string) => {
    try {
      const { data, error } = await supabase
        .from('affiliates')
        .select('id, display_name, status')
        .eq('referral_code', code)
        .eq('status', 'active')
        .single();

      if (error || !data) {
        console.warn('Código de indicação inválido ou inativo:', code);
        // Limpar código inválido
        localStorage.removeItem('referral_code');
        setReferralCode(null);
        return;
      }

      setAffiliateInfo({
        id: data.id,
        display_name: data.display_name,
      });

      // Validação silenciosa - não exibir toast
      console.log('✅ Código de indicação válido:', code, 'Afiliado:', data.display_name);
    } catch (error) {
      console.error('Erro ao validar código de indicação:', error);
    }
  };

  // Registrar indicação após o usuário completar o cadastro
  const registerReferral = async (userId: string) => {
    if (!referralCode || !affiliateInfo) {
      return { success: false, message: 'Nenhum código de indicação' };
    }

    try {
      const { error } = await supabase
        .from('affiliate_referrals')
        .insert({
          affiliate_id: affiliateInfo.id,
          referred_user_id: userId,
          referral_code: referralCode,
          status: 'pending',
        });

      if (error) {
        console.error('Erro ao registrar indicação:', error);
        return { success: false, message: error.message };
      }

      // Limpar código após registro bem-sucedido
      localStorage.removeItem('referral_code');
      
      return { 
        success: true, 
        message: `Indicação registrada! Você foi indicado por ${affiliateInfo.display_name}` 
      };
    } catch (error: any) {
      console.error('Erro ao registrar indicação:', error);
      return { success: false, message: error.message };
    }
  };

  // Limpar código de indicação
  const clearReferralCode = () => {
    setReferralCode(null);
    setAffiliateInfo(null);
    localStorage.removeItem('referral_code');
  };

  return {
    referralCode,
    affiliateInfo,
    registerReferral,
    clearReferralCode,
    hasReferral: !!referralCode && !!affiliateInfo,
  };
}
