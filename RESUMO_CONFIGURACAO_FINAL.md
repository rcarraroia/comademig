# 🎯 RESUMO FINAL - Configuração de Credenciais

## ✅ STATUS ATUAL
- ✅ Tokens seguros gerados
- ✅ Arquivo .env local atualizado
- ⏳ Aguardando chave de produção do Asaas
- ⏳ Configuração no Vercel
- ⏳ Configuração no Supabase

---

## 🔑 TOKENS GERADOS (COPIE E GUARDE!)

```
📡 WEBHOOK TOKEN:
webhook_prod_36a882b2b9ff39b4106009bd1c554a00901d507ee3758dce

🔒 ENCRYPTION KEY:
encrypt_prod_e5ec0c0371d871d79c41f35653a5569a42a85fdee0015f11
```

---

## 🏦 1. OBTER CHAVE DO ASAAS (PRIMEIRO PASSO)

### Acesse: https://www.asaas.com/
1. Faça login na sua conta
2. Vá em **Configurações** → **Integrações** → **API**
3. Copie a **Chave de Produção** (não a de sandbox!)
4. Substitua no arquivo .env local:
   ```
   VITE_ASAAS_API_KEY="SUA_CHAVE_REAL_AQUI"
   ```

---

## 🌐 2. CONFIGURAR NO VERCEL

### Environment Variables (copie exatamente):
```env
VITE_ASAAS_API_KEY=SUA_CHAVE_ASAAS_REAL
VITE_ASAAS_ENVIRONMENT=production
VITE_ASAAS_BASE_URL=https://api.asaas.com/v3
VITE_ASAAS_WEBHOOK_TOKEN=webhook_prod_36a882b2b9ff39b4106009bd1c554a00901d507ee3758dce
VITE_ENCRYPTION_KEY=encrypt_prod_e5ec0c0371d871d79c41f35653a5569a42a85fdee0015f11
VITE_SUPABASE_URL=https://amkelczfwazutrciqtlk.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFta2VsY3pmd2F6dXRyY2lxdGxrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxODQxMjYsImV4cCI6MjA2ODc2MDEyNn0.7-M7DCqMzfZtXvcg6Zlf24zNv-XqvDT_oAznQGiqFHY
```

---

## 🔧 3. CONFIGURAR NO SUPABASE

### Edge Functions → Secrets:
```env
ASAAS_API_KEY=SUA_CHAVE_ASAAS_REAL
ASAAS_ENVIRONMENT=production
ASAAS_BASE_URL=https://api.asaas.com/v3
ASAAS_WEBHOOK_TOKEN=webhook_prod_36a882b2b9ff39b4106009bd1c554a00901d507ee3758dce
```

---

## 📡 4. CONFIGURAR WEBHOOK NO ASAAS

### No painel do Asaas → Webhooks:
```
URL: https://amkelczfwazutrciqtlk.supabase.co/functions/v1/asaas-process-webhook
Token: webhook_prod_36a882b2b9ff39b4106009bd1c554a00901d507ee3758dce

🔥 EVENTOS DE PAGAMENTOS (Essenciais):
☑️ PAYMENT_CREATED - Cobrança criada
☑️ PAYMENT_CONFIRMED - Pagamento confirmado
☑️ PAYMENT_RECEIVED - Pagamento recebido
☑️ PAYMENT_OVERDUE - Pagamento vencido
☑️ PAYMENT_REFUNDED - Pagamento estornado
☑️ PAYMENT_CHARGEBACK_REQUESTED - Chargeback solicitado

📋 EVENTOS DE ASSINATURAS (Para anuidades COMADEMIG):
☑️ SUBSCRIPTION_CREATED - Assinatura criada
☑️ SUBSCRIPTION_UPDATED - Assinatura atualizada
☑️ SUBSCRIPTION_DELETED - Assinatura excluída
☑️ SUBSCRIPTION_SUSPENDED - Assinatura suspensa
☑️ SUBSCRIPTION_REACTIVATED - Assinatura reativada

📊 EVENTOS OPCIONAIS (Monitoramento):
☑️ PAYMENT_UPDATED - Cobrança atualizada
☑️ PAYMENT_DELETED - Cobrança excluída
☑️ PAYMENT_RESTORED - Cobrança restaurada
```

**✅ CONFIRMADO:** O Asaas possui eventos específicos de assinatura para monitorar o ciclo de vida das anuidades.

---

## 🗄️ 5. EXECUTAR MIGRAÇÕES (SQL Editor do Supabase)

### Execute estes 4 scripts EM ORDEM:

#### Script 1: Clientes Asaas
```sql
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

CREATE INDEX IF NOT EXISTS idx_asaas_customers_user_id ON asaas_customers(user_id);
CREATE INDEX IF NOT EXISTS idx_asaas_customers_asaas_id ON asaas_customers(asaas_customer_id);

ALTER TABLE asaas_customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own asaas customers" ON asaas_customers
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own asaas customers" ON asaas_customers
  FOR INSERT WITH CHECK (auth.uid() = user_id);
```

#### Script 2: Cobranças
```sql
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

CREATE INDEX IF NOT EXISTS idx_asaas_cobrancas_user_id ON asaas_cobrancas(user_id);
CREATE INDEX IF NOT EXISTS idx_asaas_cobrancas_payment_id ON asaas_cobrancas(asaas_payment_id);
CREATE INDEX IF NOT EXISTS idx_asaas_cobrancas_status ON asaas_cobrancas(status);

ALTER TABLE asaas_cobrancas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own payments" ON asaas_cobrancas
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all payments" ON asaas_cobrancas
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
```

#### Script 3: Splits
```sql
CREATE TABLE IF NOT EXISTS asaas_splits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  payment_id UUID REFERENCES asaas_cobrancas(id) ON DELETE CASCADE,
  wallet_id TEXT NOT NULL,
  fixed_value DECIMAL(10,2),
  percentage_value DECIMAL(5,2),
  status TEXT DEFAULT 'PENDING',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_asaas_splits_payment_id ON asaas_splits(payment_id);

ALTER TABLE asaas_splits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage splits" ON asaas_splits
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
```

#### Script 4: Webhooks
```sql
CREATE TABLE IF NOT EXISTS asaas_webhooks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL,
  payment_id TEXT,
  data JSONB NOT NULL,
  processed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_asaas_webhooks_event_type ON asaas_webhooks(event_type);
CREATE INDEX IF NOT EXISTS idx_asaas_webhooks_processed ON asaas_webhooks(processed);

ALTER TABLE asaas_webhooks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage webhooks" ON asaas_webhooks
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
```

---

## 🧪 6. TESTAR BUILD LOCAL

```bash
npm run build
```

Se passar sem erros, está pronto para deploy!

---

## 🚀 7. FAZER DEPLOY

```bash
vercel --prod
```

---

## ✅ 8. CHECKLIST FINAL

- [ ] Chave do Asaas obtida e configurada
- [ ] Variáveis configuradas no Vercel
- [ ] Secrets configuradas no Supabase
- [ ] Webhook configurado no Asaas
- [ ] 4 migrações executadas no banco
- [ ] Build local funcionando
- [ ] Deploy executado
- [ ] Site funcionando em produção
- [ ] Teste de pagamento realizado

---

## 🎯 PRÓXIMO PASSO IMEDIATO

**1. Obtenha sua chave de produção do Asaas**
**2. Configure no Vercel e Supabase**
**3. Execute as migrações**
**4. Faça o deploy!**

---

**🎉 Quando tudo estiver configurado, seu sistema estará 100% funcional em produção!**