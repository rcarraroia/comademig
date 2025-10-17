/**
 * Edge Function: Criar Pagamento PIX no Asaas
 * 
 * Cria cobranças PIX no Asaas com desconto automático de 5%
 * Gera QR Code e código copia-e-cola para pagamento instantâneo
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Imports compartilhados
import { asaasClient } from '../shared/asaas-client.ts';
import { logInfo, logError, logWarning } from '../shared/logger.ts';
import type { 
  CreatePaymentData,
  AsaasPayment,
  ServiceType,
  ServiceData
} from '../shared/types.ts';

// Tipos específicos para PIX
interface CreatePixPaymentRequest {
  customer_id: string;
  service_type: ServiceType;
  service_data: ServiceData;
  payment_data: {
    value: number;
    dueDate: string;
    description: string;
    externalReference?: string;
  };
  user_id: string; // OBRIGATÓRIO - Conta deve ser criada antes do pagamento
}

interface PixPaymentResponse {
  success: boolean;
  payment_id: string;
  asaas_id: string;
  qr_code: string;
  copy_paste_code: string;
  expiration_date: string;
  original_value: number;
  discounted_value: number;
  discount_percentage: number;
  message: string;
}

// Cliente Supabase
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Aplica desconto de 5% para pagamentos PIX
 */
function applyPixDiscount(originalValue: number): { discountedValue: number; discountAmount: number } {
  const discountPercentage = 5; // 5% de desconto para PIX
  const discountAmount = originalValue * (discountPercentage / 100);
  const discountedValue = originalValue - discountAmount;
  
  return {
    discountedValue: Math.round(discountedValue * 100) / 100, // Arredondar para 2 casas decimais
    discountAmount: Math.round(discountAmount * 100) / 100
  };
}

/**
 * Cria cobrança PIX no Asaas
 */
async function createPixPaymentAsaas(
  customerId: string,
  paymentData: CreatePixPaymentRequest['payment_data']
): Promise<AsaasPayment> {
  
  // Aplicar desconto PIX
  const { discountedValue } = applyPixDiscount(paymentData.value);
  
  const pixPaymentData: CreatePaymentData = {
    customer: customerId,
    billingType: 'PIX',
    value: discountedValue,
    dueDate: paymentData.dueDate,
    description: `${paymentData.description} (PIX - 5% desconto)`,
    externalReference: paymentData.externalReference,
    discount: {
      value: 5,
      type: 'PERCENTAGE',
      dueDateLimitDays: 0 // Desconto válido até o vencimento
    }
  };

  return await asaasClient.post<AsaasPayment>('/payments', pixPaymentData);
}

/**
 * Salva cobrança no banco local
 */
async function savePaymentLocally(
  userId: string, // OBRIGATÓRIO - conta deve existir antes do pagamento
  asaasPayment: AsaasPayment,
  serviceType: ServiceType,
  serviceData: ServiceData,
  originalValue: number
): Promise<string> {
  
  const { data, error} = await supabase
    .from('asaas_cobrancas')
    .insert({
      user_id: userId, // Sempre obrigatório
      asaas_id: asaasPayment.id,
      customer_id: asaasPayment.customer,
      valor: originalValue, // Valor original
      net_value: asaasPayment.value, // Valor com desconto
      descricao: asaasPayment.description || '',
      forma_pagamento: 'PIX',
      status: asaasPayment.status,
      data_vencimento: asaasPayment.dueDate,
      qr_code_pix: asaasPayment.pixTransaction?.qrCode?.payload,
      pix_copy_paste: asaasPayment.pixTransaction?.qrCode?.payload,
      pix_expiration_date: asaasPayment.pixTransaction?.expirationDate,
      service_type: serviceType,
      service_data: serviceData,
      external_reference: asaasPayment.externalReference,
      url_pagamento: asaasPayment.invoiceUrl
    })
    .select('id')
    .single();

  if (error) {
    throw new Error(`Erro ao salvar cobrança localmente: ${error.message}`);
  }

  return data.id;
}

/**
 * Valida dados de entrada
 */
function validatePixPaymentData(data: CreatePixPaymentRequest): string[] {
  const errors: string[] = [];

  if (!data.customer_id) {
    errors.push('customer_id é obrigatório');
  }

  if (!data.user_id) {
    errors.push('user_id é obrigatório - conta deve ser criada antes do pagamento');
  }

  if (!data.service_type) {
    errors.push('service_type é obrigatório');
  }

  if (!data.payment_data) {
    errors.push('payment_data é obrigatório');
  } else {
    if (!data.payment_data.value || data.payment_data.value <= 0) {
      errors.push('Valor deve ser maior que zero');
    }

    if (!data.payment_data.dueDate) {
      errors.push('Data de vencimento é obrigatória');
    }

    if (!data.payment_data.description) {
      errors.push('Descrição é obrigatória');
    }
  }

  return errors;
}

