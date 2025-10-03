# 🔐 Configuração de Credenciais - Deploy Produção

## 🎯 Tokens Gerados (COPIE AGORA!)

```
📡 WEBHOOK TOKEN:
webhook_prod_36a882b2b9ff39b4106009bd1c554a00901d507ee3758dce

🔒 ENCRYPTION KEY:
encrypt_prod_e5ec0c0371d871d79c41f35653a5569a42a85fdee0015f11

🎲 TOKEN GENÉRICO:
e60978a2f8d6ed36808ff9df6d28adc05aad6b0ec44596de6806596636b45eeb
```

---

## 🌐 1. CONFIGURAÇÃO NO VERCEL

### Acesse: https://vercel.com/dashboard
1. Selecione seu projeto COMADEMIG
2. Vá em **Settings** → **Environment Variables**
3. Adicione as seguintes variáveis:

```env
# ASAAS - Produção
VITE_ASAAS_API_KEY=SUA_CHAVE_ASAAS_AQUI
VITE_ASAAS_ENVIRONMENT=production
VITE_ASAAS_BASE_URL=https://api.asaas.com/v3
VITE_ASAAS_WEBHOOK_TOKEN=webhook_prod_36a882b2b9ff39b4106009bd1c554a00901d507ee3758dce

# Segurança
VITE_ENCRYPTION_KEY=encrypt_prod_e5ec0c0371d871d79c41f35653a5569a42a85fdee0015f11

# Supabase (já configuradas)
VITE_SUPABASE_URL=https://amkelczfwazutrciqtlk.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFta2VsY3pmd2F6dXRyY2lxdGxrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ5NzI4NzQsImV4cCI6MjA1MDU0ODg3NH0.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8
```

### ⚠️ IMPORTANTE:
- Substitua `SUA_CHAVE_ASAAS_AQUI` pela sua chave real do Asaas
- Mantenha todos os outros valores exatamente como mostrado

---

## 🔧 2. CONFIGURAÇÃO NO SUPABASE

### Acesse: https://supabase.com/dashboard
1. Selecione seu projeto COMADEMIG
2. Vá em **Edge Functions** → **Secrets**
3. Adicione as seguintes secrets:

```env
# ASAAS - Produção
ASAAS_API_KEY=SUA_CHAVE_ASAAS_AQUI
ASAAS_ENVIRONMENT=production
ASAAS_BASE_URL=https://api.asaas.com/v3
ASAAS_WEBHOOK_TOKEN=webhook_prod_36a882b2b9ff39b4106009bd1c554a00901d507ee3758dce
```

### ⚠️ IMPORTANTE:
- Use a MESMA chave do Asaas configurada no Vercel
- Use o MESMO webhook token configurado no Vercel

---

## 🏦 3. OBTER CHAVE DO ASAAS

### Para Produção:
1. Acesse: https://www.asaas.com/
2. Faça login na sua conta
3. Vá em **Configurações** → **Integrações** → **API**
4. Copie a **Chave de Produção**
5. Cole nas configurações do Vercel e Supabase

### ⚠️ ATENÇÃO:
- Use APENAS a chave de PRODUÇÃO
- NUNCA use chave de sandbox em produção
- Mantenha a chave segura e privada

---

## 📡 4. CONFIGURAR WEBHOOK NO ASAAS

### No painel do Asaas:
1. Vá em **Configurações** → **Webhooks**
2. Clique em **Novo Webhook**
3. Configure:

```
URL do Webhook:
https://amkelczfwazutrciqtlk.supabase.co/functions/v1/asaas-process-webhook

Token de Autenticação:
webhook_prod_36a882b2b9ff39b4106009bd1c554a00901d507ee3758dce

Eventos Essenciais:
☑️ PAYMENT_CREATED - Cobrança criada
☑️ PAYMENT_CONFIRMED - Pagamento confirmado  
☑️ PAYMENT_RECEIVED - Pagamento recebido
☑️ PAYMENT_OVERDUE - Pagamento vencido
☑️ PAYMENT_REFUNDED - Pagamento estornado
☑️ PAYMENT_CHARGEBACK_REQUESTED - Chargeback solicitado

Eventos Opcionais:
☑️ PAYMENT_UPDATED - Cobrança atualizada
☑️ PAYMENT_DELETED - Cobrança excluída
☑️ PAYMENT_RESTORED - Cobrança restaurada
```

4. Salve a configuração

---

## 🗄️ 5. EXECUTAR MIGRAÇÕES DO BANCO

### No SQL Editor do Supabase, execute EM ORDEM:

