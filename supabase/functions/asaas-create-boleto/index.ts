/**
 * Edge Function: Criar Boleto Bancário no Asaas
 * 
 * Gera boletos bancários com linha digitável e URL do PDF
 * Suporta segunda via e controle de vencimento
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Imports compartilhados
import { asaasClient } from '../shared/asaas-client.ts';
import type { 
  CreatePaymentData,
  AsaasPayment,
  ServiceType,
  ServiceData
} from '../shared/types.ts';

// Tipos específicos para boleto
interface CreateBoletoPaymentRequest {
  customer_id: string;
  service_type: ServiceType;
  service_data: ServiceData;
  payment_data: {
    value: number;
    dueDate: string;
    description: string;
    externalReference?: string;
    fine?: {
      value: number;
      type: 'FIXED' | 'PERCENTAGE';
    };
    interest?: {
      value: number;
      type: 'PERCENTAGE';
    };
  };
  user_id: string;
}

interface BoletoPaymentResponse {
  success: boolean;
  payment_id: string;
  asaas_id: string;
  boleto_url: string;
  linha_digitavel: string;
  nosso_numero: string;
  due_date: string;
  value: number;
  message: string;
}

// Cliente Supabase
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Cria boleto bancário no Asaas
 */
async function createBoletoAsaas(
  customerId: string,
  paymentData: CreateBoletoPaymentRequest['payment_data']
): Promise<AsaasPayment> {
  
  const boletoPaymentData: CreatePaymentData = {
    customer: customerId,
    billingType: 'BOLETO',
    value: paymentData.value,
    dueDate: paymentData.dueDate,
    description: paymentData.description,
    externalReference: paymentData.externalReference,
    fine: paymentData.fine,
    interest: paymentData.interest,
    postalService: false // Não enviar por correio
  };

  return await asaasClient.post<AsaasPayment>('/payments', boletoPaymentData);
}

/**
 * Salva boleto no banco local
 */
async function saveBoletoLocally(
  userId: string,
  asaasPayment: AsaasPayment,
  serviceType: ServiceType,
  serviceData: ServiceData
): Promise<string> {
  
  const { data, error } = await supabase
    .from('asaas_cobrancas')
    .insert({
      user_id: userId,
      asaas_id: asaasPayment.id,
      customer_id: asaasPayment.customer,
      valor: asaasPayment.value,
      net_value: asaasPayment.netValue,
      original_value: asaasPayment.originalValue,
      descricao: asaasPayment.description || '',
      forma_pagamento: 'BOLETO',
      status: asaasPayment.status,
      data_vencimento: asaasPayment.dueDate,
      original_due_date: asaasPayment.originalDueDate,
      data_pagamento: asaasPayment.paymentDate,
      linha_digitavel: asaasPayment.identificationField,
      nosso_numero: asaasPayment.nossoNumero,
      url_pagamento: asaasPayment.bankSlipUrl,
      invoice_url: asaasPayment.invoiceUrl,
      service_type: serviceType,
      service_data: serviceData,
      external_reference: asaasPayment.externalReference
    })
    .select('id')
    .single();

  if (error) {
    throw new Error(`Erro ao salvar boleto localmente: ${error.message}`);
  }

  return data.id;
}

/**
 * Valida dados de entrada
 */
function validateBoletoData(data: CreateBoletoPaymentRequest): string[] {
  const errors: string[] = [];

  if (!data.customer_id) {
    errors.push('customer_id é obrigatório');
  }

  if (!data.user_id) {
    errors.push('user_id é obrigatório');
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
    } else {
      const dueDate = new Date(data.payment_data.dueDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (dueDate < today) {
        errors.push('Data de vencimento deve ser futura');
      }
    }

    if (!data.payment_data.description) {
      errors.push('Descrição é obrigatória');
    }

    // Validar multa se informada
    if (data.payment_data.fine) {
      if (data.payment_data.fine.value <= 0) {
        errors.push('Valor da multa deve ser maior que zero');
      }
      if (data.payment_data.fine.type === 'PERCENTAGE' && data.payment_data.fine.value > 100) {
        errors.push('Percentual de multa não pode ser maior que 100%');
      }
    }

    // Validar juros se informados
    if (data.payment_data.interest) {
      if (data.payment_data.interest.value <= 0) {
        errors.push('Valor dos juros deve ser maior que zero');
      }
      if (data.payment_data.interest.value > 100) {
        errors.push('Percentual de juros não pode ser maior que 100%');
      }
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
    // Verificar método
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Método não permitido' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse do body
    const requestData: CreateBoletoPaymentRequest = await req.json();

    // Validar dados de entrada
    const validationErrors = validateBoletoData(requestData);
    if (validationErrors.length > 0) {
      return new Response(
        JSON.stringify({ error: 'Dados inválidos', details: validationErrors }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Criando boleto bancário no Asaas...');
    console.log('Customer ID:', requestData.customer_id);
    console.log('Valor:', requestData.payment_data.value);
    console.log('Vencimento:', requestData.payment_data.dueDate);

    // Criar boleto no Asaas
    const asaasPayment = await createBoletoAsaas(
      requestData.customer_id,
      requestData.payment_data
    );

    console.log('Boleto criado no Asaas:', asaasPayment.id);

    // Verificar se o boleto foi gerado corretamente
    if (!asaasPayment.bankSlipUrl || !asaasPayment.identificationField) {
      throw new Error('Boleto não foi gerado corretamente pelo Asaas');
    }

    // Salvar no banco local
    const localPaymentId = await saveBoletoLocally(
      requestData.user_id,
      asaasPayment,
      requestData.service_type,
      requestData.service_data
    );

    console.log('Boleto salvo localmente:', localPaymentId);

    // Resposta de sucesso
    const response: BoletoPaymentResponse = {
      success: true,
      payment_id: localPaymentId,
      asaas_id: asaasPayment.id,
      boleto_url: asaasPayment.bankSlipUrl,
      linha_digitavel: asaasPayment.identificationField,
      nosso_numero: asaasPayment.nossoNumero || '',
      due_date: asaasPayment.dueDate,
      value: asaasPayment.value,
      message: 'Boleto gerado com sucesso'
    };

    return new Response(
      JSON.stringify(response),
      { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro na Edge Function de boleto:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Erro interno do servidor',
        message: error instanceof Error ? error.message : 'Erro desconhecido'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});