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
      
      // Usar servidor Node.js ao invés de Edge Functions
      const serverUrl = 'https://comademig-payment-server.vercel.app'; // Será configurado após deploy
      let endpoint;
      
      if (paymentData.tipoCobranca === 'filiacao') {
        endpoint = `${serverUrl}/api/create-subscription`;
      } else {
        endpoint = `${serverUrl}/api/create-payment`;
      }
      
      // Para filiação, permitir chamadas não autenticadas
      // Para outros serviços, exigir autenticação
      const { data: { session } } = await supabase.auth.getSession();
      
      let requestBody = paymentData;
      
      // Para filiação, adicionar dados de assinatura
      if (paymentData.tipoCobranca === 'filiacao') {
        requestBody = {
          ...paymentData,
          cycle: 'MONTHLY',
          nextDueDate: paymentData.dueDate
        };
      }

      const invokeOptions: any = {
        body: requestBody
      };
      
      // Se há sessão ativa, incluir o token de autorização
      if (session) {
        invokeOptions.headers = {
          Authorization: `Bearer ${session.access_token}`
        };
      }
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao processar pagamento');
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Erro ao criar cobrança');
      }

      toast({
        title: "Cobrança criada com sucesso",
        description: `${paymentData.billingType === 'PIX' ? 'PIX' : 'Cartão de Crédito'} processado com sucesso${data.split_configured ? ' (com comissão de afiliado)' : ''}`,
      });

      // Para filiação, retornar cobrança da assinatura; para outros, cobrança normal
      return data.cobranca || data.subscription;
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
