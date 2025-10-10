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
  try {
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

    // Buscar dados da cobrança para verificar se é uma solicitação de serviço
    const { data: cobranca, error: cobrancaError } = await supabaseClient
      .from('asaas_cobrancas')
      .select('*')
      .eq('asaas_payment_id', payment.id)
      .single()

    if (cobrancaError) {
      console.error('Erro ao buscar cobrança:', cobrancaError)
      return
    }

    // INTEGRAÇÃO: Processar splits automaticamente
    await processPaymentSplits(supabaseClient, cobranca, payment)

    // Verificar se há service_data (indica solicitação de serviço)
    if (cobranca?.service_data) {
      await createServiceRequest(supabaseClient, cobranca, payment)
    }

  } catch (error) {
    console.error('Erro em handlePaymentConfirmed:', error)
  }
}

/**
 * Processa splits automaticamente após confirmação de pagamento
 */
async function processPaymentSplits(supabaseClient: any, cobranca: any, payment: any) {
  try {
    console.log('Processing payment splits for:', payment.id)

    // Determinar tipo de serviço baseado na descrição ou metadata
    let serviceType = 'outros'
    const description = payment.description?.toLowerCase() || ''
    
    if (description.includes('filiação') || description.includes('filiacao') || description.includes('anuidade')) {
      serviceType = 'filiacao'
    } else if (description.includes('certidão') || description.includes('certidao') || description.includes('regularização')) {
      serviceType = 'servicos'
    } else if (description.includes('publicidade') || description.includes('patrocínio')) {
      serviceType = 'publicidade'
    } else if (description.includes('evento') || description.includes('curso')) {
      serviceType = 'eventos'
    }

    // Chamar Edge Function para processar splits
    const response = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/asaas-process-splits`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
      },
      body: JSON.stringify({
        cobrancaId: cobranca.id,
        paymentValue: payment.value,
        serviceType: serviceType,
      }),
    })

    const result = await response.json()

    if (!result.success) {
      console.error('Failed to process splits:', result)
      return
    }

    console.log('Splits processed successfully:', result)

    // Se houver afiliado, atualizar status da indicação e enviar notificação
    if (result.data?.processedSplits) {
      const affiliateSplit = result.data.processedSplits.find(
        (s: any) => s.recipientType === 'affiliate'
      )

      if (affiliateSplit) {
        await updateReferralAndNotify(supabaseClient, cobranca, payment, affiliateSplit)
      }
    }

  } catch (error) {
    console.error('Error processing payment splits:', error)
    // Não falha o processo principal - apenas loga o erro
  }
}

/**
 * Atualiza status da indicação e notifica o afiliado
 */
async function updateReferralAndNotify(supabaseClient: any, cobranca: any, payment: any, affiliateSplit: any) {
  try {
    // Buscar indicação
    const { data: referral } = await supabaseClient
      .from('affiliate_referrals')
      .select(`
        *,
        affiliate:affiliates!affiliate_id(
          id,
          user_id,
          display_name
        )
      `)
      .eq('referred_user_id', cobranca.user_id)
      .eq('status', 'pending')
      .single()

    if (!referral) {
      console.log('No pending referral found for user:', cobranca.user_id)
      return
    }

    // Atualizar status para 'converted'
    await supabaseClient
      .from('affiliate_referrals')
      .update({
        status: 'converted',
        conversion_date: new Date().toISOString(),
        conversion_value: payment.value,
      })
      .eq('id', referral.id)

    console.log('Referral status updated to converted:', referral.id)

    // Enviar notificação para o afiliado
    if (referral.affiliate?.user_id) {
      await supabaseClient
        .from('notifications')
        .insert({
          user_id: referral.affiliate.user_id,
          type: 'comissao_recebida',
          title: 'Nova Comissão Recebida!',
          message: `Você recebeu uma comissão de R$ ${affiliateSplit.amount?.toFixed(2)} referente ao pagamento de ${referral.affiliate.display_name || 'um indicado'}.`,
          action_url: '/dashboard/afiliados',
        })

      console.log('Commission notification sent to affiliate:', referral.affiliate.id)
    }

  } catch (error) {
    console.error('Error updating referral and notifying:', error)
    // Não falha o processo principal
  }
}

async function createServiceRequest(supabaseClient: any, cobranca: any, payment: any) {
  try {
    const serviceData = cobranca.service_data
    
    // Gerar número de protocolo único
    const protocolo = `SRV-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
    
    // Criar solicitação de serviço
    const { data: solicitacao, error: solicitacaoError } = await supabaseClient
      .from('solicitacoes_servicos')
      .insert({
        user_id: cobranca.user_id,
        servico_id: serviceData.servico_id,
        protocolo: protocolo,
        status: 'pendente',
        valor: payment.value,
        dados_adicionais: serviceData.dados_formulario || {},
        documentos: serviceData.documentos || [],
        payment_id: payment.id,
        payment_status: payment.status,
        payment_method: payment.billingType,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (solicitacaoError) {
      console.error('Erro ao criar solicitação:', solicitacaoError)
      throw solicitacaoError
    }

    console.log('Solicitação criada com sucesso:', solicitacao)

    // Criar notificação para o usuário
    await supabaseClient
      .from('notifications')
      .insert({
        user_id: cobranca.user_id,
        title: 'Pagamento Confirmado',
        message: `Seu pagamento foi confirmado! Protocolo: ${protocolo}. Sua solicitação está sendo processada.`,
        type: 'payment_confirmed',
        link: `/dashboard/solicitacao-servicos?protocolo=${protocolo}`,
        read: false,
        created_at: new Date().toISOString()
      })

    // Criar notificação para admins
    const { data: admins } = await supabaseClient
      .from('profiles')
      .select('id')
      .in('tipo_membro', ['admin', 'super_admin'])

    if (admins && admins.length > 0) {
      const adminNotifications = admins.map((admin: any) => ({
        user_id: admin.id,
        title: 'Nova Solicitação de Serviço',
        message: `Nova solicitação recebida. Protocolo: ${protocolo}`,
        type: 'new_service_request',
        link: `/admin/solicitacoes?protocolo=${protocolo}`,
        read: false,
        created_at: new Date().toISOString()
      }))

      await supabaseClient
        .from('notifications')
        .insert(adminNotifications)
    }

    // Registrar em audit_logs
    await supabaseClient
      .from('audit_logs')
      .insert({
        user_id: cobranca.user_id,
        action: 'service_request_created',
        table_name: 'solicitacoes_servicos',
        record_id: solicitacao.id,
        changes: {
          protocolo: protocolo,
          servico_id: serviceData.servico_id,
          payment_id: payment.id,
          valor: payment.value
        },
        created_at: new Date().toISOString()
      })

    console.log('Notificações e logs criados com sucesso')

  } catch (error) {
    console.error('Erro ao criar solicitação de serviço:', error)
    
    // Tentar registrar erro para retry posterior
    await supabaseClient
      .from('webhook_errors')
      .insert({
        payment_id: payment.id,
        error_message: error.message,
        error_stack: error.stack,
        payload: { cobranca, payment },
        retry_count: 0,
        created_at: new Date().toISOString()
      })
      .catch((logError: any) => {
        console.error('Erro ao registrar erro de webhook:', logError)
      })
    
    throw error
  }
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