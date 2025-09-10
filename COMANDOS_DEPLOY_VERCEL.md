# 🚀 COMANDOS RÁPIDOS - DEPLOY VERCEL
## Sistema de Pagamentos COMADEMIG

---

## ⚡ **DEPLOY AUTOMÁTICO (RECOMENDADO)**

### **1. Deploy via Git Push**
```bash
# Validar antes do commit
cd api
npm run validate:vercel

# Commit e push (deploy automático)
git add .
git commit -m "Deploy: Sistema de pagamentos v1.0"
git push origin main
```

### **2. Verificar Deploy**
```bash
# Verificar status no Vercel Dashboard
# Ou via health check:
curl https://your-app.vercel.app/health
```

---

## 🛠️ **DEPLOY MANUAL (SE NECESSÁRIO)**

### **1. Instalar Vercel CLI**
```bash
npm i -g vercel
```

### **2. Login e Deploy**
```bash
# Login no Vercel
vercel login

# Deploy para produção
vercel --prod

# Ou usar script npm
npm run deploy:vercel
```

---

## 🔍 **VALIDAÇÃO E TESTES**

### **Validação Completa**
```bash
cd api

# Validar configuração para Vercel
npm run validate:vercel

# Executar testes
npm run test

# Validação completa
npm run validate
```

### **Testes Específicos**
```bash
# Testar conexão Asaas
node test-backend.js

# Testar health check
npm run health

# Verificar logs
npm run logs
```

---

## 📊 **MONITORAMENTO**

### **Logs em Tempo Real**
```bash
# Via Vercel CLI
vercel logs --follow

# Ou usar script npm
npm run logs:vercel
```

### **Health Check**
```bash
# Local
curl http://localhost:3000/health

# Produção
curl https://comademig.vercel.app/health
```

### **Métricas**
```bash
# Dashboard de transações
curl https://comademig.vercel.app/dashboard/transactions

# Métricas de performance
curl https://comademig.vercel.app/metrics
```

---

## 🚨 **TROUBLESHOOTING**

### **Build Falha**
```bash
# Verificar logs detalhados
vercel logs [deployment-url]

# Validar localmente
npm run validate:vercel
```

### **Variáveis de Ambiente**
```bash
# Listar variáveis no Vercel
vercel env ls

# Adicionar variável
vercel env add VARIABLE_NAME production
```

### **Rollback**
```bash
# Rollback para deploy anterior
vercel rollback [deployment-url]
```

---

## 📋 **CHECKLIST RÁPIDO**

### **Antes do Deploy**
```bash
# ✅ Executar validação
npm run validate:vercel

# ✅ Executar testes
npm run test

# ✅ Verificar variáveis no Vercel Dashboard
# ✅ Confirmar migrações no Supabase
```

### **Após o Deploy**
```bash
# ✅ Testar health check
curl https://comademig.vercel.app/health

# ✅ Testar endpoints principais
curl -X POST https://comademig.vercel.app/api/members/join

# ✅ Verificar webhooks no Asaas
# ✅ Monitorar logs por alguns minutos
```

---

## 🎯 **COMANDOS ESSENCIAIS**

```bash
# Deploy completo em uma linha
cd api && npm run validate:vercel && cd .. && git add . && git commit -m "Deploy update" && git push origin main

# Verificação rápida pós-deploy
curl https://comademig.vercel.app/health && curl https://comademig.vercel.app/metrics

# Monitoramento contínuo
vercel logs --follow
```

---

## 🔐 **CONFIGURAÇÃO DE PRODUÇÃO**

### **Variáveis Obrigatórias no Vercel**
- `ASAAS_API_KEY` - Chave de produção do Asaas (conta COMADEMIG)
- `SUPABASE_URL` - URL do projeto Supabase
- `SUPABASE_SERVICE_ROLE_KEY` - Chave service role
- `JWT_SECRET` - Chave secreta para JWT
- `RENUM_WALLET_ID` - ID da carteira RENUM (para split de 40%)
- `SLACK_WEBHOOK_URL` - URL do webhook Slack
- `INTERNAL_API_TOKEN` - Token para APIs internas
- `NODE_ENV=production`

**Nota**: COMADEMIG_WALLET_ID não é necessário pois a conta principal (API_KEY) já recebe automaticamente.

### **Configurar Webhooks no Asaas**
```
URL: https://comademig.vercel.app/webhook/asaas
Eventos: PAYMENT_RECEIVED, PAYMENT_FAILED, SUBSCRIPTION_CREATED
```

---

## 🎉 **DEPLOY CONCLUÍDO!**

Após seguir estes comandos, seu sistema estará **100% operacional** no Vercel com:

- ✅ **8 Endpoints** funcionais
- ✅ **Split automático** 40%/40%/20%
- ✅ **Webhooks** processando em tempo real
- ✅ **Monitoramento** ativo
- ✅ **Segurança** implementada

**🚀 SISTEMA COMADEMIG LIVE NO VERCEL!**