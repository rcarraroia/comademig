# 🚀 Guia de Deploy - Integração Asaas COMADEMIG

## 📋 Configuração de Credenciais para Produção

### 🔧 1. Configuração no Supabase (Edge Functions)

**Acesse: Supabase Dashboard → Seu Projeto → Edge Functions → Secrets**

Adicione os seguintes secrets:

```bash
# API Asaas de Produção
ASAAS_API_KEY=sua_chave_de_producao_asaas_aqui

# Token de Webhook Seguro (gere um novo)
ASAAS_WEBHOOK_TOKEN=token_webhook_seguro_32_caracteres_ou_mais

# Ambiente
ASAAS_ENVIRONMENT=production

# URL Base da API
ASAAS_BASE_URL=https://api.asaas.com/v3
```

### 🌐 2. Configuração no Vercel (Frontend)

**Acesse: Vercel Dashboard → Seu Projeto → Settings → Environment Variables**

Adicione as seguintes variáveis:

```bash
# Supabase (já configuradas)
VITE_SUPABASE_URL=https://amkelczfwazutrciqtlk.supabase.co
VITE_SUPABASE_ANON_KEY=sua_chave_anon_supabase

# Asaas - Produção
VITE_ASAAS_API_KEY=sua_chave_de_producao_asaas_aqui
VITE_ASAAS_ENVIRONMENT=production
VITE_ASAAS_BASE_URL=https://api.asaas.com/v3
VITE_ASAAS_WEBHOOK_TOKEN=token_webhook_seguro_32_caracteres_ou_mais

# Segurança
VITE_ENCRYPTION_KEY=chave_criptografia_32_caracteres_segura
```

## 🔑 3. Obter Credenciais do Asaas

### 📝 Passo a Passo:

1. **Acesse o Painel do Asaas**: https://app.asaas.com
2. **Faça Login** na sua conta de produção
3. **Vá em Configurações → API**
4. **Gere uma Nova Chave de API** para produção
5. **Copie a Chave** (formato: `$aact_...`)

### 🔒 Configurar Webhook no Asaas:

1. **Acesse Configurações → Webhooks**
2. **Adicione Nova URL de Webhook**:
   ```
   https://amkelczfwazutrciqtlk.supabase.co/functions/v1/asaas-process-webhook
   ```
3. **Configure o Token de Autenticação**:
   - Use o mesmo token configurado nas variáveis de ambiente
   - Recomendado: gere um token de 32+ caracteres
4. **Selecione os Eventos**:
   - ✅ PAYMENT_CONFIRMED
   - ✅ PAYMENT_RECEIVED
   - ✅ PAYMENT_OVERDUE
   - ✅ PAYMENT_REFUNDED
   - ✅ PAYMENT_CANCELLED

## 🗄️ 4. Executar Migrações no Banco de Produção

### 🚨 IMPORTANTE: Execute MANUALMENTE no Editor SQL do Supabase

**Acesse: Supabase Dashboard → SQL Editor**

Execute os seguintes scripts **NA ORDEM**:

#### 4.1 Tabela de Clientes Asaas
```sql
-- Executar: supabase/migrations/20240101000001_create_asaas_customers.sql
CREATE TABLE IF NOT EXISTS asaas_customers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  asaas_customer_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  cpf_cnpj TEXT NOT NULL,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS
ALTER TABLE asaas_customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own asaas customers" ON asaas_customers
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own asaas customers" ON asaas_customers
  FOR INSERT WITH CHECK (auth.uid() = user_id);
```

#### 4.2 Tabela de Cobranças Asaas
```sql
-- Executar: supabase/migrations/20240101000002_create_asaas_cobrancas.sql
CREATE TABLE IF NOT EXISTS asaas_cobrancas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  asaas_id TEXT UNIQUE NOT NULL,
  customer_id TEXT NOT NULL,
  description TEXT NOT NULL,
  value DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING',
  payment_method TEXT,
  service_type TEXT NOT NULL,
  service_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  data_pagamento TIMESTAMP WITH TIME ZONE,
  net_value DECIMAL(10,2)
);

-- RLS
ALTER TABLE asaas_cobrancas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own cobrancas" ON asaas_cobrancas
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own cobrancas" ON asaas_cobrancas
  FOR INSERT WITH CHECK (auth.uid() = user_id);
```

#### 4.3 Tabela de Splits
```sql
-- Executar: supabase/migrations/20240101000003_create_asaas_splits.sql
CREATE TABLE IF NOT EXISTS asaas_splits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cobranca_id UUID REFERENCES asaas_cobrancas(id) ON DELETE CASCADE,
  affiliate_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  percentage DECIMAL(5,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  commission_value DECIMAL(10,2),
  transfer_id TEXT,
  processed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS
ALTER TABLE asaas_splits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view related splits" ON asaas_splits
  FOR SELECT USING (
    auth.uid() = affiliate_id OR 
    auth.uid() IN (SELECT user_id FROM asaas_cobrancas WHERE id = cobranca_id)
  );
```

