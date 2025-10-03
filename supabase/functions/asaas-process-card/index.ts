/**
 * Edge Function: Processar Pagamento com Cartão de Crédito
 * 
 * Tokeniza cartão e processa pagamento via API Asaas
 * Suporta pagamento à vista e assinaturas recorrentes
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Imports compartilhados
import { asaasClient } from '../shared/asaas-client.ts';
import { validateCpfCnpj, validateEmail, validatePhone, formatCpfCnpj, formatPhone } from '../shared/validation.ts';
import type { 
  CreatePaymentData,
  AsaasPayment,
  ServiceType,
  ServiceData
} from '../shared/types.ts';

// Tipos específicos para cartão
interface CreditCardData {
  holderName: string;
  number: string;
  expiryMonth: string;
  expiryYear: string;
  ccv: string;
}

interface CreditCardHolderInfo {
  name: string;
  email: string;
  cpfCnpj: string;
  postalCode: string;
  addressNumber: string;
  addressComplement?: string;
  phone: string;
  mobilePhone?: string;
}

interface ProcessCardPaymentRequest {
  customer_id: string;
  service_type: ServiceType;
  service_data: ServiceData;
  payment_data: {
    value: number;
    dueDate: string;
    description: string;
    externalReference?: string;
    installmentCount?: number;
  };
  credit_card: CreditCardData;
  credit_card_holder_info: CreditCardHolderInfo;
  user_id: string;
  save_card?: boolean; // Para assinaturas recorrentes
}

interface CardPaymentResponse {
  success: boolean;
  payment_id: string;
  asaas_id: string;
  status: string;
  invoice_url?: string;
  credit_card_token?: string;
  installment_count?: number;
  installment_value?: number;
  message: string;
}

// Cliente Supabase
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Valida dados do cartão de crédito
 */
function validateCreditCard(cardData: CreditCardData): string[] {
  const errors: string[] = [];

  if (!cardData.holderName || cardData.holderName.trim().length < 2) {
    errors.push('Nome do portador é obrigatório');
  }

  if (!cardData.number || cardData.number.replace(/\D/g, '').length < 13) {
    errors.push('Número do cartão deve ter pelo menos 13 dígitos');
  }

  if (!cardData.expiryMonth || !cardData.expiryYear) {
    errors.push('Mês e ano de expiração são obrigatórios');
  } else {
    const month = parseInt(cardData.expiryMonth);
    const year = parseInt(cardData.expiryYear);
    const currentYear = new Date().getFullYear();
    
    if (month < 1 || month > 12) {
      errors.push('Mês de expiração inválido');
    }
    
    if (year < currentYear || year > currentYear + 20) {
      errors.push('Ano de expiração inválido');
    }
  }

  if (!cardData.ccv || cardData.ccv.length < 3) {
    errors.push('CCV deve ter pelo menos 3 dígitos');
  }

  return errors;
}

/**
 * Valida dados do portador do cartão
 */
function validateCardHolder(holderInfo: CreditCardHolderInfo): string[] {
  const errors: string[] = [];

  if (!holderInfo.name || holderInfo.name.trim().length < 2) {
    errors.push('Nome do portador é obrigatório');
  }

  if (!holderInfo.email || !validateEmail(holderInfo.email)) {
    errors.push('Email válido é obrigatório');
  }

  if (!holderInfo.cpfCnpj || !validateCpfCnpj(holderInfo.cpfCnpj)) {
    errors.push('CPF/CNPJ válido é obrigatório');
  }

  if (!holderInfo.postalCode || holderInfo.postalCode.replace(/\D/g, '').length !== 8) {
    errors.push('CEP deve ter 8 dígitos');
  }

  if (!holderInfo.addressNumber) {
    errors.push('Número do endereço é obrigatório');
  }

  if (!holderInfo.phone || !validatePhone(holderInfo.phone)) {
    errors.push('Telefone válido é obrigatório');
  }

  return errors;
}

/**
 * Cria pagamento com cartão no Asaas
 */
async function createCardPaymentAsaas(
  customerId: string,
  paymentData: ProcessCardPaymentRequest['payment_data'],
  creditCard: CreditCardData,
  holderInfo: CreditCardHolderInfo,
  remoteIp?: string
): Promise<AsaasPayment> {
  
  const cardPaymentData: CreatePaymentData = {
    customer: customerId,
    billingType: 'CREDIT_CARD',
    value: paymentData.value,
    dueDate: paymentData.dueDate,
    description: paymentData.description,
    externalReference: paymentData.externalReference,
    installmentCount: paymentData.installmentCount || 1,
    creditCard: {
      holderName: creditCard.holderName,
      number: creditCard.number.replace(/\D/g, ''), // Remove formatação
      expiryMonth: creditCard.expiryMonth.padStart(2, '0'),
      expiryYear: creditCard.expiryYear,
      ccv: creditCard.ccv
    },
    creditCardHolderInfo: {
      name: holderInfo.name,
      email: holderInfo.email,
      cpfCnpj: formatCpfCnpj(holderInfo.cpfCnpj),
      postalCode: holderInfo.postalCode.replace(/\D/g, ''),
      addressNumber: holderInfo.addressNumber,
      addressComplement: holderInfo.addressComplement,
      phone: formatPhone(holderInfo.phone),
      mobilePhone: holderInfo.mobilePhone ? formatPhone(holderInfo.mobilePhone) : undefined
    },
    remoteIp: remoteIp || '127.0.0.1'
  };

  return await asaasClient.post<AsaasPayment>('/payments', cardPaymentData);
}

