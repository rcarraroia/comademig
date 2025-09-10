# 🚀 GUIA DE DEPLOY NO VERCEL
## Sistema de Pagamentos COMADEMIG

---

## 📋 **VISÃO GERAL**

O sistema está configurado para deploy automático no Vercel através de push para o repositório Git. Este guia detalha o processo completo de configuração e deploy.

---

## 🔧 **PRÉ-REQUISITOS**

### **1. Configurações Obrigatórias**
- ✅ Conta Vercel configurada
- ✅ Repositório Git conectado ao Vercel
- ✅ Variáveis de ambiente configuradas no Vercel
- ✅ Migrações executadas no Supabase

### **2. Variáveis de Ambiente no Vercel**
Configure as seguintes variáveis no painel do Vercel:

```bash
# Asaas API
ASAAS_API_KEY=your_production_asaas_api_key
ASAAS_ENVIRONMENT=production
ASAAS_BASE_URL=https://www.asaas.com/api/v3

# Supabase
SUPABASE_URL=https://amkelczfwazutrciqtlk.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Split de Pagamentos
COMADEMIG_WALLET_ID=your_comademig_wallet_id
RENUM_WALLET_ID=your_renum_wallet_id

# Segurança
JWT_SECRET=your_jwt_secret
WEBHOOK_SECRET_TOKEN=your_webhook_secret
INTERNAL_API_TOKEN=your_internal_token

# Notificações
SLACK_WEBHOOK_URL=your_slack_webhook_url
ADMIN_EMAIL=admin@comademig.com.br

# Performance
NODE_ENV=production
```

---

## 🚀 **PROCESSO DE DEPLOY**

### **Método 1: Deploy Automático (Recomendado)**

#### **1. Push para Repositório**
```bash
# Fazer commit das alterações
git add .
git commit -m "Deploy: Sistema de pagamentos completo"

# Push para branch principal
git push origin main
```

#### **2. Verificação Automática**
- ✅ Vercel detecta o push automaticamente
- ✅ Inicia build e deploy automaticamente
- ✅ Executa testes se configurados
- ✅ Deploy em produção se tudo estiver OK

### **Método 2: Deploy Manual via CLI**

#### **1. Instalar Vercel CLI**
```bash
npm i -g vercel
```

#### **2. Login e Deploy**
```bash
# Login no Vercel
vercel login

# Deploy para produção
vercel --prod
```

---

## 📊 **CONFIGURAÇÃO DO VERCEL**

### **1. Arquivo vercel.json**
Crie na raiz do projeto:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "api/index.js",
      "use": "@vercel/node"
    },
    {
      "src": "dist/**",
      "use": "@vercel/static"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/api/index.js"
    },
    {
      "src": "/(.*)",
      "dest": "/dist/$1"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  },
  "functions": {
    "api/index.js": {
      "maxDuration": 30
    }
  }
}
```

### **2. Scripts de Build**
Adicione no package.json:

```json
{
  "scripts": {
    "build": "npm run build:frontend && npm run build:api",
    "build:frontend": "cd src && npm run build",
    "build:api": "cd api && npm install --production",
    "start": "cd api && node index.js",
    "vercel-build": "npm run build"
  }
}
```

---

## 🔍 **VALIDAÇÃO PRÉ-DEPLOY**

### **Script de Validação Vercel**
Execute antes do deploy:

```bash
# Navegar para pasta da API
cd api

# Executar validação
node deploy.js

# Executar testes
npm test

# Verificar configuração
npm run validate
```

### **Checklist de Validação**
- ✅ Todas as variáveis de ambiente configuradas
- ✅ Chaves Asaas válidas
- ✅ Conexão Supabase funcionando
- ✅ Migrações aplicadas
- ✅ Testes passando
- ✅ Webhooks configurados

---

## 📈 **MONITORAMENTO PÓS-DEPLOY**

### **1. Health Check**
Após deploy, verificar:
```bash
curl https://your-app.vercel.app/health
```

### **2. Endpoints Críticos**
Testar endpoints principais:
```bash
# Teste de filiação
curl -X POST https://your-app.vercel.app/api/members/join

# Teste de pagamento
curl -X POST https://your-app.vercel.app/api/payments/service

