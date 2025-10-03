import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useAsaasCustomers } from './useAsaasCustomers';
import { useAsaasPixPayments } from './useAsaasPixPayments';
import { useAsaasCardPayments } from './useAsaasCardPayments';
import { useAsaasBoletoPayments } from './useAsaasBoletoPayments';
import type { UnifiedMemberType } from './useMemberTypeWithPlan';
import type { FiliacaoData } from './useFiliacaoFlow';

export interface FiliacaoPaymentData extends FiliacaoData {
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
  const { user } = useAuth();
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'creating_customer' | 'processing_payment' | 'updating_profile' | 'completed'>('idle');
  
  const { createCustomer } = useAsaasCustomers();
  const { createPixPayment } = useAsaasPixPayments();
  const { processCardPayment } = useAsaasCardPayments();
  const { createBoletoPayment } = useAsaasBoletoPayments();

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
      if (!user?.id) {
        throw new Error('Usuário não autenticado');
      }

      if (!selectedMemberType.plan_id) {
        throw new Error('Tipo de membro selecionado não possui plano associado');
      }

      const originalPrice = selectedMemberType.plan_value || 0;
      const isPixPayment = data.payment_method === 'pix';
      const { finalPrice } = isPixPayment ? calculatePixDiscount(originalPrice) : { finalPrice: originalPrice };

      // 1. Criar/verificar cliente no Asaas
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

      const customer = await createCustomer.mutateAsync(customerData);

      // 2. Processar pagamento baseado no método escolhido
      setPaymentStatus('processing_payment');
      let paymentResult;

      switch (data.payment_method) {
        case 'pix':
          paymentResult = await createPixPayment.mutateAsync({
            customer: customer.id,
            billingType: 'PIX',
            value: finalPrice,
            description: `Filiação COMADEMIG - ${selectedMemberType.name}`,
            dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 24h
            externalReference: `filiacao_${user.id}_${Date.now()}`,
            discount: {
              value: isPixPayment ? (originalPrice - finalPrice) : 0,
              dueDateLimitDays: 0
            }
          });
          break;

        case 'credit_card':
          if (!data.cardData) {
            throw new Error('Dados do cartão são obrigatórios para pagamento com cartão');
          }
          paymentResult = await processCardPayment.mutateAsync({
            customer: customer.id,
            billingType: 'CREDIT_CARD',
            value: finalPrice,
            description: `Filiação COMADEMIG - ${selectedMemberType.name}`,
            dueDate: new Date().toISOString().split('T')[0],
            externalReference: `filiacao_${user.id}_${Date.now()}`,
            creditCard: {
              holderName: data.cardData.holderName,
              number: data.cardData.number,
              expiryMonth: data.cardData.expiryMonth,
              expiryYear: data.cardData.expiryYear,
              ccv: data.cardData.ccv
            },
            creditCardHolderInfo: {
              name: data.nome_completo,
              email: data.email,
              cpfCnpj: data.cpf,
              postalCode: data.cep,
              addressNumber: data.numero,
              phone: data.telefone
            },
            installmentCount: data.cardData.installmentCount || 1
          });
          break;

        case 'boleto':
          const dueDate = data.dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // 7 dias
          paymentResult = await createBoletoPayment.mutateAsync({
            customer: customer.id,
            billingType: 'BOLETO',
            value: finalPrice,
            description: `Filiação COMADEMIG - ${selectedMemberType.name}`,
            dueDate,
            externalReference: `filiacao_${user.id}_${Date.now()}`,
            fine: {
              value: 2.0 // 2% de multa
            },
            interest: {
              value: 1.0 // 1% de juros ao mês
            }
          });
          break;

        default:
          throw new Error('Método de pagamento não suportado');
      }

      // 3. Atualizar perfil do usuário
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
        updated_at: new Date().toISOString()
      };

      const { error: profileError } = await supabase
        .from('profiles')
        .update(profileUpdateData)
        .eq('id', user.id);

      if (profileError) {
        console.error('Erro ao atualizar perfil:', profileError);
        throw new Error(`Erro ao atualizar perfil: ${profileError.message}`);
      }

      // 4. Criar assinatura do usuário (inicialmente pendente)
      const expirationDate = calculateExpirationDate(selectedMemberType.plan_recurrence || 'Mensal');
      
      const subscriptionData = {
        user_id: user.id,
        subscription_plan_id: selectedMemberType.plan_id,
        member_type_id: selectedMemberType.id,
        status: 'pending' as const, // Será ativada via webhook quando pagamento for confirmado
        payment_id: paymentResult.id,
        started_at: new Date().toISOString(),
        expires_at: expirationDate,
      };

      const { data: subscription, error: subscriptionError } = await supabase
        .from('user_subscriptions')
        .insert([subscriptionData])
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

      // 5. Registrar dados ministeriais adicionais se fornecidos
      if (data.cargo_igreja || data.tempo_ministerio) {
        const ministerialData = {
          user_id: user.id,
          cargo_igreja: data.cargo_igreja,
          tempo_ministerio: data.tempo_ministerio,
          created_at: new Date().toISOString()
        };

        try {
          await supabase
            .from('ministerial_data')
            .insert([ministerialData]);
        } catch (error) {
          console.log('Dados ministeriais salvos em log:', ministerialData);
        }
      }

      // 6. Registrar afiliado se houver
      if (affiliateInfo?.referralCode) {
        try {
          const affiliateData = {
            user_id: user.id,
            referral_code: affiliateInfo.referralCode,
            subscription_id: subscription.id,
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
        payment: paymentResult,
        customer,
        memberType: selectedMemberType,
        paymentMethod: data.payment_method
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