import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { logInfo, logError } from '../shared/logger.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const MAX_RETRIES = 5

/**
 * Edge Function para reprocessar webhooks falhados
 * 
 * Implementa:
 * - Busca webhooks não processados
 * - Backoff exponencial (1min, 5min, 15min, 1h, 6h)
 * - Limite de 5 tentativas
 * - Registro em webhook_errors após falhas
 */
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('🔄 Iniciando retry de webhooks falhados...')

    // Buscar webhooks não processados com retry_count < MAX_RETRIES
    const { data: failedWebhooks, error: fetchError } = await supabaseClient
      .from('webhook_events')
      .select('*')
      .eq('processed', false)
      .lt('retry_count', MAX_RETRIES)
      .order('created_at', { ascending: true })
      .limit(10) // Processar 10 por vez

    if (fetchError) {
      throw new Error(`Failed to fetch failed webhooks: ${fetchError.message}`)
    }

    if (!failedWebhooks || failedWebhooks.length === 0) {
      console.log('✅ Nenhum webhook falhado para reprocessar')
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No failed webhooks to retry',
          processed: 0
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log(`📋 Encontrados ${failedWebhooks.length} webhooks para reprocessar`)

    let successCount = 0
    let failCount = 0
    let maxRetriesCount = 0

    // Processar cada webhook
    for (const webhook of failedWebhooks) {
      try {
        // Verificar se deve fazer retry baseado em backoff exponencial
        const shouldRetry = await checkBackoff(webhook)
        
        if (!shouldRetry) {
          console.log(`⏳ Webhook ${webhook.id} ainda em backoff, pulando...`)
          continue
        }

        console.log(`🔄 Reprocessando webhook ${webhook.id} (tentativa ${webhook.retry_count + 1}/${MAX_RETRIES})`)

        // Chamar função de processamento
        const processResult = await reprocessWebhook(supabaseClient, webhook)

        if (processResult.success) {
          // Marcar como processado
          await supabaseClient
            .from('webhook_events')
            .update({
              processed: true,
              processed_at: new Date().toISOString(),
              last_error: null
            })
            .eq('id', webhook.id)

          successCount++
          console.log(`✅ Webhook ${webhook.id} reprocessado com sucesso`)

          await logInfo({
            source: 'webhook',
            functionName: 'retry-failed-webhooks',
            message: `Webhook reprocessado com sucesso após ${webhook.retry_count + 1} tentativas`,
            details: {
              webhook_id: webhook.id,
              event_type: webhook.event_type,
              retry_count: webhook.retry_count + 1
            }
          })

        } else {
          throw new Error(processResult.error || 'Unknown error')
        }

      } catch (error) {
        failCount++
        const newRetryCount = webhook.retry_count + 1

        console.error(`❌ Erro ao reprocessar webhook ${webhook.id}:`, error.message)

        // Atualizar retry_count e last_error
        await supabaseClient
          .from('webhook_events')
          .update({
            retry_count: newRetryCount,
            last_error: error.message
          })
          .eq('id', webhook.id)

        // Se atingiu o máximo de tentativas, registrar em webhook_errors
        if (newRetryCount >= MAX_RETRIES) {
          maxRetriesCount++
          
          await supabaseClient
            .from('webhook_errors')
            .insert({
              webhook_event_id: webhook.id,
              asaas_event_id: webhook.asaas_event_id,
              event_type: webhook.event_type,
              payload: webhook.payload,
              error_message: error.message,
              error_stack: error.stack,
              retry_count: newRetryCount,
              created_at: new Date().toISOString()
            })

          console.log(`🛑 Webhook ${webhook.id} atingiu máximo de tentativas, registrado em webhook_errors`)

          await logError({
            source: 'webhook',
            functionName: 'retry-failed-webhooks',
            message: `Webhook falhou após ${MAX_RETRIES} tentativas`,
            error: error as Error,
            details: {
              webhook_id: webhook.id,
              event_type: webhook.event_type,
              asaas_event_id: webhook.asaas_event_id
            }
          })
        }
      }
    }

    const result = {
      success: true,
      message: 'Retry process completed',
      stats: {
        total: failedWebhooks.length,
        success: successCount,
        failed: failCount,
        maxRetriesReached: maxRetriesCount
      }
    }

    console.log('📊 Resultado do retry:', result.stats)

    return new Response(
      JSON.stringify(result),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('❌ Erro crítico no retry:', error)
    
    await logError({
      source: 'webhook',
      functionName: 'retry-failed-webhooks',
      message: 'Erro crítico ao fazer retry de webhooks',
      error: error as Error
    })
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

/**
 * Verifica se deve fazer retry baseado em backoff exponencial
 * Intervalos: 1min, 5min, 15min, 1h, 6h
 */
async function checkBackoff(webhook: any): Promise<boolean> {
  const now = new Date()
  const lastAttempt = webhook.updated_at ? new Date(webhook.updated_at) : new Date(webhook.created_at)
  const minutesSinceLastAttempt = (now.getTime() - lastAttempt.getTime()) / 1000 / 60

  // Backoff exponencial
  const backoffMinutes = [1, 5, 15, 60, 360] // 1min, 5min, 15min, 1h, 6h
  const requiredWait = backoffMinutes[webhook.retry_count] || 360

  return minutesSinceLastAttempt >= requiredWait
}

/**
 * Reprocessa um webhook específico
 */
async function reprocessWebhook(
  supabaseClient: any, 
  webhook: any
): Promise<{ success: boolean; error?: string }> {
  
  try {
    const payload = webhook.payload
    
    // Importar lógica de processamento da função principal
    // (Aqui você chamaria as mesmas funções de handlePaymentReceived, etc)
    
    // Por simplicidade, vamos chamar a própria Edge Function asaas-webhook
    const response = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/asaas-webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'asaas-access-token': Deno.env.get('ASAAS_WEBHOOK_TOKEN') || '',
      },
      body: JSON.stringify(payload)
    })

    const result = await response.json()

    if (!response.ok || !result.success) {
      return { 
        success: false, 
        error: result.error || 'Failed to reprocess webhook' 
      }
    }

    return { success: true }

  } catch (error) {
    return { 
      success: false, 
      error: error.message 
    }
  }
}
