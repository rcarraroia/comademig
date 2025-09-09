# 🚀 Servidor de Pagamentos COMADEMIG

Servidor Node.js para processar pagamentos via Asaas com webhooks automáticos.

## 📋 Funcionalidades

- ✅ **Assinaturas recorrentes** (filiação mensal)
- ✅ **Cobranças únicas** (certidões, regularização)
- ✅ **Processamento PIX** com QR Code
- ✅ **Processamento Cartão** de crédito
- ✅ **Webhooks automáticos** para confirmação de pagamentos
- ✅ **Integração Supabase** para salvar dados
- ✅ **Deploy Vercel** com um clique

## 🔧 Configuração

### 1. Instalar dependências
```bash
cd server
npm install
```

### 2. Configurar variáveis de ambiente
```bash
cp .env.example .env
```

Edite o arquivo `.env`:
```env
ASAAS_API_KEY=sua_chave_api_do_asaas
SUPABASE_URL=https://amkelczfwazutrciqtlk.supabase.co
SUPABASE_ANON_KEY=sua_chave_supabase
PORT=3001
```

### 3. Executar localmente
```bash
npm run dev
```

### 4. Deploy no Vercel
```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy
vercel

# Configurar variáveis de ambiente no Vercel
vercel env add ASAAS_API_KEY
vercel env add SUPABASE_URL  
vercel env add SUPABASE_ANON_KEY
```

### 5. Configurar Webhook no Asaas
```bash
# Após deploy, configurar webhook automaticamente
node setup-webhook.js https://seu-projeto.vercel.app
```

## 📡 Endpoints

### Pagamentos
- `POST /api/create-subscription` - Criar assinatura (filiação)
- `POST /api/create-payment` - Criar cobrança única
- `POST /api/process-pix/:paymentId` - Processar PIX
- `POST /api/process-card/:paymentId` - Processar cartão

### Webhooks
- `POST /api/webhook` - Receber notificações do Asaas
- `POST /api/setup-webhook` - Configurar webhook
- `GET /api/webhooks` - Listar webhooks

### Utilitários
- `GET /api/health` - Status do servidor

## 🔔 Eventos de Webhook

O servidor processa automaticamente:

- `PAYMENT_CONFIRMED` - Pagamento confirmado
- `PAYMENT_RECEIVED` - Pagamento recebido
- `PAYMENT_OVERDUE` - Pagamento vencido
- `PAYMENT_DELETED` - Pagamento cancelado
- `PAYMENT_RESTORED` - Pagamento restaurado
- `PAYMENT_REFUNDED` - Pagamento estornado
- `SUBSCRIPTION_CREATED` - Assinatura criada
- `SUBSCRIPTION_UPDATED` - Assinatura atualizada
- `SUBSCRIPTION_DELETED` - Assinatura cancelada

## 🛡️ Segurança

- ✅ Chave API segura no servidor
- ✅ CORS configurado para domínios específicos
- ✅ Validação de dados de entrada
- ✅ Logs detalhados para auditoria
- ✅ Tratamento de erros robusto

## 📊 Monitoramento

### Logs
Todos os eventos são logados com timestamp:
```
🔄 Criando assinatura...
✅ Assinatura criada: sub_123456
📡 Webhook recebido: PAYMENT_CONFIRMED
💰 Pagamento confirmado: pay_789012
```

### Health Check
```bash
curl https://seu-projeto.vercel.app/api/health
```

## 🚨 Troubleshooting

### Webhook não funciona
1. Verificar se URL está acessível
2. Verificar logs do Vercel
3. Testar endpoint manualmente
4. Reconfigurar webhook: `node setup-webhook.js URL`

### Pagamentos não processam
1. Verificar chave API do Asaas
2. Verificar conexão com Supabase
3. Verificar logs de erro
4. Testar endpoints individualmente

## 📞 Suporte

Em caso de problemas:
1. Verificar logs do Vercel
2. Testar health check
3. Verificar configuração de webhooks
4. Contatar suporte técnico