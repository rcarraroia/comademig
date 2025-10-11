# 🔍 RELATÓRIO DETALHADO - ANÁLISE DO MÓDULO DE FILIAÇÃO

**Data:** 10/01/2025  
**Sistema:** COMADEMIG - Módulo de Filiação  
**URL:** https://comademig.vercel.app/filiacao

---

## 🎯 RESUMO EXECUTIVO

### Status Geral: 🔴 **SISTEMA QUEBRADO**

**Causa Raiz Identificada:**
- ❌ **Relacionamento Tipo de Membro ↔ Plano está QUEBRADO**
- ❌ **Query unificada retorna tipos SEM planos associados**
- ❌ **Usuários não conseguem ver valores ao selecionar tipo de membro**

---

## 📊 ANÁLISE DAS TABELAS

### ✅ Tabelas Existentes (7/7)

| Tabela | Status | Registros | Observação |
|--------|--------|-----------|------------|
| `member_types` | ✅ OK | 5 | 2 ativos (Diácono, Membro) |
| `subscription_plans` | ✅ OK | 15 | Todos ativos |
| `member_type_subscriptions` | ⚠️ PROBLEMA | 6 | **Relacionamentos com erro** |
| `user_subscriptions` | ✅ OK | 1 | 1 assinatura ativa |
| `profiles` | ⚠️ VAZIO | 0 | Nenhum perfil (problema de RLS?) |
| `asaas_customers` | ✅ OK | 0 | Normal (sistema novo) |
| `asaas_cobrancas` | ✅ OK | 0 | Normal (sistema novo) |

---

## 🔴 PROBLEMA CRÍTICO #1: Relacionamento Tipo ↔ Plano

### Erro Identificado:
```
❌ Erro ao buscar relacionamentos: 
{'message': 'invalid input syntax for type uuid: "None"', 
 'code': '22P02'}
```

### O que isso significa:
A tabela `member_type_subscriptions` tem **6 registros**, mas ao tentar buscar os detalhes:
- Algum campo UUID está com valor `"None"` (string) ao invés de `NULL` ou UUID válido
- Isso quebra a query e impede o sistema de funcionar

### Impacto:
- ❌ Frontend não consegue carregar planos associados aos tipos
- ❌ Usuários veem "SEM PLANO ASSOCIADO"
- ❌ Formulário de filiação não funciona

---

## 🔴 PROBLEMA CRÍTICO #2: Query Unificada Retorna Vazio

### Teste Realizado:
```sql
SELECT 
  member_types.*,
  member_type_subscriptions(
    subscription_plans(*)
  )
FROM member_types
WHERE is_active = true
```

### Resultado:
```
• Diácono
  ❌ SEM PLANO ASSOCIADO - PROBLEMA!

• Membro
  ❌ SEM PLANO ASSOCIADO - PROBLEMA!
```

### O que deveria retornar:
```
• Diácono
  ✅ Plano: Diácono - Mensal - R$ 8.00 (monthly)

• Membro
  ✅ Plano: Membro - Mensal - R$ 5.00 (monthly)
```

---

## 📋 DADOS ENCONTRADOS

### Tipos de Membro Ativos (2)

1. **Diácono**
   - ID: `615dc80a-870b-4b98-bb44-d48e778f1208`
   - Descrição: "Diácono da igreja local"
   - Ordem: 2
   - Status: Ativo ✅

2. **Membro**
   - ID: `fb3a0d99-9190-412a-8784-f3fd91a234d3`
   - Descrição: "Membro regular da congregação"
   - Ordem: 3
   - Status: Ativo ✅

### Planos de Assinatura (15 ativos)

#### Mensais:
- Pastor - R$ 15.00
- Diácono - R$ 8.00
- Membro - R$ 5.00
- Evangelista - R$ 12.00
- Bispo - R$ 10.00

#### Semestrais:
- Pastor - R$ 85.00
- Diácono - R$ 45.00
- Membro - R$ 28.00
- Evangelista - R$ 68.00
- Bispo - R$ 55.00

#### Anuais:
- Pastor - R$ 150.00
- Diácono - R$ 80.00
- Membro - R$ 50.00
- Evangelista - R$ 120.00
- Bispo - R$ 100.00

**⚠️ PROBLEMA:** Todos os planos têm `recurrence: 'monthly'` mesmo os semestrais e anuais!

---

## 🔍 ANÁLISE DO CÓDIGO FONTE