#### 4.4 Tabela de Comissões
```sql
-- Executar: supabase/migrations/20240101000004_create_affiliate_commissions.sql
CREATE TABLE IF NOT EXISTS affiliate_commissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  affiliate_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  cobranca_id UUID REFERENCES asaas_cobrancas(id) ON DELETE CASCADE,
  split_id UUID REFERENCES asaas_splits(id) ON DELETE CASCADE,
  commission_value DECIMAL(10,2) NOT NULL,
  payment_value DECIMAL(10,2) NOT NULL,
  percentage DECIMAL(5,2) NOT NULL,
  transfer_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS
ALTER TABLE affiliate_commissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Affiliates can view own commissions" ON affiliate_commissions
  FOR SELECT USING (auth.uid() = affiliate_id);
```

#### 4.5 Tabela de Webhooks
```sql
-- Executar: supabase/migrations/20240101000005_create_asaas_webhooks.sql
CREATE TABLE IF NOT EXISTS asaas_webhooks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  asaas_payment_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  processed BOOLEAN DEFAULT FALSE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_asaas_webhooks_payment_id ON asaas_webhooks(asaas_payment_id);
CREATE INDEX IF NOT EXISTS idx_asaas_webhooks_processed ON asaas_webhooks(processed);
CREATE INDEX IF NOT EXISTS idx_asaas_cobrancas_asaas_id ON asaas_cobrancas(asaas_id);
CREATE INDEX IF NOT EXISTS idx_asaas_cobrancas_user_id ON asaas_cobrancas(user_id);
```

## 🔐 5. Gerar Tokens Seguros

### Token de Webhook (32+ caracteres):
```bash
# Exemplo de token seguro (GERE UM NOVO):
webhook_token_prod_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
```

### Chave de Criptografia (32+ caracteres):
```bash
# Exemplo de chave (GERE UMA NOVA):
encryption_key_prod_x1y2z3a4b5c6d7e8f9g0h1i2j3k4l5m6
```

## ✅ 6. Checklist de Deploy

### 🔧 Configuração:
- [ ] Chave de API Asaas de produção configurada
- [ ] Token de webhook seguro gerado e configurado
- [ ] Variáveis de ambiente no Vercel atualizadas
- [ ] Secrets no Supabase configurados
- [ ] Migrações executadas no banco de produção

### 🔗 Integração:
- [ ] Webhook configurado no painel do Asaas
- [ ] URL do webhook testada e funcionando
- [ ] Eventos de webhook selecionados corretamente
- [ ] Token de autenticação validado

### 🧪 Testes:
- [ ] Teste de conectividade com API Asaas
- [ ] Teste de criação de cliente
- [ ] Teste de pagamento PIX
- [ ] Teste de pagamento com cartão
- [ ] Teste de geração de boleto
- [ ] Teste de processamento de webhook
- [ ] Teste de split de afiliados

### 🛡️ Segurança:
- [ ] HTTPS ativo no domínio
- [ ] Políticas RLS ativas no Supabase
- [ ] Criptografia de dados sensíveis ativa
- [ ] Logs de auditoria funcionando
- [ ] Sistema de monitoramento ativo

## 🚀 7. Comandos de Deploy

### Deploy no Vercel:
```bash
# Se usando CLI do Vercel
vercel --prod

# Ou via GitHub (push para main)
git add .
git commit -m "feat: deploy integração Asaas completa"
git push origin main
```

### Deploy das Edge Functions:
```bash
# As Edge Functions são deployadas automaticamente
# quando você faz push para o repositório conectado ao Supabase
```

## 🔍 8. Validação Pós-Deploy

### Testes Essenciais:
1. **Acesse o site** em produção
2. **Teste o fluxo de filiação** completo
3. **Faça um pagamento PIX** de teste (valor baixo)
4. **Verifique se o webhook** foi processado
5. **Confirme no dashboard** se o pagamento aparece
6. **Teste o sistema de splits** se aplicável

### Monitoramento:
1. **Acesse o Dashboard de Monitoramento**
2. **Verifique as métricas** em tempo real
3. **Confirme que não há alertas** críticos
4. **Teste a conectividade** com todos os serviços

## 🆘 9. Solução de Problemas Comuns

### Erro 401 - Unauthorized:
- Verifique se a chave de API está correta
- Confirme que está usando a chave de PRODUÇÃO
- Verifique se a chave não expirou

### Webhook não funciona:
- Confirme a URL do webhook no Asaas
- Verifique se o token está correto
- Teste a conectividade da URL

### Pagamentos não processam:
- Verifique as migrações do banco
- Confirme as políticas RLS
- Teste a conectividade com Asaas

### Erros de CORS:
- Configure as origens permitidas no Supabase
- Verifique se o domínio está correto

## 📞 10. Suporte

Em caso de problemas:
1. **Verifique os logs** no Supabase (Edge Functions → Logs)
2. **Consulte o Dashboard de Monitoramento** para métricas
3. **Execute os testes automatizados** para validar
4. **Verifique a documentação** do Asaas para mudanças na API

---

## 🎯 RESUMO RÁPIDO:

1. **Configure as credenciais** no Supabase e Vercel
2. **Execute as migrações** no banco de produção
3. **Configure o webhook** no painel do Asaas
4. **Teste a integração** completa
5. **Monitore o sistema** após o deploy

**O sistema está 100% pronto para produção!** 🎉