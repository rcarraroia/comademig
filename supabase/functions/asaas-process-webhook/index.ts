/**
 * Edge Function: Processar Webhooks do Asaas
 * 
 * Recebe notificações automáticas do Asaas sobre mudanças de status de pagamentos
 * Valida token de segurança e atualiza dados locais
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Imports compartilhados
import type {
  WebhookEvent,
  WebhookPayload,
  AsaasPayment
} from '../shared/types.ts';

// Configurações do webhook
const WEBHOOK_TOKEN = Deno.env.get('ASAAS_WEBHOOK_TOKEN') || '';

// Cliente Supabase
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Valida token do webhook
 */
function validateWebhookToken(headers: Headers): boolean {
  const receivedToken = headers.get('asaas-access-token') ||
    headers.get('x-asaas-token') ||
    headers.get('authorization')?.replace('Bearer ', '');

  if (!WEBHOOK_TOKEN) {
    console.warn('ASAAS_WEBHOOK_TOKEN não configurado - validação de token desabilitada');
    return true; // Permitir em desenvolvimento se token não estiver configurado
  }

  return receivedToken === WEBHOOK_TOKEN;
}

/**
 * Valida estrutura do payload do webhook
 */
function validateWebhookPayload(payload: any): payload is WebhookPayload {
  return (
    payload &&
    typeof payload.event === 'string' &&
    typeof payload.dateCreated === 'string' &&
    ((payload.payment && typeof payload.payment.id === 'string') ||
      (payload.subscription && typeof payload.subscription.id === 'string'))
  );
}

/**
 * Registra webhook no banco para auditoria
 * Versão resiliente que nunca lança exceção síncrona
 */
async function logWebhook(
  event: WebhookEvent,
  entityId: string,
  payload: any,
  processed: boolean = false
): Promise<string> {
  try {
    const { data, error } = await supabase
      .from('asaas_webhooks')
      .insert({
        asaas_payment_id: entityId, // Pode ser ID de pagamento ou assinatura
        event_type: event,
        payload: payload,
        processed: processed
      })
      .select('id')
      .maybeSingle(); // Usar maybeSingle por segurança

    if (error) {
      console.error(`Erro ao registrar webhook ${event} (${entityId}):`, error);
      return '';
    }

    return data?.id || '';
  } catch (criticalError) {
    console.error('Falha catastrófica ao tentar logar webhook:', criticalError);
    return ''; // Retorna vazio para permitir que o fluxo continue
  }
}

/**
 * Atualiza status da cobrança local
 */
async function updateLocalPayment(payment: AsaasPayment): Promise<void> {
  const updateData: any = {
    status: payment.status,
    updated_at: new Date().toISOString()
  };

  // Adicionar dados específicos baseados no status
  if (payment.paymentDate) {
    updateData.data_pagamento = payment.paymentDate;
  }

  if (payment.clientPaymentDate) {
    updateData.client_payment_date = payment.clientPaymentDate;
  }

  if (payment.netValue) {
    updateData.net_value = payment.netValue;
  }

  // Atualizar dados do cartão se disponível
  if (payment.creditCard) {
    updateData.credit_card_number = payment.creditCard.creditCardNumber;
    updateData.credit_card_brand = payment.creditCard.creditCardBrand;
    updateData.credit_card_token = payment.creditCard.creditCardToken;
  }

  const { data: existingPayment, error: checkError } = await supabase
    .from('asaas_cobrancas')
    .select('id')
    .eq('asaas_id', payment.id)
    .maybeSingle();

  if (checkError || !existingPayment) {
    console.warn(`Cobrança local não encontrada para atualizar: ${payment.id}. Pulando atualização.`);
    return;
  }

  const { error } = await supabase
    .from('asaas_cobrancas')
    .update(updateData)
    .eq('asaas_id', payment.id);

  if (error) {
    console.error('Erro ao atualizar cobrança local:', error);
    throw new Error(`Erro ao atualizar cobrança: ${error.message}`);
  }

  console.log(`Cobrança ${payment.id} atualizada para status: ${payment.status}`);
}

/**
 * Processa splits de pagamento se confirmado
 */