### 1. Página de Filiação (`src/pages/Filiacao.tsx`)

**Status:** ✅ Código OK

**Fluxo:**
1. Usuário acessa `/filiacao`
2. Vê benefícios da filiação
3. Seleciona tipo de membro via `MemberTypeSelector`
4. Clica em "Prosseguir com a Filiação"
5. Preenche formulário `PaymentFormEnhanced`
6. Submete pagamento

**Problema:** Passo 3 não funciona porque `MemberTypeSelector` não recebe planos.

---

### 2. Componente MemberTypeSelector

**Status:** ✅ Código OK

**Hook usado:** `useMemberTypeWithPlan()`

**Query executada:**
```typescript
supabase
  .from('member_types')
  .select(`
    id, name, description, sort_order, is_active,
    created_at, updated_at,
    member_type_subscriptions(
      subscription_plans(
        id, name, price, recurrence,
        plan_id_gateway, description
      )
    )
  `)
  .eq('is_active', true)
  .order('sort_order')
```

**Problema:** Query retorna tipos mas `member_type_subscriptions` vem vazio.

---

### 3. Hook useMemberTypeWithPlan

**Status:** ✅ Código OK

**Transformação de dados:**
```typescript
const validSubscriptions = memberType.member_type_subscriptions?.filter(
  sub => sub.subscription_plans !== null
) || [];

const subscription = validSubscriptions[0]?.subscription_plans;
```

**Problema:** `validSubscriptions` está vazio porque relacionamento está quebrado.

---

### 4. Componente PaymentFormEnhanced

**Status:** ✅ Código OK (810 linhas)

**Validação:** Usa Zod schema completo
**Campos:** Todos os campos necessários presentes
**Integração:** Usa hooks do Asaas corretamente

**Problema:** Nunca é alcançado porque usuário não consegue selecionar tipo.

---

### 5. Hook useFiliacaoPayment

**Status:** ✅ Código OK

**Fluxo completo:**
1. Criar cliente no Asaas
2. Processar pagamento (PIX/Cartão/Boleto)
3. Atualizar perfil do usuário
4. Criar assinatura
5. Registrar dados ministeriais
6. Registrar afiliado (se houver)

**Problema:** Nunca é executado porque formulário não é submetido.

---

## 🔧 ANÁLISE DO BANCO DE DADOS

### Tabela: member_type_subscriptions

**Estrutura esperada:**
```sql
CREATE TABLE member_type_subscriptions (
  id UUID PRIMARY KEY,
  member_type_id UUID REFERENCES member_types(id),
  subscription_plan_id UUID REFERENCES subscription_plans(id),
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

**Problema identificado:**
- Tem 6 registros
- Algum campo UUID contém string `"None"` ao invés de NULL
- Isso quebra queries com JOIN

### Possíveis causas:
1. Inserção manual com valor incorreto
2. Migração com dados inválidos
3. Código que insere string "None" ao invés de NULL

---

## 🔴 PROBLEMA CRÍTICO #3: Profiles Vazio

### Observação:
```
📊 Total de perfis: 0
ℹ️  Nenhum perfil cadastrado
```

### Possíveis causas:
1. **RLS (Row Level Security) bloqueando leitura**
   - Política muito restritiva
   - Usuário anônimo não consegue ler

2. **Realmente não há perfis**
   - Sistema novo sem usuários

3. **Problema de autenticação**
   - Token inválido
   - Sessão expirada

### Impacto:
- Se RLS está bloqueando, usuários não conseguem ver seus próprios dados
- Formulário pode não conseguir atualizar perfil após pagamento

---

## 🔴 PROBLEMA CRÍTICO #4: Recorrência Incorreta

### Observação:
Todos os 15 planos têm `recurrence: 'monthly'`, incluindo:
- Pastor - Semestral (deveria ser 'semestral')
- Diácono - Anual (deveria ser 'annual')

### Impacto:
- Sistema pode cobrar mensalmente ao invés de semestral/anual
- Cálculo de expiração incorreto
- Confusão para o usuário

---

## 📝 CHECKLIST DE PROBLEMAS

### 🔴 Críticos (Impedem funcionamento)

- [ ] **Relacionamento member_type_subscriptions com UUID inválido**
  - Erro: `invalid input syntax for type uuid: "None"`
  - Impacto: Query unificada falha
  - Solução: Limpar registros com UUID inválido

- [ ] **Query unificada retorna tipos sem planos**
  - Causa: Relacionamento quebrado
  - Impacto: Usuário não vê valores
  - Solução: Corrigir relacionamentos

- [ ] **Profiles retorna 0 registros**
  - Causa: RLS ou realmente vazio
  - Impacto: Pode bloquear atualização de perfil
  - Solução: Verificar políticas RLS

### 🟡 Importantes (Causam problemas)

- [ ] **Recorrência incorreta nos planos**
  - Todos marcados como 'monthly'
  - Impacto: Cobrança e expiração incorretas
  - Solução: Atualizar campo recurrence

- [ ] **plan_id_gateway NULL em todos os planos**
  - Impacto: Pode causar problemas na integração Asaas
  - Solução: Gerar IDs no gateway ou usar outro método

### 🟢 Opcionais (Melhorias)

- [ ] Adicionar descrições aos planos
- [ ] Ativar mais tipos de membro (Pastor, Evangelista, Bispo)
- [ ] Testar fluxo completo end-to-end

---

## 🎯 PLANO DE AÇÃO RECOMENDADO

### Fase 1: Diagnóstico Detalhado (URGENTE)

#### 1.1 Verificar dados da tabela member_type_subscriptions
```sql
-- Executar no Supabase SQL Editor:
SELECT * FROM member_type_subscriptions;
```

**Objetivo:** Ver exatamente quais registros têm problema

#### 1.2 Verificar políticas RLS de profiles
```sql
-- Ver políticas atuais:
SELECT * FROM pg_policies 
WHERE tablename = 'profiles';
```

**Objetivo:** Entender por que retorna 0 registros

---

### Fase 2: Correção dos Dados (URGENTE)

#### 2.1 Limpar relacionamentos inválidos
```sql
-- OPÇÃO A: Deletar todos e recriar
DELETE FROM member_type_subscriptions;

