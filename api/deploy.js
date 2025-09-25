#!/usr/bin/env node

/**
 * Script de deploy e configuração para produção
 * Valida configurações, executa testes e prepara o ambiente
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Iniciando processo de deploy...\n');

// Verificar se arquivo .env existe
function checkEnvFile() {
  console.log('📋 Verificando arquivo .env...');
  
  const envPath = path.join(__dirname, '.env');
  if (!fs.existsSync(envPath)) {
    console.log('❌ Arquivo .env não encontrado!');
    console.log('   Copie o arquivo .env.example para .env e configure as variáveis.');
    console.log('   cp .env.example .env');
    return false;
  }
  
  console.log('✅ Arquivo .env encontrado');
  return true;
}

// Verificar variáveis obrigatórias
function checkRequiredEnvVars() {
  console.log('\n🔍 Verificando variáveis de ambiente obrigatórias...');
  
  const required = [
    'ASAAS_API_KEY',
    'SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'RENUM_WALLET_ID',
    'JWT_SECRET'
  ];
  
  const missing = [];
  
  required.forEach(varName => {
    if (!process.env[varName] || process.env[varName] === 'your_' + varName.toLowerCase() + '_here') {
      missing.push(varName);
    }
  });
  
  if (missing.length > 0) {
    console.log('❌ Variáveis obrigatórias não configuradas:');
    missing.forEach(varName => {
      console.log(`   - ${varName}`);
    });
    return false;
  }
  
  console.log('✅ Todas as variáveis obrigatórias estão configuradas');
  return true;
}

// Verificar dependências
function checkDependencies() {
  console.log('\n📦 Verificando dependências...');
  
  try {
    const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));
    const nodeModulesExists = fs.existsSync(path.join(__dirname, 'node_modules'));
    
    if (!nodeModulesExists) {
      console.log('⚠️  node_modules não encontrado. Instalando dependências...');
      execSync('npm install', { stdio: 'inherit', cwd: __dirname });
    }
    
    console.log('✅ Dependências verificadas');
    return true;
  } catch (error) {
    console.log('❌ Erro ao verificar dependências:', error.message);
    return false;
  }
}

// Executar testes
async function runTests() {
  console.log('\n🧪 Executando testes do backend...');
  
  try {
    // Importar e executar testes
    const { runAllTests } = require('./test-backend');
    const success = await runAllTests();
    
    if (success) {
      console.log('✅ Todos os testes passaram');
      return true;
    } else {
      console.log('❌ Alguns testes falharam');
      return false;
    }
  } catch (error) {
    console.log('❌ Erro ao executar testes:', error.message);
    return false;
  }
}

// Verificar conectividade com Asaas
async function checkAsaasConnection() {
  console.log('\n🔗 Verificando conectividade com Asaas...');
  
  try {
    const AsaasClient = require('./src/services/asaasClient');
    
    // Fazer uma chamada simples para testar a API
    const response = await AsaasClient.makeRequest('GET', '/customers?limit=1');
    
    console.log('✅ Conexão com Asaas funcionando');
    console.log(`   Ambiente: ${process.env.ASAAS_ENVIRONMENT}`);
    return true;
  } catch (error) {
    console.log('❌ Erro na conexão com Asaas:', error.message);
    return false;
  }
}

// Verificar conectividade com Supabase
async function checkSupabaseConnection() {
  console.log('\n🗄️  Verificando conectividade com Supabase...');
  
  try {
    const supabaseService = require('./src/services/supabaseClient');
    
    // Testar conexão básica
    const result = await supabaseService.executeQuery('profiles', {
      type: 'select',
      limit: 1
    }, null, { useServiceRole: true });
    
    console.log('✅ Conexão com Supabase funcionando');
    return true;
  } catch (error) {
    console.log('❌ Erro na conexão com Supabase:', error.message);
    return false;
  }
}

// Gerar relatório de configuração
function generateConfigReport() {
  console.log('\n📊 Relatório de Configuração:');
  console.log('='.repeat(50));
  
  const config = {
    'Ambiente': process.env.NODE_ENV || 'development',
    'Porta': process.env.PORT || '3000',
    'Asaas Environment': process.env.ASAAS_ENVIRONMENT || 'sandbox',
    'Supabase URL': process.env.SUPABASE_URL ? '✅ Configurado' : '❌ Não configurado',
    'JWT Secret': process.env.JWT_SECRET ? '✅ Configurado' : '❌ Não configurado',
    'Conta Principal COMADEMIG': process.env.ASAAS_API_KEY ? '✅ Via API_KEY' : '❌ API_KEY não configurada',
    'Wallet RENUM': process.env.RENUM_WALLET_ID ? '✅ Configurado' : '❌ Não configurado',
    'Slack Webhook': process.env.SLACK_WEBHOOK_URL ? '✅ Configurado' : '⚠️  Opcional',
    'CORS Origins': process.env.ALLOWED_ORIGINS || 'Padrão'
  };
  
  Object.entries(config).forEach(([key, value]) => {
    console.log(`${key.padEnd(20)} ${value}`);
  });
  
  console.log('='.repeat(50));
}

// Função principal
async function deploy() {
  console.log('🎯 Sistema de Pagamentos COMADEMIG - Deploy\n');
  
  const checks = [];
  
  // 1. Verificar arquivo .env
  checks.push({ name: 'Arquivo .env', result: checkEnvFile() });
  
  if (!checks[0].result) {
    console.log('\n❌ Deploy interrompido. Configure o arquivo .env primeiro.');
    return false;
  }
  
  // Carregar variáveis de ambiente
  require('dotenv').config();
  
  // 2. Verificar variáveis obrigatórias
  checks.push({ name: 'Variáveis de ambiente', result: checkRequiredEnvVars() });
  
  // 3. Verificar dependências
  checks.push({ name: 'Dependências', result: checkDependencies() });
  
  // 4. Verificar conectividade
  checks.push({ name: 'Conexão Asaas', result: await checkAsaasConnection() });
  checks.push({ name: 'Conexão Supabase', result: await checkSupabaseConnection() });
  
  // 5. Executar testes
  checks.push({ name: 'Testes do backend', result: await runTests() });
  
  // Resumo
  console.log('\n' + '='.repeat(60));
  console.log('📋 RESUMO DO DEPLOY');
  console.log('='.repeat(60));
  
  let allPassed = true;
  checks.forEach(check => {
    const status = check.result ? '✅ OK' : '❌ FALHOU';
    console.log(`${check.name.padEnd(25)} ${status}`);
    if (!check.result) allPassed = false;
  });
  
  console.log('='.repeat(60));
  
  if (allPassed) {
    console.log('🎉 DEPLOY CONCLUÍDO COM SUCESSO!');
    console.log('   O sistema está pronto para produção.');
    console.log('   Execute: npm start');
  } else {
    console.log('❌ DEPLOY FALHOU!');
    console.log('   Corrija os problemas acima antes de prosseguir.');
  }
  
  // Gerar relatório
  generateConfigReport();
  
  return allPassed;
}

// Executar deploy se chamado diretamente
if (require.main === module) {
  deploy()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Erro fatal no deploy:', error);
      process.exit(1);
    });
}

module.exports = { deploy };