async function processSplits(payment: AsaasPayment): Promise<void> {
  if (payment.status !== 'CONFIRMED' && payment.status !== 'RECEIVED') {
    return; // Só processar splits para pagamentos confirmados
  }

  try {
    // Buscar cobrança local
    const { data: cobranca, error: cobrancaError } = await supabase
      .from('asaas_cobrancas')
      .select('id')
      .eq('asaas_id', payment.id)
      .maybeSingle();

    if (cobrancaError || !cobranca) {
      console.log('Cobrança local não encontrada para processar splits');
      return;
    }

    // Chamar Edge Function para processar splits
    console.log('Processando splits automaticamente via webhook');

    const { data: splitResult, error: splitError } = await supabase.functions.invoke('asaas-process-splits', {
      body: {
        cobrancaId: cobranca.id,
        paymentValue: payment.value
      }
    });

    if (splitError) {
      console.error('Erro ao processar splits via Edge Function:', splitError);
    } else if (splitResult?.processed) {
      console.log('Splits processados com sucesso:', splitResult.data);
    } else {
      console.log('Nenhum split para processar neste pagamento');
    }

  } catch (error) {
    console.error('Erro ao processar splits:', error);
    // Não falhar o webhook por erro de split
  }
}

/**
 * Executa ações pós-pagamento baseadas no tipo de serviço
 */
