const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');

// Configurações
const ASAAS_API_KEY = process.env.ASAAS_API_KEY;
const ASAAS_BASE_URL = 'https://www.asaas.com/api/v3';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Função auxiliar para criar/buscar cliente
async function createOrFindCustomer(customerData) {
  try {
    console.log('Criando/buscando cliente:', customerData.name);
    
    const response = await axios.post(`${ASAAS_BASE_URL}/customers`, customerData, {
      headers: {
        'Content-Type': 'application/json',
        'access_token': ASAAS_API_KEY
      }
    });
    
    console.log('Cliente criado:', response.data.id);
    return response.data.id;
    
  } catch (error) {
    if (error.response?.status === 400) {
      console.log('Cliente já existe, buscando...');
      
      const searchResponse = await axios.get(`${ASAAS_BASE_URL}/customers`, {
        params: { cpfCnpj: customerData.cpfCnpj },
        headers: {
          'Content-Type': 'application/json',
          'access_token': ASAAS_API_KEY
        }
      });
      
      const customerId = searchResponse.data.data[0]?.id;
      if (!customerId) {
        throw new Error('Cliente não encontrado após busca');
      }
      
      console.log('Cliente encontrado:', customerId);
      return customerId;
    }
    
    throw error;
  }
}

module.exports = async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🔄 Criando assinatura...');
    const { customer, billingType, value, description, selectedMemberType, selectedPlan } = req.body;
    
    if (!ASAAS_API_KEY) {
      throw new Error('ASAAS_API_KEY não configurada');
    }

    // 1. Criar/buscar cliente
    const customerId = await createOrFindCustomer(customer);
    
    // 2. Criar assinatura
    const subscriptionData = {
      customer: customerId,
      billingType,
      value,
      nextDueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      cycle: 'MONTHLY',
      description,
      endDate: null,
      maxPayments: null
    };
    
    console.log('Criando assinatura:', subscriptionData);
    
    const subscriptionResponse = await axios.post(`${ASAAS_BASE_URL}/subscriptions`, subscriptionData, {
      headers: {
        'Content-Type': 'application/json',
        'access_token': ASAAS_API_KEY
      }
    });
    
    const subscription = subscriptionResponse.data;
    console.log('✅ Assinatura criada:', subscription.id);
    
    // 3. Salvar no banco
    const cobrancaData = {
      user_id: 'anonymous_' + Date.now(),
      asaas_id: subscription.id,
      customer_id: customerId,
      valor: value,
      descricao: description + ' (Assinatura Mensal)',
      data_vencimento: subscriptionData.nextDueDate,
      status: 'PENDING',
      forma_pagamento: billingType,
      tipo_cobranca: 'filiacao',
      service_type: 'filiacao'
    };
    
    const { data: cobranca, error } = await supabase
      .from('asaas_cobrancas')
      .insert(cobrancaData)
      .select()
      .single();
    
    if (error) {
      console.error('Erro ao salvar no banco:', error);
      throw error;
    }
    
    console.log('✅ Salvo no banco:', cobranca.id);
    
    res.json({
      success: true,
      cobranca,
      subscription,
      message: 'Assinatura criada com sucesso'
    });
    
  } catch (error) {
    console.error('❌ Erro ao criar assinatura:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      details: error.response?.data || error
    });
  }
};