/**
 * Edge Function: Criar Cliente no Asaas
 * 
 * Cria um cliente no Asaas automaticamente quando um usuário faz primeira compra
 * Reutiliza customer_id existente se já foi criado anteriormente
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Imports compartilhados
import { asaasClient } from '../shared/asaas-client.ts';
import { validateCustomerData, formatCpfCnpj, formatPhone, formatCEP } from '../shared/validation.ts';
import type { 
  CreateCustomerRequest, 
  AsaasCustomer, 
  CreateCustomerData 
} from '../shared/types.ts';

// Cliente Supabase
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);



/**
 * Verifica se cliente já existe no banco local
 */
async function getExistingCustomer(userId: string): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('asaas_customers')
      .select('asaas_customer_id')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error('Erro ao buscar cliente existente:', error);
      return null;
    }

    return data?.asaas_customer_id || null;
  } catch (error) {
    console.error('Erro ao verificar cliente existente:', error);
    return null;
  }
}

/**
 * Cria cliente no Asaas via API
 */
async function createAsaasCustomer(customerData: CreateCustomerData): Promise<AsaasCustomer> {
  // LOG: Dados ANTES da formatação
  console.log('📤 DADOS ANTES DA FORMATAÇÃO:');
  console.log('  cpfCnpj:', customerData.cpfCnpj, '(length:', customerData.cpfCnpj?.length, ')');
  console.log('  phone:', customerData.phone);
  console.log('  postalCode:', customerData.postalCode);
  
  // Formatar dados para o Asaas
  const formattedData = {
    name: customerData.name,
    cpfCnpj: formatCpfCnpj(customerData.cpfCnpj),
    email: customerData.email,
    phone: customerData.phone ? formatPhone(customerData.phone) : undefined,
    mobilePhone: customerData.mobilePhone ? formatPhone(customerData.mobilePhone) : undefined,
    address: customerData.address,
    addressNumber: customerData.addressNumber,
    complement: customerData.complement,
    province: customerData.province,
    postalCode: customerData.postalCode ? formatCEP(customerData.postalCode) : undefined,
    // city: removido temporariamente - API Asaas espera ID numérico, não nome
    state: customerData.state,
    country: customerData.country || 'Brasil',
    externalReference: customerData.externalReference,
    notificationDisabled: customerData.notificationDisabled || false,
    additionalEmails: customerData.additionalEmails,
    municipalInscription: customerData.municipalInscription,
    stateInscription: customerData.stateInscription,
    observations: customerData.observations,
    groupName: customerData.groupName,
    company: customerData.company
  };
  
  // LOG: Dados APÓS a formatação (que serão enviados ao Asaas)
  console.log('📤 DADOS APÓS FORMATAÇÃO (ENVIADOS AO ASAAS):');
  console.log('  cpfCnpj:', formattedData.cpfCnpj, '(length:', formattedData.cpfCnpj?.length, ')');
  console.log('  phone:', formattedData.phone);
  console.log('  postalCode:', formattedData.postalCode);
  console.log('📤 PAYLOAD COMPLETO PARA ASAAS:');
  console.log(JSON.stringify(formattedData, null, 2));
  
  return await asaasClient.post<AsaasCustomer>('/customers', formattedData);
}

/**
 * Salva cliente no banco local
 */
async function saveCustomerLocally(
  userId: string, 
  asaasCustomer: AsaasCustomer, 
  originalData: CreateCustomerData
): Promise<void> {
  const { error } = await supabase
    .from('asaas_customers')
    .insert({
      user_id: userId,
      asaas_customer_id: asaasCustomer.id,
      name: asaasCustomer.name,
      cpf_cnpj: asaasCustomer.cpfCnpj,
      email: asaasCustomer.email,
      phone: asaasCustomer.phone,
      mobile_phone: asaasCustomer.mobilePhone,
      address: asaasCustomer.address,
      address_number: asaasCustomer.addressNumber,
      complement: asaasCustomer.complement,
      province: asaasCustomer.province,
      postal_code: asaasCustomer.postalCode,
      city: asaasCustomer.city,
      state: asaasCustomer.state,
      country: asaasCustomer.country,
      external_reference: asaasCustomer.externalReference,
      notification_disabled: originalData.notificationDisabled || false,
      additional_emails: originalData.additionalEmails,
      municipal_inscription: originalData.municipalInscription,
      state_inscription: originalData.stateInscription,
      observations: originalData.observations,
      group_name: originalData.groupName,
      company: originalData.company
    });

  if (error) {
    throw new Error(`Erro ao salvar cliente localmente: ${error.message}`);
  }
}

/**
 * Atualiza customer_id no perfil do usuário
 */
async function updateUserProfile(userId: string, customerId: string): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({ asaas_customer_id: customerId })
    .eq('id', userId);

  if (error) {
    console.warn('Aviso: Não foi possível atualizar perfil do usuário:', error.message);
    // Não falha a operação se não conseguir atualizar o perfil
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

    // Verificar configuração do Asaas (feito automaticamente pelo asaasClient)

    // Parse do body
    const requestData: CreateCustomerRequest = await req.json();

    // Validar dados de entrada
    if (!requestData.user_id || !requestData.customer_data) {
      return new Response(
        JSON.stringify({ error: 'user_id e customer_data são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validar dados do cliente
    const validation = validateCustomerData(requestData.customer_data);
    if (!validation.isValid) {
      return new Response(
        JSON.stringify({ error: 'Dados inválidos', details: validation.errors }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verificar se cliente já existe
    const existingCustomerId = await getExistingCustomer(requestData.user_id);
    if (existingCustomerId) {
      console.log(`Cliente já existe: ${existingCustomerId}`);
      return new Response(
        JSON.stringify({ 
          success: true, 
          customer_id: existingCustomerId,
          message: 'Cliente já existente reutilizado'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Criar cliente no Asaas
    console.log('Criando cliente no Asaas...');
    const asaasCustomer = await createAsaasCustomer(requestData.customer_data);
    console.log(`Cliente criado no Asaas: ${asaasCustomer.id}`);

    // Salvar no banco local
    await saveCustomerLocally(requestData.user_id, asaasCustomer, requestData.customer_data);
    console.log('Cliente salvo no banco local');

    // Atualizar perfil do usuário
    await updateUserProfile(requestData.user_id, asaasCustomer.id);
    console.log('Perfil do usuário atualizado');

    // Resposta de sucesso
    return new Response(
      JSON.stringify({
        success: true,
        customer_id: asaasCustomer.id,
        message: 'Cliente criado com sucesso',
        customer_data: {
          id: asaasCustomer.id,
          name: asaasCustomer.name,
          email: asaasCustomer.email,
          cpfCnpj: asaasCustomer.cpfCnpj
        }
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