/**
 * Edge Function: process-pending-subscriptions
 * 
 * Processamento de cron job para assinaturas pendentes
 * Implementa retry automático e notificação de falhas críticas
 * 
 * Requirements: 4.2, 4.3
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

// Configuração do Supabase
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Interfaces
interface PendingSubscription {
  id: string;
  payment_id: string;
  customer_id: string;
  user_data: {
    email: string;
    password: string;
    nome: string;
    cpf: string;
    telefone: string;
    endereco: any;
    tipo_membro: string;
  };
  subscription_data: {
    plan_id: string;
    affiliate_id?: string;
  };
  payment_data: {
    amount: number;
    payment_method: string;
  };
  retry_count: number;
  last_error?: string;
  created_at: string;
  status: string;
}

interface ProcessingResult {
  success: boolean;
  processed: number;
  completed: number;
  failed: number;
  errors: string[];
  duration: number;
}

interface RetryResult {
  success: boolean;
  error?: string;
  completed?: boolean;
  requiresManualIntervention?: boolean;
}

serve(async (req) => {
  const startTime = Date.now();
  
  try {
    console.log('🔄 Iniciando processamento de pending subscriptions...');

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

    // Configurações
    const maxRetries = 3;
    const retryDelay = 5000; // 5 segundos

    // Buscar pending subscriptions que precisam de retry
    console.log('📋 Buscando pending subscriptions...');
    
    const { data: pendingItems, error: fetchError } = await supabase
      .from('pending_subscriptions')
      .select('*')
      .eq('status', 'pending')
      .lt('retry_count', maxRetries)
      .order('created_at', { ascending: true })
      .limit(50); // Processar no máximo 50 por vez

    if (fetchError) {
      throw new Error(`Erro ao buscar pending subscriptions: ${fetchError.message}`);
    }

    if (!pendingItems || pendingItems.length === 0) {
      console.log('✅ Nenhuma pending subscription para processar');
      
      return new Response(
        JSON.stringify({
          success: true,
          processed: 0,
          completed: 0,
          failed: 0,
          errors: [],
          duration: Date.now() - startTime,
          message: 'Nenhuma pending subscription para processar'
        }),
        { 
          status: 200, 
          headers: { 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`📊 Processando ${pendingItems.length} pending subscriptions`);

    const results: RetryResult[] = [];
    let completed = 0;
    let failed = 0;
    const errors: string[] = [];

    // Processar cada item
    for (const item of pendingItems) {
      try {
        console.log(`🔄 Processando pending subscription ${item.id}...`);

        // Marcar como processando
        await updatePendingSubscriptionStatus(item.id, 'processing');

        // Tentar completar o processo
        const result = await completePendingSubscription(item);
        results.push(result);

        if (result.success) {
          // Marcar como concluído
          await updatePendingSubscriptionStatus(item.id, 'completed');
          completed++;
          console.log(`✅ Pending subscription ${item.id} concluída com sucesso`);
        } else {
          // Incrementar tentativas e atualizar erro
          await incrementPendingSubscriptionAttempts(item.id, result.error);
          
          if (item.retry_count + 1 >= maxRetries) {
            // Marcar como falhada e notificar admin
            await updatePendingSubscriptionStatus(item.id, 'failed');
            await notifyAdministrators('pending_subscription', item.id, result.error);
            failed++;
            errors.push(`${item.id}: ${result.error}`);
            console.error(`❌ Pending subscription ${item.id} falhou após ${maxRetries} tentativas`);
          } else {
            console.log(`⚠️ Pending subscription ${item.id} falhará na tentativa ${item.retry_count + 1}/${maxRetries}`);
          }
        }

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
        console.error(`❌ Erro ao processar pending subscription ${item.id}:`, error);
        
        await incrementPendingSubscriptionAttempts(item.id, errorMessage);
        
        if (item.retry_count + 1 >= maxRetries) {
          await updatePendingSubscriptionStatus(item.id, 'failed');
          await notifyAdministrators('pending_subscription', item.id, errorMessage);
          failed++;
        }
        
        errors.push(`${item.id}: ${errorMessage}`);
        
        results.push({
          success: false,
          error: errorMessage,
          requiresManualIntervention: item.retry_count + 1 >= maxRetries
        });
      }

      // Aguardar antes da próxima tentativa (exceto no último item)
      if (pendingItems.indexOf(item) < pendingItems.length - 1) {
        await sleep(retryDelay);
      }
    }

    const duration = Date.now() - startTime;
    console.log(`✅ Processamento concluído em ${duration}ms: ${completed} sucesso, ${failed} falhas`);

    return new Response(
      JSON.stringify({
        success: true,
        processed: pendingItems.length,
        completed,
        failed,
        errors,
        duration,
        message: `Processadas ${pendingItems.length} pending subscriptions: ${completed} sucesso, ${failed} falhas`
      }),
      { 
        status: 200, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('❌ Erro geral no processamento:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Erro interno do servidor',
        duration: Date.now() - startTime
      }),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  }
});

// Funções auxiliares

async function completePendingSubscription(item: PendingSubscription): Promise<RetryResult> {
  try {
    console.log(`🔄 Tentando completar pending subscription: ${item.payment_id}`);

    // 1. Verificar se pagamento foi confirmado
    const paymentStatus = await checkPaymentStatus(item.payment_id);
    
    if (paymentStatus !== 'CONFIRMED') {
      return {
        success: false,
        error: `Pagamento ainda não confirmado: ${paymentStatus}`
      };
    }

    // 2. Criar conta Supabase
    const userId = await createSupabaseAccount(item.user_data);
    console.log(`✅ Conta Supabase criada: ${userId}`);

    // 3. Criar perfil e assinatura
    await createProfileAndSubscription(userId, item);
    console.log(`✅ Perfil e assinatura criados para: ${userId}`);

    return {
      success: true,
      completed: true
    };

  } catch (error) {
    console.error('❌ Erro ao completar pending subscription:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    };
  }
}

async function checkPaymentStatus(paymentId: string): Promise<string> {
  const asaasApiKey = Deno.env.get('ASAAS_API_KEY');
  const asaasBaseUrl = Deno.env.get('ASAAS_BASE_URL') || 'https://sandbox.asaas.com/api/v3';

  if (!asaasApiKey) {
    throw new Error('Configuração da API Asaas não encontrada');
  }

  const response = await fetch(`${asaasBaseUrl}/payments/${paymentId}`, {
    headers: {
      'access_token': asaasApiKey,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`Erro ao consultar status do pagamento: ${response.status}`);
  }

  const payment = await response.json();
  return payment.status;
}

async function createSupabaseAccount(userData: PendingSubscription['user_data']): Promise<string> {
  console.log('👤 Criando conta Supabase para:', userData.email);
  
  // Criar conta via Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: userData.email,
    password: userData.password,
    email_confirm: true,
    user_metadata: {
      nome: userData.nome,
      cpf: userData.cpf,
      telefone: userData.telefone,
      tipo_membro: userData.tipo_membro,
      registration_flow_version: 'payment_first_v1'
    }
  });

  if (authError) {
    throw new Error(`Erro ao criar conta: ${authError.message}`);
  }

  if (!authData.user) {
    throw new Error('Conta não foi criada - dados de usuário ausentes');
  }

  return authData.user.id;
}

async function createProfileAndSubscription(userId: string, item: PendingSubscription): Promise<void> {
  console.log('📋 Criando perfil e assinatura para usuário:', userId);
  
  // 1. Criar perfil do usuário
  const { error: profileError } = await supabase
    .from('profiles')
    .insert({
      id: userId,
      nome: item.user_data.nome,
      email: item.user_data.email,
      cpf: item.user_data.cpf,
      telefone: item.user_data.telefone,
      endereco: item.user_data.endereco,
      tipo_membro: item.user_data.tipo_membro,
      status: 'ativo', // Sempre ativo no novo fluxo
      asaas_customer_id: item.customer_id,
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
    .eq('id', item.subscription_data.plan_id)
    .single();

  if (planError || !plan) {
    throw new Error(`Plano não encontrado: ${item.subscription_data.plan_id}`);
  }

  // 3. Calcular próxima data de cobrança
  const nextBillingDate = calculateNextBillingDate(plan.cycle);

  // 4. Criar assinatura do usuário
  const { error: subscriptionError } = await supabase
    .from('user_subscriptions')
    .insert({
      user_id: userId,
      plan_id: item.subscription_data.plan_id,
      status: 'active',
      start_date: new Date().toISOString(),
      next_billing_date: nextBillingDate,
      asaas_payment_id: item.payment_id,
      processing_context: {
        flow_version: 'payment_first_v1',
        payment_confirmed_at: new Date().toISOString(),
        affiliate_id: item.subscription_data.affiliate_id,
        processed_by: 'pending_subscriptions_cron'
      }
    });

  if (subscriptionError) {
    throw new Error(`Erro ao criar assinatura: ${subscriptionError.message}`);
  }

  // 5. Se houver afiliado, registrar comissão
  if (item.subscription_data.affiliate_id) {
    await registerAffiliateCommission(
      item.subscription_data.affiliate_id,
      userId,
      item.payment_id,
      plan.value
    );
  }
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

async function updatePendingSubscriptionStatus(id: string, status: string): Promise<void> {
  const { error } = await supabase
    .from('pending_subscriptions')
    .update({ 
      status, 
      processed_at: new Date().toISOString() 
    })
    .eq('id', id);

  if (error) {
    throw new Error(`Erro ao atualizar status: ${error.message}`);
  }
}

async function incrementPendingSubscriptionAttempts(id: string, error?: string): Promise<void> {
  const { error: updateError } = await supabase
    .from('pending_subscriptions')
    .update({ 
      retry_count: supabase.raw('retry_count + 1'),
      last_error: error,
      status: 'pending'
    })
    .eq('id', id);

  if (updateError) {
    throw new Error(`Erro ao incrementar tentativas: ${updateError.message}`);
  }
}

async function notifyAdministrators(type: string, itemId: string, error?: string): Promise<void> {
  try {
    console.log(`📧 Notificando administradores sobre falha em ${type}:`, itemId);

    // Criar notificação no sistema (se tabela existir)
    const { error: notificationError } = await supabase
      .from('admin_notifications')
      .insert({
        type: 'fallback_system_failure',
        title: `Falha no Sistema de Fallback - ${type}`,
        message: `Item ${itemId} falhou após múltiplas tentativas. Erro: ${error || 'Não especificado'}`,
        data: {
          fallback_type: type,
          item_id: itemId,
          error: error,
          requires_manual_intervention: true
        },
        priority: 'high',
        status: 'unread'
      });

    if (notificationError) {
      console.error('❌ Erro ao criar notificação para admin:', notificationError);
      // Não falha o processo principal por erro de notificação
    } else {
      console.log('✅ Notificação criada para administradores');
    }

    // TODO: Integrar com sistema de email/webhook para notificação externa
    // await sendEmailNotification(type, itemId, error);

  } catch (error) {
    console.error('❌ Erro ao notificar administradores:', error);
    // Não falha o processo principal
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/*
EXEMPLO DE USO:

POST /functions/v1/process-pending-subscriptions
{}

RESPOSTA DE SUCESSO:
{
  "success": true,
  "processed": 5,
  "completed": 3,
  "failed": 2,
  "errors": [
    "sub_123: Pagamento ainda não confirmado: PENDING",
    "sub_456: Erro ao criar conta: Email já existe"
  ],
  "duration": 15000,
  "message": "Processadas 5 pending subscriptions: 3 sucesso, 2 falhas"
}

RESPOSTA SEM ITENS:
{
  "success": true,
  "processed": 0,
  "completed": 0,
  "failed": 0,
  "errors": [],
  "duration": 500,
  "message": "Nenhuma pending subscription para processar"
}
*/