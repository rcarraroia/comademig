import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useAsaasCustomers } from './useAsaasCustomers';
import { useAsaasCardPayments } from './useAsaasCardPayments';
import type { UnifiedMemberType } from './useMemberTypeWithPlan';
import type { FiliacaoData } from './useFiliacaoFlow';
import { mapErrorToMessage, formatErrorMessage } from '@/utils/errorMessages';

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
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'creating_account' | 'creating_customer' | 'processing_payment' | 'creating_subscription' | 'updating_profile' | 'completed'>('idle');
  
  const { createCustomer } = useAsaasCustomers();
  const { processCardPayment } = useAsaasCardPayments();

  // Função auxiliar para calcular próximo vencimento com validação anti-duplicação
  const calculateNextDueDate = (days: number = 30): string => {
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + days);
    
    const nextDateStr = nextDate.toISOString().split('T')[0];
    const todayStr = new Date().toISOString().split('T')[0];
    
    // VALIDAÇÃO CRÍTICA: Garantir que nextDueDate > hoje
    if (nextDateStr <= todayStr) {
      throw new Error(
        `ERRO CRÍTICO: nextDueDate (${nextDateStr}) deve ser maior que hoje (${todayStr})`
      );
    }
    
    console.log('📅 Próximo vencimento calculado:', nextDateStr);
    return nextDateStr;
  };

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

  const processFiliacaoPaymentMutation = useMutation({
    mutationFn: async (data: FiliacaoPaymentData) => {
      let currentUserId = user?.id;
      let isNewAccount = false;
      
      // ✅ CORREÇÃO: Usar affiliateInfo já validado pelo useReferralCode
      // Não buscar da URL novamente para evitar perda de dados
      let validatedAffiliateInfo: { affiliateId: string; referralCode: string } | null = null;
      
      if (affiliateInfo?.referralCode && affiliateInfo?.affiliateInfo?.id) {
        validatedAffiliateInfo = {
          affiliateId: affiliateInfo.affiliateInfo.id,
          referralCode: affiliateInfo.referralCode
        };
        console.log('✅ Usando afiliado já validado:');
        console.log('   - ID:', validatedAffiliateInfo.affiliateId);
        console.log('   - Código:', validatedAffiliateInfo.referralCode);
      } else {
        console.log('ℹ️ Nenhum código de indicação válido');
      }

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
          if (signUpError.message.includes('already registered') || 
              signUpError.message.includes('User already registered') ||
              signUpError.message.includes('email already exists')) {
            throw new Error('email_already_exists');
          }
          
          // Tratar outros erros de autenticação
          if (signUpError.message.includes('password')) {
            throw new Error('Senha inválida. Use pelo menos 6 caracteres, 1 maiúscula e 1 número.');
          }
          
          if (signUpError.message.includes('email')) {
            throw new Error('Email inválido. Verifique o endereço digitado.');
          }
          
          throw new Error(`Erro ao criar conta: ${signUpError.message}`);
        }
        
        if (!authData.user) {
          throw new Error('Erro ao criar conta: Dados do usuário não retornados');
        }

        currentUserId = authData.user.id;
        isNewAccount = true;
        toast.success('Conta criada com sucesso!');
        
        // 🎯 REGISTRAR INDICAÇÃO DE AFILIADO (se houver)
        if (validatedAffiliateInfo) {
          try {
            console.log('📝 Registrando indicação de afiliado...');
            const { error: referralError } = await supabase
              .from('affiliate_referrals')
              .insert({
                affiliate_id: validatedAffiliateInfo.affiliateId,
                referral_code: validatedAffiliateInfo.referralCode,
                referred_user_id: currentUserId,
                status: 'pending'
              });
            
            if (referralError) {
              console.error('⚠️ Erro ao registrar indicação:', referralError);
            } else {
              console.log('✅ Indicação de afiliado registrada com sucesso!');
              toast.success('Indicação registrada! Você foi indicado por um afiliado.');
            }
          } catch (error) {
            console.error('⚠️ Erro ao registrar indicação (não crítico):', error);
            // Não falhar o processo por causa disso
          }
        }
      } else {
        // Usuário já está logado - verificar se já tem filiação ativa
        const { data: existingSubscription } = await (supabase as any)
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
      const finalPrice = originalPrice; // Sem desconto PIX

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

      // ============================================
      // 3. PROCESSAR PAGAMENTO INICIAL (PRIMEIRA MENSALIDADE)
      // ============================================
      setPaymentStatus('processing_payment');
      
      console.log('💳 ========================================');
      console.log('💳 PROCESSANDO PAGAMENTO INICIAL');
      console.log('💳 ========================================');
      
      if (!data.cardData) {
        throw new Error('Dados do cartão são obrigatórios para filiação');
      }

      const initialPaymentData = {
        value: finalPrice,
        dueDate: new Date().toISOString().split('T')[0], // HOJE - Processamento imediato
        description: `Primeira mensalidade COMADEMIG - ${selectedMemberType.name}`,
        service_type: 'filiacao' as const,
        service_data: {
          member_type_id: selectedMemberType.id,
          subscription_plan_id: selectedMemberType.plan_id,
          user_id: currentUserId
        },
        installmentCount: 1,
        creditCard: {
          holderName: data.cardData.holderName,
          number: data.cardData.number,
          expiryMonth: data.cardData.expiryMonth,
          expiryYear: data.cardData.expiryYear,
          ccv: data.cardData.ccv,
        },
        creditCardHolderInfo: {
          name: data.nome_completo,
          email: data.email,
          cpfCnpj: data.cpf,
          postalCode: data.cep,
          addressNumber: data.numero,
          phone: data.telefone,
        },
        saveCard: true // IMPORTANTE: Salvar cartão para renovações futuras
      };

      console.log('💳 Processando pagamento inicial...');
      // ✅ Passar currentUserId E customer_id que já foi criado
      const initialPaymentResult = await processCardPayment(
        initialPaymentData, 
        currentUserId,
        customer.id  // ← Customer já foi criado na linha 217
      );

      if (!initialPaymentResult || !initialPaymentResult.success) {
        // Extrair mensagem de erro específica se disponível
        const errorMessage = initialPaymentResult?.message || 'card_declined';
        throw new Error(errorMessage);
      }

      console.log('✅ Pagamento inicial processado com sucesso!');
      console.log('   Payment ID:', initialPaymentResult.asaas_id);
      console.log('   Status:', initialPaymentResult.status);
      console.log('   Token do cartão:', initialPaymentResult.credit_card_token);

      // Validar que cartão foi tokenizado
      if (!initialPaymentResult.credit_card_token) {
        console.warn('⚠️ Cartão não foi tokenizado. Renovação automática pode não funcionar.');
      }

      // ============================================
      // 4. CRIAR ASSINATURA PARA RENOVAÇÃO AUTOMÁTICA
      // ============================================
      setPaymentStatus('creating_subscription');
      
      console.log('📅 ========================================');
      console.log('📅 CRIANDO ASSINATURA VIA EDGE FUNCTION');
      console.log('📅 ========================================');

      // Mapear cycle baseado na recorrência do plano
      let cycle: 'MONTHLY' | 'QUARTERLY' | 'SEMIANNUALLY' | 'YEARLY' = 'MONTHLY';
      const recurrence = selectedMemberType.plan_recurrence?.toLowerCase();
      if (recurrence === 'semestral') {
        cycle = 'SEMIANNUALLY';
      } else if (recurrence === 'anual' || recurrence === 'annual') {
        cycle = 'YEARLY';
      }

      // Calcular próximo vencimento (30 dias) com validação anti-duplicação
      const nextDueDate = calculateNextDueDate(30);

      console.log('📅 Dados da assinatura:');
      console.log('   Customer:', customer.id);
      console.log('   User ID:', currentUserId);
      console.log('   Valor:', finalPrice);
      console.log('   Próximo vencimento:', nextDueDate);
      console.log('   Ciclo:', cycle);
      console.log('   Afiliado:', validatedAffiliateInfo?.affiliateId || 'Nenhum');
      console.log('   Código de indicação:', validatedAffiliateInfo?.referralCode || 'Nenhum');

      let subscriptionResult;
      try {
        // Chamar Edge Function que cria assinatura + configura splits
        const { data: edgeFunctionResponse, error: edgeFunctionError } = await supabase.functions.invoke(
          'asaas-create-subscription',
          {
            body: {
              customer: customer.id,
              userId: currentUserId,
              billingType: 'CREDIT_CARD',
              value: finalPrice,
              nextDueDate: nextDueDate,
              cycle,
              description: `Assinatura COMADEMIG - ${selectedMemberType.name}`,
              affiliateCode: validatedAffiliateInfo?.referralCode || null,
              subscriptionPlanId: selectedMemberType.plan_id,
              memberTypeId: selectedMemberType.id,
              initialPaymentId: initialPaymentResult.asaas_id,
              creditCardToken: initialPaymentResult.credit_card_token,
              creditCardHolderInfo: {
                name: data.nome_completo,
                email: data.email,
                cpfCnpj: data.cpf.replace(/\D/g, ''),
                postalCode: data.cep.replace(/\D/g, ''),
                addressNumber: data.numero,
                phone: data.telefone.replace(/\D/g, '')
              }
            }
          }
        );

        if (edgeFunctionError) {
          throw new Error(`Erro na Edge Function: ${edgeFunctionError.message}`);
        }

        if (!edgeFunctionResponse?.success) {
          throw new Error(edgeFunctionResponse?.error || 'Erro ao criar assinatura');
        }

        subscriptionResult = {
          id: edgeFunctionResponse.asaasSubscriptionId,
          status: 'ACTIVE'
        };

        console.log('✅ Assinatura criada com sucesso via Edge Function!');
        console.log('   Subscription ID:', subscriptionResult.id);
        console.log('   User Subscription ID:', edgeFunctionResponse.userSubscriptionId);
        console.log('   Splits configurados:', edgeFunctionResponse.splitsConfigured);

        toast.success('Assinatura e splits configurados com sucesso!');

      } catch (subscriptionError) {
        console.error('⚠️ Erro ao criar assinatura:', subscriptionError);
        
        // IMPORTANTE: Pagamento já foi processado, usuário JÁ ESTÁ ATIVO
        // Mas não terá renovação automática
        
        console.error('❌ Falha ao criar assinatura:', subscriptionError);
        console.error('   User ID:', currentUserId);
        console.error('   Payment ID:', initialPaymentResult.asaas_id);
        
        // Criar assinatura "fake" para não quebrar o fluxo
        subscriptionResult = {
          id: `MANUAL_${Date.now()}`,
          status: 'PENDING_MANUAL_CREATION'
        };
        
        console.log('⚠️ Usuário será ativado mas precisará de intervenção manual para renovação');
        toast.warning('Assinatura criada parcialmente. Entre em contato com o suporte.');
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
        igreja: null, // Será preenchido no perfil posteriormente
        cargo: null, // Será preenchido no perfil posteriormente
        data_ordenacao: null, // Será preenchido no perfil posteriormente
        tempo_ministerio: null, // Será preenchido no perfil posteriormente
        member_type_id: selectedMemberType.id,
        tipo_membro: selectedMemberType.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''), // Remove acentos
        status: initialPaymentResult.status === 'CONFIRMED' ? 'ativo' : 'pendente', // Ativar se pagamento confirmado
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

      // 5. Buscar registro de assinatura criado pela Edge Function
      const { data: subscription, error: subscriptionError } = await (supabase as any)
        .from('user_subscriptions')
        .select(`
          *,
          subscription_plans(
            id,
            name,
            price,
            recurrence
          )
        `)
        .eq('user_id', currentUserId)
        .eq('asaas_subscription_id', subscriptionResult.id)
        .single();

      if (subscriptionError) {
        console.error('Erro ao buscar assinatura criada:', subscriptionError);
        // Não falha o processo - assinatura foi criada pela Edge Function
        console.log('⚠️ Assinatura existe mas não foi possível buscar detalhes');
      }

      // 6. Dados ministeriais já foram salvos no perfil (cargo e data_ordenacao)
      // Não é mais necessário salvar em tabela separada

      // 7. Indicação já foi registrada após criar conta (linha ~145)
      // Não é necessário registrar novamente aqui
      console.log('ℹ️ Indicação de afiliado já foi registrada anteriormente');

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
      
      // Mapear erro para mensagem amigável
      const errorInfo = mapErrorToMessage(error);
      const friendlyMessage = formatErrorMessage(error, false);
      
      // Exibir mensagem amigável
      toast.error(friendlyMessage, {
        duration: errorInfo.retryable ? 5000 : 7000,
        description: errorInfo.retryable 
          ? 'Você pode tentar novamente.' 
          : 'Entre em contato com o suporte se o problema persistir.'
      });
      
      // Log detalhado para debug
      console.error('📋 Detalhes do erro:', {
        originalError: error,
        mappedMessage: errorInfo.message,
        retryable: errorInfo.retryable,
        paymentStatus
      });
      
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