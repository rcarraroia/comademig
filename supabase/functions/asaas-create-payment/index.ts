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
 * Busca configuração de split para afiliados (método atual - por affiliate_id)
 */
async function getSplitConfiguration(affiliateId?: string): Promise<AsaasSplitData[]> {
  if (!affiliateId) return [];

  try {
    const { data: affiliate, error } = await supabase
      .from('affiliates')
      .select('asaas_wallet_id, display_name, status')
      .eq('id', affiliateId)
      .eq('status', 'active')
      .single();

    if (error || !affiliate?.asaas_wallet_id) {
      console.warn('Afiliado não encontrado ou sem wallet_id:', error);
      return [];
    }

    return [{
      walletId: affiliate.asaas_wallet_id,
      percentualValue: 20, // 20% padrão para afiliados
      description: `Comissão ${affiliate.display_name || 'Afiliado'}`,
      externalReference: `affiliate_${affiliateId}`
    }];
  } catch (error) {
    console.error('Erro ao buscar configuração de split:', error);
    return [];
  }
}

/**
 * NOVA: Busca configuração de split por user_id (para comissões vitalícias)
 * Verifica se o usuário foi indicado por algum afiliado
 */
async function getSplitConfigurationByUser(userId: string): Promise<AsaasSplitData[]> {
  if (!userId) return [];

  try {
    console.log('🔍 Buscando indicação para user_id:', userId);
    
    const { data: referral, error } = await supabase
      .from('affiliate_referrals')
      .select(`
        affiliate_id,
        referral_code,
        affiliates(
          id,
          asaas_wallet_id,
          display_name,
          status
        )
      `)
      .eq('referred_user_id', userId)
      .eq('status', 'pending') // Status pode ser 'pending' até conversão
      .single();

    if (error) {
      console.log('ℹ️ Usuário não foi indicado por afiliado:', error.message);
      return [];
    }

    if (!referral?.affiliates?.asaas_wallet_id) {
      console.warn('⚠️ Afiliado encontrado mas sem wallet_id configurado');
      return [];
    }

    if (referral.affiliates.status !== 'active') {
      console.warn('⚠️ Afiliado encontrado mas está inativo');
      return [];
    }

    const affiliate = referral.affiliates;
    
    console.log('✅ Afiliado encontrado para comissão vitalícia:', {
      affiliateId: affiliate.id,
      affiliateName: affiliate.display_name,
      referralCode: referral.referral_code,
      walletId: affiliate.asaas_wallet_id
    });

    return [{
      walletId: affiliate.asaas_wallet_id,
      percentualValue: 20, // 20% comissão vitalícia
      description: `Comissão vitalícia ${affiliate.display_name || 'Afiliado'}`,
      externalReference: `affiliate_lifetime_${affiliate.id}`
    }];
    
  } catch (error) {
    console.error('❌ Erro ao buscar split por user_id:', error);
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

    console.log('💰 ========================================');
    console.log('💰 CONFIGURANDO SPLIT DE PAGAMENTO');
    console.log('💰 ========================================');
    console.log('📋 Dados recebidos:', {
      service_type: requestData.service_type,
      user_id: requestData.user_id,
      has_service_data_affiliate_id: !!requestData.service_data?.affiliate_id,
      service_data_keys: Object.keys(requestData.service_data || {})
    });

    // Configurar split se houver afiliado
    let splitConfig: AsaasSplitData[] = [];
    
    // 1. MÉTODO ATUAL: Buscar por service_data.affiliate_id (casos específicos)
    if (requestData.service_data?.affiliate_id) {
      console.log('🔍 Método 1: Buscando split por service_data.affiliate_id:', requestData.service_data.affiliate_id);
      splitConfig = await getSplitConfiguration(requestData.service_data.affiliate_id);
      
      if (splitConfig.length > 0) {
        console.log('✅ Split encontrado via service_data.affiliate_id');
      } else {
        console.log('⚠️ Affiliate_id em service_data não resultou em split válido');
      }
    }

    // 2. NOVO MÉTODO: Se não encontrou split, buscar por user_id (comissões vitalícias)
    if (splitConfig.length === 0 && requestData.user_id) {
      console.log('🔍 Método 2: Buscando split por user_id (comissões vitalícias):', requestData.user_id);
      splitConfig = await getSplitConfigurationByUser(requestData.user_id);
      
      if (splitConfig.length > 0) {
        console.log('✅ Split encontrado via user_id - Comissão vitalícia aplicada!');
      } else {
        console.log('ℹ️ Usuário não foi indicado por afiliado ativo');
      }
    }

    // 3. RESULTADO FINAL
    if (splitConfig.length > 0) {
      console.log('🎯 SPLIT FINAL CONFIGURADO:', {
        splits: splitConfig.map(s => ({
          walletId: s.walletId,
          percentage: s.percentualValue,
          description: s.description
        }))
      });
    } else {
      console.log('💸 NENHUM SPLIT APLICADO - Pagamento integral para COMADEMIG');
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