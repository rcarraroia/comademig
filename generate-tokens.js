/**
 * Script para gerar tokens seguros para produção
 * Execute: node generate-tokens.js
 */

import crypto from 'crypto';

function generateSecureToken(length = 32) {
  return crypto.randomBytes(length).toString('hex');
}

function generateWebhookToken() {
  return `webhook_prod_${generateSecureToken(24)}`;
}

function generateEncryptionKey() {
  return `encrypt_prod_${generateSecureToken(24)}`;
}

console.log('🔐 TOKENS SEGUROS PARA PRODUÇÃO');
console.log('================================\n');

console.log('📡 WEBHOOK TOKEN:');
console.log(generateWebhookToken());
console.log('');

console.log('🔒 ENCRYPTION KEY:');
console.log(generateEncryptionKey());
console.log('');

console.log('🎲 TOKEN GENÉRICO (32 chars):');
console.log(generateSecureToken(32));
console.log('');

console.log('⚠️  IMPORTANTE:');
console.log('- Copie estes tokens e configure nas variáveis de ambiente');
console.log('- NUNCA compartilhe estes tokens');
console.log('- Use tokens diferentes para cada ambiente');
console.log('- Configure o mesmo webhook token no painel do Asaas');
console.log('');

console.log('📋 PRÓXIMOS PASSOS:');
console.log('1. Configure no Vercel (Environment Variables)');
console.log('2. Configure no Supabase (Edge Functions → Secrets)');
console.log('3. Configure no Asaas (Webhooks → Token de Autenticação)');
console.log('4. Execute as migrações do banco');
console.log('5. Teste a integração completa');