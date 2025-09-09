// Importações com try/catch para debug
let axios, createClient;
try {
  axios = require('axios');
  const supabaseLib = require('@supabase/supabase-js');
  createClient = supabaseLib.createClient;
} catch (error) {
  console.error('Erro ao importar dependências:', error);
}

// Configurações
const ASAAS_API_KEY = process.env.ASAAS_API_KEY;
const ASAAS_BASE_URL = 'https://www.asaas.com/api/v3';

// Configurações do Supabase (hardcoded para garantir funcionamento)
const SUPABASE_URL = process.env.SUPABASE_URL || "https://amkelczfwazutrciqtlk.supabase.co";
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFta2VsY3pmd2F6dXRyY2lxdGxrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxODQxMjYsImV4cCI6MjA2ODc2MDEyNn0.7-M7DCqMzfZtXvcg6Zlf24zNv-XqvDT_oAznQGiqFHY";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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
    console.log('🔄 Criando cobrança única...');
    const { customer, billingType, value, dueDate, description, tipoCobranca } = req.body;
    
    if (!ASAAS_API_KEY) {
      throw new Error('ASAAS_API_KEY não configurada');
    }

    // 1. Criar/buscar cliente
    const customerId = await createOrFindCustomer(customer);
    
    // 2. Criar cobrança
    const paymentData = {
      customer: customerId,
      billingType,
      value,
      dueDate,
      description,
      postalService: false
    };
    
    console.log('Criando cobrança:', paymentData);
    
    const paymentResponse = await axios.post(`${ASAAS_BASE_URL}/payments`, paymentData, {
      headers: {
        'Content-Type': 'application/json',
        'access_token': ASAAS_API_KEY
      }
    });
    
    const payment = paymentResponse.data;
    console.log('✅ Cobrança criada:', payment.id);
    
    // 3. Salvar no banco
    const cobrancaData = {
      user_id: 'anonymous_' + Date.now(),
      asaas_id: payment.id,
      customer_id: customerId,
      valor: value,
      descricao: description,
      data_vencimento: dueDate,
      status: payment.status,
      forma_pagamento: billingType,
      url_pagamento: payment.invoiceUrl || `https://www.asaas.com/c/${payment.id}`,
      tipo_cobranca: tipoCobranca,
      service_type: tipoCobranca
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
      payment,
      message: 'Cobrança criada com sucesso'
    });
    
  } catch (error) {
    console.error('❌ Erro ao criar cobrança:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      details: error.response?.data || error
    });
  }
};