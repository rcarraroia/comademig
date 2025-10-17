# Problemas Identificados no Fluxo de Registro e Assinaturas

## ⚠️ PROBLEMAS CRÍTICOS

### 1. **Incompatibilidade entre Tabelas de Assinatura**

**Problema:** Existem DUAS tabelas diferentes para assinaturas:
- `asaas_subscriptions` (criada em 20250310000001)
- `user_subscriptions` (criada em 20250827000022)

**Estruturas Diferentes:**

#### `asaas_subscriptions`:
```sql
- id (UUID)
- user_id (UUID) → auth.users
- asaas_subscription_id (VARCHAR) → ID do Asaas
- customer_id (VARCHAR) → ID do cliente no Asaas
- billing_type, value, cycle, description
- status, next_due_date, end_date
- service_type, service_data (JSONB)
```

#### `user_subscriptions`:
```sql
- id (UUID)
- user_id (UUID) → auth.users
- subscription_plan_id (UUID) → subscription_plans
- member_type_id (UUID) → member_types
- status, payment_id
- started_at, expires_at
- asaas_subscription_id (VARCHAR) ← adicionado depois
```

**Impacto:**
- Edge Function `asaas-create-subscription` salva em `asaas_subscriptions` (linha 114)
- Hook `useFiliacaoPayment` verifica `user_subscriptions` (linha 110-115)
- **DADOS NÃO ESTÃO SINCRONIZADOS!**

**✅ CORREÇÃO PARCIAL ENCONTRADA:**
- Hook `useFiliacaoPayment` SALVA em `user_subscriptions` (linhas 346-368)
- Mas Edge Function ainda salva em `asaas_subscriptions`
- Resultado: **dados duplicados em duas tabelas**

### 2. **Edge Function Salva na Tabela Errada com Campos Incorretos**

**Arquivo:** `supabase/functions/asaas-create-subscription/index.ts`

**Problema (linha 113-125):**
```typescript
const { error: dbError } = await supabaseClient
    .from('asaas_subscriptions')  // ❌ Tabela secundária
    .insert({
        subscription_id: result.id,  // ❌ Campo não existe (deveria ser asaas_subscription_id)
        customer_id: customer,
        billing_type: billingType,
        value: value,
        cycle: cycle,
        status: result.status,
        next_due_date: nextDueDate,
        external_reference: externalReference,
        raw_response: result,  // ❌ Campo não existe no schema
    })
```

**Campos Incorretos:**
- `subscription_id` → deveria ser `asaas_subscription_id`
- `raw_response` → campo não existe na tabela
- Falta `user_id` na inserção (obrigatório)

### 3. **Split de Pagamentos com Problema na Cobrança ID**

**Arquivo:** `src/hooks/useFiliacaoPayment.ts` (linhas 243-271)

**Problema:**
```typescript
// 3.4. Registrar cobrança no banco local
const { error: cobrancaError } = await supabase
  .from('asaas_cobrancas')
  .insert({
    asaas_payment_id: subscriptionResult.id,  // ❌ subscriptionResult é SUBSCRIPTION, não PAYMENT
    user_id: currentUserId,
    customer_id: customer.id,
    subscription_id: subscriptionResult.id,
    // ...
  });

// 3.5. Configurar split de pagamento
const { data: splitData, error: splitError } = await supabase.functions.invoke(
  'asaas-configure-split',
  {
    body: {
      cobrancaId: subscriptionResult.id,  // ❌ ID da SUBSCRIPTION, não da COBRANÇA
      // ...
    }
  }
);
```

**Impacto:**
- `subscriptionResult.id` é o ID da **assinatura**, não da **cobrança**
- Split está sendo configurado com ID errado
- Edge Function `asaas-configure-split` tenta criar split em `/payments/{id}/splits`
- **API do Asaas vai falhar** porque ID não é de um payment

**Documentação Asaas:**
- Split deve ser configurado em **cada cobrança** (payment)
- Assinatura gera cobranças recorrentes
- Cada cobrança tem seu próprio ID
- Split deve ser configurado quando cobrança é criada

### 4. **Edge Function asaas-configure-split Usa Endpoint Errado**

**Arquivo:** `supabase/functions/asaas-configure-split/index.ts` (linha 200)

**Problema:**
```typescript
const splitResponse = await asaasClient.post(`/payments/${cobrancaId}/splits`, splitData)
```

**Documentação Asaas:**
- Para **assinaturas**, split deve ser configurado na criação: `POST /subscriptions` com array `split`
- Para **cobranças avulsas**, split pode ser: `POST /payments/{id}/splits`
- **Não é possível** adicionar split em cobrança de assinatura depois de criada

