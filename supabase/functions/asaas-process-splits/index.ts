import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Função auxiliar de validação
function validateRequest(body: any, requiredFields: string[]) {
  const errors: string[] = []
  for (const field of requiredFields) {
    if (!body[field]) {
      errors.push(`Campo obrigatório ausente: ${field}`)
    }
  }
  return {
    isValid: errors.length === 0,
    errors
  }
}

// Cliente Asaas inline
function createAsaasClient() {
  const apiKey = Deno.env.get('ASAAS_API_KEY') || ''
  const baseUrl = Deno.env.get('ASAAS_BASE_URL') || 'https://api-sandbox.asaas.com/v3'

  if (!apiKey) {
    throw new Error('ASAAS_API_KEY não configurada')
  }

  return {
    async request(endpoint: string, options: RequestInit = {}) {
      const url = `${baseUrl}${endpoint}`
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'access_token': apiKey,
          ...options.headers
        }
      })

      const data = await response.json()

      return {
        success: response.ok,
        data: response.ok ? data : null,
        error: !response.ok ? (data.errors?.[0]?.description || `HTTP ${response.status}`) : null
      }
    }
  }
}

interface ProcessSplitsRequest {
  cobrancaId: string
  paymentValue: number
  serviceType: 'filiacao' | 'servicos' | 'publicidade' | 'eventos' | 'outros'
  affiliateId?: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const asaasClient = new AsaasClient()
    const body = await req.json()

