// Script para configurar webhook automaticamente
// Execute: node configure-webhook.js

const axios = require('axios');

// COLE SUA CHAVE API AQUI
const ASAAS_API_KEY = 'SUA_CHAVE_API_AQUI';

async function configureWebhook() {
  try {
    const webhookData = {
      name: 'COMADEMIG Pagamentos',
      url: 'https://comademig.vercel.app/api/webhook',
      email: 'contato@comademig.org.br',
      sendType: 'SEQUENTIALLY',
      apiVersion: 3,
      enabled: true,
      authToken: 'comademig_webhook_2024',
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

    console.log('🔧 Configurando webhook...');
    
    const response = await axios.post('https://www.asaas.com/api/v3/webhooks', webhookData, {
      headers: {
        'Content-Type': 'application/json',
        'access_token': ASAAS_API_KEY
      }
    });

    console.log('✅ Webhook configurado com sucesso!');
    console.log('ID:', response.data.id);
    console.log('URL:', response.data.url);
    
  } catch (error) {
    console.error('❌ Erro:', error.response?.data || error.message);
  }
}

configureWebhook();