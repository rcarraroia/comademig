import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { logWebhookReceived, logWebhookProcessed, logError } from '../shared/logger.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, asaas-access-token',
}

const ASAAS_WEBHOOK_TOKEN = Deno.env.get('ASAAS_WEBHOOK_TOKEN')

interface AsaasWebhookPayload {
  event: string
  payment?: any
  subscription?: any
  split?: any
}

/**
 * Edge Function para receber e processar webhooks do Asaas
 * 
 * Implementa:
 * - Validação de autenticidade (asaas-access-token)
 * - Verificação de idempotência (asaas_event_id)
 * - Salvamento em webhook_events
 * - Processamento assíncrono de eventos
 */
serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // Health check
  if (req.method === 'GET') {
    return new Response(
      JSON.stringify({ 
        status: 'ok', 
        message: 'Webhook endpoint is active',
        timestamp: new Date().toISOString()
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }

  try {
    // 1. Validar método
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { 
          status: 405, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // 2. Validar autenticidade (asaas-access-token)
    const accessToken = req.headers.get('asaas-access-token')
    
    if (ASAAS_WEBHOOK_TOKEN && accessToken !== ASAAS_WEBHOOK_TOKEN) {
      console.error('❌ Token de webhook inválido')
      
      await logError({
        source: 'webhook',
        functionName: 'asaas-webhook',
        message: 'Tentativa de acesso com token inválido',
        details: {
          received_token: accessToken ? '[REDACTED]' : 'null',
          ip: req.headers.get('x-forwarded-for') || 'unknown'
        }
      })
      
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // 3. Parse do payload
    const payload: AsaasWebhookPayload = await req.json()
    
    if (!payload.event) {
      return new Response(
        JSON.stringify({ error: 'Invalid webhook payload: missing event' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // 4. Gerar ID único do evento (para idempotência)
    const eventId = generateEventId(payload)
    
    console.log('📨 Webhook recebido:', {
      event: payload.event,
      eventId,
      paymentId: payload.payment?.id,
      subscriptionId: payload.subscription?.id
    })

    // Log estruturado
    await logWebhookReceived({
      eventType: payload.event,
      eventId,
      paymentId: payload.payment?.id,
      subscriptionId: payload.subscription?.id
    })

    // 5. Conectar ao Supabase
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 6. Verificar idempotência (se evento já foi processado)
    const { data: existingEvent } = await supabaseClient
      .from('webhook_events')
      .select('id, processed')
      .eq('asaas_event_id', eventId)
      .single()

    if (existingEvent) {
      console.log('⚠️ Evento já foi recebido anteriormente:', eventId)
      
      if (existingEvent.processed) {
        console.log('✅ Evento já foi processado, retornando sucesso')
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'Event already processed',
            eventId 
          }),
          { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      } else {
        console.log('🔄 Evento existe mas não foi processado, reprocessando...')
      }
    }

    // 7. Salvar evento em webhook_events (se não existir)
    if (!existingEvent) {
      const { error: insertError } = await supabaseClient
        .from('webhook_events')
        .insert({
          asaas_event_id: eventId,
          event_type: payload.event,
          payload: payload,
          processed: false,
          retry_count: 0
        })

      if (insertError) {
        console.error('❌ Erro ao salvar webhook_event:', insertError)
        // Continuar mesmo com erro - não bloquear processamento
      } else {
        console.log('✅ Evento salvo em webhook_events')
      }
    }

    // 8. Processar evento
    let processResult = { success: false, message: 'Not processed' }
    
    try {
      processResult = await processWebhookEvent(supabaseClient, payload, eventId)
      
      // 9. Marcar como processado
      await supabaseClient
        .from('webhook_events')
        .update({
          processed: true,
          processed_at: new Date().toISOString()
        })
        .eq('asaas_event_id', eventId)

      // Log de sucesso
      await logWebhookProcessed({
        eventType: payload.event,
        eventId,
        success: true,
        action: processResult.message
      })

      console.log('✅ Webhook processado com sucesso')

    } catch (processError) {
      console.error('❌ Erro ao processar webhook:', processError)
      
      // Incrementar retry_count
      await supabaseClient
        .from('webhook_events')
        .update({
          retry_count: (existingEvent?.retry_count || 0) + 1,
          last_error: processError.message
        })
        .eq('asaas_event_id', eventId)

      // Log de erro
      await logWebhookProcessed({
        eventType: payload.event,
        eventId,
        success: false,
        error: processError as Error
      })

      // ⚠️ IMPORTANTE: Retornar 200 mesmo com erro para não pausar webhook
      // O erro foi registrado e pode ser reprocessado depois
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Webhook received but processing failed',
          eventId,
          error: processError.message
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // 10. Retornar sucesso
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Webhook processed successfully',
        eventId,
        result: processResult
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('❌ Erro crítico no webhook:', error)
    
    await logError({
      source: 'webhook',
      functionName: 'asaas-webhook',
      message: 'Erro crítico ao processar webhook',
      error: error as Error
    })
    
    // ⚠️ IMPORTANTE: Retornar 200 para não pausar webhook
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Webhook received but critical error occurred',
        error: error.message 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

/**
 * Gera ID único para o evento (para idempotência)
 */
function generateEventId(payload: AsaasWebhookPayload): string {
  const parts = [
    payload.event,
    payload.payment?.id || '',
    payload.subscription?.id || '',
    payload.split?.id || ''
  ].filter(Boolean)
  
  return parts.join('-')
}

/**
 * Processa o evento do webhook
 */
async function processWebhookEvent(
  supabaseClient: any, 
  payload: AsaasWebhookPayload,
  eventId: string
): Promise<{ success: boolean; message: string }> {
  
  console.log(`🔄 Processando evento: ${payload.event}`)
  
  switch (payload.event) {
    case 'PAYMENT_RECEIVED':
    case 'PAYMENT_CONFIRMED':
      return await handlePaymentReceived(supabaseClient, payload)
    
    case 'PAYMENT_OVERDUE':
      return await handlePaymentOverdue(supabaseClient, payload)
    
    case 'PAYMENT_DELETED':
    case 'PAYMENT_REFUNDED':
      return await handlePaymentCancelled(supabaseClient, payload)
    
    case 'SUBSCRIPTION_UPDATED':
      return await handleSubscriptionUpdated(supabaseClient, payload)
    
    case 'TRANSFER_DONE':
    case 'TRANSFER_FAILED':
    case 'TRANSFER_CANCELLED':
      return await handleTransferEvent(supabaseClient, payload)
    
    default:
      console.log(`⚠️ Evento não tratado: ${payload.event}`)
      return { 
        success: true, 
        message: `Event ${payload.event} received but not processed` 
      }
  }
}

/**
 * Processa PAYMENT_RECEIVED e PAYMENT_CONFIRMED
 */
async function handlePaymentReceived(
  supabaseClient: any, 
  payload: AsaasWebhookPayload
): Promise<{ success: boolean; message: string }> {
  
  const payment = payload.payment
  
  if (!payment) {
    throw new Error('Payment data missing in webhook payload')
  }

  console.log('💰 Processando pagamento confirmado:', payment.id)

  // Buscar assinatura pelo asaas_subscription_id OU initial_payment_id
  let subscription = null
  
  if (payment.subscription) {
    // É uma renovação
    const { data } = await supabaseClient
      .from('user_subscriptions')
      .select('*')
      .eq('asaas_subscription_id', payment.subscription)
      .single()
    
    subscription = data
  } else {
    // É pagamento inicial
    const { data } = await supabaseClient
      .from('user_subscriptions')
      .select('*')
      .eq('initial_payment_id', payment.id)
      .single()
    
    subscription = data
  }

  if (!subscription) {
    console.log('⚠️ Assinatura não encontrada para pagamento:', payment.id)
    return { 
      success: true, 
      message: 'Payment received but no subscription found' 
    }
  }

  // Atualizar status para 'active'
  const updateData: any = {
    status: 'active',
    updated_at: new Date().toISOString()
  }

  // Se é o primeiro pagamento, definir started_at
  if (!subscription.started_at) {
    updateData.started_at = payment.paymentDate || payment.confirmedDate || new Date().toISOString()
  }

  const { error } = await supabaseClient
    .from('user_subscriptions')
    .update(updateData)
    .eq('id', subscription.id)

  if (error) {
    throw new Error(`Failed to update subscription: ${error.message}`)
  }

  console.log('✅ Assinatura atualizada para active:', subscription.id)

  return { 
    success: true, 
    message: 'Subscription activated' 
  }
}

/**
 * Processa PAYMENT_OVERDUE
 */
async function handlePaymentOverdue(
  supabaseClient: any, 
  payload: AsaasWebhookPayload
): Promise<{ success: boolean; message: string }> {
  
  const payment = payload.payment
  
  if (!payment || !payment.subscription) {
    return { success: true, message: 'No subscription to update' }
  }

  const { error } = await supabaseClient
    .from('user_subscriptions')
    .update({
      status: 'overdue',
      updated_at: new Date().toISOString()
    })
    .eq('asaas_subscription_id', payment.subscription)

  if (error) {
    throw new Error(`Failed to mark subscription as overdue: ${error.message}`)
  }

  console.log('⚠️ Assinatura marcada como vencida')

  return { success: true, message: 'Subscription marked as overdue' }
}

/**
 * Processa PAYMENT_DELETED e PAYMENT_REFUNDED
 */
async function handlePaymentCancelled(
  supabaseClient: any, 
  payload: AsaasWebhookPayload
): Promise<{ success: boolean; message: string }> {
  
  const payment = payload.payment
  
  if (!payment || !payment.subscription) {
    return { success: true, message: 'No subscription to cancel' }
  }

  const { error } = await supabaseClient
    .from('user_subscriptions')
    .update({
      status: 'cancelled',
      updated_at: new Date().toISOString()
    })
    .eq('asaas_subscription_id', payment.subscription)

  if (error) {
    throw new Error(`Failed to cancel subscription: ${error.message}`)
  }

  console.log('❌ Assinatura cancelada')

  return { success: true, message: 'Subscription cancelled' }
}

/**
 * Processa SUBSCRIPTION_UPDATED
 */
async function handleSubscriptionUpdated(
  supabaseClient: any, 
  payload: AsaasWebhookPayload
): Promise<{ success: boolean; message: string }> {
  
  const subscription = payload.subscription
  
  if (!subscription) {
    throw new Error('Subscription data missing in webhook payload')
  }

  // Sincronizar dados da assinatura
  const { error } = await supabaseClient
    .from('user_subscriptions')
    .update({
      status: subscription.status,
      value: subscription.value,
      cycle: subscription.cycle,
      updated_at: new Date().toISOString()
    })
    .eq('asaas_subscription_id', subscription.id)

  if (error) {
    throw new Error(`Failed to sync subscription: ${error.message}`)
  }

  console.log('🔄 Assinatura sincronizada')

  return { success: true, message: 'Subscription synced' }
}

/**
 * Processa eventos de transferência (splits)
 */
async function handleTransferEvent(
  supabaseClient: any, 
  payload: AsaasWebhookPayload
): Promise<{ success: boolean; message: string }> {
  
  const transfer = payload.split || payload.transfer
  
  if (!transfer) {
    throw new Error('Transfer data missing in webhook payload')
  }

  // Mapear status do evento para status do banco
  let newStatus = 'pending'
  
  switch (payload.event) {
    case 'TRANSFER_DONE':
      newStatus = 'done'
      break
    case 'TRANSFER_FAILED':
      newStatus = 'failed'
      break
    case 'TRANSFER_CANCELLED':
      newStatus = 'cancelled'
      break
  }

  // Atualizar status da transferência
  const { error } = await supabaseClient
    .from('asaas_splits')
    .update({
      status: newStatus,
      processed_at: new Date().toISOString()
    })
    .eq('asaas_split_id', transfer.id)

  if (error) {
    throw new Error(`Failed to update transfer status: ${error.message}`)
  }

  console.log(`✅ Transferência atualizada para ${newStatus}`)

  return { success: true, message: `Transfer ${newStatus}` }
}
