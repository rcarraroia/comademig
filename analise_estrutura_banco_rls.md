# Análise da Estrutura do Banco e Políticas RLS - COMADEMIG

## Resumo Executivo

Esta análise examina a estrutura do banco de dados PostgreSQL do sistema COMADEMIG, focando nas tabelas relacionadas ao sistema de pagamentos, afiliados e suas respectivas políticas de Row Level Security (RLS), identificando possíveis problemas que podem estar causando falhas no sistema de pagamentos.

## Estrutura das Tabelas Principais

### 1. Tabela `asaas_cobrancas`
**Função:** Armazena todas as cobranças criadas via API Asaas
**Estrutura:**
```sql
CREATE TABLE public.asaas_cobrancas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  asaas_id TEXT NOT NULL UNIQUE, -- ID da cobrança no Asaas
  customer_id TEXT, -- ID do cliente no Asaas
  valor DECIMAL(10,2) NOT NULL,
  descricao TEXT NOT NULL,
  data_vencimento DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING',
  forma_pagamento TEXT, -- BOLETO, CREDIT_CARD, PIX
  url_pagamento TEXT,
  linha_digitavel TEXT, -- Para boletos
  qr_code_pix TEXT, -- Para PIX
  data_pagamento TIMESTAMP WITH TIME ZONE,
  tipo_cobranca TEXT NOT NULL, -- 'filiacao', 'taxa_anual', 'certidao'
  referencia_id UUID, -- ID da referência
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

**Índices:**
- `idx_asaas_cobrancas_user_id` - Performance para consultas por usuário
- `idx_asaas_cobrancas_asaas_id` - Performance para consultas por ID Asaas
- `idx_asaas_cobrancas_status` - Performance para consultas por status

### 2. Tabela `affiliates`
**Função:** Gerencia dados dos afiliados do sistema
**Estrutura:**
```sql
CREATE TABLE public.affiliates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  cpf_cnpj TEXT,
  asaas_wallet_id UUID NOT NULL, -- walletId para repasses
  contact_email TEXT,
  phone TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- pending | active | suspended
  is_adimplent BOOLEAN NOT NULL DEFAULT true,
  referral_code TEXT UNIQUE, -- código único de indicação
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id)
);
```

**Campos Críticos:**
- `asaas_wallet_id` - **OBRIGATÓRIO** para splits de pagamento
- `status` - Deve ser 'active' para participar de splits
- `is_adimplent` - Deve ser `true` para receber comissões
- `referral_code` - Gerado automaticamente via trigger

### 3. Tabela `referrals`
**Função:** Registra indicações feitas por afiliados
**Estrutura:**
```sql
CREATE TABLE public.referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID NOT NULL REFERENCES public.affiliates(id) ON DELETE SET NULL,
  referred_user_id UUID REFERENCES auth.users(id),
  referred_name TEXT,
  referred_email TEXT,
  charge_id TEXT, -- id da cobrança no Asaas
  amount NUMERIC(12,2),
  status TEXT NOT NULL DEFAULT 'pending', -- pending | paid | cancelled
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

### 4. Tabela `transactions`
**Função:** Histórico detalhado das divisões de pagamento
**Estrutura:**
```sql
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asaas_payment_id TEXT NOT NULL,
  charge_id TEXT,
  affiliate_id UUID REFERENCES public.affiliates(id),
  total_amount NUMERIC(12,2),
  affiliate_amount NUMERIC(12,2), -- 20%
  convention_amount NUMERIC(12,2), -- 40%
  renum_amount NUMERIC(12,2), -- 40%
  status TEXT NOT NULL, -- paid | pending | failed
  raw_payload JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

### 5. Tabela `webhook_events`
**Função:** Controle de idempotência para webhooks do Asaas
**Estrutura:**
```sql
CREATE TABLE public.webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id TEXT NOT NULL UNIQUE,
  payload JSONB NOT NULL,
  received_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  processed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

## Análise das Políticas RLS

### ✅ Políticas Corretas

#### 1. Tabela `asaas_cobrancas`
```sql
-- ✅ Usuários podem ver apenas suas cobranças
CREATE POLICY "Usuários podem ver suas próprias cobranças" 
  ON public.asaas_cobrancas 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- ✅ Sistema pode inserir/atualizar (Edge Functions)
CREATE POLICY "Sistema pode inserir cobranças" 
  ON public.asaas_cobrancas 
  FOR INSERT 
  WITH CHECK (true);
```

#### 2. Tabela `affiliates`
```sql
-- ✅ Usuários podem ver seus próprios dados
CREATE POLICY "Usuários podem ver seus próprios dados de afiliado"
  ON public.affiliates
  FOR SELECT
  USING (auth.uid() = user_id);

-- ✅ Admins podem ver todos
CREATE POLICY "Admins podem ver todos os afiliados"
  ON public.affiliates
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'::app_role
  ));
```

### ⚠️ Possíveis Problemas Identificados

#### 1. Política de Leitura de Afiliados nas Edge Functions
**Problema:** Edge Functions podem não conseguir ler dados de afiliados
```sql
-- Edge Function precisa verificar afiliado ativo
SELECT * FROM affiliates 
WHERE id = affiliate_id 
  AND status = 'active' 
  AND is_adimplent = true;
```
**Causa:** RLS pode estar bloqueando leitura por service_role
**Solução:** Verificar se service_role bypassa RLS ou criar política específica

#### 2. Inserção de Referrals
**Problema:** Edge Function pode falhar ao inserir referrals
```sql
-- Política atual permite inserção
CREATE POLICY "Sistema pode inserir indicações"
  ON public.referrals
  FOR INSERT
  WITH CHECK (true);
```
**Status:** ✅ Parece correto

