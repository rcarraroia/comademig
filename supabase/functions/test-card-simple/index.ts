/**
 * Função de teste simplificada para pagamento com cartão
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

serve(async (req) => {
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('🧪 Iniciando teste simplificado de cartão');

    // Verificar método
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Método não permitido' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse do body
    const requestData = await req.json();
    console.log('📋 Dados recebidos:', JSON.stringify(requestData, null, 2));

    // Verificar se temos os dados básicos
    if (!requestData.customer_id) {
      return new Response(
        JSON.stringify({ error: 'customer_id é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Testar acesso às variáveis de ambiente
    const apiKey = Deno.env.get('ASAAS_API_KEY');
    const baseUrl = Deno.env.get('ASAAS_BASE_URL');
    
    console.log('🔑 API Key disponível:', apiKey ? 'SIM' : 'NÃO');
    console.log('🌐 Base URL:', baseUrl);

    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'ASAAS_API_KEY não configurada' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Testar chamada simples para API Asaas
    console.log('📞 Testando chamada para API Asaas...');
    
    const testUrl = `${baseUrl}/customers/${requestData.customer_id}`;
    const response = await fetch(testUrl, {
      method: 'GET',
      headers: {
        'access_token': apiKey,
        'Content-Type': 'application/json',
        'User-Agent': 'COMADEMIG-Test/1.0'
      }
    });

    const asaasData = await response.json();
    console.log('📥 Resposta Asaas:', JSON.stringify(asaasData, null, 2));

    if (!response.ok) {
      return new Response(
        JSON.stringify({ 
          error: 'Erro na API Asaas', 
          details: asaasData,
          status: response.status 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Sucesso
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Teste básico funcionando',
        customer_data: asaasData,
        api_key_valid: true,
        base_url: baseUrl
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Erro na função de teste:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Erro interno',
        message: error instanceof Error ? error.message : 'Erro desconhecido',
        stack: error instanceof Error ? error.stack : undefined
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});