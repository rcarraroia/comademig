# 🚀 Guia Completo para Produção - Sistema de Pagamentos COMADEMIG

## 📋 Pré-requisitos

### 1. Contas e Serviços Necessários
- ✅ **Conta Asaas** (sandbox e produção)
- ✅ **Projeto Supabase** configurado
- ✅ **Servidor/Hosting** (VPS, Heroku, Vercel, etc.)
- ✅ **Domínio** para a API (ex: api.comademig.com.br)

### 2. Informações que Você Precisa Ter
- 🔑 **API Key do Asaas** (produção)
- 🔑 **Service Role Key do Supabase**
- 🏦 **IDs das Carteiras** (COMADEMIG e RENUM no Asaas)
- 🔐 **Chave JWT** (gerar uma segura)

## 🛠️ Configuração Passo a Passo

### Passo 1: Preparar o Ambiente

```bash
# 1. Clone/baixe o código
cd api

# 2. Instale as dependências
npm install

# 3. Copie o arquivo de configuração
cp .env.example .env
```

### Passo 2: Configurar Variáveis de Ambiente

Edite o arquivo `.env` com suas informações reais:

```bash
# OBRIGATÓRIO - Configurações do Asaas
ASAAS_API_KEY=sua_chave_asaas_producao
ASAAS_ENVIRONMENT=production

# OBRIGATÓRIO - Configurações do Supabase  
SUPABASE_URL=https://amkelczfwazutrciqtlk.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key

# OBRIGATÓRIO - Carteiras para Split
COMADEMIG_WALLET_ID=sua_carteira_comademig
RENUM_WALLET_ID=sua_carteira_renum

# OBRIGATÓRIO - Segurança
JWT_SECRET=sua_chave_jwt_super_secreta
WEBHOOK_SECRET_TOKEN=token_para_validar_webhooks

# OBRIGATÓRIO - CORS
ALLOWED_ORIGINS=https://comademig.com.br,https://www.comademig.com.br
```

### Passo 3: Executar Migrações do Banco

**⚠️ IMPORTANTE: Execute manualmente no Supabase**

1. Abra o **Editor SQL** no painel do Supabase
2. Execute os scripts na ordem:

```sql
-- 1. Primeiro execute:
-- Conteúdo do arquivo: supabase/migrations/20250909_create_payments_system_tables.sql

-- 2. Depois execute:  
-- Conteúdo do arquivo: supabase/migrations/20250909_create_payments_rls_policies.sql
```

### Passo 4: Configurar Webhooks no Asaas

1. Acesse o **painel do Asaas** (produção)
2. Vá em **Configurações > Webhooks**
3. Adicione a URL: `https://sua-api.com.br/webhook/asaas`
4. Selecione os eventos:
   - ✅ PAYMENT_RECEIVED
   - ✅ PAYMENT_CONFIRMED  
   - ✅ PAYMENT_FAILED
   - ✅ PAYMENT_REFUNDED
   - ✅ SUBSCRIPTION_CREATED
   - ✅ SUBSCRIPTION_PAYMENT_RECEIVED
   - ✅ SUBSCRIPTION_CANCELED

### Passo 5: Validar Configuração

```bash
# Execute o script de validação
node deploy.js
```

Este script vai verificar:
- ✅ Arquivo .env configurado
- ✅ Variáveis obrigatórias preenchidas
- ✅ Conexão com Asaas funcionando
- ✅ Conexão com Supabase funcionando
- ✅ Todos os endpoints testados

### Passo 6: Testar o Sistema

```bash
# Execute os testes completos
node test-backend.js
```

## 🌐 Deploy em Diferentes Plataformas

### Deploy no Heroku

```bash
# 1. Instalar Heroku CLI
# 2. Fazer login
heroku login

# 3. Criar app
heroku create comademig-payments-api

# 4. Configurar variáveis de ambiente
heroku config:set ASAAS_API_KEY=sua_chave
heroku config:set SUPABASE_URL=sua_url
# ... (todas as outras variáveis)

# 5. Deploy
git push heroku main
```

### Deploy no Vercel

```bash
# 1. Instalar Vercel CLI
npm i -g vercel

# 2. Deploy
vercel

# 3. Configurar variáveis no painel Vercel
# Vá em Settings > Environment Variables
```

### Deploy em VPS (Ubuntu)

```bash
# 1. Conectar no servidor
ssh user@seu-servidor.com

# 2. Instalar Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 3. Instalar PM2
sudo npm install -g pm2

# 4. Clonar código
git clone seu-repositorio
cd api

# 5. Instalar dependências
npm install

# 6. Configurar .env
nano .env

# 7. Iniciar com PM2
pm2 start index.js --name "comademig-api"
pm2 startup
pm2 save
```

