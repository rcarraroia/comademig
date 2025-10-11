import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const ASAAS_API_KEY = Deno.env.get('ASAAS_API_KEY')
const ASAAS_BASE_URL = Deno.env.get('ASAAS_BASE_URL') || 'https://api.asaas.com/v3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const {
      customer,
      billingType,
      value,
      nextDueDate,
      cycle,
      description,
      externalReference,
      creditCard,
      creditCardHolderInfo,
      discount
    } = await req.json()

    console.log('📝 Criando assinatura no Asaas:', {
      customer,
      value,
      cycle,
      billingType
    })

    // Validações
    if (!customer || !billingType || !value || !nextDueDate || !cycle) {
      throw new Error('Dados obrigatórios faltando')
    }

    if (!ASAAS_API_KEY) {
      throw new Error('ASAAS_API_KEY não configurada')
    }

    // Preparar payload para Asaas
    const payload: any = {
      customer,
      billingType,
      value,
      nextDueDate,
      cycle,
      description: description || 'Assinatura COMADEMIG',
    }

    if (externalReference) {
      payload.externalReference = externalReference
    }

    if (discount) {
      payload.discount = discount
    }

    // Adicionar dados do cartão se for pagamento com cartão
    if (billingType === 'CREDIT_CARD' && creditCard && creditCardHolderInfo) {
      payload.creditCard = creditCard
      payload.creditCardHolderInfo = creditCardHolderInfo
    }

    console.log('🚀 Enviando para Asaas:', ASAAS_BASE_URL + '/subscriptions')

    // Criar assinatura no Asaas
    const response = await fetch(`${ASAAS_BASE_URL}/subscriptions`, {
      method: 'POST',
      headers: {
        'access_token': ASAAS_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    const result = await response.json()

    if (!response.ok) {
      console.error('❌ Erro do Asaas:', result)
      throw new Error(result.errors?.[0]?.description || result.message || 'Erro ao criar assinatura')
    }

    console.log('✅ Assinatura criada:', result.id)

    // Salvar assinatura no banco
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { error: dbError } = await supabaseClient
      .from('asaas_subscriptions')
      .insert({
        subscription_id: result.id,
        customer_id: customer,
        billing_type: billingType,
        value: value,
        cycle: cycle,
        status: result.status,
        next_due_date: nextDueDate,
        external_reference: externalReference,
        raw_response: result,
      })

    if (dbError) {
      console.error('⚠️ Erro ao salvar no banco:', dbError)
      // Não falhar se erro no banco, assinatura já foi criada no Asaas
    }

    return new Response(
      JSON.stringify(result),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('❌ Erro na Edge Function:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Erro ao criar assinatura',
        details: error 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})
