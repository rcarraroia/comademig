#!/usr/bin/env node

/**
 * Gerador de chaves seguras para o sistema de pagamentos
 * Gera JWT secrets, webhook tokens e outras chaves necessárias
 */

const crypto = require('crypto');

console.log('🔐 Gerador de Chaves Seguras - Sistema COMADEMIG\n');

// Função para gerar chave aleatória
function generateSecureKey(length = 64) {
  return crypto.randomBytes(length).toString('hex');
}

// Função para gerar JWT secret
function generateJWTSecret() {
  return crypto.randomBytes(32).toString('base64');
}

// Função para gerar webhook token
function generateWebhookToken() {
  return crypto.randomBytes(16).toString('hex');
}

// Gerar todas as chaves
console.log('🔑 Chaves geradas para seu sistema:\n');

console.log('# ============================================================================');
console.log('# CHAVES DE SEGURANÇA - COPIE PARA SEU ARQUIVO .env');
console.log('# ============================================================================\n');

console.log('# Chave secreta para JWT (autenticação)');
console.log(`JWT_SECRET=${generateJWTSecret()}\n`);

console.log('# Token para validação de webhooks');
console.log(`WEBHOOK_SECRET_TOKEN=${generateWebhookToken()}\n`);

console.log('# Chave de criptografia adicional (se necessário)');
console.log(`ENCRYPTION_KEY=${generateSecureKey(32)}\n`);

console.log('# Chave para assinatura de dados');
console.log(`SIGNATURE_KEY=${generateSecureKey(32)}\n`);

console.log('# ============================================================================');
console.log('# INSTRUÇÕES IMPORTANTES');
console.log('# ============================================================================');
console.log('# 1. Copie as chaves acima para seu arquivo .env');
console.log('# 2. NUNCA compartilhe essas chaves');
console.log('# 3. Use chaves diferentes para cada ambiente (dev/staging/prod)');
console.log('# 4. Faça backup seguro dessas chaves');
console.log('# 5. Rotacione as chaves periodicamente');
console.log('# ============================================================================\n');

// Gerar exemplo de configuração completa
console.log('📋 Exemplo de configuração completa para .env:\n');

const exampleConfig = `# Ambiente
NODE_ENV=production
PORT=3000

# Chaves de segurança (geradas automaticamente)
JWT_SECRET=${generateJWTSecret()}
WEBHOOK_SECRET_TOKEN=${generateWebhookToken()}

# Asaas (PREENCHER COM SUAS INFORMAÇÕES)
ASAAS_API_KEY=sua_chave_asaas_aqui
ASAAS_ENVIRONMENT=production

# Supabase (PREENCHER COM SUAS INFORMAÇÕES)
SUPABASE_URL=https://amkelczfwazutrciqtlk.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key_aqui

# Carteiras para split (PREENCHER COM SUAS INFORMAÇÕES)
# COMADEMIG_WALLET_ID não é necessário - usa conta principal via API_KEY
RENUM_WALLET_ID=sua_carteira_renum

# CORS
ALLOWED_ORIGINS=https://comademig.com.br,https://www.comademig.com.br

# Notificações (OPCIONAL)
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/SEU/SLACK/WEBHOOK
ADMIN_EMAIL=admin@comademig.com.br`;

console.log(exampleConfig);

console.log('\n🎯 Próximos passos:');
console.log('1. Copie a configuração acima para seu arquivo .env');
console.log('2. Preencha as informações do Asaas e Supabase');
console.log('3. Execute: node deploy.js');
console.log('4. Execute: node test-backend.js');
console.log('5. Inicie o servidor: npm start\n');

// Salvar em arquivo se solicitado
if (process.argv.includes('--save')) {
  const fs = require('fs');
  const filename = `keys-${Date.now()}.txt`;
  
  fs.writeFileSync(filename, exampleConfig);
  console.log(`💾 Configuração salva em: ${filename}`);
  console.log('⚠️  IMPORTANTE: Mantenha este arquivo seguro e delete após usar!\n');
}