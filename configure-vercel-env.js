#!/usr/bin/env node

/**
 * Script para configurar variáveis de ambiente no Vercel
 * 
 * INSTRUÇÕES:
 * 1. Instale a CLI do Vercel: npm i -g vercel
 * 2. Faça login: vercel login
 * 3. Configure sua chave do Asaas abaixo
 * 4. Execute: node configure-vercel-env.js
 */

const { execSync } = require('child_process');

// CONFIGURE SUA CHAVE ASAAS AQUI
const ASAAS_API_KEY = 'SUA_CHAVE_ASAAS_AQUI'; // ⚠️ SUBSTITUA PELA SUA CHAVE REAL

// Configurações do Supabase (já extraídas do código)
const SUPABASE_URL = 'https://amkelczfwazutrciqtlk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFta2VsY3pmd2F6dXRyY2lxdGxrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxODQxMjYsImV4cCI6MjA2ODc2MDEyNn0.7-M7DCqMzfZtXvcg6Zlf24zNv-XqvDT_oAznQGiqFHY';

function runCommand(command) {
  try {
    console.log(`🔄 Executando: ${command}`);
    const output = execSync(command, { encoding: 'utf8' });
    console.log(`✅ Sucesso: ${output.trim()}`);
    return true;
  } catch (error) {
    console.error(`❌ Erro: ${error.message}`);
    return false;
  }
}

function configureVercelEnv() {
  console.log('🚀 Configurando variáveis de ambiente no Vercel...\n');

  // Verificar se a chave foi configurada
  if (ASAAS_API_KEY === 'SUA_CHAVE_ASAAS_AQUI') {
    console.error('❌ ERRO: Configure sua chave ASAAS_API_KEY no script antes de executar!');
    console.log('📋 Edite o arquivo configure-vercel-env.js e substitua SUA_CHAVE_ASAAS_AQUI pela sua chave real.');
    process.exit(1);
  }

  const envVars = [
    { name: 'ASAAS_API_KEY', value: ASAAS_API_KEY },
    { name: 'SUPABASE_URL', value: SUPABASE_URL },
    { name: 'SUPABASE_ANON_KEY', value: SUPABASE_ANON_KEY }
  ];

  let success = true;

  for (const envVar of envVars) {
    const command = `vercel env add ${envVar.name} production`;
    console.log(`\n📝 Configurando ${envVar.name}...`);
    console.log(`💡 Quando solicitado, cole o valor: ${envVar.value.substring(0, 20)}...`);
    
    if (!runCommand(command)) {
      success = false;
    }
  }

  if (success) {
    console.log('\n🎉 Todas as variáveis foram configuradas!');
    console.log('🔄 Fazendo redeploy para aplicar as mudanças...');
    runCommand('vercel --prod');
    console.log('\n✅ Sistema configurado e deployado com sucesso!');
    console.log('🧪 Teste o sistema em: https://comademig.vercel.app/filiacao');
  } else {
    console.log('\n❌ Algumas configurações falharam. Verifique os erros acima.');
  }
}

// Verificar se a CLI do Vercel está instalada
try {
  execSync('vercel --version', { encoding: 'utf8' });
  configureVercelEnv();
} catch (error) {
  console.error('❌ CLI do Vercel não encontrada!');
  console.log('📦 Instale com: npm i -g vercel');
  console.log('🔑 Faça login com: vercel login');
  console.log('🔄 Execute novamente: node configure-vercel-env.js');
}