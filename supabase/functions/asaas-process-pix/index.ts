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
    const { paymentId, customerData } = await req.json()
    const asaasApiKey = Deno.env.get('ASAAS_API_KEY')

    if (!asaasApiKey) {
      throw new Error('ASAAS_API_KEY não configurada')
    }

    // Buscar QR Code PIX
    const pixResponse = await fetch(`https://www.asaas.com/api/v3/payments/${paymentId}/pixQrCode`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'access_token': asaasApiKey,
      }
    })

    if (!pixResponse.ok) {
      throw new Error('Erro ao buscar QR Code PIX')
    }

    const pixData = await pixResponse.json()

    return new Response(JSON.stringify({
      success: true,
      qrCode: pixData.payload,
      encodedImage: pixData.encodedImage
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Erro ao processar PIX:', error)
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message 
    }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})