## 🔒 Configurações de Segurança

### 1. Firewall e Portas
```bash
# Permitir apenas portas necessárias
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
sudo ufw allow 3000  # API (se necessário)
sudo ufw enable
```

### 2. SSL/HTTPS
- Use **Cloudflare** ou **Let's Encrypt**
- Configure redirecionamento HTTP → HTTPS
- Valide certificados regularmente

### 3. Monitoramento
```bash
# Logs da aplicação
pm2 logs comademig-api

# Monitoramento em tempo real
pm2 monit
```

## 📊 Endpoints Disponíveis

### 🔓 Públicos
- `GET /health` - Status da API
- `POST /api/members/join` - Filiação de membros
- `POST /api/cards/tokenize` - Tokenização de cartões
- `POST /webhook/asaas` - Webhooks do Asaas

### 🔐 Autenticados (requer JWT)
- `POST /api/payments/service` - Pagamentos de serviços
- `GET /api/payments/:id/status` - Status de pagamento
- `POST /api/cards/save-token` - Salvar token de cartão
- `DELETE /api/cards/token/:id` - Remover token

## 🧪 Testes de Produção

### 1. Teste de Filiação
```bash
curl -X POST https://sua-api.com.br/api/members/join \
  -H "Content-Type: application/json" \
  -d '{
    "name": "João Silva",
    "email": "joao@teste.com",
    "phone": "31999999999",
    "cpfCnpj": "12345678901",
    "cargo": "veterinario",
    "plan_id": "plan_veterinario",
    "payment_method": "PIX"
  }'
```

### 2. Teste de Webhook
```bash
curl -X POST https://sua-api.com.br/webhook/asaas \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Token: seu_token" \
  -d '{
    "event": "PAYMENT_RECEIVED",
    "payment": {
      "id": "pay_123",
      "value": 150.00,
      "status": "RECEIVED"
    }
  }'
```

## 📈 Monitoramento e Alertas

### 1. Métricas Importantes
- ✅ **Uptime da API** (deve ser > 99.9%)
- ✅ **Tempo de resposta** (< 2 segundos)
- ✅ **Taxa de erro** (< 1%)
- ✅ **Webhooks processados** (100%)

### 2. Alertas Recomendados
- 🚨 API fora do ar por > 5 minutos
- 🚨 Taxa de erro > 5%
- 🚨 Falha na conexão com Asaas
- 🚨 Falha na conexão com Supabase

### 3. Logs Importantes
```bash
# Ver logs em tempo real
tail -f logs/api.log

# Filtrar erros
grep "ERROR" logs/api.log

# Monitorar webhooks
grep "webhook" logs/api.log
```

## 🔧 Manutenção

### Backup Regular
```bash
# Backup do banco (Supabase faz automaticamente)
# Backup dos logs
tar -czf backup-logs-$(date +%Y%m%d).tar.gz logs/

# Backup da configuração
cp .env .env.backup
```

### Atualizações
```bash
# 1. Fazer backup
cp .env .env.backup

# 2. Atualizar código
git pull origin main

# 3. Instalar dependências
npm install

# 4. Reiniciar serviço
pm2 restart comademig-api
```

## 🆘 Troubleshooting

### Problemas Comuns

#### 1. API não responde
```bash
# Verificar se está rodando
pm2 status

# Ver logs de erro
pm2 logs comademig-api --err

# Reiniciar
pm2 restart comademig-api
```

#### 2. Erro de conexão com Asaas
- ✅ Verificar API Key
- ✅ Verificar ambiente (sandbox/production)
- ✅ Verificar conectividade de rede

#### 3. Erro de conexão com Supabase
- ✅ Verificar URL do projeto
- ✅ Verificar Service Role Key
- ✅ Verificar políticas RLS

#### 4. Webhooks não funcionam
- ✅ Verificar URL configurada no Asaas
- ✅ Verificar token de validação
- ✅ Verificar logs de webhook

## 📞 Suporte

### Contatos Importantes
- **Asaas**: suporte@asaas.com
- **Supabase**: support@supabase.io

### Documentação
- **Asaas API**: https://docs.asaas.com
- **Supabase**: https://supabase.com/docs

---

## ✅ Checklist Final

Antes de ir para produção, confirme:

- [ ] ✅ Migrações executadas no Supabase
- [ ] ✅ Variáveis de ambiente configuradas
- [ ] ✅ Webhooks configurados no Asaas
- [ ] ✅ SSL/HTTPS configurado
- [ ] ✅ Testes passando 100%
- [ ] ✅ Monitoramento ativo
- [ ] ✅ Backup configurado
- [ ] ✅ Equipe treinada

**🎉 Sistema pronto para produção!**