**Solução Correta:**
- Split deve ser enviado no payload de criação da assinatura
- Edge Function `asaas-create-subscription` deve receber array de splits
- Exemplo do payload correto:
```json
{
  "customer": "cus_xxx",
  "billingType": "CREDIT_CARD",
  "value": 100,
  "cycle": "MONTHLY",
  "split": [
    {
      "walletId": "xxx-xxx-xxx",
      "percentualValue": 40
    },
    {
      "walletId": "yyy-yyy-yyy",
      "percentualValue": 20
    }
  ]
}
```

### 5. **Falta Implementar Split na Criação da Assinatura**

**Arquivo:** `supabase/functions/asaas-create-subscription/index.ts`

**Problema:** Payload não inclui split (linhas 63-84)

**Falta:**
```typescript
// Buscar configuração de split antes de criar assinatura
const splitConfig = await getSplitConfiguration(serviceType, affiliateId);

// Adicionar ao payload
if (splitConfig && splitConfig.length > 0) {
  payload.split = splitConfig.map(s => ({
    walletId: s.walletId,
    percentualValue: s.percentage,
    // OU fixedValue: s.fixedValue
  }));
}
```

### 6. **Programa de Afiliados Parcialmente Implementado**

**Tabelas Existentes:**
- `affiliates` (com campo `asaas_wallet_id`)
- `affiliate_referrals`
- `asaas_splits`

**Implementado:**
- ✅ Captura código de referral na URL (Filiacao.tsx linha 27-32)
- ✅ Salva em `affiliate_referrals` (useFiliacaoPayment.ts linhas 379-395)
- ✅ Edge Function `asaas-configure-split` busca wallet do afiliado (linhas 122-138)
- ✅ Cria split para afiliado (20% para filiação)

**Não Implementado:**
- ❌ Função `loadAffiliateInfo` está vazia (Filiacao.tsx linha 35-38)
- ❌ Não valida se código de referral existe
- ❌ Não mostra informações do afiliado para o usuário
- ❌ Split não está sendo enviado na criação da assinatura

### 7. **Validação de Método de Pagamento Muito Restritiva**

**Arquivo:** `supabase/functions/asaas-create-subscription/index.ts`

**Problema (linhas 48-60):**
```typescript
// Boleto não é mais aceito
if (billingType === 'BOLETO') {
    throw new Error('Boleto não é mais aceito...')
}

// PIX apenas para planos anuais
if (billingType === 'UNDEFINED' && cycle !== 'YEARLY') {
    throw new Error('PIX disponível apenas para planos anuais...')
}

// Cartão obrigatório para planos mensais e semestrais
if ((cycle === 'MONTHLY' || cycle === 'SEMIANNUALLY') && billingType !== 'CREDIT_CARD') {
    throw new Error('Planos mensais e semestrais requerem Cartão de Crédito...')
}
```

**Conflito:**
- Frontend permite PIX para todos os planos (PaymentFormEnhanced)
- Backend rejeita PIX para planos mensais/semestrais
- Documentação Asaas permite PIX para assinaturas recorrentes

**Impacto:**
- Usuário seleciona PIX no frontend
- Backend rejeita com erro
- Má experiência do usuário

### 8. **Webhooks Não Implementados**

**Documentação Asaas:** Eventos importantes para assinaturas:
- `SUBSCRIPTION_CREATED`
- `SUBSCRIPTION_UPDATED`
- `SUBSCRIPTION_INACTIVATED`
- `PAYMENT_RECEIVED` (para cada cobrança da assinatura)
- `PAYMENT_CONFIRMED`
- `PAYMENT_OVERDUE`

**Problema:**
- Não encontrei Edge Function para receber webhooks
- Tabela `webhook_errors` existe mas não vi processamento
- Status da assinatura não é atualizado automaticamente
- Pagamentos não são confirmados via webhook
- `user_subscriptions.status` fica `pending` indefinidamente

**Impacto:**
- Usuário paga mas sistema não reconhece
- Assinatura não é ativada automaticamente
- Precisa ativação manual

### 9. **RLS Policies Permissivas Demais**

**Tabela `asaas_customers` (linha 176-180):**
```sql
CREATE POLICY "System can manage customers" ON public.asaas_customers
    FOR ALL USING (
        auth.jwt() ->> 'role' = 'service_role' OR
        auth.jwt() ->> 'role' = 'authenticated'
    );
```

**Problema:**
- Qualquer usuário autenticado pode fazer ALL (INSERT, UPDATE, DELETE)
- Deveria ser restrito a `service_role` apenas
- Usuários comuns deveriam ter apenas SELECT dos próprios dados

**Risco de Segurança:**
- Usuário pode modificar dados de outros usuários
- Usuário pode deletar registros
- Violação do princípio do menor privilégio

### 10. **Falta de Tratamento de Erros do Asaas**

