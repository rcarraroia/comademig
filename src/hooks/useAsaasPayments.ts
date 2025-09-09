import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface PaymentData {
  customer: {
    name: string;
    email: string;
    cpfCnpj: string;
    phone?: string;
    address?: string;
    addressNumber?: string;
    complement?: string;
    province?: string;
    city?: string;
    postalCode?: string;
  };
  billingType: 'CREDIT_CARD' | 'PIX';
  value: number;
  dueDate: string;
  description: string;
  tipoCobranca: string;
  referenciaId?: string;
  affiliateId?: string;
}

export const useAsaasPayments = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const createPayment = async (paymentData: PaymentData) => {
    setLoading(true);
    try {
      console.log('Iniciando criação de pagamento com dados:', paymentData);
      
      // Verificar se há split de afiliado
      const functionName = paymentData.affiliateId ? 'asaas-create-payment-with-split' : 'asaas-create-payment';
      
      // Para filiação, permitir chamadas não autenticadas
      // Para outros serviços, exigir autenticação
      const { data: { session } } = await supabase.auth.getSession();
      
      const invokeOptions: any = {
        body: paymentData
      };
      
      // Se há sessão ativa, incluir o token de autorização
      if (session) {
        invokeOptions.headers = {
          Authorization: `Bearer ${session.access_token}`
        };
      }
      
      const { data, error } = await supabase.functions.invoke(functionName, invokeOptions);

      if (error) {
        throw error;
      }

      if (!data.success) {
        throw new Error(data.error?.message || 'Erro ao criar cobrança');
      }

      toast({
        title: "Cobrança criada com sucesso",
        description: `${paymentData.billingType === 'PIX' ? 'PIX' : 'Cartão de Crédito'} processado com sucesso${data.split_configured ? ' (com comissão de afiliado)' : ''}`,
      });

      return data.cobranca;
    } catch (error: any) {
      console.error('Erro ao criar pagamento:', error);
      toast({
        title: "Erro ao criar cobrança",
        description: error.message || 'Ocorreu um erro inesperado',
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const checkPaymentStatus = async (paymentId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('asaas-check-payment', {
        body: { paymentId }
      });

      if (error) {
        throw error;
      }

      return data;
    } catch (error: any) {
      console.error('Erro ao verificar pagamento:', error);
      toast({
        title: "Erro ao verificar pagamento",
        description: error.message || 'Ocorreu um erro inesperado',
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const getUserPayments = async () => {
    try {
      const { data, error } = await supabase
        .from('asaas_cobrancas')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return data;
    } catch (error: any) {
      console.error('Erro ao buscar cobranças:', error);
      toast({
        title: "Erro ao carregar cobranças",
        description: error.message || 'Ocorreu um erro inesperado',
        variant: "destructive",
      });
      return [];
    }
  };

  const getAffiliateByReferralCode = async (referralCode: string) => {
    try {
      const { data, error } = await supabase
        .from('affiliates')
        .select('id, status, is_adimplent')
        .eq('referral_code', referralCode)
        .eq('status', 'active')
        .eq('is_adimplent', true)
        .maybeSingle();

      if (error) {
        console.error('Erro ao buscar afiliado:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Erro ao buscar afiliado:', error);
      return null;
    }
  };

  return {
    createPayment,
    checkPaymentStatus,
    getUserPayments,
    getAffiliateByReferralCode,
    loading
  };
};
