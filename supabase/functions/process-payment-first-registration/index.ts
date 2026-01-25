/**
 * Edge Function: process-payment-first-registration
 * 
 * Orquestrador principal do novo fluxo Payment First
 * Processa pagamento ANTES de criar conta de usuário
 * 
 * Timeout: 25 segundos
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

// Configuração do Supabase
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Interfaces
interface RegistrationData {
  nome: string;
  email: string;
  password: string;
  cpf: string;
  telefone: string;
  endereco: {
    cep: string;
    logradouro: string;
    numero: string;
    complemento?: string;
    bairro: string;
    cidade: string;
    estado: string;
  };
  tipo_membro: 'bispo' | 'pastor' | 'diacono' | 'membro';
  plan_id: string;
  payment_method: 'CREDIT_CARD' | 'PIX';
  card_data?: {
    holderName: string;
    number: string;
    expiryMonth: string;
    expiryYear: string;
    ccv: string;
  };
  affiliate_id?: string;
}

interface ProcessingStep {
  step: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  message: string;
  timestamp: string;
  error?: string;
}

interface PaymentFirstFlowResult {
  success: boolean;
  user_id?: string;
  payment_id?: string;
  asaas_customer_id?: string;
  asaas_subscription_id?: string;
  steps: ProcessingStep[];
  error?: string;
  fallback_stored?: boolean;
  requires_manual_intervention?: boolean;
}

serve(async (req) => {
  // Configurar timeout de 25 segundos
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 25000);

  try {
    console.log('🚀 Iniciando Payment First Flow...');

    // Verificar método HTTP
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Método não permitido. Use POST.' 
        }),
        { 
          status: 405, 
          headers: { 'Content-Type': 'application/json' } 
        }
      );
    }

    // Extrair dados da requisição
    const { registration_data }: { registration_data: RegistrationData } = await req.json();

    if (!registration_data) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Dados de registro não fornecidos' 
        }),
        { 
          status: 400, 
          headers: { 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('📝 Dados recebidos para:', registration_data.email);

    const steps: ProcessingStep[] = [];
    const startTime = Date.now();

    // Função auxiliar para adicionar steps
    const addStep = (step: string, status: ProcessingStep['status'], message: string, error?: string) => {
      steps.push({
        step,
        status,
        message,
        timestamp: new Date().toISOString(),
        error
      });
      console.log(`📊 Step [${step}]: ${status} - ${message}`);
    };

    // ETAPA 1: Validação de dados
    addStep('validation', 'processing', 'Validando dados de entrada...');
    
    const validation = validateRegistrationData(registration_data);
    if (!validation.isValid) {
      addStep('validation', 'failed', `Dados inválidos: ${validation.errors.join(', ')}`);
      
      return new Response(
        JSON.stringify({
          success: false,
          steps,
          error: `Dados inválidos: ${validation.errors.join(', ')}`
        }),
        { 
          status: 400, 
          headers: { 'Content-Type': 'application/json' } 
        }
      );
    }

    addStep('validation', 'completed', 'Dados validados com sucesso');

    // ETAPA 2: Criar cliente Asaas
    addStep('asaas_customer', 'processing', 'Criando cliente no Asaas...');
    
    let asaasCustomerId: string;
    try {
      asaasCustomerId = await createAsaasCustomer(registration_data);
      addStep('asaas_customer', 'completed', `Cliente Asaas criado: ${asaasCustomerId}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      addStep('asaas_customer', 'failed', `Erro ao criar cliente: ${errorMessage}`);
      
      return new Response(
        JSON.stringify({
          success: false,
          steps,
          error: `Erro ao criar cliente Asaas: ${errorMessage}`
        }),
        { 
          status: 500, 
          headers: { 'Content-Type': 'application/json' } 
        }
      );
    }

    // ETAPA 3: Processar pagamento
    addStep('payment', 'processing', 'Processando pagamento...');
    
    let paymentId: string;
    try {
      paymentId = await processPayment(registration_data, asaasCustomerId);
      addStep('payment', 'completed', `Pagamento criado: ${paymentId}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      addStep('payment', 'failed', `Erro ao processar pagamento: ${errorMessage}`);
      
      return new Response(
        JSON.stringify({
          success: false,
          steps,
          error: `Erro ao processar pagamento: ${errorMessage}`
        }),
        { 
          status: 500, 
          headers: { 'Content-Type': 'application/json' } 
        }
      );
    }

    // ETAPA 4: Aguardar confirmação via polling
    addStep('payment_confirmation', 'processing', 'Aguardando confirmação do pagamento...');
    
    try {
      const pollingResult = await pollPaymentStatus(paymentId, 15, 1, (status) => {
        addStep('payment_confirmation', 'processing', `Status: ${status}`);
      });

      if (!pollingResult.success) {
        if (pollingResult.timedOut) {
          // Timeout - armazenar no fallback system
          addStep('payment_confirmation', 'failed', 'Timeout na confirmação - processo será retomado automaticamente');
          
          await storePendingSubscription({
            payment_id: paymentId,
            asaas_customer_id: asaasCustomerId,
            registration_data,
            attempts: 0,
            status: 'pending'
          });
          
          return new Response(
            JSON.stringify({
              success: false,
              steps,
              error: 'Timeout na confirmação do pagamento',
              fallback_stored: true
            }),
            { 
              status: 408, 
              headers: { 'Content-Type': 'application/json' } 
            }
          );
        } else {
          // Pagamento recusado
          addStep('payment_confirmation', 'failed', `Pagamento recusado: ${pollingResult.error}`);
          
          return new Response(
            JSON.stringify({
              success: false,
              steps,
              error: pollingResult.error || 'Pagamento recusado'
            }),
            { 
              status: 402, 
              headers: { 'Content-Type': 'application/json' } 
            }
          );
        }
      }

      addStep('payment_confirmation', 'completed', 'Pagamento confirmado com sucesso');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      addStep('payment_confirmation', 'failed', `Erro no polling: ${errorMessage}`);
      
      return new Response(
        JSON.stringify({
          success: false,
          steps,
          error: `Erro na confirmação: ${errorMessage}`
        }),
        { 
          status: 500, 
          headers: { 'Content-Type': 'application/json' } 
        }
      );
    }

    // ETAPA 5: Criar conta Supabase
    addStep('account_creation', 'processing', 'Criando conta de usuário...');
    
    let userId: string;
    try {
      userId = await createSupabaseAccount(registration_data);
      addStep('account_creation', 'completed', `Conta criada: ${userId}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      addStep('account_creation', 'failed', `Erro ao criar conta: ${errorMessage}`);
      
      // Armazenar no fallback system para completar depois
      await storePendingCompletion({
        payment_id: paymentId,
        asaas_customer_id: asaasCustomerId,
        asaas_subscription_id: '', // Será preenchido quando assinatura for criada
        registration_data,
        attempts: 0,
        status: 'pending'
      });
      
      return new Response(
        JSON.stringify({
          success: false,
          steps,
          error: `Erro ao criar conta: ${errorMessage}`,
          fallback_stored: true,
          requires_manual_intervention: true
        }),
        { 
          status: 500, 
          headers: { 'Content-Type': 'application/json' } 
        }
      );
    }

    // ETAPA 6: Criar perfil e assinatura
    addStep('profile_subscription', 'processing', 'Criando perfil e assinatura...');
    
    let asaasSubscriptionId: string | undefined;
    try {
      asaasSubscriptionId = await createProfileAndSubscription(
        userId, 
        registration_data, 
        asaasCustomerId, 
        paymentId
      );
      addStep('profile_subscription', 'completed', 'Perfil e assinatura criados com sucesso');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      addStep('profile_subscription', 'failed', `Erro ao criar perfil/assinatura: ${errorMessage}`);
      
      // Conta foi criada mas perfil/assinatura falharam - armazenar no fallback
      await storePendingCompletion({
        payment_id: paymentId,
        asaas_customer_id: asaasCustomerId,
        asaas_subscription_id: asaasSubscriptionId || '',
        registration_data,
        attempts: 0,
        status: 'pending'
      });
      
      return new Response(
        JSON.stringify({
          success: false,
          steps,
          error: `Erro ao criar perfil/assinatura: ${errorMessage}`,
          fallback_stored: true,
          requires_manual_intervention: true
        }),
        { 
          status: 500, 
          headers: { 'Content-Type': 'application/json' } 
        }
      );
    }

    // Sucesso completo
    addStep('completed', 'completed', 'Processo concluído com sucesso');

    const duration = Date.now() - startTime;
    console.log(`✅ Payment First Flow concluído em ${duration}ms`);

    return new Response(
      JSON.stringify({
        success: true,
        user_id: userId,
        payment_id: paymentId,
        asaas_customer_id: asaasCustomerId,
        asaas_subscription_id: asaasSubscriptionId,
        steps,
        duration
      }),
      { 
        status: 200, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('❌ Erro geral no Payment First Flow:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Erro interno do servidor'
      }),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );

  } finally {
    clearTimeout(timeoutId);
  }
});

// Funções auxiliares

function validateRegistrationData(data: RegistrationData): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Validações básicas
  if (!data.nome || data.nome.trim().length < 2) {
    errors.push('Nome deve ter pelo menos 2 caracteres');
  }

  if (!data.email || !isValidEmail(data.email)) {
    errors.push('Email inválido');
  }

  if (!data.password || data.password.length < 6) {
    errors.push('Senha deve ter pelo menos 6 caracteres');
  }

  if (!data.cpf || !isValidCPF(data.cpf)) {
    errors.push('CPF inválido');
  }

  if (!data.telefone || !isValidPhone(data.telefone)) {
    errors.push('Telefone inválido');
  }

  // Validação de endereço
  if (!data.endereco.cep || !isValidCEP(data.endereco.cep)) {
    errors.push('CEP inválido');
  }

  if (!data.endereco.logradouro || data.endereco.logradouro.trim().length < 5) {
    errors.push('Logradouro deve ter pelo menos 5 caracteres');
  }

  // Validação de tipo de membro
  const validMemberTypes = ['bispo', 'pastor', 'diacono', 'membro'];
  if (!data.tipo_membro || !validMemberTypes.includes(data.tipo_membro)) {
    errors.push('Tipo de membro inválido');
  }

  // Validação de plano
  if (!data.plan_id || data.plan_id.trim().length === 0) {
    errors.push('Plano é obrigatório');
  }

  // Validação de método de pagamento
  const validPaymentMethods = ['CREDIT_CARD', 'PIX'];
  if (!data.payment_method || !validPaymentMethods.includes(data.payment_method)) {
    errors.push('Método de pagamento inválido');
  }

  // Validação específica para cartão de crédito
  if (data.payment_method === 'CREDIT_CARD') {
    if (!data.card_data) {
      errors.push('Dados do cartão são obrigatórios');
    } else {
      if (!data.card_data.holderName || data.card_data.holderName.trim().length < 2) {
        errors.push('Nome do portador inválido');
      }

      if (!data.card_data.number || !isValidCardNumber(data.card_data.number)) {
        errors.push('Número do cartão inválido');
      }

      if (!data.card_data.expiryMonth || !isValidMonth(data.card_data.expiryMonth)) {
        errors.push('Mês de expiração inválido');
      }

      if (!data.card_data.expiryYear || !isValidYear(data.card_data.expiryYear)) {
        errors.push('Ano de expiração inválido');
      }

      if (!data.card_data.ccv || !isValidCCV(data.card_data.ccv)) {
        errors.push('CCV inválido');
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

async function createAsaasCustomer(data: RegistrationData): Promise<string> {
  console.log('🏢 Criando cliente Asaas para:', data.email);
  
  const customerData = {
    name: data.nome,
    cpfCnpj: data.cpf,
    email: data.email,
    phone: data.telefone,
    mobilePhone: data.telefone,
    address: data.endereco.logradouro,
    addressNumber: data.endereco.numero,
    complement: data.endereco.complemento,
    province: data.endereco.bairro,
    postalCode: data.endereco.cep,
    city: data.endereco.cidade,
    state: data.endereco.estado,
    country: 'Brasil',
    externalReference: `user_${Date.now()}`,
    notificationDisabled: false
  };

  // Chamar Edge Function para criar cliente
  const response = await supabase.functions.invoke('asaas-create-customer', {
    body: {
      user_id: `temp_${Date.now()}`, // ID temporário
      customer_data: customerData
    }
  });

  if (response.error) {
    throw new Error(`Erro na Edge Function: ${response.error.message}`);
  }

  if (!response.data?.success) {
    throw new Error(`Falha ao criar cliente: ${response.data?.error || 'Erro desconhecido'}`);
  }

  console.log('✅ Cliente Asaas criado:', response.data.customer_id);
  return response.data.customer_id;
}

async function processPayment(data: RegistrationData, customerId: string): Promise<string> {
  console.log('💳 Processando pagamento para cliente:', customerId);
  
  // Buscar dados do plano
  const { data: plan, error: planError } = await supabase
    .from('subscription_plans')
    .select('value, cycle')
    .eq('id', data.plan_id)
    .single();

  if (planError || !plan) {
    throw new Error(`Plano não encontrado: ${data.plan_id}`);
  }

  const paymentData = {
    billingType: data.payment_method,
    value: plan.value,
    dueDate: new Date().toISOString().split('T')[0],
    description: `Filiação COMADEMIG - ${data.tipo_membro}`,
    externalReference: `filiacao_${Date.now()}`,
    // Dados do cartão se for pagamento com cartão
    ...(data.payment_method === 'CREDIT_CARD' && data.card_data && {
      creditCard: {
        holderName: data.card_data.holderName,
        number: data.card_data.number,
        expiryMonth: data.card_data.expiryMonth,
        expiryYear: data.card_data.expiryYear,
        ccv: data.card_data.ccv
      },
      creditCardHolderInfo: {
        name: data.nome,
        email: data.email,
        cpfCnpj: data.cpf,
        postalCode: data.endereco.cep,
        addressNumber: data.endereco.numero,
        addressComplement: data.endereco.complemento,
        phone: data.telefone,
        mobilePhone: data.telefone
      }
    })
  };

  // Chamar Edge Function para criar pagamento
  const response = await supabase.functions.invoke('asaas-create-payment', {
    body: {
      customer_id: customerId,
      service_type: 'filiacao',
      service_data: {
        type: 'filiacao',
        details: {
          tipo_membro: data.tipo_membro,
          plan_id: data.plan_id
        },
        affiliate_id: data.affiliate_id
      },
      payment_data: paymentData
    }
  });

  if (response.error) {
    throw new Error(`Erro na Edge Function: ${response.error.message}`);
  }

  if (!response.data?.success) {
    throw new Error(`Falha ao criar pagamento: ${response.data?.error || 'Erro desconhecido'}`);
  }

  console.log('✅ Pagamento criado:', response.data.payment_id);
  return response.data.payment_id;
}

async function pollPaymentStatus(
  paymentId: string, 
  timeout: number, 
  interval: number,
  onStatusUpdate?: (status: string) => void
): Promise<{ success: boolean; error?: string; timedOut?: boolean }> {
  console.log('🔄 Iniciando polling para pagamento:', paymentId);
  
  const startTime = Date.now();
  const timeoutMs = timeout * 1000;
  const intervalMs = interval * 1000;
  
  while (Date.now() - startTime < timeoutMs) {
    try {
      // Consultar status via API do Asaas
      const asaasApiKey = Deno.env.get('ASAAS_API_KEY');
      const asaasBaseUrl = Deno.env.get('ASAAS_BASE_URL') || 'https://sandbox.asaas.com/api/v3';
      
      const response = await fetch(`${asaasBaseUrl}/payments/${paymentId}`, {
        headers: {
          'access_token': asaasApiKey!,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Erro ao consultar status: ${response.status}`);
      }

      const payment = await response.json();
      const status = payment.status;
      
      if (onStatusUpdate) {
        onStatusUpdate(status);
      }
      
      // Retornar sucesso imediatamente se CONFIRMED
      if (status === 'CONFIRMED') {
        console.log('✅ Pagamento confirmado');
        return { success: true };
      }
      
      // Retornar falha imediatamente se REFUSED
      if (status === 'REFUSED') {
        console.log('❌ Pagamento recusado');
        return { success: false, error: 'Pagamento recusado' };
      }
      
      // Status ainda pendente, aguardar próximo intervalo
      if (status === 'PENDING' || status === 'OVERDUE') {
        await new Promise(resolve => setTimeout(resolve, intervalMs));
        continue;
      }
      
      // Status inesperado
      return { success: false, error: `Status inesperado: ${status}` };
      
    } catch (error) {
      console.warn('⚠️ Erro na tentativa de polling:', error);
      
      // Se estivermos próximos do timeout, falhar
      if (Date.now() - startTime >= timeoutMs - intervalMs) {
        throw error;
      }
      
      // Aguardar antes da próxima tentativa
      await new Promise(resolve => setTimeout(resolve, intervalMs));
    }
  }
  
  // Timeout
  console.log('⏰ Timeout no polling');
  return { success: false, timedOut: true };
}

async function createSupabaseAccount(data: RegistrationData): Promise<string> {
  console.log('👤 Criando conta Supabase para:', data.email);
  
  // Criar conta via Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: data.email,
    password: data.password,
    email_confirm: true,
    user_metadata: {
      nome: data.nome,
      cpf: data.cpf,
      telefone: data.telefone,
      tipo_membro: data.tipo_membro,
      registration_flow_version: 'payment_first_v1'
    }
  });

  if (authError) {
    throw new Error(`Erro ao criar conta: ${authError.message}`);
  }

  if (!authData.user) {
    throw new Error('Conta não foi criada - dados de usuário ausentes');
  }

  console.log('✅ Conta Supabase criada:', authData.user.id);
  return authData.user.id;
}

async function createProfileAndSubscription(
  userId: string,
  data: RegistrationData,
  asaasCustomerId: string,
  paymentId: string
): Promise<string | undefined> {
  console.log('📋 Criando perfil e assinatura para usuário:', userId);
  
  // 1. Criar perfil do usuário
  const { error: profileError } = await supabase
    .from('profiles')
    .insert({
      id: userId,
      nome: data.nome,
      email: data.email,
      cpf: data.cpf,
      telefone: data.telefone,
      endereco: data.endereco,
      tipo_membro: data.tipo_membro,
      status: 'ativo', // Sempre ativo no novo fluxo
      asaas_customer_id: asaasCustomerId,
      payment_confirmed_at: new Date().toISOString(),
      registration_flow_version: 'payment_first_v1'
    });

  if (profileError) {
    throw new Error(`Erro ao criar perfil: ${profileError.message}`);
  }

  // 2. Buscar dados do plano
  const { data: plan, error: planError } = await supabase
    .from('subscription_plans')
    .select('*')
    .eq('id', data.plan_id)
    .single();

  if (planError || !plan) {
    throw new Error(`Plano não encontrado: ${data.plan_id}`);
  }

  // 3. Calcular próxima data de cobrança
  const nextBillingDate = calculateNextBillingDate(plan.cycle);

  // 4. Criar assinatura do usuário
  const { error: subscriptionError } = await supabase
    .from('user_subscriptions')
    .insert({
      user_id: userId,
      plan_id: data.plan_id,
      status: 'active',
      start_date: new Date().toISOString(),
      next_billing_date: nextBillingDate,
      asaas_payment_id: paymentId,
      processing_context: {
        flow_version: 'payment_first_v1',
        payment_confirmed_at: new Date().toISOString(),
        affiliate_id: data.affiliate_id
      }
    });

  if (subscriptionError) {
    throw new Error(`Erro ao criar assinatura: ${subscriptionError.message}`);
  }

  // 5. Se houver afiliado, registrar comissão
  if (data.affiliate_id) {
    await registerAffiliateCommission(data.affiliate_id, userId, paymentId, plan.value);
  }

  console.log('✅ Perfil e assinatura criados com sucesso');
  return undefined; // TODO: Retornar asaas_subscription_id quando implementado
}

function calculateNextBillingDate(cycle: string): string {
  const now = new Date();
  
  switch (cycle.toUpperCase()) {
    case 'MONTHLY':
      now.setMonth(now.getMonth() + 1);
      break;
    case 'SEMIANNUALLY':
      now.setMonth(now.getMonth() + 6);
      break;
    case 'YEARLY':
      now.setFullYear(now.getFullYear() + 1);
      break;
    default:
      now.setMonth(now.getMonth() + 1);
  }
  
  return now.toISOString();
}

async function registerAffiliateCommission(
  affiliateId: string,
  userId: string,
  paymentId: string,
  planValue: number
): Promise<void> {
  try {
    // Buscar dados do afiliado
    const { data: affiliate, error: affiliateError } = await supabase
      .from('affiliates')
      .select('commission_percentage')
      .eq('id', affiliateId)
      .single();

    if (affiliateError || !affiliate) {
      console.warn('⚠️ Afiliado não encontrado, pulando registro de comissão:', affiliateId);
      return;
    }

    const commissionAmount = (planValue * (affiliate.commission_percentage || 10)) / 100;

    // Registrar comissão
    const { error: commissionError } = await supabase
      .from('commissions')
      .insert({
        affiliate_id: affiliateId,
        user_id: userId,
        payment_id: paymentId,
        amount: commissionAmount,
        percentage: affiliate.commission_percentage || 10,
        status: 'pending',
        type: 'filiacao',
        created_at: new Date().toISOString()
      });

    if (commissionError) {
      console.error('❌ Erro ao registrar comissão:', commissionError);
    } else {
      console.log(`💰 Comissão registrada: ${commissionAmount} para afiliado ${affiliateId}`);
    }

  } catch (error) {
    console.error('❌ Erro ao processar comissão do afiliado:', error);
  }
}

async function storePendingSubscription(data: {
  payment_id: string;
  asaas_customer_id: string;
  registration_data: RegistrationData;
  attempts: number;
  status: string;
}): Promise<void> {
  console.log('💾 Armazenando pending subscription:', data.payment_id);
  
  const { error } = await supabase
    .from('pending_subscriptions')
    .insert({
      payment_id: data.payment_id,
      customer_id: data.asaas_customer_id,
      user_data: {
        email: data.registration_data.email,
        password: data.registration_data.password,
        nome: data.registration_data.nome,
        cpf: data.registration_data.cpf,
        telefone: data.registration_data.telefone,
        endereco: data.registration_data.endereco,
        tipo_membro: data.registration_data.tipo_membro
      },
      subscription_data: {
        plan_id: data.registration_data.plan_id,
        affiliate_id: data.registration_data.affiliate_id
      },
      payment_data: {
        amount: 0, // TODO: Obter valor real do plano
        payment_method: data.registration_data.payment_method
      },
      retry_count: data.attempts,
      status: data.status
    });

  if (error) {
    console.error('❌ Erro ao armazenar pending subscription:', error);
    throw new Error(`Erro ao armazenar pending subscription: ${error.message}`);
  }

  console.log('✅ Pending subscription armazenada');
}

async function storePendingCompletion(data: {
  payment_id: string;
  asaas_customer_id: string;
  asaas_subscription_id: string;
  registration_data: RegistrationData;
  attempts: number;
  status: string;
}): Promise<void> {
  console.log('💾 Armazenando pending completion:', data.payment_id);
  
  const { error } = await supabase
    .from('pending_completions')
    .insert({
      payment_id: data.payment_id,
      customer_id: data.asaas_customer_id,
      subscription_id: data.asaas_subscription_id,
      email: data.registration_data.email,
      password_hash: data.registration_data.password, // TODO: Hash da senha
      full_name: data.registration_data.nome,
      cpf: data.registration_data.cpf,
      phone: data.registration_data.telefone,
      member_type_id: data.registration_data.plan_id, // TODO: Mapear corretamente
      affiliate_code: data.registration_data.affiliate_id,
      profile_data: {
        endereco: data.registration_data.endereco,
        tipo_membro: data.registration_data.tipo_membro
      },
      retry_count: data.attempts,
      status: data.status
    });

  if (error) {
    console.error('❌ Erro ao armazenar pending completion:', error);
    throw new Error(`Erro ao armazenar pending completion: ${error.message}`);
  }

  console.log('✅ Pending completion armazenada');
}

// Funções de validação

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function isValidCPF(cpf: string): boolean {
  const cleanCPF = cpf.replace(/\D/g, '');
  if (cleanCPF.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cleanCPF)) return false;
  
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (10 - i);
  }
  let remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCPF.charAt(9))) return false;
  
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCPF.charAt(10))) return false;
  
  return true;
}

function isValidPhone(phone: string): boolean {
  const cleanPhone = phone.replace(/\D/g, '');
  return cleanPhone.length >= 10 && cleanPhone.length <= 11;
}

function isValidCEP(cep: string): boolean {
  const cleanCEP = cep.replace(/\D/g, '');
  return cleanCEP.length === 8;
}

function isValidCardNumber(number: string): boolean {
  const cleanNumber = number.replace(/\D/g, '');
  return cleanNumber.length >= 13 && cleanNumber.length <= 19;
}

function isValidMonth(month: string): boolean {
  const monthNum = parseInt(month);
  return monthNum >= 1 && monthNum <= 12;
}

function isValidYear(year: string): boolean {
  const yearNum = parseInt(year);
  const currentYear = new Date().getFullYear();
  return yearNum >= currentYear && yearNum <= currentYear + 20;
}

function isValidCCV(ccv: string): boolean {
  const cleanCCV = ccv.replace(/\D/g, '');
  return cleanCCV.length >= 3 && cleanCCV.length <= 4;
}