-- OPÇÃO B: Deletar apenas inválidos (se conseguir identificar)
DELETE FROM member_type_subscriptions 
WHERE member_type_id IS NULL 
   OR subscription_plan_id IS NULL
   OR member_type_id::text = 'None'
   OR subscription_plan_id::text = 'None';
```

#### 2.2 Recriar relacionamentos corretos
```sql
-- Diácono → Diácono Mensal
INSERT INTO member_type_subscriptions (member_type_id, subscription_plan_id)
VALUES (
  '615dc80a-870b-4b98-bb44-d48e778f1208',  -- Diácono
  '71626827-5d8d-48a8-9587-93d34c2318da'   -- Diácono - Mensal
);

-- Membro → Membro Mensal
INSERT INTO member_type_subscriptions (member_type_id, subscription_plan_id)
VALUES (
  'fb3a0d99-9190-412a-8784-f3fd91a234d3',  -- Membro
  '063de54b-4bba-4fd1-b520-e4992072f211'   -- Membro - Mensal
);
```

#### 2.3 Corrigir recorrência dos planos
```sql
-- Corrigir planos semestrais
UPDATE subscription_plans 
SET recurrence = 'semestral'
WHERE name LIKE '% - Semestral';

-- Corrigir planos anuais
UPDATE subscription_plans 
SET recurrence = 'annual'
WHERE name LIKE '% - Anual';
```

---

### Fase 3: Verificação (IMPORTANTE)

#### 3.1 Testar query unificada novamente
```python
python analise_filiacao_completa.py
```

**Resultado esperado:**
```
• Diácono
  ✅ Plano: Diácono - Mensal - R$ 8.00 (monthly)

• Membro
  ✅ Plano: Membro - Mensal - R$ 5.00 (monthly)
```

#### 3.2 Testar no frontend
1. Acessar https://comademig.vercel.app/filiacao
2. Selecionar "Diácono"
3. Verificar se aparece: "R$ 8.00 - Mensal"
4. Clicar em "Prosseguir com a Filiação"
5. Verificar se formulário abre

---

### Fase 4: Teste Completo (CRÍTICO)

#### 4.1 Criar conta de teste
1. Fazer logout
2. Acessar `/filiacao`
3. Selecionar tipo de membro
4. Preencher formulário completo
5. Escolher método de pagamento PIX
6. Submeter

#### 4.2 Verificar resultado
- [ ] Cliente criado no Asaas
- [ ] Cobrança gerada
- [ ] QR Code PIX exibido
- [ ] Perfil atualizado
- [ ] Assinatura criada (status: pending)
- [ ] Redirecionado para dashboard

---

## 📊 ARQUITETURA DO SISTEMA

### Fluxo Completo de Filiação:

```
1. FRONTEND (Filiacao.tsx)
   ↓