    const validation = validateRequest(body, ['cobrancaId', 'paymentValue', 'serviceType'])
    if (!validation.isValid) {
      return new Response(
        JSON.stringify({ error: validation.errors }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { cobrancaId, paymentValue, serviceType, affiliateId } = body as ProcessSplitsRequest

    console.log(`Processing triple splits for cobranca ${cobrancaId}, value: ${paymentValue}, type: ${serviceType}`)

    // Buscar TODOS os splits pendentes desta cobrança
    const { data: splitConfigs, error: splitError } = await supabase
      .from('asaas_splits')
      .select('*')
      .eq('cobranca_id', cobrancaId)
      .eq('status', 'PENDING')

    if (splitError) {
      console.error('Error fetching split configs:', splitError)
      throw new Error('Erro ao buscar configurações de split')
    }

    // Se não há configuração de split, não há nada a processar
    if (!splitConfigs || splitConfigs.length === 0) {
      console.log('No split configurations found for this payment')
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No split configurations found',
          processed: false
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Found ${splitConfigs.length} splits to process`)

    // Processar cada split individualmente
    const processedSplits = []
    const failedSplits = []

    for (const splitConfig of splitConfigs) {
      try {
        console.log(`Processing split ${splitConfig.id} for ${splitConfig.recipient_name}`)

        // COMADEMIG recebe direto - apenas marcar como processado
        if (splitConfig.recipient_type === 'comademig') {
          console.log('COMADEMIG split - marking as processed (receives directly)')

          await supabase
            .from('asaas_splits')
            .update({
              status: 'PROCESSED',
              processed_at: new Date().toISOString(),
            })
            .eq('id', splitConfig.id)

          processedSplits.push({
            splitId: splitConfig.id,
            recipientType: 'comademig',
            recipientName: 'COMADEMIG',
            amount: splitConfig.commission_amount,
            status: 'PROCESSED',
            note: 'Recebe diretamente (não precisa transferência)'
          })
          continue
        }

        // RENUM e Afiliado: processar transferência via Asaas
        const amount = splitConfig.commission_amount
        const minimumTransfer = 10.00 // Valor mínimo de transferência

        if (amount < minimumTransfer) {
          console.log(`Amount ${amount} below minimum ${minimumTransfer} for ${splitConfig.recipient_name}`)

          await supabase
            .from('asaas_splits')
            .update({
              status: 'CANCELLED',
              processed_at: new Date().toISOString(),
              error_message: `Valor de R$ ${amount.toFixed(2)} abaixo do mínimo de R$ ${minimumTransfer.toFixed(2)}`
            })
            .eq('id', splitConfig.id)

          failedSplits.push({
            splitId: splitConfig.id,
            recipientName: splitConfig.recipient_name,
            error: 'Valor abaixo do mínimo',
            amount
          })
          continue
        }

        // Verificar se tem asaas_split_id (foi criado no Asaas)
        if (!splitConfig.asaas_split_id) {
          console.error(`Split ${splitConfig.id} não tem asaas_split_id`)

          await supabase
            .from('asaas_splits')
            .update({
              status: 'ERROR',
              processed_at: new Date().toISOString(),
              error_message: 'Split não foi criado no Asaas'
            })
            .eq('id', splitConfig.id)

          failedSplits.push({
            splitId: splitConfig.id,
            recipientName: splitConfig.recipient_name,
            error: 'Split não criado no Asaas'
          })
          continue
        }

        // Ativar split no Asaas (muda de PENDING para ACTIVE)
        console.log(`Activating split ${splitConfig.asaas_split_id} in Asaas`)

        const activateResponse = await asaasClient.request(`/splits/${splitConfig.asaas_split_id}/activate`, {
          method: 'POST'
        })

        if (!activateResponse.success) {
          console.error(`Error activating split: ${activateResponse.error}`)

          await supabase
            .from('asaas_splits')
            .update({
              status: 'ERROR',
              processed_at: new Date().toISOString(),
              error_message: `Erro ao ativar split: ${activateResponse.error}`,
              retry_count: (splitConfig.retry_count || 0) + 1
            })
            .eq('id', splitConfig.id)

          failedSplits.push({
            splitId: splitConfig.id,
            recipientName: splitConfig.recipient_name,
            error: activateResponse.error,
            amount
          })
          continue
        }

        // Atualizar split como processado
        await supabase
          .from('asaas_splits')
          .update({
            status: 'PROCESSED',
            processed_at: new Date().toISOString(),
          })
          .eq('id', splitConfig.id)

        // Se for afiliado, registrar comissão
        if (splitConfig.recipient_type === 'affiliate' && splitConfig.affiliate_id) {
          try {
            await supabase
              .from('affiliate_commissions')
              .insert({
                affiliate_id: splitConfig.affiliate_id,
                payment_id: cobrancaId,
                amount: amount,
                status: 'pending',
              })

            console.log(`Commission registered for affiliate ${splitConfig.affiliate_id}`)
          } catch (error) {
            console.error('Error registering commission:', error)
            // Não falha o processo principal
          }
        }

        processedSplits.push({
          splitId: splitConfig.id,
          recipientType: splitConfig.recipient_type,
          recipientName: splitConfig.recipient_name,
          amount: amount,
          status: 'PROCESSED',
          asaasSplitId: splitConfig.asaas_split_id
        })

        console.log(`Split processed successfully: R$ ${amount.toFixed(2)} for ${splitConfig.recipient_name}`)

      } catch (error) {
        console.error(`Error processing split ${splitConfig.id}:`, error)

        await supabase
          .from('asaas_splits')
          .update({
            status: 'ERROR',
            processed_at: new Date().toISOString(),
            error_message: error.message,
            retry_count: (splitConfig.retry_count || 0) + 1
          })
          .eq('id', splitConfig.id)

        failedSplits.push({
          splitId: splitConfig.id,
          recipientName: splitConfig.recipient_name,
          error: error.message
        })
      }
    }

    const totalProcessed = processedSplits.reduce((sum, s) => sum + (s.amount || 0), 0)

    console.log(`Processing complete: ${processedSplits.length} successful, ${failedSplits.length} failed`)

    return new Response(
      JSON.stringify({
        success: true,
        message: `${processedSplits.length} splits processados com sucesso`,
        processed: processedSplits.length > 0,
        data: {
          cobrancaId,
          totalValue: paymentValue,
          totalProcessed,
          processedSplits,
          failedSplits,
          summary: {
            total: splitConfigs.length,
            processed: processedSplits.length,
            failed: failedSplits.length
          }
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error processing splits:', error)
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        details: error.message
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})