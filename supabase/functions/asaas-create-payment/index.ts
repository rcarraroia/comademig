
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PaymentRequest {
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
  billingType: 'BOLETO' | 'CREDIT_CARD' | 'PIX'
  value: number
  dueDate: string
  description: string
  externalReference?: string
  tipoCobranca: string
  referenciaId?: string
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

    // Verificar autenticação
    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) {
      return new Response('Não autorizado', { status: 401, headers: corsHeaders })
    }

    const paymentData: PaymentRequest = await req.json()
    const asaasApiKey = Deno.env.get('ASAAS_API_KEY')

    if (!asaasApiKey) {
      return new Response('Chave da API Asaas não configurada', { status: 500, headers: corsHeaders })
    }

    console.log('Criando cobrança para usuário:', user.id)
    console.log('Dados do pagamento:', paymentData)

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

    console.log('ID do cliente:', customerId)

    // Criar a cobrança no Asaas
    const paymentPayload = {
      customer: customerId,
      billingType: paymentData.billingType,
      value: paymentData.value,
      dueDate: paymentData.dueDate,
      description: paymentData.description,
      externalReference: paymentData.externalReference || user.id,
      postalService: false
    }

    const paymentResponse = await fetch('https://www.asaas.com/api/v3/payments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access_token': asaasApiKey,
      },
      body: JSON.stringify(paymentPayload)
    })

    if (!paymentResponse.ok) {
      const errorData = await paymentResponse.json()
      console.error('Erro na API do Asaas:', errorData)
      return new Response(JSON.stringify({ error: errorData }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const asaasPayment = await paymentResponse.json()
    console.log('Cobrança criada no Asaas:', asaasPayment.id)

    // Salvar a cobrança no banco de dados
    const { data: cobranca, error: dbError } = await supabaseClient
      .from('asaas_cobrancas')
      .insert({
        user_id: user.id,
        asaas_id: asaasPayment.id,
        customer_id: customerId,
        valor: paymentData.value,
        descricao: paymentData.description,
        data_vencimento: paymentData.dueDate,
        status: asaasPayment.status,
        forma_pagamento: paymentData.billingType,
        url_pagamento: asaasPayment.invoiceUrl,
        linha_digitavel: asaasPayment.bankSlipUrl,
        tipo_cobranca: paymentData.tipoCobranca,
        referencia_id: paymentData.referenciaId
      })
      .select()
      .single()

    if (dbError) {
      console.error('Erro ao salvar cobrança no banco:', dbError)
      return new Response(JSON.stringify({ error: dbError }), { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Se for PIX, buscar QR Code
    let pixQrCode = null
    if (paymentData.billingType === 'PIX') {
      const pixResponse = await fetch(`https://www.asaas.com/api/v3/payments/${asaasPayment.id}/pixQrCode`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'access_token': asaasApiKey,
        }
      })

      if (pixResponse.ok) {
        const pixData = await pixResponse.json()
        pixQrCode = pixData.payload

        // Atualizar com QR Code do PIX
        await supabaseClient
          .from('asaas_cobrancas')
          .update({ qr_code_pix: pixQrCode })
          .eq('id', cobranca.id)
      }
    }

    return new Response(JSON.stringify({
      success: true,
      cobranca: {
        ...cobranca,
        qr_code_pix: pixQrCode,
        asaas_data: asaasPayment
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Erro geral:', error)
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