**Edge Function `asaas-create-customer`:**
- ✅ Verifica se cliente já existe localmente (linha 183-194)
- ❌ Não trata erro de CPF duplicado no Asaas
- ❌ Não trata erro de email duplicado no Asaas
- ❌ Não verifica se cliente já existe no Asaas antes de criar

**Edge Function `asaas-create-subscription`:**
- ❌ Não trata erro de cartão inválido
- ❌ Não trata erro de customer inexistente
- ❌ Não retorna informações detalhadas de erro
- ✅ Retorna erro genérico (linha 100-103)

### 11. **Dados Ministeriais Salvos Corretamente**

**✅ IMPLEMENTADO CORRETAMENTE:**

**Formulário coleta:**
- `igreja`
- `cargo_igreja`
- `tempo_ministerio`

**Hook salva em `profiles`:**
```typescript
const profileUpdateData = {
  // ... outros campos
  igreja: data.igreja,
  cargo: data.cargo_igreja || null,
  tempo_ministerio: data.tempo_ministerio || null,
  // ...
};
```

**Confirmado:** Dados ministeriais estão sendo salvos corretamente.

## 📊 PROBLEMAS DE ESTRUTURA

### 12. **Múltiplas Migrações Conflitantes**

**Observado:**
- 80 arquivos de migração
- Várias migrações com prefixo "fix_"
- Migrações que corrigem outras migrações
- Possível estado inconsistente do banco

**Exemplos:**
- `001_fix_member_types_subscription_plans.sql`
- `20250108_fix_user_subscriptions_fk.sql`
- `20250109000004_fix_filiation_system_corrected.sql`
- `20250109000005_fix_rls_policies.sql`

**Risco:**
- Ordem de execução pode causar erros
- Migrações podem ter sido aplicadas parcialmente
- Estado do banco pode estar inconsistente

### 13. **Falta de Transações Atômicas**

**Hook `useFiliacaoPayment`:**
1. Cria conta no Auth ✅
2. Cria cliente no Asaas ✅
3. Cria assinatura no Asaas ✅
4. Registra cobrança local ⚠️ (não falha se erro)
5. Configura split ⚠️ (não falha se erro)
6. Atualiza profile ✅
7. Cria user_subscription ✅
8. Registra afiliado ⚠️ (não falha se erro)

**Problema:**
- Se qualquer passo falhar após criar conta, fica inconsistente
- Não há rollback automático
- Usuário pode ficar com conta criada mas sem assinatura
- Assinatura pode ser criada no Asaas mas não salva localmente

**Observação:**
- Código trata alguns erros como não-críticos (try/catch sem throw)
- Isso é bom para não bloquear o fluxo
- Mas pode deixar dados inconsistentes

### 14. **Falta de Validação de Plano**

**Código não valida:**
- ❌ Se `plan_id` existe
- ❌ Se plano está ativo
- ❌ Se valor do plano está correto
- ❌ Se recorrência está correta

**Risco:**
- Criar assinatura com dados incorretos
- Cobrar valor errado
- Criar assinatura para plano desativado

## 🔍 PONTOS QUE PRECISAM VERIFICAÇÃO NO BANCO

### 15. **Tabela `profiles` - Campos Necessários**

**Precisa verificar se existem:**
- `asaas_customer_id` (para vincular cliente)
- `member_type_id` (para vincular tipo de membro)
- `igreja`, `cargo`, `tempo_ministerio` (dados ministeriais)
- `cpf`, `telefone`, `endereco`, `cep`, `numero`, `complemento`, `bairro`, `cidade`, `estado` (dados pessoais)
- `asaas_subscription_id` (para vincular assinatura)

### 16. **Tabela `subscription_plans` - Dados Corretos**

**Precisa verificar:**
- Se planos estão cadastrados
- Se valores estão corretos
- Se recorrências estão corretas
- Se estão vinculados a `member_types`
- Se campo `is_active` existe e está correto

### 17. **Tabela `member_types` - Configuração**

**Precisa verificar:**
- Quais tipos existem
- Se estão ativos
- Se têm planos vinculados
- Se permissões estão corretas

### 18. **Tabela `asaas_splits` - Estrutura**

**Schema esperado pela Edge Function:**
```sql
- id (UUID)
- cobranca_id (VARCHAR ou UUID?)
- recipient_type (VARCHAR)
- recipient_name (VARCHAR)
- service_type (VARCHAR)
- percentage (DECIMAL)
- commission_amount (DECIMAL)
- total_value (DECIMAL)
- wallet_id (VARCHAR)
- asaas_split_id (VARCHAR)
- status (VARCHAR)
- affiliate_id (UUID)
```

**Precisa verificar:**
- Se todos os campos existem
- Se tipos estão corretos
- Se `cobranca_id` é VARCHAR ou UUID

