import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SubscriptionRequest {
  customer: {
    name: string
    email: string
    cpfCnpj: string
    phone?: string
    address?: string
    addressNumber?: string
    complement?: string
    province?: string
    city?: string
    postalCode?: string
  }
  billingType: 'CREDIT_CARD' | 'PIX'
  value: number
  description: string
  cycle: 'MONTHLY' | 'YEARLY'
  nextDueDate: string
  tipoCobranca: string
  selectedMemberType?: string
  selectedPlan?: string
  affiliateId?: string
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

    const subscriptionData: SubscriptionRequest = await req.json()
    const asaasApiKey = Deno.env.get('ASAAS_API_KEY')

    if (!asaasApiKey) {
      console.error('ASAAS_API_KEY não configurada')
      return new Response(JSON.stringify({ error: 'Chave da API Asaas não configurada' }), { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    console.log('Criando assinatura para:', subscriptionData.customer.name)
    console.log('Valor:', subscriptionData.value)
    console.log('Ciclo:', subscriptionData.cycle)

    // 1. Criar/buscar cliente no Asaas
    let customerId: string;
    
    try {
      const customerResponse = await fetch('https://www.asaas.com/api/v3/customers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'access_token': asaasApiKey,
        },
        body: JSON.stringify(subscriptionData.customer)
      });

      if (customerResponse.ok) {
        const customerData = await customerResponse.json();
        customerId = customerData.id;
        console.log('Cliente criado:', customerId);
      } else if (customerResponse.status === 400) {
        // Cliente já existe, buscar pelo CPF
        console.log('Cliente já existe, buscando...');
        
        const searchResponse = await fetch(`https://www.asaas.com/api/v3/customers?cpfCnpj=${subscriptionData.customer.cpfCnpj}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'access_token': asaasApiKey,
          }
        });
        
        if (!searchResponse.ok) {
          throw new Error(`Erro ao buscar cliente: ${searchResponse.status}`);
        }
        
        const searchData = await searchResponse.json();
        customerId = searchData.data[0].id;
        console.log('Cliente encontrado:', customerId);
      } else {
        const errorData = await customerResponse.json();
        throw new Error(`Erro ao criar cliente: ${JSON.stringify(errorData)}`);
      }
    } catch (error) {
      console.error('Erro no cliente:', error);
      return new Response(JSON.stringify({ 
        error: 'Erro ao processar dados do cliente',
        details: error.message 
      }), { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 2. Criar assinatura no Asaas
    const subscriptionPayload = {
      customer: customerId,
      billingType: subscriptionData.billingType,
      value: subscriptionData.value,
      nextDueDate: subscriptionData.nextDueDate,
      cycle: subscriptionData.cycle,
      description: subscriptionData.description,
      endDate: null, // Assinatura sem fim
      maxPayments: null, // Sem limite de pagamentos
      externalReference: `filiacao_${Date.now()}`
    }

    console.log('Criando assinatura com payload:', subscriptionPayload);

    const subscriptionResponse = await fetch('https://www.asaas.com/api/v3/subscriptions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access_token': asaasApiKey,
      },
      body: JSON.stringify(subscriptionPayload)
    });

    if (!subscriptionResponse.ok) {
      const errorData = await subscriptionResponse.json();
      console.error('Erro na API do Asaas:', errorData);
      throw new Error(`Erro na API do Asaas: ${JSON.stringify(errorData)}`);
    }

    const asaasSubscription = await subscriptionResponse.json();
    console.log('Assinatura criada:', asaasSubscription.id);

    // 3. Salvar assinatura no banco
    const subscriptionRecord = {
      user_id: 'anonymous_' + Date.now(), // Para filiação sem login
      asaas_subscription_id: asaasSubscription.id,
      customer_id: customerId,
      valor: subscriptionData.value,
      descricao: subscriptionData.description,
      ciclo: subscriptionData.cycle,
      status: asaasSubscription.status,
      forma_pagamento: subscriptionData.billingType,
      proxima_cobranca: subscriptionData.nextDueDate,
      tipo_servico: 'filiacao',
      member_type_id: subscriptionData.selectedMemberType,
      plan_id: subscriptionData.selectedPlan
    }

    // Tentar salvar na tabela de assinaturas (se existir)
    const { data: subscription, error: dbError } = await supabaseClient
      .from('asaas_subscriptions')
      .insert(subscriptionRecord)
      .select()
      .single()

    if (dbError) {
      console.error('Erro ao salvar assinatura:', dbError);
      // Se a tabela não existir, criar uma cobrança normal como fallback
      const cobrancaData = {
        user_id: subscriptionRecord.user_id,
        asaas_id: asaasSubscription.id,
        customer_id: customerId,
        valor: subscriptionData.value,
        descricao: subscriptionData.description + ' (Assinatura)',
        data_vencimento: subscriptionData.nextDueDate,
        status: 'PENDING',
        forma_pagamento: subscriptionData.billingType,
        tipo_cobranca: 'filiacao',
        service_type: 'filiacao'
      }

      const { data: cobranca, error: cobrancaError } = await supabaseClient
        .from('asaas_cobrancas')
        .insert(cobrancaData)
        .select()
        .single()

      if (cobrancaError) {
        console.error('Erro ao salvar cobrança fallback:', cobrancaError);
        throw new Error('Erro ao salvar no banco de dados');
      }

      return new Response(JSON.stringify({
        success: true,
        subscription: asaasSubscription,
        cobranca: cobranca,
        message: 'Assinatura criada (salva como cobrança)'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({
      success: true,
      subscription: asaasSubscription,
      record: subscription
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Erro geral:', error)
    return new Response(JSON.stringify({ 
      error: 'Erro interno do servidor', 
      details: error.message,
      timestamp: new Date().toISOString()
    }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})