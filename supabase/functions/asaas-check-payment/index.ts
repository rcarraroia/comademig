
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) {
      return new Response('Não autorizado', { status: 401, headers: corsHeaders })
    }

    const { paymentId } = await req.json()
    const asaasApiKey = Deno.env.get('ASAAS_API_KEY')

    if (!asaasApiKey) {
      return new Response('Chave da API Asaas não configurada', { status: 500, headers: corsHeaders })
    }

    // Buscar status do pagamento no Asaas
    const paymentResponse = await fetch(`https://www.asaas.com/api/v3/payments/${paymentId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'access_token': asaasApiKey,
      }
    })

    if (!paymentResponse.ok) {
      return new Response('Pagamento não encontrado', { status: 404, headers: corsHeaders })
    }

    const asaasPayment = await paymentResponse.json()

    // Atualizar status no banco de dados
    const { data: cobranca, error } = await supabaseClient
      .from('asaas_cobrancas')
      .update({
        status: asaasPayment.status,
        data_pagamento: asaasPayment.dateReceived || null,
        updated_at: new Date().toISOString()
      })
      .eq('asaas_id', paymentId)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      console.error('Erro ao atualizar cobrança:', error)
      return new Response(JSON.stringify({ error }), { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    return new Response(JSON.stringify({
      success: true,
      payment: asaasPayment,
      cobranca
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Erro ao verificar pagamento:', error)
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
