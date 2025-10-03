import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { AsaasClient } from '../shared/asaas-client.ts'
import { validateRequest } from '../shared/validation.ts'

interface ProcessSplitsRequest {
  cobrancaId: string
  paymentValue: number
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
    
    const validation = validateRequest(body, ['cobrancaId', 'paymentValue'])
    if (!validation.isValid) {
      return new Response(
        JSON.stringify({ error: validation.errors }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { cobrancaId, paymentValue, affiliateId } = body as ProcessSplitsRequest

    console.log(`Processing splits for cobranca ${cobrancaId}, value: ${paymentValue}`)

    // Buscar configuração de split ativa
    const { data: splitConfig, error: splitError } = await supabase
      .from('asaas_splits')
      .select('*')
      .eq('cobranca_id', cobrancaId)
      .eq('status', 'active')
      .single()

    if (splitError && splitError.code !== 'PGRST116') {
      console.error('Error fetching split config:', splitError)
      throw new Error('Erro ao buscar configuração de split')
    }

    // Se não há configuração de split, não há nada a processar
    if (!splitConfig) {
      console.log('No split configuration found for this payment')
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No split configuration found',
          processed: false 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Calcular valor da comissão
    const commissionValue = (paymentValue * splitConfig.percentage) / 100
    const minimumCommission = 5.00 // Valor mínimo de comissão

    if (commissionValue < minimumCommission) {
      console.log(`Commission value ${commissionValue} below minimum ${minimumCommission}`)
      
      // Atualizar status do split
      await supabase
        .from('asaas_splits')
        .update({ 
          status: 'cancelled',
          processed_at: new Date().toISOString(),
          notes: `Comissão de R$ ${commissionValue.toFixed(2)} abaixo do mínimo de R$ ${minimumCommission.toFixed(2)}`
        })
        .eq('id', splitConfig.id)

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Commission below minimum value',
          processed: false,
          commissionValue,
          minimumCommission
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Buscar dados do afiliado
    const { data: affiliate, error: affiliateError } = await supabase
      .from('profiles')
      .select('id, full_name, email, asaas_customer_id')
      .eq('id', splitConfig.affiliate_id)
      .single()

    if (affiliateError) {
      console.error('Error fetching affiliate:', affiliateError)
      throw new Error('Erro ao buscar dados do afiliado')
    }

    // Verificar se afiliado tem customer_id no Asaas
    if (!affiliate.asaas_customer_id) {
      console.log('Affiliate does not have Asaas customer ID, creating...')
      
      // Criar customer para o afiliado
      const customerData = {
        name: affiliate.full_name,
        email: affiliate.email,
        externalReference: affiliate.id
      }

      const customerResponse = await asaasClient.createCustomer(customerData)
      
      if (!customerResponse.success) {
        throw new Error(`Erro ao criar customer para afiliado: ${customerResponse.error}`)
      }

      // Atualizar profile com customer_id
      await supabase
        .from('profiles')
        .update({ asaas_customer_id: customerResponse.data.id })
        .eq('id', affiliate.id)

      affiliate.asaas_customer_id = customerResponse.data.id
    }

    // Criar transferência no Asaas
    const transferData = {
      value: commissionValue,
      pixAddressKey: affiliate.email, // Usar email como chave PIX
      description: `Comissão de afiliado - Cobrança ${cobrancaId}`,
      scheduleDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0] // +1 dia
    }

    console.log('Creating transfer in Asaas:', transferData)

    const transferResponse = await asaasClient.request('/transfers', {
      method: 'POST',
      body: JSON.stringify(transferData)
    })

    if (!transferResponse.success) {
      console.error('Error creating transfer:', transferResponse.error)
      
      // Marcar split como erro
      await supabase
        .from('asaas_splits')
        .update({ 
          status: 'error',
          processed_at: new Date().toISOString(),
          notes: `Erro ao criar transferência: ${transferResponse.error}`
        })
        .eq('id', splitConfig.id)

      throw new Error(`Erro ao criar transferência: ${transferResponse.error}`)
    }

    // Atualizar split como processado
    const { error: updateError } = await supabase
      .from('asaas_splits')
      .update({ 
        status: 'processed',
        processed_at: new Date().toISOString(),
        transfer_id: transferResponse.data.id,
        commission_value: commissionValue,
        notes: `Transferência criada com sucesso - ID: ${transferResponse.data.id}`
      })
      .eq('id', splitConfig.id)

    if (updateError) {
      console.error('Error updating split status:', updateError)
    }

    // Registrar histórico de comissão
    const { error: historyError } = await supabase
      .from('affiliate_commissions')
      .insert({
        affiliate_id: splitConfig.affiliate_id,
        cobranca_id: cobrancaId,
        split_id: splitConfig.id,
        commission_value: commissionValue,
        payment_value: paymentValue,
        percentage: splitConfig.percentage,
        transfer_id: transferResponse.data.id,
        status: 'pending',
        created_at: new Date().toISOString()
      })

    if (historyError) {
      console.error('Error creating commission history:', historyError)
    }

    console.log(`Split processed successfully: R$ ${commissionValue.toFixed(2)} for affiliate ${affiliate.full_name}`)

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Split processed successfully',
        processed: true,
        data: {
          splitId: splitConfig.id,
          affiliateId: splitConfig.affiliate_id,
          affiliateName: affiliate.full_name,
          commissionValue,
          transferId: transferResponse.data.id,
          percentage: splitConfig.percentage
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