
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const RENUM_WALLET_ID = 'f9c7d1dd-9e52-4e81-8194-8b666f276405'

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

    const paymentData = await req.json()
    const { affiliate_id, ...basePaymentData } = paymentData
    const asaasApiKey = Deno.env.get('ASAAS_API_KEY')

    if (!asaasApiKey) {
      return new Response('Chave da API Asaas não configurada', { status: 500, headers: corsHeaders })
    }

    let finalPaymentData = { ...basePaymentData }

    // Primeiro, criar/buscar o cliente no Asaas
    let customerId: string;
    
    try {
      const customerResponse = await fetch('https://www.asaas.com/api/v3/customers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'access_token': asaasApiKey,
        },
        body: JSON.stringify(paymentData.customer)
      });

      if (customerResponse.ok) {
        // Cliente criado com sucesso
        const customerData = await customerResponse.json();
        customerId = customerData.id;
        console.log('Cliente criado com sucesso:', customerId);
      } else if (customerResponse.status === 400) {
        // Cliente já existe, buscar pelo CPF
        console.log('Cliente já existe, buscando pelo CPF...');
        
        const searchResponse = await fetch(`https://www.asaas.com/api/v3/customers?cpfCnpj=${paymentData.customer.cpfCnpj}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'access_token': asaasApiKey,
          }
        });
        
        if (!searchResponse.ok) {
          throw new Error(`Erro ao buscar cliente existente: ${searchResponse.status}`);
        }
        
        const searchData = await searchResponse.json();
        
        if (!searchData.data || searchData.data.length === 0) {
          throw new Error('Cliente não encontrado após erro de criação');
        }
        
        customerId = searchData.data[0].id;
        console.log('Cliente encontrado:', customerId);
      } else {
        // Outro erro na criação
        const errorData = await customerResponse.json();
        throw new Error(`Erro ao criar cliente: ${JSON.stringify(errorData)}`);
      }
    } catch (error) {
      console.error('Erro no processo de criação/busca de cliente:', error);
      return new Response(JSON.stringify({ 
        error: 'Erro ao processar dados do cliente',
        details: error.message 
      }), { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Adicionar customer ID ao payload
    finalPaymentData.customer = customerId;

    // Se tem afiliado, configurar split
    if (affiliate_id) {
      const { data: affiliate } = await supabaseClient
        .from('affiliates')
        .select('asaas_wallet_id, status, is_adimplent')
        .eq('id', affiliate_id)
        .eq('status', 'active')
        .eq('is_adimplent', true)
        .maybeSingle()

      if (affiliate && affiliate.asaas_wallet_id) {
        // Configurar split: 40% Convenção + 40% Renum + 20% Afiliado
        finalPaymentData.split = [
          {
            walletId: RENUM_WALLET_ID,
            percentualValue: 40.0
          },
          {
            walletId: affiliate.asaas_wallet_id,
            percentualValue: 20.0
          }
          // 40% restante fica para a conta principal (Convenção)
        ]

        // Adicionar referência do afiliado
        finalPaymentData.externalReference = `referral:${affiliate_id}`

        // Registrar indicação
        await supabaseClient
          .from('referrals')
          .insert({
            affiliate_id: affiliate_id,
            referred_name: paymentData.customer?.name || 'Cliente',
            referred_email: paymentData.customer?.email || '',
            amount: paymentData.value,
            status: 'pending'
          })
      }
    }

    // Criar cobrança no Asaas
    const asaasResponse = await fetch('https://www.asaas.com/api/v3/payments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access_token': asaasApiKey,
      },
      body: JSON.stringify(finalPaymentData)
    })

    if (!asaasResponse.ok) {
      const errorText = await asaasResponse.text()
      console.error('Erro do Asaas:', errorText)
      return new Response(`Erro ao criar cobrança: ${errorText}`, { 
        status: asaasResponse.status, 
        headers: corsHeaders 
      })
    }

    const asaasPayment = await asaasResponse.json()

    // Salvar cobrança no banco
    const { error: dbError } = await supabaseClient
      .from('asaas_cobrancas')
      .insert({
        user_id: user.id,
        asaas_id: asaasPayment.id,
        customer_id: asaasPayment.customer,
        valor: asaasPayment.value,
        descricao: asaasPayment.description,
        data_vencimento: asaasPayment.dueDate,
        status: asaasPayment.status,
        forma_pagamento: asaasPayment.billingType,
        url_pagamento: asaasPayment.invoiceUrl || asaasPayment.bankSlipUrl,
        linha_digitavel: asaasPayment.identificationField,
        qr_code_pix: asaasPayment.encodedImage || asaasPayment.payload,
        tipo_cobranca: paymentData.tipoCobranca || 'filiacao',
        referencia_id: paymentData.referenciaId
      })

    if (dbError) {
      console.error('Erro ao salvar no banco:', dbError)
    }

    return new Response(JSON.stringify({
      success: true,
      cobranca: asaasPayment,
      split_configured: !!affiliate_id
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Erro ao criar pagamento com split:', error)
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
