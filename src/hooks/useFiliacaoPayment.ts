import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useAsaasCustomers } from './useAsaasCustomers';
import { useAsaasSubscriptions } from './useAsaasSubscriptions';
import type { UnifiedMemberType } from './useMemberTypeWithPlan';
import type { FiliacaoData } from './useFiliacaoFlow';
import type { UserSubscriptionInsert, MinisterialData, ProfileExtension } from '@/integrations/supabase/types-extension';

export interface FiliacaoPaymentData extends FiliacaoData {
  // Senha para criar conta (obrigatória se usuário não estiver autenticado)
  password?: string;
  // Dados específicos do cartão (se aplicável)
  cardData?: {
    holderName: string;
    number: string;
    expiryMonth: string;
    expiryYear: string;
    ccv: string;
    installmentCount?: number;
  };
  // Data de vencimento para boleto (se aplicável)
  dueDate?: string;
}

interface UseFiliacaoPaymentProps {
  selectedMemberType: UnifiedMemberType;
  affiliateInfo?: any;
}

export function useFiliacaoPayment({ selectedMemberType, affiliateInfo }: UseFiliacaoPaymentProps) {
  const { user, signUp } = useAuth();
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'creating_account' | 'creating_customer' | 'creating_subscription' | 'updating_profile' | 'completed'>('idle');
  
  const { createCustomer } = useAsaasCustomers();
  const { createSubscription } = useAsaasSubscriptions();

  const calculateExpirationDate = (recurrence: string): string => {
    const now = new Date();
    
    switch (recurrence.toLowerCase()) {
      case 'mensal':
      case 'monthly':
        now.setMonth(now.getMonth() + 1);
        break;
      case 'semestral':
        now.setMonth(now.getMonth() + 6);
        break;
      case 'anual':
      case 'annual':
        now.setFullYear(now.getFullYear() + 1);
        break;
      default:
        now.setMonth(now.getMonth() + 1);
    }
    
    return now.toISOString();
  };

  const calculatePixDiscount = (originalPrice: number) => {
    const discountPercentage = 0.05; // 5%
    const discount = originalPrice * discountPercentage;
    const finalPrice = originalPrice - discount;
    return { discount, finalPrice, discountPercentage };
  };

  const processFiliacaoPaymentMutation = useMutation({
    mutationFn: async (data: FiliacaoPaymentData) => {
      let currentUserId = user?.id;

      // 1. Criar conta se usuário não estiver autenticado
      if (!currentUserId) {
        if (!data.password) {
          throw new Error('Senha é obrigatória para criar nova conta');
        }

        setPaymentStatus('creating_account');
        
        // Criar conta no Supabase Auth
        const { data: authData, error: signUpError } = await supabase.auth.signUp({
          email: data.email,
          password: data.password,
          options: {
            data: {
              full_name: data.nome_completo,
            }
          }
        });
        
        if (signUpError || !authData.user) {
          throw new Error(`Erro ao criar conta: ${signUpError?.message || 'Erro desconhecido'}`);
        }

        currentUserId = authData.user.id;
        toast.success('Conta criada com sucesso!');
      }

      if (!selectedMemberType.plan_id) {
        throw new Error('Tipo de membro selecionado não possui plano associado');
      }

      const originalPrice = selectedMemberType.plan_value || 0;
      const isPixPayment = data.payment_method === 'pix';
      const { finalPrice } = isPixPayment ? calculatePixDiscount(originalPrice) : { finalPrice: originalPrice };

      // 2. Criar/verificar cliente no Asaas
      setPaymentStatus('creating_customer');
      const customerData = {
        name: data.nome_completo,
        email: data.email,
        phone: data.telefone,
        cpfCnpj: data.cpf,
        postalCode: data.cep,
        address: data.endereco,
        addressNumber: data.numero,
        complement: data.complemento || undefined,
        province: data.bairro,
        city: data.cidade,
        state: data.estado,
      };

      const customerResponse = await createCustomer(customerData);
      
      if (!customerResponse || !customerResponse.success) {
        throw new Error('Erro ao criar cliente no Asaas');
      }
      
      const customer = { id: customerResponse.customer_id };

      // 3. Criar assinatura recorrente no Asaas
      setPaymentStatus('creating_subscription');
      
      // Mapear billingType baseado no método de pagamento
      let billingType: 'BOLETO' | 'CREDIT_CARD' | 'UNDEFINED' = 'UNDEFINED';
      if (data.payment_method === 'boleto') {
        billingType = 'BOLETO';
      } else if (data.payment_method === 'credit_card') {
        billingType = 'CREDIT_CARD';
      }

      // Mapear cycle baseado na recorrência do plano
      let cycle: 'MONTHLY' | 'QUARTERLY' | 'SEMIANNUALLY' | 'YEARLY' = 'MONTHLY';
      const recurrence = selectedMemberType.plan_recurrence?.toLowerCase();
      if (recurrence === 'semestral') {
        cycle = 'SEMIANNUALLY';
      } else if (recurrence === 'anual' || recurrence === 'annual') {
        cycle = 'YEARLY';
      }

      const subscriptionData: any = {
        customer: customer.id,
        billingType,
        value: finalPrice,
        nextDueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 dias
        cycle,
        description: `Assinatura COMADEMIG - ${selectedMemberType.name}`,
        externalReference: `subscription_${currentUserId}_${Date.now()}`,
      };

      // Adicionar dados do cartão se for pagamento com cartão
      if (data.payment_method === 'credit_card' && data.cardData) {
        subscriptionData.creditCard = {
          holderName: data.cardData.holderName,
          number: data.cardData.number,
          expiryMonth: data.cardData.expiryMonth,
          expiryYear: data.cardData.expiryYear,
          ccv: data.cardData.ccv,
        };
        subscriptionData.creditCardHolderInfo = {
          name: data.nome_completo,
          email: data.email,
          cpfCnpj: data.cpf,
          postalCode: data.cep,
          addressNumber: data.numero,
          phone: data.telefone,
        };
      }

      // Adicionar desconto PIX se aplicável
      if (isPixPayment) {
        subscriptionData.discount = {
          value: originalPrice - finalPrice,
          dueDateLimitDays: 0,
        };
      }

      const subscriptionResult = await createSubscription.mutateAsync(subscriptionData);

      // 4. Atualizar perfil do usuário
      setPaymentStatus('updating_profile');
      const profileUpdateData = {
        nome_completo: data.nome_completo,
        cpf: data.cpf,
        telefone: data.telefone,
        cep: data.cep,
        endereco: data.endereco,
        numero: data.numero,
        complemento: data.complemento || null,
        bairro: data.bairro,
        cidade: data.cidade,
        estado: data.estado,
        igreja: data.igreja,
        cargo: selectedMemberType.name,
        member_type_id: selectedMemberType.id,
        subscription_source: 'filiacao',
        asaas_customer_id: customer.id,
        asaas_subscription_id: subscriptionResult.id,
        updated_at: new Date().toISOString()
      };

      const { error: profileError } = await supabase
        .from('profiles')
        .update(profileUpdateData)
        .eq('id', currentUserId);

      if (profileError) {
        console.error('Erro ao atualizar perfil:', profileError);
        throw new Error(`Erro ao atualizar perfil: ${profileError.message}`);
      }

      // 5. Criar registro de assinatura do usuário (inicialmente pendente)
      const expirationDate = calculateExpirationDate(selectedMemberType.plan_recurrence || 'Mensal');
      
      const userSubscriptionData: UserSubscriptionInsert = {
        user_id: currentUserId,
        subscription_plan_id: selectedMemberType.plan_id,
        member_type_id: selectedMemberType.id,
        status: 'pending', // Será ativada via webhook quando primeiro pagamento for confirmado
        asaas_subscription_id: subscriptionResult.id,
        started_at: new Date().toISOString(),
        expires_at: expirationDate,
      };

      const { data: subscription, error: subscriptionError } = await (supabase as any)
        .from('user_subscriptions')
        .insert([userSubscriptionData])
        .select(`
          *,
          subscription_plans(
            id,
            name,
            price,
            recurrence,
            permissions
          ),
          member_types(
            id,
            name
          )
        `)
        .single();

      if (subscriptionError) {
        console.error('Erro ao criar assinatura:', subscriptionError);
        throw new Error(`Erro ao criar assinatura: ${subscriptionError.message}`);
      }

      // 6. Registrar dados ministeriais adicionais se fornecidos
      if (data.cargo_igreja || data.tempo_ministerio) {
        const ministerialData: MinisterialData = {
          user_id: currentUserId,
          cargo_igreja: data.cargo_igreja,
          tempo_ministerio: data.tempo_ministerio,
          created_at: new Date().toISOString()
        };

        try {
          await (supabase as any)
            .from('ministerial_data')
            .insert([ministerialData]);
        } catch (error) {
          console.log('Dados ministeriais salvos em log:', ministerialData);
        }
      }

      // 7. Registrar afiliado se houver
      if (affiliateInfo?.affiliateId && affiliateInfo?.referralCode) {
        try {
          const affiliateData = {
            affiliate_id: affiliateInfo.affiliateId,
            referral_code: affiliateInfo.referralCode,
            referred_user_id: currentUserId,
            status: 'pending',
            created_at: new Date().toISOString()
          };

          await supabase
            .from('affiliate_referrals')
            .insert([affiliateData]);
        } catch (error) {
          console.log('Erro ao registrar afiliado, mas filiação continua:', error);
        }
      }

      setPaymentStatus('completed');

      return {
        profile: profileUpdateData,
        subscription,
        asaasSubscription: subscriptionResult,
        customer,
        memberType: selectedMemberType,
        paymentMethod: data.payment_method,
        userId: currentUserId
      };
    },
    onError: (error: Error) => {
      console.error('Erro no processo de filiação com pagamento:', error);
      toast.error(error.message || 'Erro ao processar filiação');
      setPaymentStatus('idle');
    },
  });

  const processarFiliacaoComPagamento = async (data: FiliacaoPaymentData) => {
    try {
      const result = await processFiliacaoPaymentMutation.mutateAsync(data);
      return result;
    } catch (error) {
      throw error;
    }
  };

  return {
    processarFiliacaoComPagamento,
    isProcessing: processFiliacaoPaymentMutation.isPending,
    paymentStatus,
    error: processFiliacaoPaymentMutation.error,
    isSuccess: processFiliacaoPaymentMutation.isSuccess,
    data: processFiliacaoPaymentMutation.data,
  };
}