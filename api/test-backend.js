#!/usr/bin/env node

/**
 * Script de teste completo para o backend de pagamentos
 * Testa todos os endpoints e funcionalidades implementadas
 */

const axios = require('axios');
const config = require('./src/config');

// Configuração do teste
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
const TEST_USER_TOKEN = process.env.TEST_USER_TOKEN || 'test-jwt-token';

console.log('🚀 Iniciando testes do backend de pagamentos...\n');

// Dados de teste
const testData = {
  member: {
    name: 'João Silva Teste',
    email: 'joao.teste@email.com',
    phone: '31999999999',
    cpfCnpj: '12345678901',
    cargo: 'veterinario',
    plan_id: 'plan_veterinario_mensal',
    payment_method: 'PIX',
    affiliate_code: 'AFILIADO123'
  },
  service: {
    service_type: 'certidao',
    service_data: {
      tipo_certidao: 'regularidade',
      observacoes: 'Teste de certidão'
    },
    payment_method: 'PIX'
  },
  card: {
    card_number: '4111111111111111',
    card_holder: 'JOAO SILVA',
    expiry_month: '12',
    expiry_year: '2028',
    cvv: '123'
  }
};

// Função para fazer requisições
async function makeRequest(method, endpoint, data = null, headers = {}) {
  try {
    const config = {
      method,
      url: `${API_BASE_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    if (data) {
      config.data = data;
    }

    const response = await axios(config);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || error.message,
      status: error.response?.status || 500
    };
  }
}

// Testes individuais
async function testHealthCheck() {
  console.log('📋 Testando Health Check...');
  const result = await makeRequest('GET', '/health');
  
  if (result.success) {
    console.log('✅ Health Check: OK');
    console.log(`   Status: ${result.data.message}`);
    console.log(`   Environment: ${result.data.environment}`);
  } else {
    console.log('❌ Health Check: FALHOU');
    console.log(`   Erro: ${JSON.stringify(result.error)}`);
  }
  
  return result.success;
}

async function testMemberJoin() {
  console.log('\n👤 Testando Filiação de Membro...');
  const result = await makeRequest('POST', '/api/members/join', testData.member);
  
  if (result.success) {
    console.log('✅ Filiação: OK');
    console.log(`   Customer ID: ${result.data.customer_id}`);
    console.log(`   Subscription ID: ${result.data.subscription_id}`);
    console.log(`   Payment ID: ${result.data.payment_id}`);
    console.log(`   Split Recipients: ${result.data.split_info.total_recipients}`);
    
    if (result.data.pix_qr_code) {
      console.log('   PIX QR Code: Gerado ✅');
    }
    
    return result.data;
  } else {
    console.log('❌ Filiação: FALHOU');
    console.log(`   Erro: ${JSON.stringify(result.error)}`);
    return null;
  }
}

async function testCardTokenization() {
  console.log('\n💳 Testando Tokenização de Cartão...');
  const result = await makeRequest('POST', '/api/cards/tokenize', testData.card);
  
  if (result.success) {
    console.log('✅ Tokenização: OK');
    console.log(`   Token: ${result.data.token.substring(0, 20)}...`);
    console.log(`   Last Four: ${result.data.card_info.last_four}`);
    console.log(`   Brand: ${result.data.card_info.brand}`);
    return result.data.token;
  } else {
    console.log('❌ Tokenização: FALHOU');
    console.log(`   Erro: ${JSON.stringify(result.error)}`);
    return null;
  }
}

async function testServicePayment() {
  console.log('\n🏥 Testando Pagamento de Serviço...');
  const result = await makeRequest('POST', '/api/payments/service', testData.service, {
    'Authorization': `Bearer ${TEST_USER_TOKEN}`
  });
  
  if (result.success) {
    console.log('✅ Pagamento de Serviço: OK');
    console.log(`   Payment ID: ${result.data.payment_id}`);
    console.log(`   Service Request ID: ${result.data.service_request_id}`);
    console.log(`   Amount: R$ ${result.data.amount}`);
    console.log(`   Due Date: ${result.data.due_date}`);
    return result.data;
  } else {
    console.log('❌ Pagamento de Serviço: FALHOU');
    console.log(`   Erro: ${JSON.stringify(result.error)}`);
    return null;
  }
}

async function testWebhookSimulation() {
  console.log('\n🔔 Testando Simulação de Webhook...');
  
  const webhookPayload = {
    id: `test_webhook_${Date.now()}`,
    event: 'PAYMENT_RECEIVED',
    dateCreated: new Date().toISOString(),
    payment: {
      id: 'pay_test_123456',
      customer: 'cus_test_123456',
      value: 150.00,
      status: 'RECEIVED',
      billingType: 'PIX',
      dueDate: new Date().toISOString().split('T')[0]
    }
  };
  
  const result = await makeRequest('POST', '/webhook/asaas', webhookPayload, {
    'X-Webhook-Token': 'test-webhook-token'
  });
  
  if (result.success) {
    console.log('✅ Webhook: OK');
    console.log(`   Event ID: ${result.data.event_id}`);
    console.log(`   Processed: ${result.data.success}`);
  } else {
    console.log('❌ Webhook: FALHOU');
    console.log(`   Erro: ${JSON.stringify(result.error)}`);
  }
  
  return result.success;
}

async function testPaymentStatus(paymentId) {
  if (!paymentId) return false;
  
  console.log('\n📊 Testando Consulta de Status...');
  const result = await makeRequest('GET', `/api/payments/${paymentId}/status`, null, {
    'Authorization': `Bearer ${TEST_USER_TOKEN}`
  });
  
  if (result.success) {
    console.log('✅ Status: OK');
    console.log(`   Payment ID: ${result.data.payment_id}`);
    console.log(`   Status: ${result.data.status}`);
    console.log(`   Amount: R$ ${result.data.amount}`);
  } else {
    console.log('❌ Status: FALHOU');
    console.log(`   Erro: ${JSON.stringify(result.error)}`);
  }
  
  return result.success;
}

// Função principal de teste
async function runAllTests() {
  console.log(`🎯 Testando API em: ${API_BASE_URL}\n`);
  
  const results = {
    healthCheck: false,
    memberJoin: null,
    cardTokenization: null,
    servicePayment: null,
    webhook: false,
    paymentStatus: false
  };
  
  try {
    // 1. Health Check
    results.healthCheck = await testHealthCheck();
    
    // 2. Filiação de Membro
    results.memberJoin = await testMemberJoin();
    
    // 3. Tokenização de Cartão
    results.cardTokenization = await testCardTokenization();
    
    // 4. Pagamento de Serviço
    results.servicePayment = await testServicePayment();
    
    // 5. Webhook
    results.webhook = await testWebhookSimulation();
    
    // 6. Status de Pagamento
    if (results.servicePayment) {
      results.paymentStatus = await testPaymentStatus(results.servicePayment.payment_id);
    }
    
  } catch (error) {
    console.log(`\n❌ Erro geral nos testes: ${error.message}`);
  }
  
  // Resumo dos resultados
  console.log('\n' + '='.repeat(50));
  console.log('📊 RESUMO DOS TESTES');
  console.log('='.repeat(50));
  
  const tests = [
    { name: 'Health Check', result: results.healthCheck },
    { name: 'Filiação de Membro', result: !!results.memberJoin },
    { name: 'Tokenização de Cartão', result: !!results.cardTokenization },
    { name: 'Pagamento de Serviço', result: !!results.servicePayment },
    { name: 'Webhook', result: results.webhook },
    { name: 'Status de Pagamento', result: results.paymentStatus }
  ];
  
  let passed = 0;
  tests.forEach(test => {
    const status = test.result ? '✅ PASSOU' : '❌ FALHOU';
    console.log(`${test.name.padEnd(25)} ${status}`);
    if (test.result) passed++;
  });
  
  console.log('='.repeat(50));
  console.log(`📈 RESULTADO: ${passed}/${tests.length} testes passaram`);
  
  if (passed === tests.length) {
    console.log('🎉 TODOS OS TESTES PASSARAM! Backend está funcionando perfeitamente.');
  } else {
    console.log('⚠️  Alguns testes falharam. Verifique a configuração e logs.');
  }
  
  console.log('='.repeat(50));
  
  return passed === tests.length;
}

// Executar testes se chamado diretamente
if (require.main === module) {
  runAllTests()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Erro fatal nos testes:', error);
      process.exit(1);
    });
}

module.exports = { runAllTests, testData };