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
      let isNewAccount = false;

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
        
        if (signUpError) {
          // Tratar erro de email já registrado
          if (signUpError.message.includes('already registered') || signUpError.message.includes('User already registered')) {
            throw new Error('Este email já está cadastrado. Por favor, faça login antes de prosseguir com a filiação.');
          }
          throw new Error(`Erro ao criar conta: ${signUpError.message}`);
        }
        
        if (!authData.user) {
          throw new Error('Erro ao criar conta: Dados do usuário não retornados');
        }

        currentUserId = authData.user.id;
        isNewAccount = true;
        toast.success('Conta criada com sucesso!');
      } else {
        // Usuário já está logado - verificar se já tem filiação ativa
        const { data: existingSubscription } = await supabase
          .from('user_subscriptions')
          .select('id, status')
          .eq('user_id', currentUserId)
          .in('status', ['active', 'pending'])
          .single();

        if (existingSubscription) {
          throw new Error(
            'Você já possui uma filiação ativa. ' +
            'Se deseja criar uma nova filiação, entre em contato com o suporte.'
          );
        }
      }

      if (!selectedMemberType.plan_id) {
        throw new Error('Tipo de membro selecionado não possui plano associado');
      }

      const originalPrice = selectedMemberType.plan_value || 0;
      const isPixPayment = data.payment_method === 'pix';
      const { finalPrice } = isPixPayment ? calculatePixDiscount(originalPrice) : { finalPrice: originalPrice };

      // 2. Criar/verificar cliente no Asaas
      setPaymentStatus('creating_customer');
      
      console.log('🔍 DEBUG useFiliacaoPayment - Criando cliente Asaas:');
      console.log('  - currentUserId:', currentUserId);
      console.log('  - isNewAccount:', isNewAccount);
      
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

      // 📤 LOG DETALHADO: Dados enviados ao createCustomer
      console.log('📤 ========================================');
      console.log('📤 useFiliacaoPayment - DADOS DO FORMULÁRIO:');
      console.log('📤 ========================================');
      console.log('📤 currentUserId:', currentUserId);
      console.log('📤 customerData preparado:');
      console.log(JSON.stringify(customerData, null, 2));
      console.log('📤 ========================================');
      console.log('📤 VALIDAÇÃO DE CAMPOS OBRIGATÓRIOS:');
      console.log('📤   name:', customerData.name ? '✅' : '❌', customerData.name);
      console.log('📤   email:', customerData.email ? '✅' : '❌', customerData.email);
      console.log('📤   cpfCnpj:', customerData.cpfCnpj ? '✅' : '❌', customerData.cpfCnpj, '(length:', customerData.cpfCnpj?.length, ')');
      console.log('📤   phone:', customerData.phone ? '✅' : '❌', customerData.phone);
      console.log('📤 ========================================');

      // ✅ CORREÇÃO: Passar currentUserId explicitamente
      // Isso evita dependência do contexto de autenticação que pode não estar atualizado
      const customerResponse = await createCustomer(customerData, currentUserId);
      
      console.log('📥 Resposta createCustomer:', customerResponse);
      
      if (!customerResponse || !customerResponse.success) {
        const errorMsg = customerResponse?.message || 'Erro ao criar cliente no Asaas';
        console.error('❌ Erro ao criar cliente:', errorMsg);
        throw new Error(errorMsg);
      }
      
      console.log('✅ Cliente Asaas criado:', customerResponse.customer_id);
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

      // 3.4. Registrar cobrança no banco local (para vincular splits)
      try {
        console.log('📝 Registrando cobrança no banco local...');
        
        const { error: cobrancaError } = await (supabase as any)
          .from('asaas_cobrancas')
          .insert({
            asaas_payment_id: subscriptionResult.id,
            user_id: currentUserId,
            customer_id: customer.id,
            subscription_id: subscriptionResult.id,
            value: finalPrice,
            status: 'PENDING',
            billing_type: billingType,
            description: subscriptionData.description,
            due_date: subscriptionData.nextDueDate,
            service_type: 'filiacao',
          });
        
        if (cobrancaError) {
          console.error('❌ Erro ao registrar cobrança:', cobrancaError);
          // Não falha o processo - apenas loga
        } else {
          console.log('✅ Cobrança registrada no banco local');
        }
      } catch (error) {
        console.error('❌ Exceção ao registrar cobrança:', error);
        // Não falha o processo principal
      }

      // 3.5. Configurar split de pagamento (divisão tripla)
      try {
        console.log('🔄 Configurando split de pagamento...');
        console.log('  - Cobrança ID:', subscriptionResult.id);
        console.log('  - Valor:', finalPrice);
        console.log('  - Tipo:', 'filiacao');
        console.log('  - Afiliado:', affiliateInfo?.affiliateId || 'Nenhum');
        
        const { data: splitData, error: splitError } = await supabase.functions.invoke(
          'asaas-configure-split',
          {
            body: {
              cobrancaId: subscriptionResult.id,
              serviceType: 'filiacao',
              totalValue: finalPrice,
              affiliateId: affiliateInfo?.affiliateId || null
            }
          }
        );
        
        if (splitError) {
          console.error('❌ Erro ao configurar split:', splitError);
          // Não falha o processo principal - apenas loga o erro
          toast.error('Aviso: Split de pagamento não foi configurado. Entre em contato com o suporte.');
        } else if (splitData?.success) {
          console.log('✅ Split configurado com sucesso!');
          console.log('  - Total de beneficiários:', splitData.data?.splits?.length || 0);
          console.log('  - Splits:', splitData.data?.splits);
          toast.success('Split de pagamento configurado com sucesso!');
        } else {
          console.warn('⚠️ Split retornou sem sucesso:', splitData);
        }
      } catch (error) {
        console.error('❌ Exceção ao configurar split:', error);
        // Não falha o processo principal
      }

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
        cargo: data.cargo_igreja || null, // ✅ CORRIGIDO: Salvar cargo na igreja informado pelo usuário
        data_ordenacao: data.tempo_ministerio || null, // ✅ NOVO: Salvar tempo de ministério
        member_type_id: selectedMemberType.id,
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
            recurrence
          )
        `)
        .single();

      if (subscriptionError) {
        console.error('Erro ao criar assinatura:', subscriptionError);
        throw new Error(`Erro ao criar assinatura: ${subscriptionError.message}`);
      }

      // 6. Dados ministeriais já foram salvos no perfil (cargo e data_ordenacao)
      // Não é mais necessário salvar em tabela separada

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