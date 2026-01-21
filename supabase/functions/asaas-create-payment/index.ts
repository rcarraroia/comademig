/**
 * Edge Function: Criar Pagamento no Asaas
 * 
 * Cria pagamentos no Asaas com suporte a split automático para afiliados
 * Suporta PIX, Cartão de Crédito e Boleto
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Imports compartilhados
import { asaasClient } from '../shared/asaas-client.ts';
import type { 
  CreatePaymentRequest,
  AsaasPayment,
  CreatePaymentData,
  AsaasSplitData
} from '../shared/types.ts';

// Cliente Supabase
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Busca configuração de split para afiliados
 */
async function getSplitConfiguration(affiliateId?: string): Promise<AsaasSplitData[]> {
  if (!affiliateId) return [];

  try {
    const { data: affiliate, error } = await supabase
      .from('affiliates')
      .select('wallet_id, commission_percentage')
      .eq('id', affiliateId)
      .single();

    if (error || !affiliate?.wallet_id) {
      console.warn('Afiliado não encontrado ou sem wallet_id:', error);
      return [];
    }

    return [{
      walletId: affiliate.wallet_id,
      percentualValue: affiliate.commission_percentage || 10, // 10% padrão
      description: `Comissão afiliado ${affiliateId}`,
      externalReference: `affiliate_${affiliateId}`
    }];
  } catch (error) {
    console.error('Erro ao buscar configuração de split:', error);
    return [];
  }
}

/**
 * Cria pagamento no Asaas via API
 */
async function createAsaasPayment(paymentData: CreatePaymentData): Promise<AsaasPayment> {
  return await asaasClient.post<AsaasPayment>('/payments', paymentData);
}

/**
 * Salva pagamento no banco local
 */
async function savePaymentLocally(
  asaasPayment: AsaasPayment,
  serviceType: string,
  serviceData: any
): Promise<void> {
  const { error } = await supabase
    .from('asaas_cobrancas')
    .insert({
      asaas_payment_id: asaasPayment.id,
      customer_id: asaasPayment.customer,
      billing_type: asaasPayment.billingType,
      value: asaasPayment.value,
      net_value: asaasPayment.netValue,
      status: asaasPayment.status,
      due_date: asaasPayment.dueDate,
      description: asaasPayment.description,
      external_reference: asaasPayment.externalReference,
      service_type: serviceType,
      service_data: serviceData,
      // Dados específicos por tipo de pagamento
      pix_qr_code: asaasPayment.pixTransaction?.qrCode?.payload,
      pix_qr_code_image: asaasPayment.pixTransaction?.qrCode?.encodedImage,
      pix_expiration_date: asaasPayment.pixTransaction?.expirationDate,
      boleto_url: asaasPayment.bankSlipUrl,
      boleto_barcode: asaasPayment.identificationField,
      invoice_url: asaasPayment.invoiceUrl
    });

  if (error) {
    throw new Error(`Erro ao salvar pagamento localmente: ${error.message}`);
  }
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
    const requestData: CreatePaymentRequest = await req.json();

    // Validar dados de entrada
    if (!requestData.customer_id || !requestData.payment_data) {
      return new Response(
        JSON.stringify({ error: 'customer_id e payment_data são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Configurar split se houver afiliado
    let splitConfig: AsaasSplitData[] = [];
    if (requestData.service_data?.affiliate_id) {
      splitConfig = await getSplitConfiguration(requestData.service_data.affiliate_id);
    }

    // Preparar dados do pagamento
    const paymentData: CreatePaymentData = {
      ...requestData.payment_data,
      customer: requestData.customer_id,
      split: splitConfig.length > 0 ? splitConfig : undefined
    };

    // Criar pagamento no Asaas
    console.log('Criando pagamento no Asaas...');
    const asaasPayment = await createAsaasPayment(paymentData);
    console.log(`Pagamento criado no Asaas: ${asaasPayment.id}`);

    // Salvar no banco local
    await savePaymentLocally(
      asaasPayment, 
      requestData.service_type, 
      requestData.service_data
    );
    console.log('Pagamento salvo no banco local');

    // Resposta de sucesso
    return new Response(
      JSON.stringify({
        success: true,
        payment_id: asaasPayment.id,
        payment_data: {
          id: asaasPayment.id,
          status: asaasPayment.status,
          value: asaasPayment.value,
          dueDate: asaasPayment.dueDate,
          billingType: asaasPayment.billingType,
          // Dados específicos por tipo
          pixQrCode: asaasPayment.pixTransaction?.qrCode?.payload,
          pixQrCodeImage: asaasPayment.pixTransaction?.qrCode?.encodedImage,
          boletoUrl: asaasPayment.bankSlipUrl,
          invoiceUrl: asaasPayment.invoiceUrl
        },
        split_applied: splitConfig.length > 0,
        message: 'Pagamento criado com sucesso'
      }),
      { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro na Edge Function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Erro interno do servidor',
        message: error instanceof Error ? error.message : 'Erro desconhecido'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});