### 19. **Tabela `affiliates` - Wallet ID**

**Precisa verificar:**
- Se campo `asaas_wallet_id` existe
- Se afiliados têm wallet ID configurado
- Se wallet IDs são válidos no Asaas

### 20. **Variáveis de Ambiente**

**Precisa verificar se estão configuradas:**
- `ASAAS_API_KEY` ✅ (usado no código)
- `ASAAS_BASE_URL` ✅ (usado no código)
- `SUPABASE_URL` ✅ (usado no código)
- `SUPABASE_SERVICE_ROLE_KEY` ✅ (usado no código)
- `RENUM_WALLET_ID` ✅ (usado em asaas-configure-split)

## 🎯 FLUXO COMPLETO IDENTIFICADO

### Fluxo Atual (com problemas):

1. **Usuário acessa `/filiacao`**
   - Seleciona tipo de membro
   - Preenche formulário de pagamento

2. **Frontend chama `useFiliacaoPayment.processarFiliacaoComPagamento()`**
   - ✅ Cria conta no Auth (se não logado)
   - ✅ Cria cliente no Asaas via `asaas-create-customer`
   - ✅ Cria assinatura no Asaas via `asaas-create-subscription`
   - ❌ Registra cobrança com ID errado (ID da subscription)
   - ❌ Configura split com ID errado (não funciona)
   - ✅ Atualiza profile
   - ✅ Cria user_subscription (status: pending)
   - ✅ Registra afiliado (se houver)

3. **Problemas:**
   - Assinatura criada no Asaas SEM split
   - Split tentado depois com ID errado
   - Cobrança não é registrada corretamente
   - Status fica `pending` indefinidamente (sem webhook)

### Fluxo Correto (proposta):

1. **Usuário acessa `/filiacao`**
   - Seleciona tipo de membro
   - Preenche formulário de pagamento

2. **Frontend chama `useFiliacaoPayment.processarFiliacaoComPagamento()`**
   - ✅ Cria conta no Auth (se não logado)
   - ✅ Cria cliente no Asaas via `asaas-create-customer`
   - ✅ **Busca configuração de split ANTES de criar assinatura**
   - ✅ Cria assinatura no Asaas **COM array split** via `asaas-create-subscription`
   - ✅ Registra splits localmente
   - ✅ Atualiza profile
   - ✅ Cria user_subscription (status: pending)
   - ✅ Registra afiliado (se houver)

3. **Webhook do Asaas:**
   - Recebe evento `PAYMENT_RECEIVED` quando primeira cobrança é paga
   - Atualiza `user_subscriptions.status` para `active`
   - Atualiza `asaas_splits.status` para `CREDITED`
   - Notifica usuário e afiliado

## 📝 RESUMO EXECUTIVO

### Problemas CRÍTICOS (impedem funcionamento):
1. **Split configurado com ID errado** - assinatura criada sem split
2. **Endpoint de split incorreto** - API do Asaas vai rejeitar
3. **Webhooks não implementados** - status não atualiza
4. **Edge Function salva em tabela errada** - dados duplicados

### Problemas ALTOS (afetam funcionalidade):
5. **Validação de pagamento restritiva** - rejeita PIX válido
6. **RLS policies permissivas** - risco de segurança
7. **Falta tratamento de erros** - mensagens genéricas

### Problemas MÉDIOS (afetam qualidade):
8. **Múltiplas migrações conflitantes** - possível inconsistência
9. **Falta validação de plano** - pode criar assinatura inválida
10. **Falta transações atômicas** - pode deixar dados inconsistentes

### Funcionalidades IMPLEMENTADAS:
- ✅ Criação de conta
- ✅ Criação de cliente Asaas
- ✅ Criação de assinatura Asaas
- ✅ Salvamento de dados ministeriais
- ✅ Registro de afiliado
- ✅ Estrutura de split (mas não funcional)

### Funcionalidades NÃO IMPLEMENTADAS:
- ❌ Split na criação da assinatura
- ❌ Webhooks para atualizar status
- ❌ Validação de código de referral
- ❌ Tratamento robusto de erros

## 🔧 PRÓXIMOS PASSOS RECOMENDADOS

### Prioridade 1 (Crítico):
1. Implementar split na criação da assinatura
2. Implementar webhook para receber eventos do Asaas
3. Corrigir Edge Function para não salvar em tabela duplicada
4. Corrigir RLS policies para serem mais restritivas

### Prioridade 2 (Alto):
5. Remover validação restritiva de PIX
6. Implementar tratamento de erros detalhado
7. Validar código de referral antes de usar

### Prioridade 3 (Médio):
8. Consolidar migrações em estado limpo
9. Adicionar validação de plano
10. Implementar transações atômicas onde possível

