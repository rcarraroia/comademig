/**
 * Script para atualizar .env para produção
 * Execute: node update-env-production.js
 */

import fs from 'fs';
import path from 'path';

const WEBHOOK_TOKEN = 'webhook_prod_36a882b2b9ff39b4106009bd1c554a00901d507ee3758dce';
const ENCRYPTION_KEY = 'encrypt_prod_e5ec0c0371d871d79c41f35653a5569a42a85fdee0015f11';

function updateEnvFile() {
  const envPath = '.env';
  
  try {
    let envContent = fs.readFileSync(envPath, 'utf8');
    
    console.log('🔄 Atualizando .env para produção...\n');
    
    // Atualizar configurações do Asaas para produção
    envContent = envContent.replace(
      /VITE_ASAAS_API_KEY=".*"/,
      'VITE_ASAAS_API_KEY="SUA_CHAVE_ASAAS_PRODUCAO_AQUI"'
    );
    
    envContent = envContent.replace(
      /VITE_ASAAS_ENVIRONMENT=".*"/,
      'VITE_ASAAS_ENVIRONMENT="production"'
    );
    
    envContent = envContent.replace(
      /VITE_ASAAS_BASE_URL=".*"/,
      'VITE_ASAAS_BASE_URL="https://api.asaas.com/v3"'
    );
    
    envContent = envContent.replace(
      /VITE_ASAAS_WEBHOOK_TOKEN=".*"/,
      `VITE_ASAAS_WEBHOOK_TOKEN="${WEBHOOK_TOKEN}"`
    );
    
    // Adicionar chave de criptografia se não existir
    if (!envContent.includes('VITE_ENCRYPTION_KEY')) {
      envContent += `\n# Chave de criptografia\nVITE_ENCRYPTION_KEY="${ENCRYPTION_KEY}"\n`;
    }
    
    // Salvar arquivo atualizado
    fs.writeFileSync(envPath, envContent);
    
    console.log('✅ Arquivo .env atualizado com sucesso!\n');
    console.log('📋 PRÓXIMOS PASSOS:');
    console.log('1. Obtenha sua chave de PRODUÇÃO do Asaas');
    console.log('2. Substitua "SUA_CHAVE_ASAAS_PRODUCAO_AQUI" pela chave real');
    console.log('3. Configure as mesmas variáveis no Vercel');
    console.log('4. Configure as secrets no Supabase');
    console.log('5. Execute as migrações do banco');
    console.log('\n🔐 Tokens gerados:');
    console.log(`Webhook Token: ${WEBHOOK_TOKEN}`);
    console.log(`Encryption Key: ${ENCRYPTION_KEY}`);
    
  } catch (error) {
    console.error('❌ Erro ao atualizar .env:', error.message);
  }
}

updateEnvFile();