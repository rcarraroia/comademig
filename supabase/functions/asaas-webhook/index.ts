import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AsaasWebhookPayload {
  event: string
  payment: {
    id: string
    customer: string
    subscription?: string
    installment?: string
    value: number
    netValue: number
    originalValue?: number
    interestValue?: number
    description: string
    billingType: string
    status: string
    pixTransaction?: string
    confirmedDate?: string
    paymentDate?: string
    clientPaymentDate?: string
    installmentNumber?: number
    invoiceUrl?: string
    bankSlipUrl?: string
    transactionReceiptUrl?: string
    invoiceNumber?: string
    externalReference?: string
    originalDueDate?: string
    paymentLink?: string
    dueDate: string
    dateCreated: string
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Verificar se é uma requisição POST
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { 
          status: 405, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Parse do payload do webhook
    const payload: AsaasWebhookPayload = await req.json()
    
    console.log('Webhook recebido:', payload)

    // Verificar se é um evento de pagamento
    if (!payload.event || !payload.payment) {
      return new Response(
        JSON.stringify({ error: 'Invalid webhook payload' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const { event, payment } = payload

    // Buscar a cobrança no banco de dados
    const { data: cobranca, error: fetchError } = await supabaseClient
      .from('asaas_cobrancas')
      .select('*')
      .eq('asaas_payment_id', payment.id)
      .single()

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Erro ao buscar cobrança:', fetchError)
      return new Response(
        JSON.stringify({ error: 'Database error' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Se a cobrança não existe, criar uma nova entrada
    if (!cobranca) {
      const { error: insertError } = await supabaseClient
        .from('asaas_cobrancas')
        .insert({
          asaas_payment_id: payment.id,
          asaas_customer_id: payment.customer,
          subscription_id: payment.subscription,
          installment_id: payment.installment,
          value: payment.value,
          net_value: payment.netValue,
          original_value: payment.originalValue,
          interest_value: payment.interestValue,
          description: payment.description,
          billing_type: payment.billingType,
          status: payment.status,
          pix_transaction: payment.pixTransaction,
          confirmed_date: payment.confirmedDate,
          payment_date: payment.paymentDate,
          client_payment_date: payment.clientPaymentDate,
          installment_number: payment.installmentNumber,
          invoice_url: payment.invoiceUrl,
          bank_slip_url: payment.bankSlipUrl,
          transaction_receipt_url: payment.transactionReceiptUrl,
          invoice_number: payment.invoiceNumber,
          external_reference: payment.externalReference,
          original_due_date: payment.originalDueDate,
          payment_link: payment.paymentLink,
          due_date: payment.dueDate,
          date_created: payment.dateCreated,
          webhook_event: event,
          processed_at: new Date().toISOString()
        })

      if (insertError) {
        console.error('Erro ao inserir cobrança:', insertError)
        return new Response(
          JSON.stringify({ error: 'Failed to create payment record' }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }
    } else {
      // Atualizar cobrança existente
      const { error: updateError } = await supabaseClient
        .from('asaas_cobrancas')
        .update({
          status: payment.status,
          confirmed_date: payment.confirmedDate,
          payment_date: payment.paymentDate,
          client_payment_date: payment.clientPaymentDate,
          invoice_url: payment.invoiceUrl,
          bank_slip_url: payment.bankSlipUrl,
          transaction_receipt_url: payment.transactionReceiptUrl,
          invoice_number: payment.invoiceNumber,
          pix_transaction: payment.pixTransaction,
          webhook_event: event,
          processed_at: new Date().toISOString()
        })
        .eq('asaas_payment_id', payment.id)

      if (updateError) {
        console.error('Erro ao atualizar cobrança:', updateError)
        return new Response(
          JSON.stringify({ error: 'Failed to update payment record' }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }
    }

    // Registrar transação financeira
    const { error: transactionError } = await supabaseClient
      .from('financial_transactions')
      .insert({
        user_id: cobranca?.user_id,
        asaas_payment_id: payment.id,
        transaction_type: 'payment',
        amount: payment.value,
        status: payment.status,
        description: payment.description,
        payment_method: payment.billingType,
        external_reference: payment.externalReference,
        due_date: payment.dueDate,
        payment_date: payment.paymentDate,
        metadata: {
          webhook_event: event,
          asaas_customer_id: payment.customer,
          subscription_id: payment.subscription,
          installment_id: payment.installment,
          net_value: payment.netValue,
          invoice_url: payment.invoiceUrl,
          bank_slip_url: payment.bankSlipUrl
        }
      })

    if (transactionError) {
      console.error('Erro ao registrar transação:', transactionError)
    }

    // Processar webhook e criar notificações
    const { error: webhookError } = await supabaseClient.rpc('process_payment_webhook', {
      p_payment_id: payment.id,
      p_event: event,
      p_payment_data: payment
    })

    if (webhookError) {
      console.error('Erro ao processar webhook:', webhookError)
    }

    // Processar eventos específicos
    switch (event) {
      case 'PAYMENT_RECEIVED':
      case 'PAYMENT_CONFIRMED':
        await handlePaymentConfirmed(supabaseClient, payment)
        break
      
      case 'PAYMENT_OVERDUE':
        await handlePaymentOverdue(supabaseClient, payment)
        break
      
      case 'PAYMENT_DELETED':
      case 'PAYMENT_REFUNDED':
        await handlePaymentCancelled(supabaseClient, payment)
        break
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Webhook processed successfully' }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Erro no webhook:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

async function handlePaymentConfirmed(supabaseClient: any, payment: any) {
  // Atualizar status da assinatura do usuário se aplicável
  if (payment.subscription) {
    const { error } = await supabaseClient
      .from('user_subscriptions')
      .update({
        status: 'active',
        last_payment_date: payment.paymentDate || payment.confirmedDate,
        updated_at: new Date().toISOString()
      })
      .eq('asaas_subscription_id', payment.subscription)

    if (error) {
      console.error('Erro ao atualizar assinatura:', error)
    }
  }

  // Aqui você pode adicionar lógica para:
  // - Enviar email de confirmação
  // - Ativar benefícios do usuário
  // - Registrar log de auditoria
}

async function handlePaymentOverdue(supabaseClient: any, payment: any) {
  // Marcar assinatura como vencida
  if (payment.subscription) {
    const { error } = await supabaseClient
      .from('user_subscriptions')
      .update({
        status: 'overdue',
        updated_at: new Date().toISOString()
      })
      .eq('asaas_subscription_id', payment.subscription)

    if (error) {
      console.error('Erro ao marcar assinatura como vencida:', error)
    }
  }

  // Aqui você pode adicionar lógica para:
  // - Enviar notificação de vencimento
  // - Suspender benefícios temporariamente
}

async function handlePaymentCancelled(supabaseClient: any, payment: any) {
  // Cancelar assinatura se aplicável
  if (payment.subscription) {
    const { error } = await supabaseClient
      .from('user_subscriptions')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('asaas_subscription_id', payment.subscription)

    if (error) {
      console.error('Erro ao cancelar assinatura:', error)
    }
  }

  // Aqui você pode adicionar lógica para:
  // - Processar reembolso
  // - Cancelar benefícios
  // - Notificar usuário
}