async function executePostPaymentActions(payment: AsaasPayment): Promise<void> {
  if (payment.status !== 'CONFIRMED' && payment.status !== 'RECEIVED') {
    return; // Só executar ações para pagamentos confirmados
  }

  try {
    // Buscar dados da cobrança local
    const { data: cobranca, error } = await supabase
      .from('asaas_cobrancas')
      .select('service_type, service_data, user_id')
      .eq('asaas_id', payment.id)
      .maybeSingle();

    if (error || !cobranca) {
      console.warn('Cobrança local não encontrada para:', payment.id);
      return;
    }

    const serviceType = cobranca.service_type;
    const serviceData = cobranca.service_data;
    const userId = cobranca.user_id;

    console.log(`Executando ações pós-pagamento para ${serviceType}`);

    // Ações específicas por tipo de serviço
    switch (serviceType) {
      case 'filiacao':
        // Ativar assinatura do usuário
        await supabase
          .from('user_subscriptions')
          .update({
            status: 'active',
            activated_at: new Date().toISOString()
          })
          .eq('user_id', userId)
          .eq('status', 'pending');
        break;

      case 'certidao':
      case 'regularizacao':
      case 'servico':
        // Processar solicitação de serviço genérico após pagamento confirmado
        console.log(`Processando solicitação de ${serviceType}...`)
        try {
          // Gerar protocolo único
          const timestamp = Date.now();
          const random = Math.random().toString(36).substring(2, 11).toUpperCase();
          const protocolo = `SRV-${timestamp}-${random}`;

          // DEBUG - Logs detalhados para diagnóstico
          console.log('🔍 DEBUG - serviceData completo:', JSON.stringify(serviceData, null, 2));
          console.log('🔍 DEBUG - servico_id extraído:', serviceData?.servico_id || serviceData?.details?.servico_id);
          console.log('🔍 DEBUG - userId:', userId);
          console.log('🔍 DEBUG - protocolo gerado:', protocolo);

          // Criar solicitação
          const { data: solicitacao, error: solicitacaoError } = await supabase
            .from('solicitacoes_servicos')
            .insert({
              user_id: userId,
              servico_id: serviceData?.servico_id || serviceData?.details?.servico_id,
              protocolo: protocolo,
              status: 'pago',
              dados_enviados: serviceData?.dados_formulario || serviceData?.details?.dados_formulario || {},
              payment_reference: payment.id,
              valor_pago: payment.value,
              forma_pagamento: payment.billingType === 'PIX' ? 'pix' : 'cartao',
              data_pagamento: payment.paymentDate || new Date().toISOString(),
            })
            .select()
            .single();

          if (solicitacaoError) {
            console.error('Erro ao criar solicitação:', solicitacaoError);
          } else {
            console.log('✅ Solicitação criada:', solicitacao.id, 'Protocolo:', protocolo);

            // Criar notificação para usuário
            await supabase
              .from('notifications')
              .insert({
                user_id: userId,
                title: 'Pagamento Confirmado',
                message: `Seu pagamento foi confirmado! Protocolo: ${protocolo}. Sua solicitação está sendo processada.`,
                type: 'payment_confirmed',
                link: `/dashboard/solicitacao-servicos?protocolo=${protocolo}`,
                read: false,
              });

            // Criar notificações para admins
            const { data: admins } = await supabase
              .from('profiles')
              .select('id')
              .in('tipo_membro', ['admin', 'super_admin']);

            if (admins && admins.length > 0) {
              const adminNotifications = admins.map(admin => ({
                user_id: admin.id,
                title: 'Nova Solicitação de Serviço',
                message: `Nova solicitação recebida. Protocolo: ${protocolo}`,
                type: 'new_service_request',
                link: `/admin/solicitacoes?protocolo=${protocolo}`,
                read: false,
              }));

              await supabase
                .from('notifications')
                .insert(adminNotifications);
            }
          }
        } catch (error) {
          console.error(`Erro ao processar ${serviceType}:`, error)
        }
        break;

      case 'regularizacao':
        // Processar solicitação de regularização após pagamento confirmado
        console.log('Processando solicitação de regularização...')
        try {
          const processResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/asaas-process-regularizacao`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`
            },
            body: JSON.stringify({
              paymentId: payment.id,
              status: event === 'PAYMENT_RECEIVED' ? 'RECEIVED' : 'CONFIRMED',
              serviceData: serviceData,
              userId: userId,
              valor: payment.value
            })
          })

          const processResult = await processResponse.json()
          console.log('Resultado do processamento de regularização:', processResult)
        } catch (error) {
          console.error('Erro ao processar regularização:', error)
        }
        break;

      case 'servico':
        // Processar solicitação de serviço genérico após pagamento confirmado
        console.log('Processando solicitação de serviço...')
        try {
          // Gerar protocolo único
          const timestamp = Date.now();
          const random = Math.random().toString(36).substring(2, 11).toUpperCase();
          const protocolo = `SRV-${timestamp}-${random}`;

          // Criar solicitação
          const { data: solicitacao, error: solicitacaoError } = await supabase
            .from('solicitacoes_servicos')
            .insert({
              user_id: userId,
              servico_id: serviceData?.servico_id,
              protocolo: protocolo,
              status: 'pago',
              dados_enviados: serviceData?.dados_formulario || {},
              payment_reference: payment.id,
              valor_pago: payment.value,
              forma_pagamento: payment.billingType === 'PIX' ? 'pix' : 'cartao',
              data_pagamento: payment.paymentDate || new Date().toISOString(),
            })
            .select()
            .single();

          if (solicitacaoError) {
            console.error('Erro ao criar solicitação:', solicitacaoError);
          } else {
            console.log('✅ Solicitação criada:', solicitacao.id, 'Protocolo:', protocolo);

            // Criar notificação para usuário
            await supabase
              .from('notifications')
              .insert({
                user_id: userId,
                title: 'Pagamento Confirmado',
                message: `Seu pagamento foi confirmado! Protocolo: ${protocolo}. Sua solicitação está sendo processada.`,
                type: 'payment_confirmed',
                link: `/dashboard/solicitacao-servicos?protocolo=${protocolo}`,
                read: false,
              });

            // Criar notificações para admins
            const { data: admins } = await supabase
              .from('profiles')
              .select('id')
              .in('tipo_membro', ['admin', 'super_admin']);

            if (admins && admins.length > 0) {
              const adminNotifications = admins.map(admin => ({
                user_id: admin.id,
                title: 'Nova Solicitação de Serviço',
                message: `Nova solicitação recebida. Protocolo: ${protocolo}`,
                type: 'new_service_request',
                link: `/admin/solicitacoes?protocolo=${protocolo}`,
                read: false,
              }));

              await supabase
                .from('notifications')
                .insert(adminNotifications);
            }
          }
        } catch (error) {
          console.error('Erro ao processar serviço:', error)
        }
        break;

      case 'evento':
        // Confirmar inscrição no evento
        if (serviceData?.evento_id) {
          await supabase
            .from('inscricoes_eventos')
            .update({
              status: 'confirmado',
              confirmed_at: new Date().toISOString()
            })
            .eq('user_id', userId)
            .eq('evento_id', serviceData.evento_id);
        }
        break;

      case 'taxa_anual':
        // Atualizar status de adimplência
        await supabase
          .from('profiles')
          .update({
            is_adimplent: true,
            last_payment_date: new Date().toISOString()
          })
          .eq('id', userId);
        break;
    }

    console.log(`Ações pós-pagamento executadas para ${serviceType}`);
  } catch (error) {
    console.error('Erro ao executar ações pós-pagamento:', error);
    // Não falhar o webhook por erro de ação pós-pagamento
  }
}

/**
 * Processa evento específico do webhook
 */