2. Selecionar Tipo (MemberTypeSelector)
   ↓ usa hook: useMemberTypeWithPlan()
   ↓ query: member_types + member_type_subscriptions + subscription_plans
   ↓
3. Preencher Formulário (PaymentFormEnhanced)
   ↓ validação: Zod schema
   ↓
4. Submeter (useFiliacaoPayment)
   ↓
5. Criar Cliente Asaas (useAsaasCustomers)
   ↓
6. Processar Pagamento
   ├─ PIX (useAsaasPixPayments)
   ├─ Cartão (useAsaasCardPayments)
   └─ Boleto (useAsaasBoletoPayments)
   ↓
7. Atualizar Perfil (profiles)
   ↓
8. Criar Assinatura (user_subscriptions)
   ↓
9. Registrar Dados Ministeriais (ministerial_data)
   ↓
10. Registrar Afiliado (affiliate_referrals) [opcional]
    ↓
11. Redirecionar para Dashboard
```

### Ponto de Falha Atual:
```
❌ PASSO 2: Query retorna tipos SEM planos
   Causa: member_type_subscriptions com UUID inválido
   Resultado: Usuário não consegue prosseguir
```

---

## 🔐 VERIFICAÇÕES DE SEGURANÇA (RLS)

### Políticas que precisam existir:

#### profiles
```sql
-- Usuários podem ler seu próprio perfil
CREATE POLICY "Users can read own profile"
ON profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Usuários podem atualizar seu próprio perfil
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id);
```

#### user_subscriptions
```sql
-- Usuários podem ler suas próprias assinaturas
CREATE POLICY "Users can read own subscriptions"
ON user_subscriptions FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Sistema pode criar assinaturas
CREATE POLICY "System can create subscriptions"
ON user_subscriptions FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);
```

#### member_types (leitura pública)
```sql
-- Qualquer um pode ler tipos ativos
CREATE POLICY "Anyone can read active member types"
ON member_types FOR SELECT
TO public
USING (is_active = true);
```

#### subscription_plans (leitura pública)
```sql
-- Qualquer um pode ler planos ativos
CREATE POLICY "Anyone can read active plans"
ON subscription_plans FOR SELECT
TO public
USING (is_active = true);
```

---

## 📞 PRÓXIMOS PASSOS IMEDIATOS

### 1. EXECUTAR DIAGNÓSTICO SQL (5 min)
```sql
-- No Supabase SQL Editor:
SELECT * FROM member_type_subscriptions;
```

### 2. LIMPAR DADOS INVÁLIDOS (2 min)
```sql
DELETE FROM member_type_subscriptions;
```

### 3. RECRIAR RELACIONAMENTOS (3 min)
```sql
-- Inserir relacionamentos corretos
-- (ver scripts na Fase 2.2)
```

### 4. CORRIGIR RECORRÊNCIAS (2 min)
```sql
-- Atualizar campo recurrence
-- (ver scripts na Fase 2.3)
```

### 5. TESTAR NOVAMENTE (5 min)
```bash
python analise_filiacao_completa.py
```

### 6. TESTAR NO FRONTEND (10 min)
- Acessar /filiacao
- Selecionar tipo
- Verificar se valores aparecem

---

## ✅ CRITÉRIOS DE SUCESSO

Sistema estará funcionando quando:

- [ ] Query unificada retorna tipos COM planos
- [ ] Frontend exibe valores corretamente
- [ ] Usuário consegue selecionar tipo e ver preço
- [ ] Formulário de pagamento abre
- [ ] Todos os campos são preenchíveis
- [ ] Submissão cria cliente no Asaas
- [ ] Pagamento é processado
- [ ] Perfil é atualizado
- [ ] Assinatura é criada
- [ ] Usuário é redirecionado para dashboard

---

## 📁 ARQUIVOS GERADOS

1. **analise_filiacao_completa.py** - Script de diagnóstico
2. **relatorio_filiacao.json** - Dados em JSON
3. **RELATORIO_FILIACAO_DETALHADO.md** - Este relatório

---

**Relatório gerado automaticamente**  
**Aguardando autorização para correções**
