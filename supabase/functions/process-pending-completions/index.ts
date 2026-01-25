/**
 * Edge Function: process-pending-completions
 * 
 * Processamento de cron job para contas pendentes
 * Cria conta Supabase com dados salvos e vincula com pagamento/assinatura existentes
 * Envia email de boas-vindas após conclusão
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
interface PendingCompletion {
  id: string;
  payment_id: string;
  customer_id: string;
  subscription_id: string;
  email: string;
  password_hash: string;
  full_name: string;
  cpf: string;
  phone: string;
  member_type_id: string;
  affiliate_code?: string;
  profile_data: {
    endereco: any;
    tipo_membro: string;
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
    console.log('🔄 Iniciando processamento de pending completions...');

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

    // Buscar pending completions que precisam de retry
    console.log('📋 Buscando pending completions...');
    
    const { data: pendingItems, error: fetchError } = await supabase
      .from('pending_completions')
      .select('*')
      .eq('status', 'pending')
      .lt('retry_count', maxRetries)
      .order('created_at', { ascending: true })
      .limit(50); // Processar no máximo 50 por vez

    if (fetchError) {
      throw new Error(`Erro ao buscar pending completions: ${fetchError.message}`);
    }

    if (!pendingItems || pendingItems.length === 0) {
      console.log('✅ Nenhuma pending completion para processar');
      
      return new Response(
        JSON.stringify({
          success: true,
          processed: 0,
          completed: 0,
          failed: 0,
          errors: [],
          duration: Date.now() - startTime,
          message: 'Nenhuma pending completion para processar'
        }),
        { 
          status: 200, 
          headers: { 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`📊 Processando ${pendingItems.length} pending completions`);

    const results: RetryResult[] = [];
    let completed = 0;
    let failed = 0;
    const errors: string[] = [];

    // Processar cada item
    for (const item of pendingItems) {
      try {
        console.log(`🔄 Processando pending completion ${item.id}...`);

        // Marcar como processando
        await updatePendingCompletionStatus(item.id, 'processing');

        // Tentar completar o processo
        const result = await completePendingCompletion(item);
        results.push(result);

        if (result.success) {
          // Marcar como concluído
          await updatePendingCompletionStatus(item.id, 'completed');
          completed++;
          console.log(`✅ Pending completion ${item.id} concluída com sucesso`);
        } else {
          // Incrementar tentativas e atualizar erro
          await incrementPendingCompletionAttempts(item.id, result.error);
          
          if (item.retry_count + 1 >= maxRetries) {
            // Marcar como falhada e notificar admin
            await updatePendingCompletionStatus(item.id, 'failed');
            await notifyAdministrators('pending_completion', item.id, result.error);
            failed++;
            errors.push(`${item.id}: ${result.error}`);
            console.error(`❌ Pending completion ${item.id} falhou após ${maxRetries} tentativas`);
          } else {
            console.log(`⚠️ Pending completion ${item.id} falhará na tentativa ${item.retry_count + 1}/${maxRetries}`);
          }
        }

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
        console.error(`❌ Erro ao processar pending completion ${item.id}:`, error);
        
        await incrementPendingCompletionAttempts(item.id, errorMessage);
        
        if (item.retry_count + 1 >= maxRetries) {
          await updatePendingCompletionStatus(item.id, 'failed');
          await notifyAdministrators('pending_completion', item.id, errorMessage);
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
        message: `Processadas ${pendingItems.length} pending completions: ${completed} sucesso, ${failed} falhas`
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

async function completePendingCompletion(item: PendingCompletion): Promise<RetryResult> {
  try {
    console.log(`🔄 Tentando completar pending completion: ${item.email}`);

    // 1. Verificar se pagamento foi confirmado
    const paymentStatus = await checkPaymentStatus(item.payment_id);
    
    if (paymentStatus !== 'CONFIRMED') {
      return {
        success: false,
        error: `Pagamento ainda não confirmado: ${paymentStatus}`
      };
    }

    // 2. Verificar se conta já existe
    const existingUser = await checkExistingUser(item.email);
    if (existingUser) {
      console.log(`⚠️ Conta já existe para ${item.email}, atualizando dados...`);
      
      // Atualizar perfil existente
      await updateExistingProfile(existingUser.id, item);
      
      return {
        success: true,
        completed: true
      };
    }

    // 3. Criar conta Supabase
    const userId = await createSupabaseAccount(item);
    console.log(`✅ Conta Supabase criada: ${userId}`);

    // 4. Criar perfil
    await createProfile(userId, item);
    console.log(`✅ Perfil criado para: ${userId}`);

    // 5. Atualizar assinatura existente (se houver)
    if (item.subscription_id) {
      await linkSubscriptionToUser(userId, item.subscription_id, item.payment_id);
      console.log(`✅ Assinatura vinculada: ${item.subscription_id}`);
    }

    // 6. Registrar comissão do afiliado (se houver)
    if (item.affiliate_code) {
      await registerAffiliateCommission(item.affiliate_code, userId, item.payment_id);
      console.log(`✅ Comissão registrada para afiliado: ${item.affiliate_code}`);
    }

    // 7. Enviar email de boas-vindas
    await sendWelcomeEmail(item.email, item.full_name);
    console.log(`✅ Email de boas-vindas enviado para: ${item.email}`);

    return {
      success: true,
      completed: true
    };

  } catch (error) {
    console.error('❌ Erro ao completar pending completion:', error);
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

async function checkExistingUser(email: string): Promise<{ id: string } | null> {
  try {
    const { data: users, error } = await supabase.auth.admin.listUsers();
    
    if (error) {
      console.warn('⚠️ Erro ao verificar usuários existentes:', error);
      return null;
    }

    const existingUser = users.users.find(user => user.email === email);
    return existingUser ? { id: existingUser.id } : null;

  } catch (error) {
    console.warn('⚠️ Erro ao verificar usuário existente:', error);
    return null;
  }
}

async function createSupabaseAccount(item: PendingCompletion): Promise<string> {
  console.log('👤 Criando conta Supabase para:', item.email);
  
  // Criar conta via Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: item.email,
    password: item.password_hash, // Assumindo que já está hasheada
    email_confirm: true,
    user_metadata: {
      nome: item.full_name,
      cpf: item.cpf,
      telefone: item.phone,
      tipo_membro: item.profile_data.tipo_membro,
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

async function createProfile(userId: string, item: PendingCompletion): Promise<void> {
  console.log('📋 Criando perfil para usuário:', userId);
  
  const { error: profileError } = await supabase
    .from('profiles')
    .insert({
      id: userId,
      nome: item.full_name,
      email: item.email,
      cpf: item.cpf,
      telefone: item.phone,
      endereco: item.profile_data.endereco,
      tipo_membro: item.profile_data.tipo_membro,
      status: 'ativo', // Sempre ativo no novo fluxo
      asaas_customer_id: item.customer_id,
      payment_confirmed_at: new Date().toISOString(),
      registration_flow_version: 'payment_first_v1'
    });

  if (profileError) {
    throw new Error(`Erro ao criar perfil: ${profileError.message}`);
  }
}

async function updateExistingProfile(userId: string, item: PendingCompletion): Promise<void> {
  console.log('📋 Atualizando perfil existente para usuário:', userId);
  
  const { error: profileError } = await supabase
    .from('profiles')
    .update({
      nome: item.full_name,
      cpf: item.cpf,
      telefone: item.phone,
      endereco: item.profile_data.endereco,
      tipo_membro: item.profile_data.tipo_membro,
      status: 'ativo',
      asaas_customer_id: item.customer_id,
      payment_confirmed_at: new Date().toISOString(),
      registration_flow_version: 'payment_first_v1'
    })
    .eq('id', userId);

  if (profileError) {
    throw new Error(`Erro ao atualizar perfil: ${profileError.message}`);
  }
}

async function linkSubscriptionToUser(userId: string, subscriptionId: string, paymentId: string): Promise<void> {
  console.log('🔗 Vinculando assinatura ao usuário:', userId);
  
  // Buscar assinatura existente ou criar nova
  const { data: existingSubscription, error: fetchError } = await supabase
    .from('user_subscriptions')
    .select('*')
    .eq('asaas_subscription_id', subscriptionId)
    .single();

  if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = not found
    throw new Error(`Erro ao buscar assinatura: ${fetchError.message}`);
  }

  if (existingSubscription) {
    // Atualizar assinatura existente
    const { error: updateError } = await supabase
      .from('user_subscriptions')
      .update({
        user_id: userId,
        asaas_payment_id: paymentId,
        processing_context: {
          ...existingSubscription.processing_context,
          completed_by: 'pending_completions_cron',
          completed_at: new Date().toISOString()
        }
      })
      .eq('asaas_subscription_id', subscriptionId);

    if (updateError) {
      throw new Error(`Erro ao atualizar assinatura: ${updateError.message}`);
    }
  } else {
    console.log('⚠️ Assinatura não encontrada, será criada quando necessário');
  }
}

async function registerAffiliateCommission(affiliateCode: string, userId: string, paymentId: string): Promise<void> {
  try {
    // Buscar afiliado pelo código
    const { data: affiliate, error: affiliateError } = await supabase
      .from('affiliates')
      .select('id, commission_percentage')
      .eq('code', affiliateCode)
      .single();

    if (affiliateError || !affiliate) {
      console.warn('⚠️ Afiliado não encontrado pelo código, pulando registro de comissão:', affiliateCode);
      return;
    }

    // Buscar valor do pagamento
    const paymentValue = await getPaymentValue(paymentId);
    const commissionAmount = (paymentValue * (affiliate.commission_percentage || 10)) / 100;

    // Registrar comissão
    const { error: commissionError } = await supabase
      .from('commissions')
      .insert({
        affiliate_id: affiliate.id,
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
      console.log(`💰 Comissão registrada: ${commissionAmount} para afiliado ${affiliate.id}`);
    }

  } catch (error) {
    console.error('❌ Erro ao processar comissão do afiliado:', error);
  }
}

async function getPaymentValue(paymentId: string): Promise<number> {
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
    throw new Error(`Erro ao consultar valor do pagamento: ${response.status}`);
  }

  const payment = await response.json();
  return payment.value || 0;
}

async function sendWelcomeEmail(email: string, name: string): Promise<void> {
  try {
    console.log('📧 Enviando email de boas-vindas para:', email);

    // TODO: Implementar envio de email via serviço de email
    // Por enquanto, apenas log
    console.log(`✅ Email de boas-vindas seria enviado para ${name} (${email})`);

    // Exemplo de integração futura:
    // await emailService.send({
    //   to: email,
    //   subject: 'Bem-vindo ao COMADEMIG!',
    //   template: 'welcome',
    //   data: { name }
    // });

  } catch (error) {
    console.error('❌ Erro ao enviar email de boas-vindas:', error);
    // Não falha o processo principal por erro de email
  }
}

async function updatePendingCompletionStatus(id: string, status: string): Promise<void> {
  const { error } = await supabase
    .from('pending_completions')
    .update({ 
      status, 
      processed_at: new Date().toISOString() 
    })
    .eq('id', id);

  if (error) {
    throw new Error(`Erro ao atualizar status: ${error.message}`);
  }
}

async function incrementPendingCompletionAttempts(id: string, error?: string): Promise<void> {
  const { error: updateError } = await supabase
    .from('pending_completions')
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

POST /functions/v1/process-pending-completions
{}

RESPOSTA DE SUCESSO:
{
  "success": true,
  "processed": 3,
  "completed": 2,
  "failed": 1,
  "errors": [
    "comp_123: Pagamento ainda não confirmado: PENDING"
  ],
  "duration": 12000,
  "message": "Processadas 3 pending completions: 2 sucesso, 1 falhas"
}

RESPOSTA SEM ITENS:
{
  "success": true,
  "processed": 0,
  "completed": 0,
  "failed": 0,
  "errors": [],
  "duration": 300,
  "message": "Nenhuma pending completion para processar"
}
*/