/**
 * Salva pagamento com cartão no banco local
 */
async function saveCardPaymentLocally(
  userId: string,
  asaasPayment: AsaasPayment,
  serviceType: ServiceType,
  serviceData: ServiceData,
  installmentCount?: number
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
      forma_pagamento: 'CREDIT_CARD',
      status: asaasPayment.status,
      data_vencimento: asaasPayment.dueDate,
      data_pagamento: asaasPayment.paymentDate,
      installment_number: asaasPayment.installmentNumber || 1,
      credit_card_number: asaasPayment.creditCard?.creditCardNumber,
      credit_card_brand: asaasPayment.creditCard?.creditCardBrand,
      credit_card_token: asaasPayment.creditCard?.creditCardToken,
      service_type: serviceType,
      service_data: serviceData,
      external_reference: asaasPayment.externalReference,
      url_pagamento: asaasPayment.invoiceUrl
    })
    .select('id')
    .single();

  if (error) {
    throw new Error(`Erro ao salvar pagamento localmente: ${error.message}`);
  }

  return data.id;
}

/**
 * Valida dados de entrada
 */
function validateCardPaymentData(data: ProcessCardPaymentRequest): string[] {
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
    }

    if (!data.payment_data.description) {
      errors.push('Descrição é obrigatória');
    }

    if (data.payment_data.installmentCount && (data.payment_data.installmentCount < 1 || data.payment_data.installmentCount > 12)) {
      errors.push('Número de parcelas deve ser entre 1 e 12');
    }
  }

  if (!data.credit_card) {
    errors.push('Dados do cartão são obrigatórios');
  } else {
    errors.push(...validateCreditCard(data.credit_card));
  }

  if (!data.credit_card_holder_info) {
    errors.push('Dados do portador são obrigatórios');
  } else {
    errors.push(...validateCardHolder(data.credit_card_holder_info));
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
    const requestData: ProcessCardPaymentRequest = await req.json();

    // Validar dados de entrada
    const validationErrors = validateCardPaymentData(requestData);
    if (validationErrors.length > 0) {
      return new Response(
        JSON.stringify({ error: 'Dados inválidos', details: validationErrors }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Processando pagamento com cartão...');
    console.log('Customer ID:', requestData.customer_id);
    console.log('Valor:', requestData.payment_data.value);
    console.log('Parcelas:', requestData.payment_data.installmentCount || 1);

    // Obter IP do cliente para análise de fraude
    const clientIp = req.headers.get('x-forwarded-for') || 
                     req.headers.get('x-real-ip') || 
                     '127.0.0.1';

    // Criar pagamento com cartão no Asaas
    const asaasPayment = await createCardPaymentAsaas(
      requestData.customer_id,
      requestData.payment_data,
      requestData.credit_card,
      requestData.credit_card_holder_info,
      clientIp
    );

    console.log('Pagamento com cartão criado no Asaas:', asaasPayment.id);
    console.log('Status:', asaasPayment.status);

    // Salvar no banco local
    const localPaymentId = await saveCardPaymentLocally(
      requestData.user_id,
      asaasPayment,
      requestData.service_type,
      requestData.service_data,
      requestData.payment_data.installmentCount
    );

    console.log('Pagamento salvo localmente:', localPaymentId);

    // Calcular valor da parcela se parcelado
    const installmentValue = requestData.payment_data.installmentCount && requestData.payment_data.installmentCount > 1
      ? requestData.payment_data.value / requestData.payment_data.installmentCount
      : requestData.payment_data.value;

    // Resposta de sucesso
    const response: CardPaymentResponse = {
      success: true,
      payment_id: localPaymentId,
      asaas_id: asaasPayment.id,
      status: asaasPayment.status,
      invoice_url: asaasPayment.invoiceUrl,
      credit_card_token: asaasPayment.creditCard?.creditCardToken,
      installment_count: requestData.payment_data.installmentCount || 1,
      installment_value: installmentValue,
      message: asaasPayment.status === 'CONFIRMED' 
        ? 'Pagamento aprovado com sucesso'
        : 'Pagamento processado, aguardando confirmação'
    };

    return new Response(
      JSON.stringify(response),
      { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro na Edge Function de cartão:', error);
    
    // Tratar erros específicos do Asaas
    let errorMessage = 'Erro interno do servidor';
    let statusCode = 500;

    if (error instanceof Error) {
      if (error.message.includes('cartão')) {
        errorMessage = 'Cartão recusado. Verifique os dados ou tente outro cartão.';
        statusCode = 400;
      } else if (error.message.includes('CPF') || error.message.includes('CNPJ')) {
        errorMessage = 'CPF/CNPJ inválido.';
        statusCode = 400;
      } else if (error.message.includes('limite')) {
        errorMessage = 'Limite de cartão insuficiente.';
        statusCode = 400;
      } else {
        errorMessage = error.message;
      }
    }
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        message: error instanceof Error ? error.message : 'Erro desconhecido'
      }),
      { status: statusCode, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});