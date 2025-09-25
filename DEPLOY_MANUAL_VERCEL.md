# 🚀 DEPLOY MANUAL VERCEL - SOLUÇÃO RÁPIDA

## ⚡ **MÉTODO 1: VIA CLI (RECOMENDADO)**

### **1. Instalar Vercel CLI**
```bash
npm i -g vercel
```

### **2. Login e Deploy**
```bash
# Login no Vercel
vercel login

# Deploy direto para produção
vercel --prod

# Ou usar o script npm
cd api
npm run deploy:vercel
```

## 🖥️ **MÉTODO 2: VIA DASHBOARD VERCEL**

### **1. Acessar Dashboard**
- Vá para: https://vercel.com/dashboard
- Encontre o projeto "comademig"

### **2. Forçar Deploy**
- Clique em **"View Function Logs"** ou **"Deployments"**
- Clique em **"Redeploy"**
- Selecione branch `main`
- Clique em **"Redeploy"**

## 🔧 **MÉTODO 3: VERIFICAR CONFIGURAÇÃO**

### **1. Verificar Conexão Git**
No dashboard Vercel:
- Settings → Git
- Verificar se está conectado ao repositório correto
- Branch deve ser `main`

### **2. Verificar Auto-Deploy**
- Settings → Git
- **"Auto-deploy"** deve estar habilitado
- **"Production Branch"** deve ser `main`

## 🚨 **TROUBLESHOOTING**

### **Se Build Falhar:**
```bash
# Verificar logs no Vercel
vercel logs

# Ou testar build local
cd api
npm run vercel-build
```

### **Se Variáveis Faltarem:**
```bash
# Adicionar variáveis via CLI
vercel env add ASAAS_API_KEY
vercel env add SUPABASE_URL
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add JWT_SECRET
vercel env add RENUM_WALLET_ID
```

### **Se vercel.json Tiver Problema:**
Verificar se o arquivo está na raiz do projeto e com sintaxe correta.

## ✅ **VERIFICAÇÃO PÓS-DEPLOY**

### **1. Testar Health Check**
```bash
curl https://comademig.vercel.app/health
```

### **2. Verificar Logs**
```bash
vercel logs --follow
```

### **3. Testar Endpoints**
```bash
# Teste básico
curl https://comademig.vercel.app/api/health

# Teste com dados
curl -X POST https://comademig.vercel.app/api/members/join \
  -H "Content-Type: application/json" \
  -d '{"test": true}'
```

## 🎯 **COMANDO ÚNICO PARA DEPLOY**

```bash
# Deploy completo em uma linha
vercel --prod && curl https://comademig.vercel.app/health
```

## 📋 **CHECKLIST RÁPIDO**

- [ ] ✅ Vercel CLI instalado
- [ ] ✅ Login no Vercel feito
- [ ] ✅ Deploy executado (`vercel --prod`)
- [ ] ✅ Health check respondendo
- [ ] ✅ Variáveis de ambiente configuradas
- [ ] ✅ Logs sem erros críticos

## 🚀 **RESULTADO ESPERADO**

Após o deploy manual, você deve ver:
- ✅ Build concluído com sucesso
- ✅ URL ativa: https://comademig.vercel.app
- ✅ Health check retornando status 200
- ✅ API endpoints funcionais

**🎉 SISTEMA ESTARÁ OPERACIONAL EM POUCOS MINUTOS!**