async function processWebhookEvent(
  event: WebhookEvent,
  payment: AsaasPayment
): Promise<void> {
  console.log(`Processando evento: ${event} para pagamento: ${payment.id}`);

  // Processar eventos de pagamento
  if (event.startsWith('PAYMENT_')) {
    // Sempre atualizar dados locais para eventos de pagamento
    await updateLocalPayment(payment);

    // Ações específicas por evento de pagamento
    switch (event) {
      case 'PAYMENT_CONFIRMED':
      case 'PAYMENT_RECEIVED':
        // Pagamento confirmado - executar todas as ações
        await processSplits(payment);
        await executePostPaymentActions(payment);
        break;

      case 'PAYMENT_OVERDUE':
        // Pagamento vencido - notificar usuário (implementar se necessário)
        console.log(`Pagamento vencido: ${payment.id}`);
        break;

      case 'PAYMENT_REFUNDED':
        // Pagamento estornado - reverter ações se necessário
        console.log(`Pagamento estornado: ${payment.id}`);
        break;

      case 'PAYMENT_CHARGEBACK_REQUESTED':
        // Chargeback solicitado - alertar administração
        console.log(`Chargeback solicitado: ${payment.id}`);
        break;

      default:
        console.log(`Evento de pagamento ${event} processado - apenas atualização de status`);
    }
  }

  // Processar eventos de assinatura
  else if (event.startsWith('SUBSCRIPTION_')) {
    await processSubscriptionEvent(event, payment);
  }

  else {
    console.log(`Evento ${event} processado - sem ação específica`);
  }
}

/**
 * Processa eventos específicos de assinatura
 * Suporta payloads com 'payment' ou apenas 'subscription'
 */
async function processSubscriptionEvent(
  event: WebhookEvent,
  entity: any
): Promise<void> {
  // Extrair ID da assinatura de forma robusta
  // Pode vir como entity.subscription (se for um payment) ou entity.id (se for a assinatura direta)
  const subscriptionId = entity.subscription || entity.id;

  console.log(`[SUBSCRIPTION] Processando evento: ${event} para assinatura: ${subscriptionId}`);

  if (!subscriptionId || typeof subscriptionId !== 'string') {
    console.warn(`[SUBSCRIPTION] Evento ${event} ignorado: ID de assinatura inválido ou ausente`);
    return;
  }

  try {
    // Buscar usuário relacionado à assinatura via cobrança local
    // O ID pode ser o ID do pagamento (se entity for payment) ou o ID da assinatura
    const filterId = entity.id;

    console.log(`[SUBSCRIPTION] Buscando cobrança local com ID: ${filterId} ou SubscriptionID: ${subscriptionId}`);

    const { data: cobranca, error } = await supabase
      .from('asaas_cobrancas')
      .select('user_id, service_type')
      .or(`asaas_payment_id.eq.${filterId},asaas_id.eq.${filterId},asaas_id.eq.${subscriptionId}`)
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error(`[SUBSCRIPTION] Erro ao buscar cobrança local para ${subscriptionId}:`, error);
      return;
    }

    if (!cobranca) {
      console.warn(`[SUBSCRIPTION] Cobrança/Assinatura não encontrada localmente para: ${subscriptionId}. Ignorando processamento de regra de negócio.`);
      return;
    }

    const userId = cobranca.user_id;
    console.log(`[SUBSCRIPTION] Entidade encontrada. Usuário: ${userId}.`);

    // Ações específicas por evento de assinatura
    switch (event) {
      case 'SUBSCRIPTION_CREATED':
        console.log(`[SUBSCRIPTION] Assinatura criada: ${subscriptionId} para usuário: ${userId}`);
        break;

      case 'SUBSCRIPTION_SUSPENDED':
        console.log(`[SUBSCRIPTION] Suspendendo acesso para assinatura: ${subscriptionId}`);
        await supabase
          .from('user_subscriptions')
          .update({
            status: 'suspended',
            suspended_at: new Date().toISOString()
          })
          .eq('user_id', userId)
          .eq('asaas_subscription_id', subscriptionId);
        break;

      case 'SUBSCRIPTION_REACTIVATED':
        console.log(`[SUBSCRIPTION] Reativando acesso para assinatura: ${subscriptionId}`);
        await supabase
          .from('user_subscriptions')
          .update({
            status: 'active',
            reactivated_at: new Date().toISOString()
          })
          .eq('user_id', userId)
          .eq('asaas_subscription_id', subscriptionId);
        break;

      case 'SUBSCRIPTION_DELETED':
        console.log(`[SUBSCRIPTION] Cancelando assinatura e removendo acesso: ${subscriptionId}`);
        await supabase
          .from('user_subscriptions')
          .update({
            status: 'cancelled',
            cancelled_at: new Date().toISOString()
          })
          .eq('user_id', userId)
          .eq('asaas_subscription_id', subscriptionId);
        break;

      case 'SUBSCRIPTION_UPDATED':
        console.log(`[SUBSCRIPTION] Assinatura atualizada: ${subscriptionId}`);
        break;

      default:
        console.log(`[SUBSCRIPTION] Evento ${event} processado com sucesso (sem ação adicional)`);
    }

  } catch (error) {
    console.error(`[SUBSCRIPTION] Falha ao processar regras de negócio para ${subscriptionId}:`, error);
  }
}

