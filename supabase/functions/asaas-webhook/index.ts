
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
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const webhookData = await req.json()
    console.log('Webhook recebido:', webhookData)

    // Salvar webhook para auditoria
    const { error: webhookError } = await supabaseClient
      .from('asaas_webhooks')
      .insert({
        asaas_payment_id: webhookData.payment?.id || webhookData.id,
        event_type: webhookData.event,
        payload: webhookData,
        processed: false
      })

    if (webhookError) {
      console.error('Erro ao salvar webhook:', webhookError)
    }

    // Processar eventos de pagamento
    if (webhookData.event === 'PAYMENT_CONFIRMED' || 
        webhookData.event === 'PAYMENT_RECEIVED' ||
        webhookData.event === 'PAYMENT_CREDITED') {
      
      const paymentId = webhookData.payment?.id || webhookData.id
      
      // Atualizar status da cobrança
      const { error: updateError } = await supabaseClient
        .from('asaas_cobrancas')
        .update({
          status: 'RECEIVED',
          data_pagamento: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('asaas_id', paymentId)

      if (updateError) {
        console.error('Erro ao atualizar cobrança:', updateError)
      } else {
        console.log('Pagamento confirmado para:', paymentId)

        // Buscar a cobrança para processar ações específicas
        const { data: cobranca } = await supabaseClient
          .from('asaas_cobrancas')
          .select('*')
          .eq('asaas_id', paymentId)
          .single()

        if (cobranca) {
          // Processar ações específicas baseadas no tipo de cobrança
          await processPaymentActions(supabaseClient, cobranca)
        }
      }

      // Marcar webhook como processado
      await supabaseClient
        .from('asaas_webhooks')
        .update({ processed: true })
        .eq('asaas_payment_id', paymentId)
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Erro no webhook:', error)
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

async function processPaymentActions(supabaseClient: any, cobranca: any) {
  console.log('Processando ações para cobrança:', cobranca.tipo_cobranca)

  switch (cobranca.tipo_cobranca) {
    case 'filiacao':
      // Ativar perfil do usuário
      await supabaseClient
        .from('profiles')
        .update({ 
          status: 'ativo',
          updated_at: new Date().toISOString()
        })
        .eq('id', cobranca.user_id)
      console.log('Perfil ativado para filiação')
      break

    case 'taxa_anual':
      // Atualizar status de taxa anual
      await supabaseClient
        .from('financeiro')
        .update({ 
          status: 'pago',
          data_pagamento: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', cobranca.referencia_id)
      console.log('Taxa anual paga')
      break

    case 'certidao':
      // Aprovar solicitação de certidão
      await supabaseClient
        .from('solicitacoes_certidoes')
        .update({ 
          status: 'pago',
          updated_at: new Date().toISOString()
        })
        .eq('id', cobranca.referencia_id)
      console.log('Certidão paga, aguardando processamento')
      break

    default:
      console.log('Tipo de cobrança não reconhecido:', cobranca.tipo_cobranca)
  }
}
