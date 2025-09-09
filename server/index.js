const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: ['https://comademig.vercel.app', 'http://localhost:8080', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json());

// Configurações do Asaas
const ASAAS_API_KEY = process.env.ASAAS_API_KEY;
const ASAAS_BASE_URL = 'https://www.asaas.com/api/v3';

// Configurações do Supabase
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Função auxiliar para criar/buscar cliente
async function createOrFindCustomer(customerData) {
  try {
    console.log('Criando/buscando cliente:', customerData.name);
    
    // Tentar criar cliente
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
      // Cliente já existe, buscar pelo CPF
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

// 🎯 ENDPOINT: Criar Assinatura (Filiação)
app.post('/api/create-subscription', async (req, res) => {
  try {
    console.log('🔄 Criando assinatura...');
    const { customer, billingType, value, description, selectedMemberType, selectedPlan } = req.body;
    
    // 1. Criar/buscar cliente
    const customerId = await createOrFindCustomer(customer);
    
    // 2. Criar assinatura
    const subscriptionData = {
      customer: customerId,
      billingType,
      value,
      nextDueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 dias
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
    
    // 3. Salvar no banco (como cobrança para compatibilidade)
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
});

// 🎯 ENDPOINT: Criar Cobrança Única (Outros serviços)
app.post('/api/create-payment', async (req, res) => {
  try {
    console.log('🔄 Criando cobrança única...');
    const { customer, billingType, value, dueDate, description, tipoCobranca } = req.body;
    
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
});

// 🎯 ENDPOINT: Processar PIX
app.post('/api/process-pix/:paymentId', async (req, res) => {
  try {
    const { paymentId } = req.params;
    console.log('🔄 Processando PIX:', paymentId);
    
    const pixResponse = await axios.get(`${ASAAS_BASE_URL}/payments/${paymentId}/pixQrCode`, {
      headers: {
        'Content-Type': 'application/json',
        'access_token': ASAAS_API_KEY
      }
    });
    
    const pixData = pixResponse.data;
    console.log('✅ QR Code PIX obtido');
    
    // Atualizar no banco
    await supabase
      .from('asaas_cobrancas')
      .update({ qr_code_pix: pixData.payload })
      .eq('asaas_id', paymentId);
    
    res.json({
      success: true,
      qrCode: pixData.payload,
      encodedImage: pixData.encodedImage
    });
    
  } catch (error) {
    console.error('❌ Erro ao processar PIX:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 🎯 ENDPOINT: Processar Cartão
app.post('/api/process-card/:paymentId', async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { customerData, cardData } = req.body;
    console.log('🔄 Processando cartão:', paymentId);
    
    const cardPayload = {
      creditCard: {
        holderName: cardData.holderName,
        number: cardData.number.replace(/\s/g, ''),
        expiryMonth: cardData.expiryMonth,
        expiryYear: cardData.expiryYear,
        ccv: cardData.ccv
      },
      creditCardHolderInfo: {
        name: customerData.name,
        email: customerData.email,
        cpfCnpj: customerData.cpfCnpj.replace(/\D/g, ''),
        postalCode: "01310-100",
        addressNumber: "123",
        phone: customerData.phone?.replace(/\D/g, '') || "11999999999"
      }
    };
    
    const cardResponse = await axios.post(`${ASAAS_BASE_URL}/payments/${paymentId}/payWithCreditCard`, cardPayload, {
      headers: {
        'Content-Type': 'application/json',
        'access_token': ASAAS_API_KEY
      }
    });
    
    const result = cardResponse.data;
    console.log('✅ Cartão processado:', result.status);
    
    // Atualizar status no banco
    await supabase
      .from('asaas_cobrancas')
      .update({ status: result.status })
      .eq('asaas_id', paymentId);
    
    res.json({
      success: result.status === 'CONFIRMED',
      status: result.status,
      transactionReceiptUrl: result.transactionReceiptUrl
    });
    
  } catch (error) {
    console.error('❌ Erro ao processar cartão:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      details: error.response?.data
    });
  }
});

// 🎯 ENDPOINT: Webhook do Asaas
app.post('/api/webhook', async (req, res) => {
  try {
    console.log('📡 Webhook recebido:', JSON.stringify(req.body, null, 2));
    
    const { event, payment, subscription } = req.body;
    
    // Processar diferentes tipos de eventos
    switch (event) {
      case 'PAYMENT_CONFIRMED':
        console.log('💰 Pagamento confirmado:', payment.id);
        await supabase
          .from('asaas_cobrancas')
          .update({ 
            status: 'CONFIRMED',
            data_pagamento: new Date().toISOString()
          })
          .eq('asaas_id', payment.id);
        break;
        
      case 'PAYMENT_RECEIVED':
        console.log('✅ Pagamento recebido:', payment.id);
        await supabase
          .from('asaas_cobrancas')
          .update({ 
            status: 'RECEIVED',
            data_pagamento: new Date().toISOString()
          })
          .eq('asaas_id', payment.id);
        break;
        
      case 'PAYMENT_OVERDUE':
        console.log('⏰ Pagamento vencido:', payment.id);
        await supabase
          .from('asaas_cobrancas')
          .update({ status: 'OVERDUE' })
          .eq('asaas_id', payment.id);
        break;
        
      case 'PAYMENT_DELETED':
        console.log('🗑️ Pagamento cancelado:', payment.id);
        await supabase
          .from('asaas_cobrancas')
          .update({ status: 'CANCELLED' })
          .eq('asaas_id', payment.id);
        break;
        
      case 'PAYMENT_RESTORED':
        console.log('🔄 Pagamento restaurado:', payment.id);
        await supabase
          .from('asaas_cobrancas')
          .update({ status: 'PENDING' })
          .eq('asaas_id', payment.id);
        break;
        
      case 'PAYMENT_REFUNDED':
        console.log('💸 Pagamento estornado:', payment.id);
        await supabase
          .from('asaas_cobrancas')
          .update({ 
            status: 'REFUNDED',
            data_pagamento: null
          })
          .eq('asaas_id', payment.id);
        break;
        
      // Eventos de assinatura
      case 'SUBSCRIPTION_CREATED':
        console.log('📅 Assinatura criada:', subscription.id);
        break;
        
      case 'SUBSCRIPTION_UPDATED':
        console.log('📝 Assinatura atualizada:', subscription.id);
        break;
        
      case 'SUBSCRIPTION_DELETED':
        console.log('❌ Assinatura cancelada:', subscription.id);
        // Marcar todas as cobranças futuras como canceladas
        await supabase
          .from('asaas_cobrancas')
          .update({ status: 'CANCELLED' })
          .eq('asaas_id', subscription.id)
          .eq('status', 'PENDING');
        break;
        
      default:
        console.log('📋 Evento não tratado:', event);
    }
    
    // Sempre responder com sucesso para o Asaas
    res.status(200).json({ 
      received: true, 
      event,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Erro no webhook:', error);
    // Mesmo com erro, responder 200 para evitar reenvios desnecessários
    res.status(200).json({ 
      received: false, 
      error: error.message 
    });
  }
});

// 🎯 ENDPOINT: Configurar Webhook no Asaas
app.post('/api/setup-webhook', async (req, res) => {
  try {
    const webhookUrl = `${req.protocol}://${req.get('host')}/api/webhook`;
    
    console.log('🔧 Configurando webhook:', webhookUrl);
    
    const webhookData = {
      name: 'COMADEMIG Webhook',
      url: webhookUrl,
      email: 'contato@comademig.org.br',
      sendType: 'SEQUENTIALLY',
      apiVersion: 3,
      enabled: true,
      interrupted: false,
      authToken: process.env.WEBHOOK_AUTH_TOKEN || 'comademig_webhook_2024',
      events: [
        'PAYMENT_CREATED',
        'PAYMENT_UPDATED', 
        'PAYMENT_CONFIRMED',
        'PAYMENT_RECEIVED',
        'PAYMENT_OVERDUE',
        'PAYMENT_DELETED',
        'PAYMENT_RESTORED',
        'PAYMENT_REFUNDED',
        'SUBSCRIPTION_CREATED',
        'SUBSCRIPTION_UPDATED',
        'SUBSCRIPTION_DELETED'
      ]
    };
    
    const response = await axios.post(`${ASAAS_BASE_URL}/webhooks`, webhookData, {
      headers: {
        'Content-Type': 'application/json',
        'access_token': ASAAS_API_KEY
      }
    });
    
    console.log('✅ Webhook configurado:', response.data.id);
    
    res.json({
      success: true,
      webhook: response.data,
      message: 'Webhook configurado com sucesso!'
    });
    
  } catch (error) {
    console.error('❌ Erro ao configurar webhook:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      details: error.response?.data
    });
  }
});

// 🎯 ENDPOINT: Listar Webhooks configurados
app.get('/api/webhooks', async (req, res) => {
  try {
    const response = await axios.get(`${ASAAS_BASE_URL}/webhooks`, {
      headers: {
        'Content-Type': 'application/json',
        'access_token': ASAAS_API_KEY
      }
    });
    
    res.json({
      success: true,
      webhooks: response.data.data
    });
    
  } catch (error) {
    console.error('❌ Erro ao listar webhooks:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    message: 'Servidor COMADEMIG funcionando!',
    webhookUrl: `${req.protocol}://${req.get('host')}/api/webhook`
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
});