/**
 * Marca webhook como processado
 */
async function markWebhookProcessed(webhookId: string): Promise<void> {
  await supabase
    .from('asaas_webhooks')
    .update({ processed: true })
    .eq('id', webhookId);
}

/**
 * Handler principal da Edge Function
 */
serve(async (req) => {
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, asaas-access-token, x-asaas-token',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  let webhookId: string | null = null;

  try {
    // Verificar método
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Método não permitido' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validar token do webhook
    if (!validateWebhookToken(req.headers)) {
      console.error('Token de webhook inválido');
      return new Response(
        JSON.stringify({ error: 'Token inválido' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse do payload e validação inicial
    let payload: any;
    try {
      payload = await req.json();
    } catch (parseError) {
      console.error('Erro ao ler JSON do payload:', parseError);
      return new Response(
        JSON.stringify({ error: 'JSON inválido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validar estrutura do payload
    if (!validateWebhookPayload(payload)) {
      console.error('Payload de webhook inválido:', JSON.stringify(payload, null, 2));
      return new Response(
        JSON.stringify({ error: 'Payload inválido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { event, payment, subscription } = payload as WebhookPayload;
    const entityId = payment?.id || subscription?.id || 'unknown';

    console.log(`[RECEIVE] Webhook recebido: ${event} para entidade ${entityId}`);

    // Registrar webhook para auditoria (Marcar como iniciada a recepção)
    // logWebhook é resiliente e não lança exceções
    webhookId = await logWebhook(event, entityId, payload, false);

    // Resposta de sucesso IMEDIATA para o Asaas (Acknowledge)
    // Isso evita que o Asaas reenvie o webhook ou pause a fila por demora
    const response = new Response(
      JSON.stringify({
        success: true,
        message: 'Webhook recebido e em processamento',
        event,
        entity_id: entityId,
        webhook_log_id: webhookId
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

    // Processar evento em "background" (sem travar a resposta)
    // No Supabase Edge Functions, o processo continua até a Promise resolver
    (async () => {
      try {
        console.log(`Iniciando processamento assíncrono para ${event} (${entityId})`);

        if (event.startsWith('PAYMENT_') && payment) {
          await processWebhookEvent(event, payment);
        } else if (event.startsWith('SUBSCRIPTION_')) {
          // Normalizar entidade para processamento de assinatura
          // Pode vir tanto no campo subscription quanto no payment (do subscription event)
          const entity = subscription || payment;
          if (entity) {
            await processSubscriptionEvent(event, entity);
          } else {
            console.warn(`[PROCESS] Evento de assinatura ${event} ignorado: Nenhuma entidade encontrada no payload`);
          }
        }

        // Marcar como processado
        if (webhookId) {
          await markWebhookProcessed(webhookId);
        }

        console.log(`Processamento assíncrono de ${event} concluído com sucesso`);
      } catch (processingError) {
        console.error(`Erro no processamento assíncrono de ${event}:`, processingError);

        // Registrar erro se webhook foi criado
        if (webhookId) {
          await supabase
            .from('asaas_webhooks')
            .update({
              processed: false,
              error_message: processingError instanceof Error ? processingError.message : 'Erro no processamento assíncrono'
            })
            .eq('id', webhookId);
        }
      }
    })();

    return response;

  } catch (error) {
    console.error('Erro ao processar webhook:', error);

    // Registrar erro se webhook foi criado
    if (webhookId) {
      try {
        await supabase
          .from('asaas_webhooks')
          .update({
            processed: false,
            error_message: error instanceof Error ? error.message : 'Erro desconhecido'
          })
          .eq('id', webhookId);
      } catch (logError) {
        console.error('Erro ao registrar erro do webhook:', logError);
      }
    }

    // Retornar erro 500 com detalhes para depuração (Somente durante esta fase)
    return new Response(
      JSON.stringify({
        error: 'Erro interno do servidor',
        message: error instanceof Error ? error.message : 'Erro desconhecido',
        stack: error instanceof Error ? error.stack : null
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});