# Teste de webhook
curl -X POST https://your-app.vercel.app/webhook/asaas
```

### **3. Dashboard de Monitoramento**
Acessar métricas:
```bash
https://your-app.vercel.app/metrics
https://your-app.vercel.app/dashboard/transactions
```

---

## 🔧 **CONFIGURAÇÃO DE WEBHOOKS**

### **1. URLs de Webhook no Asaas**
Configure no painel do Asaas:

```
URL de Webhook: https://your-app.vercel.app/webhook/asaas
Eventos: PAYMENT_RECEIVED, PAYMENT_FAILED, SUBSCRIPTION_CREATED
```

### **2. Validação de Webhooks**
Teste a recepção:
```bash
# Simular webhook
curl -X POST https://your-app.vercel.app/webhook/asaas \
  -H "Content-Type: application/json" \
  -d '{"event": "PAYMENT_RECEIVED", "payment": {"id": "test"}}'
```

---

## 🚨 **TROUBLESHOOTING**

### **Problemas Comuns**

#### **1. Build Falha**
```bash
# Verificar logs no Vercel Dashboard
# Ou via CLI:
vercel logs
```

#### **2. Variáveis de Ambiente**
```bash
# Listar variáveis configuradas
vercel env ls

# Adicionar variável
vercel env add VARIABLE_NAME
```

#### **3. Timeout de Função**
```bash
# Aumentar timeout no vercel.json
"functions": {
  "api/index.js": {
    "maxDuration": 60
  }
}
```

#### **4. Erro de Conexão Supabase**
- Verificar se IP do Vercel está liberado
- Confirmar chaves de API
- Testar conexão local primeiro

---

## 📋 **CHECKLIST DE DEPLOY**

### **Antes do Deploy**
- [ ] ✅ Código commitado e pushed
- [ ] ✅ Variáveis de ambiente configuradas no Vercel
- [ ] ✅ Migrações executadas no Supabase
- [ ] ✅ Testes locais passando
- [ ] ✅ Validação de configuração OK

### **Durante o Deploy**
- [ ] ✅ Build executado com sucesso
- [ ] ✅ Deploy concluído sem erros
- [ ] ✅ Health check respondendo
- [ ] ✅ Logs sem erros críticos

### **Após o Deploy**
- [ ] ✅ Endpoints funcionando
- [ ] ✅ Webhooks recebendo eventos
- [ ] ✅ Notificações funcionando
- [ ] ✅ Monitoramento ativo
- [ ] ✅ Backup configurado

---

## 🎯 **COMANDOS ESSENCIAIS**

### **Deploy Rápido**
```bash
# Deploy completo em um comando
git add . && git commit -m "Deploy update" && git push origin main
```

### **Rollback**
```bash
# Via Vercel Dashboard ou CLI
vercel rollback [deployment-url]
```

### **Logs em Tempo Real**
```bash
# Monitorar logs
vercel logs --follow
```

### **Status do Deploy**
```bash
# Verificar status
vercel ls
vercel inspect [deployment-url]
```

---

## 🔐 **SEGURANÇA**

### **Configurações Obrigatórias**
- ✅ HTTPS habilitado (automático no Vercel)
- ✅ Variáveis sensíveis apenas no Vercel
- ✅ Rate limiting configurado
- ✅ CORS restrito aos domínios corretos
- ✅ Logs de auditoria ativos

### **Monitoramento de Segurança**
- ✅ Alertas para falhas de autenticação
- ✅ Monitoramento de tentativas de acesso
- ✅ Logs de webhook validados
- ✅ Notificações de erro em tempo real

---

## 📞 **SUPORTE**

### **Em Caso de Problemas**
1. **Verificar logs do Vercel**
2. **Consultar health check**: `/health`
3. **Verificar métricas**: `/metrics`
4. **Testar endpoints individualmente**
5. **Validar configuração**: `node deploy.js`

### **Contatos de Emergência**
- **Vercel Support**: https://vercel.com/support
- **Asaas Support**: suporte@asaas.com
- **Supabase Support**: https://supabase.com/support

---

## 🎉 **CONCLUSÃO**

O sistema está **100% pronto** para deploy no Vercel. Siga este guia passo a passo para um deploy seguro e monitorado.

**🚀 SISTEMA PRONTO PARA PRODUÇÃO NO VERCEL!**

---

*Última atualização: 09 de Janeiro de 2025*