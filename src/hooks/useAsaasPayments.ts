
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
  billingType: 'BOLETO' | 'CREDIT_CARD' | 'PIX';
  value: number;
  dueDate: string;
  description: string;
  tipoCobranca: string;
  referenciaId?: string;
}

export const useAsaasPayments = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const createPayment = async (paymentData: PaymentData) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('asaas-create-payment', {
        body: paymentData
      });

      if (error) {
        throw error;
      }

      if (!data.success) {
        throw new Error(data.error?.message || 'Erro ao criar cobrança');
      }

      toast({
        title: "Cobrança criada com sucesso",
        description: `${paymentData.billingType === 'PIX' ? 'PIX' : 'Boleto'} gerado com sucesso`,
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

  return {
    createPayment,
    checkPaymentStatus,
    getUserPayments,
    loading
  };
};