#### 3. Webhook Events
**Problema:** Webhook pode falhar ao verificar idempotência
```sql
-- Verificação de evento existente
SELECT id FROM webhook_events WHERE event_id = ?
```
**Status:** ✅ Política permite acesso total ao sistema

## Fluxo de Dados e Possíveis Falhas

### Fluxo de Pagamento Simples
1. **Frontend** → `asaas-create-payment`
2. **Edge Function** verifica autenticação (✅)
3. **Edge Function** cria cliente no Asaas (⚠️ possível falha)
4. **Edge Function** cria cobrança no Asaas (⚠️ possível falha)
5. **Edge Function** insere em `asaas_cobrancas` (✅ RLS permite)

### Fluxo de Pagamento com Split
1. **Frontend** → `asaas-create-payment-with-split`
2. **Edge Function** verifica autenticação (✅)
3. **Edge Function** busca dados do afiliado (⚠️ **POSSÍVEL FALHA RLS**)
4. **Edge Function** configura split (⚠️ depende do step 3)
5. **Edge Function** cria cobrança com split (⚠️ possível falha)
6. **Edge Function** insere referral (✅ RLS permite)

### Fluxo de Webhook
1. **Asaas** → `asaas-webhook`
2. **Edge Function** verifica idempotência (✅)
3. **Edge Function** processa pagamento (✅)
4. **Edge Function** atualiza `asaas_cobrancas` (✅)
5. **Edge Function** processa split se aplicável (⚠️ possível falha)

## Problemas Críticos Identificados

### 🔴 Problema 1: Service Role e RLS
**Descrição:** Edge Functions usam `SUPABASE_SERVICE_ROLE_KEY` que pode não bypassar RLS
**Impacto:** Falha ao ler dados de afiliados
**Código problemático:**
```typescript
// asaas-create-payment-with-split/index.ts linha 35-42
const { data: affiliate } = await supabaseClient
  .from('affiliates')
  .select('asaas_wallet_id, status, is_adimplent')
  .eq('id', affiliate_id)
  .eq('status', 'active')
  .eq('is_adimplent', true)
  .maybeSingle()
```

### 🔴 Problema 2: Inconsistência entre Edge Functions
**Descrição:** `asaas-webhook` usa `SUPABASE_SERVICE_ROLE_KEY`, outras usam `SUPABASE_ANON_KEY`
**Impacto:** Diferentes níveis de acesso podem causar inconsistências
**Solução:** Padronizar uso de chaves

### 🟡 Problema 3: Falta de Validação de Constraints
**Descrição:** Não há validação de dados antes de inserir no banco
**Impacto:** Possíveis erros de constraint violation
**Exemplo:**
```sql
-- Campo obrigatório pode estar NULL
asaas_wallet_id UUID NOT NULL
```

## Verificações Recomendadas

### 1. Teste de Acesso RLS
```sql
-- Testar se service_role consegue ler afiliados
SET ROLE service_role;
SELECT * FROM affiliates WHERE status = 'active';
```

### 2. Verificação de Dados de Afiliados
```sql
-- Verificar afiliados com dados incompletos
SELECT id, user_id, asaas_wallet_id, status, is_adimplent 
FROM affiliates 
WHERE asaas_wallet_id IS NULL 
   OR status != 'active' 
   OR is_adimplent = false;
```

### 3. Verificação de Cobranças Pendentes
```sql
-- Verificar cobranças que falharam
SELECT id, user_id, status, tipo_cobranca, created_at
FROM asaas_cobrancas 
WHERE status = 'PENDING' 
  AND created_at < now() - interval '1 hour';
```

## Correções Sugeridas

### 1. Política RLS para Service Role
```sql
-- Permitir service_role ler afiliados ativos
CREATE POLICY "Service role pode ler afiliados ativos"
  ON public.affiliates
  FOR SELECT
  USING (
    current_setting('role') = 'service_role' OR
    (status = 'active' AND is_adimplent = true)
  );
```

### 2. Validação de Dados
```sql
-- Adicionar constraints de validação
ALTER TABLE public.affiliates 
ADD CONSTRAINT check_asaas_wallet_id_format 
CHECK (asaas_wallet_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$');
```

### 3. Índices Adicionais
```sql
-- Melhorar performance de consultas de afiliados
CREATE INDEX idx_affiliates_active ON public.affiliates(status, is_adimplent) 
WHERE status = 'active' AND is_adimplent = true;
```

## Próximos Passos

1. ✅ **Análise da estrutura do banco** - CONCLUÍDA
2. 🔄 **Aguardando acesso aos logs** para confirmar falhas
3. ⏳ **Testar políticas RLS** com service_role
4. ⏳ **Verificar dados de afiliados** no banco
5. ⏳ **Implementar correções** identificadas

## Impacto nos Problemas Reportados

### Formulário de Filiação
- **Possível causa:** RLS bloqueando leitura de afiliados
- **Sintoma:** Erro ao criar pagamento com split

### Sistema de Certificados/Regularização
- **Possível causa:** Falha na criação de cobranças simples
- **Sintoma:** Edge Function retorna erro 500

### Sistema de Afiliados
- **Possível causa:** `asaas_wallet_id` inválido ou afiliado inativo
- **Sintoma:** Split não é configurado corretamente

---
*Análise realizada em: 09/09/2025*
*Próxima etapa: Verificação dos logs das Edge Functions (aguardando acesso ao Supabase)*

