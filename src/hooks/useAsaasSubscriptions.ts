import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CreateSubscriptionData {
  customer: string;
  billingType: 'CREDIT_CARD' | 'BOLETO' | 'PIX';
  value: number;
  nextDueDate: string;
  cycle: 'MONTHLY' | 'QUARTERLY' | 'SEMIANNUALLY' | 'YEARLY';
  description: string;
  externalReference?: string;
  creditCard?: {
    holderName: string;
    number: string;
    expiryMonth: string;
    expiryYear: string;
    ccv: string;
  };
  creditCardHolderInfo?: {
    name: string;
    email: string;
    cpfCnpj: string;
    postalCode: string;
    addressNumber: string;
    phone: string;
  };
  discount?: {
    value: number;
    dueDateLimitDays: number;
  };
}

interface SubscriptionResponse {
  object: 'subscription';
  id: string;
  customer: string;
  billingType: string;
  value: number;
  nextDueDate: string;
  cycle: string;
  description: string;
  status: 'ACTIVE' | 'INACTIVE' | 'EXPIRED';
  externalReference?: string;
}

export function useAsaasSubscriptions() {
  const createSubscription = useMutation({
    mutationFn: async (data: CreateSubscriptionData): Promise<SubscriptionResponse> => {
      console.log('🔄 Criando assinatura no Asaas:', {
        customer: data.customer,
        value: data.value,
        cycle: data.cycle,
        billingType: data.billingType
      });

      // Chamar Edge Function que se comunica com Asaas
      const { data: result, error } = await supabase.functions.invoke('asaas-create-subscription', {
        body: data
      });

      if (error) {
        console.error('❌ Erro ao criar assinatura:', error);
        throw new Error(error.message || 'Erro ao criar assinatura');
      }

      if (!result || result.error) {
        console.error('❌ Erro na resposta:', result);
        throw new Error(result?.error || 'Erro ao criar assinatura no Asaas');
      }

      console.log('✅ Assinatura criada com sucesso:', result);
      return result;
    },
    onSuccess: (data) => {
      console.log('✅ Assinatura criada:', data.id);
      toast.success('Assinatura criada com sucesso!');
    },
    onError: (error: Error) => {
      console.error('❌ Erro ao criar assinatura:', error);
      toast.error(`Erro ao criar assinatura: ${error.message}`);
    }
  });

  return {
    createSubscription,
    isCreating: createSubscription.isPending,
    error: createSubscription.error,
    data: createSubscription.data
  };
}
