#!/usr/bin/env node

/**
 * Script para configurar webhook do Asaas automaticamente
 * 
 * Uso:
 * node setup-webhook.js https://seu-servidor.vercel.app
 */

const axios = require('axios');
require('dotenv').config();

const ASAAS_API_KEY = process.env.ASAAS_API_KEY;
const ASAAS_BASE_URL = 'https://www.asaas.com/api/v3';

async function setupWebhook(serverUrl) {
  try {
    if (!ASAAS_API_KEY) {
      throw new Error('ASAAS_API_KEY não configurada no .env');
    }
    
    if (!serverUrl) {
      throw new Error('URL do servidor é obrigatória. Uso: node setup-webhook.js https://seu-servidor.vercel.app');
    }
    
    const webhookUrl = `${serverUrl}/api/webhook`;
    
    console.log('🔧 Configurando webhook do Asaas...');
    console.log('📡 URL do webhook:', webhookUrl);
    
    // Primeiro, listar webhooks existentes
    console.log('\n📋 Verificando webhooks existentes...');
    const listResponse = await axios.get(`${ASAAS_BASE_URL}/webhooks`, {
      headers: {
        'Content-Type': 'application/json',
        'access_token': ASAAS_API_KEY
      }
    });
    
    const existingWebhooks = listResponse.data.data;
    console.log(`Encontrados ${existingWebhooks.length} webhooks existentes`);
    
    // Verificar se já existe um webhook para esta URL
    const existingWebhook = existingWebhooks.find(w => w.url === webhookUrl);
    
    if (existingWebhook) {
      console.log('⚠️ Webhook já existe:', existingWebhook.id);
      console.log('Status:', existingWebhook.enabled ? 'Ativo' : 'Inativo');
      
      if (!existingWebhook.enabled) {
        console.log('🔄 Ativando webhook existente...');
        await axios.put(`${ASAAS_BASE_URL}/webhooks/${existingWebhook.id}`, {
          enabled: true
        }, {
          headers: {
            'Content-Type': 'application/json',
            'access_token': ASAAS_API_KEY
          }
        });
        console.log('✅ Webhook ativado!');
      }
      
      return existingWebhook;
    }
    
    // Criar novo webhook
    const webhookData = {
      name: 'COMADEMIG Webhook',
      url: webhookUrl,
      email: 'contato@comademig.org.br',
      sendType: 'SEQUENTIALLY',
      apiVersion: 3,
      enabled: true,
      interrupted: false,
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
    
    console.log('\n🚀 Criando novo webhook...');
    const response = await axios.post(`${ASAAS_BASE_URL}/webhooks`, webhookData, {
      headers: {
        'Content-Type': 'application/json',
        'access_token': ASAAS_API_KEY
      }
    });
    
    const webhook = response.data;
    
    console.log('✅ Webhook criado com sucesso!');
    console.log('🆔 ID:', webhook.id);
    console.log('📡 URL:', webhook.url);
    console.log('📧 Email:', webhook.email);
    console.log('🔄 Status:', webhook.enabled ? 'Ativo' : 'Inativo');
    console.log('📅 Eventos:', webhook.events.length);
    
    console.log('\n🎉 Configuração concluída!');
    console.log('O Asaas agora enviará notificações para:', webhookUrl);
    
    return webhook;
    
  } catch (error) {
    console.error('❌ Erro ao configurar webhook:', error.message);
    
    if (error.response?.data) {
      console.error('Detalhes do erro:', JSON.stringify(error.response.data, null, 2));
    }
    
    process.exit(1);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  const serverUrl = process.argv[2];
  setupWebhook(serverUrl);
}

module.exports = { setupWebhook };