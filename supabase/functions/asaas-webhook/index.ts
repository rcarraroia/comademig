
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

    const eventId = webhookData.id || webhookData.payment?.id || `${Date.now()}-${Math.random()}`

    // Verificar idempotência
    const { data: existing } = await supabaseClient
      .from('webhook_events')
      .select('id')
      .eq('event_id', eventId)
      .maybeSingle()

    if (existing) {
      return new Response(JSON.stringify({ success: true, message: 'Event already processed' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Salvar evento para auditoria
    await supabaseClient
      .from('webhook_events')
      .insert({
        event_id: eventId,
        payload: webhookData,
        processed: false
      })

    // Processar eventos de pagamento
    if (webhookData.event === 'PAYMENT_CONFIRMED' || 
        webhookData.event === 'PAYMENT_RECEIVED' ||
        webhookData.event === 'PAYMENT_CREDITED') {
      
      const paymentId = webhookData.payment?.id || webhookData.id
      const externalReference = webhookData.payment?.externalReference || ''
      const totalAmount = parseFloat(webhookData.payment?.value || 0)

      // Processar referral se existir
      if (externalReference.startsWith('referral:')) {
        const affiliateId = externalReference.replace('referral:', '')
        
        // Verificar se afiliado existe e está ativo
        const { data: affiliate } = await supabaseClient
          .from('affiliates')
          .select('*')
          .eq('id', affiliateId)
          .eq('status', 'active')
          .eq('is_adimplent', true)
          .maybeSingle()

        if (affiliate) {
          // Calcular valores do split (40% + 40% + 20%)
          const affiliateAmount = totalAmount * 0.2
          const conventionAmount = totalAmount * 0.4
          const renumAmount = totalAmount * 0.4

          // Registrar transação
          await supabaseClient
            .from('transactions')
            .insert({
              asaas_payment_id: paymentId,
              charge_id: paymentId,
              affiliate_id: affiliateId,
              total_amount: totalAmount,
              affiliate_amount: affiliateAmount,
              convention_amount: conventionAmount,
              renum_amount: renumAmount,
              status: 'paid',
              raw_payload: webhookData
            })

          // Atualizar referral
          await supabaseClient
            .from('referrals')
            .update({
              status: 'paid',
              charge_id: paymentId
            })
            .eq('affiliate_id', affiliateId)
            .eq('status', 'pending')

          console.log('Split processado para afiliado:', affiliateId)
        }
      }

      // Processar ações específicas baseadas no tipo de cobrança (código existente)
      const { data: cobranca } = await supabaseClient
        .from('asaas_cobrancas')
        .select('*')
        .eq('asaas_id', paymentId)
        .maybeSingle()

      if (cobranca) {
        await processPaymentActions(supabaseClient, cobranca)
      }

      // Atualizar status da cobrança
      await supabaseClient
        .from('asaas_cobrancas')
        .update({
          status: 'RECEIVED',
          data_pagamento: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('asaas_id', paymentId)

      // Marcar webhook como processado
      await supabaseClient
        .from('webhook_events')
        .update({ processed: true })
        .eq('event_id', eventId)
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