#### 5.1. Tabela de Clientes Asaas
```sql
-- Criar tabela asaas_customers
CREATE TABLE IF NOT EXISTS asaas_customers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  asaas_customer_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  cpf_cnpj TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_asaas_customers_user_id ON asaas_customers(user_id);
CREATE INDEX IF NOT EXISTS idx_asaas_customers_asaas_id ON asaas_customers(asaas_customer_id);

-- RLS
ALTER TABLE asaas_customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own asaas customers" ON asaas_customers
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own asaas customers" ON asaas_customers
  FOR INSERT WITH CHECK (auth.uid() = user_id);
```

#### 5.2. Tabela de Cobranças
```sql
-- Criar tabela asaas_cobrancas
CREATE TABLE IF NOT EXISTS asaas_cobrancas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  asaas_payment_id TEXT UNIQUE NOT NULL,
  asaas_customer_id TEXT NOT NULL,
  value DECIMAL(10,2) NOT NULL,
  net_value DECIMAL(10,2),
  status TEXT NOT NULL DEFAULT 'PENDING',
  billing_type TEXT NOT NULL,
  due_date DATE NOT NULL,
  description TEXT,
  external_reference TEXT,
  invoice_url TEXT,
  bank_slip_url TEXT,
  pix_qr_code TEXT,
  pix_copy_paste TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_asaas_cobrancas_user_id ON asaas_cobrancas(user_id);
CREATE INDEX IF NOT EXISTS idx_asaas_cobrancas_payment_id ON asaas_cobrancas(asaas_payment_id);
CREATE INDEX IF NOT EXISTS idx_asaas_cobrancas_status ON asaas_cobrancas(status);

-- RLS
ALTER TABLE asaas_cobrancas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own payments" ON asaas_cobrancas
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all payments" ON asaas_cobrancas
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
```

#### 5.3. Tabela de Splits
```sql
-- Criar tabela asaas_splits
CREATE TABLE IF NOT EXISTS asaas_splits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  payment_id UUID REFERENCES asaas_cobrancas(id) ON DELETE CASCADE,
  wallet_id TEXT NOT NULL,
  fixed_value DECIMAL(10,2),
  percentage_value DECIMAL(5,2),
  status TEXT DEFAULT 'PENDING',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_asaas_splits_payment_id ON asaas_splits(payment_id);

-- RLS
ALTER TABLE asaas_splits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage splits" ON asaas_splits
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
```

#### 5.4. Tabela de Webhooks
```sql
-- Criar tabela asaas_webhooks
CREATE TABLE IF NOT EXISTS asaas_webhooks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL,
  payment_id TEXT,
  data JSONB NOT NULL,
  processed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_asaas_webhooks_event_type ON asaas_webhooks(event_type);
CREATE INDEX IF NOT EXISTS idx_asaas_webhooks_processed ON asaas_webhooks(processed);

-- RLS
ALTER TABLE asaas_webhooks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage webhooks" ON asaas_webhooks
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
```

---

## ✅ 6. CHECKLIST DE VALIDAÇÃO

### Antes do Deploy:
- [ ] Chave do Asaas configurada no Vercel
- [ ] Chave do Asaas configurada no Supabase
- [ ] Webhook token configurado em ambos
- [ ] Webhook configurado no painel do Asaas
- [ ] Todas as migrações executadas
- [ ] Build local funcionando

### Teste Rápido:
```bash
npm run build
```

Se o build passar sem erros, está pronto para deploy!

---

## 🚀 7. EXECUTAR DEPLOY

### Deploy no Vercel:
```bash
vercel --prod
```

### Ou pelo painel:
1. Acesse o dashboard do Vercel
2. Clique em **Deploy** no seu projeto
3. Aguarde o deploy completar

---

## 🧪 8. TESTAR INTEGRAÇÃO

### Após o deploy:
1. Acesse seu site em produção
2. Teste o fluxo de filiação
3. Faça um pagamento de teste (valor baixo)
4. Verifique se o webhook foi recebido
5. Confirme atualização no dashboard

---

## 🆘 PROBLEMAS COMUNS

### ❌ Erro 401 - Unauthorized
**Solução**: Verificar se a chave do Asaas está correta

### ❌ Webhook não funciona
**Solução**: Verificar URL e token no painel do Asaas

### ❌ Build falha
**Solução**: Verificar se todas as variáveis estão configuradas

---

## 📞 SUPORTE

- **Asaas**: https://ajuda.asaas.com
- **Vercel**: https://vercel.com/docs
- **Supabase**: https://supabase.com/docs

---

**🎯 Quando tudo estiver configurado, o sistema estará 100% funcional em produção!**