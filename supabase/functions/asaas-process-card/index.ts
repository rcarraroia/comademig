import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { paymentId, customerData, cardData } = await req.json()
    const asaasApiKey = Deno.env.get('ASAAS_API_KEY')

    if (!asaasApiKey) {
      throw new Error('ASAAS_API_KEY não configurada')
    }

    // Processar pagamento com cartão
    const cardPayload = {
      creditCard: {
        holderName: cardData.holderName,
        number: cardData.number.replace(/\s/g, ''),
        expiryMonth: cardData.expiryMonth,
        expiryYear: cardData.expiryYear,
        ccv: cardData.ccv
      },
      creditCardHolderInfo: {
        name: customerData.name,
        email: customerData.email,
        cpfCnpj: customerData.cpfCnpj.replace(/\D/g, ''),
        postalCode: "01310-100", // Fallback
        addressNumber: "123", // Fallback
        phone: customerData.phone?.replace(/\D/g, '') || "11999999999"
      }
    }

    const cardResponse = await fetch(`https://www.asaas.com/api/v3/payments/${paymentId}/payWithCreditCard`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access_token': asaasApiKey,
      },
      body: JSON.stringify(cardPayload)
    })

    const cardResult = await cardResponse.json()

    if (!cardResponse.ok) {
      throw new Error(cardResult.errors?.[0]?.description || 'Erro ao processar cartão')
    }

    return new Response(JSON.stringify({
      success: cardResult.status === 'CONFIRMED',
      status: cardResult.status,
      transactionReceiptUrl: cardResult.transactionReceiptUrl,
      error: cardResult.status !== 'CONFIRMED' ? 'Pagamento não aprovado' : null
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Erro ao processar cartão:', error)
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message 
    }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})