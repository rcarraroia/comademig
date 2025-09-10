#!/usr/bin/env node

/**
 * Script de validação para deploy no Vercel
 * Sistema de Pagamentos COMADEMIG
 */

const fs = require('fs');
const path = require('path');

// Cores para output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

// Validações
const validations = {
  // Verificar se arquivo vercel.json existe
  checkVercelConfig() {
    logInfo('Verificando configuração do Vercel...');
    
    const vercelPath = path.join(process.cwd(), '..', 'vercel.json');
    if (!fs.existsSync(vercelPath)) {
      logError('Arquivo vercel.json não encontrado na raiz do projeto');
      return false;
    }
    
    try {
      const config = JSON.parse(fs.readFileSync(vercelPath, 'utf8'));
      
      // Verificar configurações essenciais
      if (!config.builds || !config.routes) {
        logError('Configuração do Vercel incompleta');
        return false;
      }
      
      logSuccess('Configuração do Vercel válida');
      return true;
    } catch (error) {
      logError(`Erro ao ler vercel.json: ${error.message}`);
      return false;
    }
  },

  // Verificar variáveis de ambiente obrigatórias
  checkEnvironmentVariables() {
    logInfo('Verificando variáveis de ambiente...');
    
    const requiredVars = [
      'ASAAS_API_KEY',
      'SUPABASE_URL',
      'SUPABASE_SERVICE_ROLE_KEY',
      'JWT_SECRET',
      'COMADEMIG_WALLET_ID',
      'RENUM_WALLET_ID'
    ];
    
    let allValid = true;
    
    for (const varName of requiredVars) {
      const value = process.env[varName];
      
      if (!value) {
        logError(`Variável ${varName} não configurada`);
        allValid = false;
      } else if (value.includes('your_') || value.includes('example')) {
        logError(`Variável ${varName} contém valor de exemplo`);
        allValid = false;
      } else {
        logSuccess(`Variável ${varName} configurada`);
      }
    }
    
    return allValid;
  },

  // Verificar estrutura de arquivos
  checkFileStructure() {
    logInfo('Verificando estrutura de arquivos...');
    
    const requiredFiles = [
      'index.js',
      'package.json',
      'src/config/index.js',
      'src/services/asaasClient.js',
      'src/services/supabaseClient.js',
      'src/routes/members.js',
      'src/routes/payments.js',
      'src/routes/webhook.js'
    ];
    
    let allExist = true;
    
    for (const file of requiredFiles) {
      const filePath = path.join(__dirname, '..', file);
      
      if (!fs.existsSync(filePath)) {
        logError(`Arquivo obrigatório não encontrado: ${file}`);
        allExist = false;
      } else {
        logSuccess(`Arquivo encontrado: ${file}`);
      }
    }
    
    return allExist;
  },

  // Verificar dependências
  checkDependencies() {
    logInfo('Verificando dependências...');
    
    try {
      const packagePath = path.join(__dirname, '..', 'package.json');
      const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
      
      const requiredDeps = [
        'express',
        'axios',
        '@supabase/supabase-js',
        'joi',
        'winston',
        'express-rate-limit',
        'helmet',
        'cors'
      ];
      
      let allInstalled = true;
      
      for (const dep of requiredDeps) {
        if (!packageJson.dependencies[dep]) {
          logError(`Dependência obrigatória não encontrada: ${dep}`);
          allInstalled = false;
        } else {
          logSuccess(`Dependência encontrada: ${dep}`);
        }
      }
      
      return allInstalled;
    } catch (error) {
      logError(`Erro ao verificar dependências: ${error.message}`);
      return false;
    }
  },

  // Verificar sintaxe dos arquivos principais
  checkSyntax() {
    logInfo('Verificando sintaxe dos arquivos...');
    
    const filesToCheck = [
      'index.js',
      'src/config/index.js',
      'src/services/asaasClient.js',
      'src/services/supabaseClient.js'
    ];
    
    let allValid = true;
    
    for (const file of filesToCheck) {
      try {
        const filePath = path.join(__dirname, '..', file);
        require(filePath);
        logSuccess(`Sintaxe válida: ${file}`);
      } catch (error) {
        logError(`Erro de sintaxe em ${file}: ${error.message}`);
        allValid = false;
      }
    }
    
    return allValid;
  },

  // Verificar configuração de rotas
  checkRoutes() {
    logInfo('Verificando configuração de rotas...');
    
    try {
      const indexPath = path.join(__dirname, '..', 'index.js');
      const indexContent = fs.readFileSync(indexPath, 'utf8');
      
      const requiredRoutes = [
        '/api/members',
        '/api/payments',
        '/api/cards',
        '/api/affiliate',
        '/webhook'
      ];
      
      let allConfigured = true;
      
      for (const route of requiredRoutes) {
        if (!indexContent.includes(route)) {
          logError(`Rota não configurada: ${route}`);
          allConfigured = false;
        } else {
          logSuccess(`Rota configurada: ${route}`);
        }
      }
      
      return allConfigured;
    } catch (error) {
      logError(`Erro ao verificar rotas: ${error.message}`);
      return false;
    }
  },

  // Verificar configuração de segurança
  checkSecurity() {
    logInfo('Verificando configurações de segurança...');
    
    const securityChecks = [
      {
        name: 'JWT_SECRET',
        check: () => {
          const secret = process.env.JWT_SECRET;
          return secret && secret.length >= 32 && !secret.includes('example');
        }
      },
      {
        name: 'WEBHOOK_SECRET_TOKEN',
        check: () => {
          const token = process.env.WEBHOOK_SECRET_TOKEN;
          return token && token.length >= 16;
        }
      },
      {
        name: 'NODE_ENV',
        check: () => process.env.NODE_ENV === 'production'
      }
    ];
    
    let allSecure = true;
    
    for (const { name, check } of securityChecks) {
      if (check()) {
        logSuccess(`Configuração de segurança OK: ${name}`);
      } else {
        logError(`Configuração de segurança falha: ${name}`);
        allSecure = false;
      }
    }
    
    return allSecure;
  }
};

// Executar todas as validações
async function runValidations() {
  log('\n🚀 VALIDAÇÃO PRE-DEPLOY VERCEL - SISTEMA COMADEMIG\n', 'blue');
  
  const results = [];
  
  for (const [name, validation] of Object.entries(validations)) {
    try {
      const result = await validation();
      results.push({ name, success: result });
    } catch (error) {
      logError(`Erro na validação ${name}: ${error.message}`);
      results.push({ name, success: false, error: error.message });
    }
  }
  
  // Resumo dos resultados
  log('\n📊 RESUMO DA VALIDAÇÃO\n', 'blue');
  
  const successful = results.filter(r => r.success).length;
  const total = results.length;
  
  results.forEach(({ name, success, error }) => {
    if (success) {
      logSuccess(`${name}: PASSOU`);
    } else {
      logError(`${name}: FALHOU${error ? ` - ${error}` : ''}`);
    }
  });
  
  log(`\n📈 RESULTADO: ${successful}/${total} validações passaram\n`);
  
  if (successful === total) {
    logSuccess('🎉 TODAS AS VALIDAÇÕES PASSARAM - PRONTO PARA DEPLOY!');
    process.exit(0);
  } else {
    logError('❌ ALGUMAS VALIDAÇÕES FALHARAM - CORRIJA ANTES DO DEPLOY');
    process.exit(1);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  runValidations().catch(error => {
    logError(`Erro fatal na validação: ${error.message}`);
    process.exit(1);
  });
}

module.exports = { validations, runValidations };