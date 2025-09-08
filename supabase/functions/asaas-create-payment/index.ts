
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
  serviceType?: 'certidao' | 'regularizacao' | 'filiacao'
  serviceData?: any
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

    // Verificar autenticação
    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) {
      console.error('Usuário não autenticado')
      return new Response(JSON.stringify({ error: 'Não autorizado' }), { 
        status: 401, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const paymentData: PaymentRequest = await req.json()
    const asaasApiKey = Deno.env.get('ASAAS_API_KEY')

    if (!asaasApiKey) {
      console.error('ASAAS_API_KEY não configurada')
      return new Response(JSON.stringify({ error: 'Chave da API Asaas não configurada' }), { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    console.log('Criando cobrança para usuário:', user.id)
    console.log('Tipo de serviço:', paymentData.serviceType || paymentData.tipoCobranca)
    console.log('Valor da cobrança:', paymentData.value)

    // Validações aprimoradas
    const validationErrors = []
    
    if (!paymentData.customer?.name) validationErrors.push('Nome do cliente é obrigatório')
    if (!paymentData.customer?.email) validationErrors.push('Email do cliente é obrigatório')
    if (!paymentData.customer?.cpfCnpj) validationErrors.push('CPF/CNPJ do cliente é obrigatório')
    if (!paymentData.value || paymentData.value <= 0) validationErrors.push('Valor deve ser maior que zero')
    if (!paymentData.description) validationErrors.push('Descrição é obrigatória')
    if (!paymentData.dueDate) validationErrors.push('Data de vencimento é obrigatória')
    if (!paymentData.billingType) validationErrors.push('Tipo de cobrança é obrigatório')

    if (validationErrors.length > 0) {
      console.error('Dados inválidos:', validationErrors)
      return new Response(JSON.stringify({ 
        error: 'Dados inválidos', 
        details: validationErrors 
      }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Criar/buscar cliente no Asaas com retry logic
    const customerId = await createOrFindCustomer(paymentData.customer, asaasApiKey)

    // Criar a cobrança no Asaas com retry
    const asaasPayment = await createAsaasPayment(customerId, paymentData, asaasApiKey, user.id)

    // Salvar a cobrança no banco de dados com dados do serviço
    const cobrancaData = {
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
      referencia_id: paymentData.referenciaId,
      service_type: paymentData.serviceType || paymentData.tipoCobranca,
      service_data: paymentData.serviceData || null
    }

    let cobranca: any
    const { data: cobrancaResult, error: dbError } = await supabaseClient
      .from('asaas_cobrancas')
      .insert(cobrancaData)
      .select()
      .single()

    if (dbError) {
      console.error('Erro ao salvar cobrança no banco:', dbError)
      // Tentar sem os novos campos se der erro de coluna não existente
      if (dbError.message?.includes('column') && (dbError.message?.includes('service_type') || dbError.message?.includes('service_data'))) {
        console.log('Tentando salvar sem campos service_type/service_data...')
        const { service_type, service_data, ...cobrancaDataLegacy } = cobrancaData
        const { data: cobrancaLegacy, error: dbErrorLegacy } = await supabaseClient
          .from('asaas_cobrancas')
          .insert(cobrancaDataLegacy)
          .select()
          .single()
        
        if (dbErrorLegacy) {
          console.error('Erro ao salvar cobrança (modo legacy):', dbErrorLegacy)
          return new Response(JSON.stringify({ error: 'Erro ao salvar cobrança no banco', details: dbErrorLegacy }), { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }
        
        cobranca = cobrancaLegacy
      } else {
        return new Response(JSON.stringify({ error: 'Erro ao salvar cobrança no banco', details: dbError }), { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }
    } else {
      cobranca = cobrancaResult
    }

    // Se for PIX, buscar QR Code com retry
    let pixQrCode = null
    if (paymentData.billingType === 'PIX') {
      pixQrCode = await getPixQrCode(asaasPayment.id, asaasApiKey, supabaseClient, cobranca.id)
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

// Função auxiliar para criar/buscar cliente com retry
async function createOrFindCustomer(customerData: any, asaasApiKey: string, maxRetries = 3): Promise<string> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Tentativa ${attempt} de criar/buscar cliente:`, customerData.name)
      
      // Tentar criar cliente
      const customerResponse = await fetch('https://www.asaas.com/api/v3/customers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'access_token': asaasApiKey,
        },
        body: JSON.stringify(customerData)
      })

      if (customerResponse.status === 400) {
        // Cliente já existe, buscar pelo CPF
        console.log('Cliente já existe, buscando pelo CPF:', customerData.cpfCnpj)
        const searchResponse = await fetch(`https://www.asaas.com/api/v3/customers?cpfCnpj=${encodeURIComponent(customerData.cpfCnpj)}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'access_token': asaasApiKey,
          }
        })
        
        if (!searchResponse.ok) {
          const searchError = await searchResponse.json()
          console.error(`Erro ao buscar cliente (tentativa ${attempt}):`, searchError)
          
          if (attempt === maxRetries) {
            throw new Error(`Erro ao buscar cliente existente: ${JSON.stringify(searchError)}`)
          }
          continue
        }
        
        const searchData = await searchResponse.json()
        const customerId = searchData.data?.[0]?.id
        
        if (!customerId) {
          throw new Error('Cliente não encontrado após busca por CPF')
        }
        
        console.log('Cliente encontrado:', customerId)
        return customerId
        
      } else if (!customerResponse.ok) {
        const customerError = await customerResponse.json()
        console.error(`Erro ao criar cliente (tentativa ${attempt}):`, customerError)
        
        if (attempt === maxRetries) {
          throw new Error(`Erro ao criar cliente: ${JSON.stringify(customerError)}`)
        }
        
        // Aguardar antes de tentar novamente
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt))
        continue
        
      } else {
        const customerResponseData = await customerResponse.json()
        console.log('Cliente criado:', customerResponseData.id)
        return customerResponseData.id
      }
      
    } catch (error) {
      console.error(`Erro na tentativa ${attempt}:`, error)
      
      if (attempt === maxRetries) {
        throw error
      }
      
      // Aguardar antes de tentar novamente
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt))
    }
  }
  
  throw new Error('Falha ao criar/buscar cliente após todas as tentativas')
}

// Função auxiliar para criar cobrança no Asaas com retry
async function createAsaasPayment(customerId: string, paymentData: any, asaasApiKey: string, userId: string, maxRetries = 3): Promise<any> {
  const paymentPayload = {
    customer: customerId,
    billingType: paymentData.billingType,
    value: paymentData.value,
    dueDate: paymentData.dueDate,
    description: paymentData.description,
    externalReference: paymentData.externalReference || userId,
    postalService: false
  }

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Tentativa ${attempt} de criar cobrança no Asaas`)
      
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
        console.error(`Erro na API do Asaas (tentativa ${attempt}):`, errorData)
        
        // Se for erro de validação (400), não tentar novamente
        if (paymentResponse.status === 400) {
          throw new Error(`Erro de validação: ${JSON.stringify(errorData)}`)
        }
        
        if (attempt === maxRetries) {
          throw new Error(`Erro na API do Asaas: ${JSON.stringify(errorData)}`)
        }
        
        // Aguardar antes de tentar novamente
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt))
        continue
      }

      const asaasPayment = await paymentResponse.json()
      console.log('Cobrança criada no Asaas:', asaasPayment.id)
      return asaasPayment
      
    } catch (error) {
      console.error(`Erro na tentativa ${attempt}:`, error)
      
      if (attempt === maxRetries) {
        throw error
      }
      
      // Aguardar antes de tentar novamente
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt))
    }
  }
  
  throw new Error('Falha ao criar cobrança após todas as tentativas')
}

// Função auxiliar para buscar QR Code PIX com retry
async function getPixQrCode(paymentId: string, asaasApiKey: string, supabaseClient: any, cobrancaId: string, maxRetries = 3): Promise<string | null> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Tentativa ${attempt} de buscar QR Code PIX`)
      
      const pixResponse = await fetch(`https://www.asaas.com/api/v3/payments/${paymentId}/pixQrCode`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'access_token': asaasApiKey,
        }
      })

      if (!pixResponse.ok) {
        console.error(`Erro ao buscar QR Code (tentativa ${attempt}):`, pixResponse.status)
        
        if (attempt === maxRetries) {
          console.error('Falha ao buscar QR Code após todas as tentativas')
          return null
        }
        
        // Aguardar antes de tentar novamente
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt))
        continue
      }

      const pixData = await pixResponse.json()
      const qrCode = pixData.payload

      if (qrCode) {
        // Atualizar com QR Code do PIX
        await supabaseClient
          .from('asaas_cobrancas')
          .update({ qr_code_pix: qrCode })
          .eq('id', cobrancaId)
        
        console.log('QR Code PIX obtido e salvo com sucesso')
        return qrCode
      }
      
    } catch (error) {
      console.error(`Erro na tentativa ${attempt} de buscar QR Code:`, error)
      
      if (attempt === maxRetries) {
        console.error('Falha ao buscar QR Code após todas as tentativas')
        return null
      }
      
      // Aguardar antes de tentar novamente
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt))
    }
  }
  
  return null
}