/**
 * Handler principal da Edge Function
 */
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
    console.log('🚀 Edge Function PIX iniciada');
    console.log('Método:', req.method);
    console.log('URL:', req.url);
    
    // Verificar método
    if (req.method !== 'POST') {
      console.log('❌ Método não permitido:', req.method);
      return new Response(
        JSON.stringify({ error: 'Método não permitido' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse do body
    console.log('📦 Fazendo parse do body...');
    const requestData: CreatePixPaymentRequest = await req.json();
    console.log('✅ Body parseado:', JSON.stringify(requestData, null, 2));

    // Validar dados de entrada
    const validationErrors = validatePixPaymentData(requestData);
    if (validationErrors.length > 0) {
      await logWarning({
        source: 'edge_function',
        functionName: 'asaas-create-pix-payment',
        message: 'Dados inválidos para criação de PIX',
        details: { errors: validationErrors },
        userId: requestData.user_id
      });
      
      return new Response(
        JSON.stringify({ error: 'Dados inválidos', details: validationErrors }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Log: Iniciando criação de PIX
    await logInfo({
      source: 'edge_function',
      functionName: 'asaas-create-pix-payment',
      message: 'Iniciando criação de pagamento PIX',
      details: {
        customer_id: requestData.customer_id,
        original_value: requestData.payment_data.value,
        service_type: requestData.service_type
      },
      userId: requestData.user_id
    });

    console.log('Criando pagamento PIX no Asaas...');
    console.log('Customer ID:', requestData.customer_id);
    console.log('Valor original:', requestData.payment_data.value);

    // Calcular desconto
    const { discountedValue, discountAmount } = applyPixDiscount(requestData.payment_data.value);
    console.log('Valor com desconto PIX:', discountedValue);
    console.log('Desconto aplicado:', discountAmount);

    // Criar cobrança PIX no Asaas
    const asaasPayment = await createPixPaymentAsaas(
      requestData.customer_id,
      requestData.payment_data
    );

    console.log('Pagamento PIX criado no Asaas:', asaasPayment.id);
    console.log('Resposta completa do Asaas:', JSON.stringify(asaasPayment, null, 2));

    // Verificar se o PIX foi gerado corretamente
    if (!asaasPayment.pixTransaction?.qrCode?.payload) {
      console.warn('⚠️ QR Code PIX não foi gerado imediatamente pelo Asaas');
      console.warn('pixTransaction:', asaasPayment.pixTransaction);
      // Não vamos lançar erro, vamos salvar mesmo assim e o QR Code pode ser gerado depois
    }

    // Salvar no banco local
    const localPaymentId = await savePaymentLocally(
      requestData.user_id,
      asaasPayment,
      requestData.service_type,
      requestData.service_data,
      requestData.payment_data.value
    );

    console.log('Pagamento salvo localmente:', localPaymentId);

    // Log: PIX criado com sucesso
    await logInfo({
      source: 'edge_function',
      functionName: 'asaas-create-pix-payment',
      message: 'Pagamento PIX criado com sucesso',
      details: {
        payment_id: localPaymentId,
        asaas_id: asaasPayment.id,
        original_value: requestData.payment_data.value,
        discounted_value: discountedValue,
        discount_amount: discountAmount,
        has_qr_code: !!asaasPayment.pixTransaction?.qrCode?.payload
      },
      userId: requestData.user_id
    });

    // Resposta de sucesso
    const response: PixPaymentResponse = {
      success: true,
      payment_id: localPaymentId,
      asaas_id: asaasPayment.id,
      qr_code: asaasPayment.pixTransaction?.qrCode?.encodedImage || asaasPayment.pixTransaction?.qrCode?.payload || '',
      copy_paste_code: asaasPayment.pixTransaction?.qrCode?.payload || '',
      expiration_date: asaasPayment.pixTransaction?.expirationDate || '',
      original_value: requestData.payment_data.value,
      discounted_value: discountedValue,
      discount_percentage: 5,
      message: asaasPayment.pixTransaction?.qrCode?.payload 
        ? 'Pagamento PIX criado com sucesso' 
        : 'Pagamento PIX criado. QR Code será gerado em instantes.'
    };

    return new Response(
      JSON.stringify(response),
      { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    // Log detalhado do erro
    console.error('❌ ERRO CRÍTICO NA EDGE FUNCTION PIX');
    console.error('Tipo do erro:', error instanceof Error ? error.constructor.name : typeof error);
    console.error('Mensagem:', error instanceof Error ? error.message : String(error));
    console.error('Stack:', error instanceof Error ? error.stack : 'N/A');
    console.error('Erro completo:', JSON.stringify(error, null, 2));
    
    // Log: Erro ao criar PIX
    try {
      await logError({
        source: 'edge_function',
        functionName: 'asaas-create-pix-payment',
        message: 'Erro ao criar pagamento PIX',
        error: error as Error
      });
    } catch (logErr) {
      console.error('Erro ao salvar log:', logErr);
    }
    
    return new Response(
      JSON.stringify({ 
        error: 'Erro interno do servidor',
        message: error instanceof Error ? error.message : 'Erro desconhecido',
        details: error instanceof Error ? error.stack : String(error)
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});