
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

    // 1. VALIDAÇÕES DE SEGURANÇA
    console.log('🔒 Iniciando validações de segurança do webhook')
    
    // Obter dados da requisição
    const rawPayload = await req.text()
    const headers: Record<string, string> = {}
    req.headers.forEach((value, key) => {
      headers[key.toLowerCase()] = value
    })
    
    // Obter IP do cliente
    const clientIP = headers['x-forwarded-for'] || headers['x-real-ip'] || 'unknown'
    
    // Validar headers básicos
    const requiredHeaders = ['user-agent', 'content-type']
    for (const header of requiredHeaders) {
      if (!headers[header]) {
        console.error(`❌ Header obrigatório ausente: ${header}`)
        return new Response(JSON.stringify({ error: 'Missing required headers' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }
    }

    // Verificar User-Agent
    if (!headers['user-agent'].includes('Asaas') && !headers['user-agent'].includes('webhook')) {
      console.warn(`⚠️ User-Agent suspeito: ${headers['user-agent']}`)
      
      // Registrar evento de segurança
      await supabaseClient.rpc('create_security_event', {
        p_user_id: null,
        p_event_type: 'suspicious_activity',
        p_severity: 'medium',
        p_description: `User-Agent suspeito detectado: ${headers['user-agent']}`,
        p_metadata: { ip_address: clientIP, headers: headers },
        p_ip_address: clientIP,
        p_user_agent: headers['user-agent']
      })
    }

    // Rate limiting básico
    const rateLimitKey = `webhook_${clientIP}`
    const { data: recentRequests } = await supabaseClient
      .from('webhook_events')
      .select('created_at')
      .gte('created_at', new Date(Date.now() - 60000).toISOString()) // Últimos 60 segundos
      .limit(50)

    if (recentRequests && recentRequests.length > 20) {
      console.error(`❌ Rate limit excedido para IP: ${clientIP}`)
      
      await supabaseClient.rpc('create_security_event', {
        p_user_id: null,
        p_event_type: 'rate_limit',
        p_severity: 'high',
        p_description: `Rate limit excedido: ${recentRequests.length} requests em 60 segundos`,
        p_metadata: { ip_address: clientIP, request_count: recentRequests.length },
        p_ip_address: clientIP,
        p_user_agent: headers['user-agent']
      })

      return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Parse e validação do payload
    let webhookData
    try {
      webhookData = JSON.parse(rawPayload)
    } catch (parseError) {
      console.error('❌ Erro ao fazer parse do JSON:', parseError)
      return new Response(JSON.stringify({ error: 'Invalid JSON payload' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Validar estrutura básica do webhook
    if (!webhookData.event || !webhookData.payment) {
      console.error('❌ Estrutura do webhook inválida:', webhookData)
      return new Response(JSON.stringify({ error: 'Invalid webhook structure' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    console.log('✅ Validações de segurança aprovadas')
    console.log('📨 Webhook recebido:', {
      event: webhookData.event,
      payment_id: webhookData.payment?.id,
      ip: clientIP,
      user_agent: headers['user-agent']
    })

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

      // Processar ações específicas baseadas no tipo de serviço
      const { data: cobranca } = await supabaseClient
        .from('asaas_cobrancas')
        .select('*, service_type, service_data')
        .eq('asaas_id', paymentId)
        .maybeSingle()

      if (cobranca) {
        await processPaymentActions(supabaseClient, cobranca, webhookData)
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

async function processPaymentActions(supabaseClient: any, cobranca: any, webhookData: any) {
  const serviceType = cobranca.service_type || cobranca.tipo_cobranca
  const serviceData = cobranca.service_data
  
  console.log('Processando ações para serviço:', serviceType)
  console.log('Dados do serviço:', serviceData)

  switch (serviceType) {
    case 'certidao':
      await processCertidaoPayment(supabaseClient, cobranca, serviceData)
      break

    case 'regularizacao':
      await processRegularizacaoPayment(supabaseClient, cobranca, serviceData)
      break

    case 'filiacao':
      await processFiliacaoPayment(supabaseClient, cobranca, serviceData)
      break

    case 'taxa_anual':
      await processTaxaAnualPayment(supabaseClient, cobranca)
      break

    case 'outros':
    case 'evento':
    case 'doacao':
      console.log(`Pagamento de ${serviceType} confirmado - sem ação específica`)
      break

    default:
      console.log('Tipo de serviço não reconhecido:', serviceType)
  }
}

// Função específica para processar pagamento de certidão
async function processCertidaoPayment(supabaseClient: any, cobranca: any, serviceData: any) {
  try {
    console.log('Processando pagamento de certidão')
    
    if (!serviceData || !serviceData.tipo_certidao) {
      console.error('Dados de certidão incompletos:', serviceData)
      return
    }

    // Gerar número de protocolo único
    const numeroProtocolo = `CERT-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`
    
    // Criar solicitação de certidão
    const { data: solicitacao, error: solicitacaoError } = await supabaseClient
      .from('solicitacoes_certidoes')
      .insert({
        user_id: cobranca.user_id,
        tipo_certidao: serviceData.tipo_certidao,
        justificativa: serviceData.justificativa || 'Solicitação via pagamento online',
        numero_protocolo: numeroProtocolo,
        status: 'pago', // Status inicial após pagamento confirmado
        payment_reference: cobranca.asaas_id,
        valor: cobranca.valor,
        data_solicitacao: new Date().toISOString()
      })
      .select()
      .single()

    if (solicitacaoError) {
      console.error('Erro ao criar solicitação de certidão:', solicitacaoError)
      return
    }

    console.log('Solicitação de certidão criada:', solicitacao.id)
    
    // Criar notificação administrativa
    try {
      const { error: adminNotificationError } = await supabaseClient
        .rpc('create_admin_notification', {
          p_title: 'Nova Solicitação de Certidão',
          p_message: `Nova solicitação de ${serviceData.tipo_certidao} no valor de R$ ${cobranca.valor.toFixed(2)}. Protocolo: ${numeroProtocolo}`,
          p_type: 'info',
          p_category: 'payment',
          p_service_type: 'certidao',
          p_reference_id: cobranca.id,
          p_user_id: cobranca.user_id,
          p_metadata: {
            tipo_certidao: serviceData.tipo_certidao,
            numero_protocolo: numeroProtocolo,
            valor: cobranca.valor,
            solicitacao_id: solicitacao.id
          }
        })

      if (adminNotificationError) {
        console.error('Erro ao criar notificação administrativa:', adminNotificationError)
      } else {
        console.log('✅ Notificação administrativa criada para certidão')
      }
    } catch (adminNotifError) {
      console.error('Erro ao processar notificação administrativa:', adminNotifError)
    }
    
    // TODO: Enviar email de confirmação para o usuário
    
  } catch (error) {
    console.error('Erro ao processar pagamento de certidão:', error)
  }
}

// Função específica para processar pagamento de regularização
async function processRegularizacaoPayment(supabaseClient: any, cobranca: any, serviceData: any) {
  try {
    console.log('Processando pagamento de regularização')
    
    if (!serviceData || !serviceData.servicos_selecionados) {
      console.error('Dados de regularização incompletos:', serviceData)
      return
    }

    // Gerar número de protocolo único
    const numeroProtocolo = `REG-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`
    
    // Criar solicitação de regularização
    const { data: solicitacao, error: solicitacaoError } = await supabaseClient
      .from('solicitacoes_regularizacao')
      .insert({
        user_id: cobranca.user_id,
        servicos_selecionados: serviceData.servicos_selecionados,
        valor_total: cobranca.valor,
        numero_protocolo: numeroProtocolo,
        status: 'pago', // Status inicial após pagamento confirmado
        payment_reference: cobranca.asaas_id,
        data_solicitacao: new Date().toISOString()
      })
      .select()
      .single()

    if (solicitacaoError) {
      console.error('Erro ao criar solicitação de regularização:', solicitacaoError)
      return
    }

    console.log('Solicitação de regularização criada:', solicitacao.id)
    
    // Criar notificação administrativa
    try {
      const { error: adminNotificationError } = await supabaseClient
        .rpc('create_admin_notification', {
          p_title: 'Nova Solicitação de Regularização',
          p_message: `Nova solicitação de regularização no valor de R$ ${cobranca.valor.toFixed(2)}. Protocolo: ${numeroProtocolo}`,
          p_type: 'info',
          p_category: 'payment',
          p_service_type: 'regularizacao',
          p_reference_id: cobranca.id,
          p_user_id: cobranca.user_id,
          p_metadata: {
            servicos_selecionados: serviceData.servicos_selecionados,
            numero_protocolo: numeroProtocolo,
            valor: cobranca.valor,
            solicitacao_id: solicitacao.id
          }
        })

      if (adminNotificationError) {
        console.error('Erro ao criar notificação administrativa:', adminNotificationError)
      } else {
        console.log('✅ Notificação administrativa criada para regularização')
      }
    } catch (adminNotifError) {
      console.error('Erro ao processar notificação administrativa:', adminNotifError)
    }
    
  } catch (error) {
    console.error('Erro ao processar pagamento de regularização:', error)
  }
}

// Função específica para processar pagamento de filiação
async function processFiliacaoPayment(supabaseClient: any, cobranca: any, serviceData: any) {
  try {
    console.log('Processando pagamento de filiação para usuário:', cobranca.user_id)
    console.log('Dados da cobrança:', { id: cobranca.id, referencia_id: cobranca.referencia_id, valor: cobranca.valor })
    
    let subscriptionActivated = false
    let profileActivated = false
    
    // 1. Ativar assinatura do usuário se existir referência
    if (cobranca.referencia_id) {
      console.log('Tentando ativar assinatura:', cobranca.referencia_id)
      
      // Primeiro, verificar se a assinatura existe
      const { data: existingSubscription, error: checkError } = await supabaseClient
        .from('user_subscriptions')
        .select('id, status, user_id')
        .eq('id', cobranca.referencia_id)
        .single()

      if (checkError) {
        console.error('Erro ao verificar assinatura existente:', checkError)
      } else if (existingSubscription) {
        console.log('Assinatura encontrada:', existingSubscription)
        
        // Verificar se pertence ao usuário correto
        if (existingSubscription.user_id !== cobranca.user_id) {
          console.error('Assinatura não pertence ao usuário da cobrança')
        } else {
          // Ativar a assinatura
          const { error: subscriptionError } = await supabaseClient
            .from('user_subscriptions')
            .update({
              status: 'active',
              start_date: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('id', cobranca.referencia_id)
            .eq('user_id', cobranca.user_id)

          if (subscriptionError) {
            console.error('Erro ao ativar assinatura:', subscriptionError)
          } else {
            console.log('✅ Assinatura ativada com sucesso:', cobranca.referencia_id)
            subscriptionActivated = true
          }
        }
      } else {
        console.warn('Assinatura não encontrada para referência:', cobranca.referencia_id)
      }
    } else {
      console.warn('Nenhuma referência de assinatura encontrada na cobrança')
      
      // Tentar encontrar assinatura pendente pelo payment_reference
      const { data: pendingSubscriptions, error: searchError } = await supabaseClient
        .from('user_subscriptions')
        .select('id, status')
        .eq('user_id', cobranca.user_id)
        .eq('payment_reference', cobranca.id)
        .eq('status', 'pending')

      if (searchError) {
        console.error('Erro ao buscar assinaturas pendentes:', searchError)
      } else if (pendingSubscriptions && pendingSubscriptions.length > 0) {
        console.log('Encontradas assinaturas pendentes:', pendingSubscriptions.length)
        
        // Ativar a primeira assinatura pendente encontrada
        const subscriptionToActivate = pendingSubscriptions[0]
        
        const { error: activateError } = await supabaseClient
          .from('user_subscriptions')
          .update({
            status: 'active',
            start_date: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', subscriptionToActivate.id)

        if (activateError) {
          console.error('Erro ao ativar assinatura encontrada:', activateError)
        } else {
          console.log('✅ Assinatura ativada via payment_reference:', subscriptionToActivate.id)
          subscriptionActivated = true
        }
      }
    }

    // 2. Ativar perfil do usuário
    console.log('Tentando ativar perfil do usuário:', cobranca.user_id)
    
    const { error: profileError } = await supabaseClient
      .from('profiles')
      .update({ 
        status: 'ativo',
        updated_at: new Date().toISOString()
      })
      .eq('id', cobranca.user_id)

    if (profileError) {
      console.error('Erro ao ativar perfil:', profileError)
    } else {
      console.log('✅ Perfil ativado para filiação')
      profileActivated = true
    }

    // 3. Criar notificação de boas-vindas
    if (subscriptionActivated) {
      try {
        const { error: notificationError } = await supabaseClient
          .from('notifications')
          .insert({
            user_id: cobranca.user_id,
            title: 'Bem-vindo ao COMADEMIG!',
            message: 'Sua filiação foi ativada com sucesso. Agora você tem acesso a todos os benefícios de membro.',
            type: 'success',
            created_at: new Date().toISOString()
          })

        if (notificationError) {
          console.error('Erro ao criar notificação de boas-vindas:', notificationError)
        } else {
          console.log('✅ Notificação de boas-vindas criada')
        }
      } catch (notifError) {
        console.error('Erro ao processar notificação:', notifError)
      }
    }

    // 4. Criar notificação administrativa
    try {
      const { error: adminNotificationError } = await supabaseClient
        .rpc('create_admin_notification', {
          p_title: 'Novo Pagamento de Filiação',
          p_message: `Pagamento de R$ ${cobranca.valor.toFixed(2)} confirmado para filiação. ${subscriptionActivated ? 'Assinatura ativada automaticamente.' : 'Verificar ativação da assinatura.'}`,
          p_type: subscriptionActivated ? 'success' : 'warning',
          p_category: 'payment',
          p_service_type: 'filiacao',
          p_reference_id: cobranca.id,
          p_user_id: cobranca.user_id,
          p_metadata: {
            valor: cobranca.valor,
            subscription_activated: subscriptionActivated,
            profile_activated: profileActivated,
            referencia_id: cobranca.referencia_id
          }
        })

      if (adminNotificationError) {
        console.error('Erro ao criar notificação administrativa:', adminNotificationError)
      } else {
        console.log('✅ Notificação administrativa criada para filiação')
      }
    } catch (adminNotifError) {
      console.error('Erro ao processar notificação administrativa:', adminNotifError)
    }

    // 5. Log de auditoria
    const auditData = {
      user_id: cobranca.user_id,
      action: 'filiacao_payment_processed',
      details: {
        cobranca_id: cobranca.id,
        referencia_id: cobranca.referencia_id,
        subscription_activated: subscriptionActivated,
        profile_activated: profileActivated,
        valor: cobranca.valor
      },
      timestamp: new Date().toISOString()
    }
    
    console.log('📋 Auditoria de filiação:', auditData)
    
    // Resumo do processamento
    console.log('📊 Resumo do processamento de filiação:')
    console.log(`   - Assinatura ativada: ${subscriptionActivated ? '✅' : '❌'}`)
    console.log(`   - Perfil ativado: ${profileActivated ? '✅' : '❌'}`)
    console.log(`   - Usuário: ${cobranca.user_id}`)
    console.log(`   - Valor: R$ ${cobranca.valor}`)
    
  } catch (error) {
    console.error('❌ Erro crítico ao processar pagamento de filiação:', error)
    
    // Log detalhado do erro para debugging
    console.error('Dados da cobrança no momento do erro:', cobranca)
    console.error('Service data:', serviceData)
  }
}

// Função específica para processar pagamento de taxa anual
async function processTaxaAnualPayment(supabaseClient: any, cobranca: any) {
  try {
    console.log('Processando pagamento de taxa anual')
    
    if (cobranca.referencia_id) {
      const { error: taxaError } = await supabaseClient
        .from('financeiro')
        .update({ 
          status: 'pago',
          data_pagamento: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', cobranca.referencia_id)

      if (taxaError) {
        console.error('Erro ao atualizar taxa anual:', taxaError)
      } else {
        console.log('Taxa anual paga')
      }
    }
    
  } catch (error) {
    console.error('Erro ao processar pagamento de taxa anual:', error)
  }
}
