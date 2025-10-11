# 📊 RELATÓRIO DE ANÁLISE PRÉVIA DO BANCO DE DADOS

**Data:** 10/10/2025  
**Objetivo:** Analisar estado atual antes de implementar sistema de assinaturas recorrentes

---

## ✅ TABELAS EXISTENTES

### 1. `profiles` (2 registros)
**Colunas identificadas (23):**
- id, nome_completo, cpf, rg, data_nascimento
- endereco, cidade, estado, cep, telefone
- igreja, cargo, data_ordenacao
- status, tipo_membro
- created_at, updated_at
- email, member_type_id
- bio, foto_url, show_contact, show_ministry

**❌ CAMPOS DO ASAAS: NENHUM**
- Não existe `asaas_customer_id`
- Não existe `asaas_subscription_id`

### 2. `member_types` (5 registros)
**Tipos ativos:**
- Pastor (inativo)
- Diácono
- Membro
- Outros...

**Colunas:** id, name, description, is_active, sort_order, created_at, updated_at, created_by

### 3. `subscription_plans` (15 registros)
**Estrutura:**
- id, name, description, price, recurrence
- plan_id_gateway, is_active
- member_type_id, duration_months
- features (JSON), sort_order
- created_at, updated_at, created_by

**Planos existentes:**
- Pastor - Mensal (R$ 15,00)
- Diácono - Mensal (R$ 8,00)
- Membro - Mensal (R$ 5,00)
- + variações semestrais e anuais

### 4. `user_subscriptions` (0 registros)
**Status:** Tabela vazia - NUNCA foi usada

**❌ CAMPO NÃO EXISTE:** `asaas_subscription_id`

**Campos que EXISTEM (confirmado por tentativa de inserção):**
- user_id
- subscription_plan_id
- member_type_id
- status
- started_at
- expires_at

### 5. `asaas_cobrancas` (0 registros)
**Status:** Tabela vazia - sistema de pagamentos nunca foi usado

---

## 🎯 CONCLUSÕES CRÍTICAS

### 1. Sistema de Assinaturas NUNCA foi implementado
- Tabela `user_subscriptions` existe mas está VAZIA
- Nenhum usuário tem assinatura ativa
- Campo `asaas_subscription_id` NÃO EXISTE na tabela

### 2. Integração com Asaas NUNCA foi usada
- Tabela `asaas_cobrancas` está vazia
- Profiles não têm campos para armazenar IDs do Asaas
- Nenhuma cobrança foi processada

### 3. Usuários existentes (2)
- Beatriz Fatima (sem member_type_id)
- Renato Carraro (member_type_id: Membro)
- Ambos criados manualmente, sem processo de filiação

### 4. Planos configurados mas não utilizados
- 15 planos criados (mensal, semestral, anual)
- Preços definidos
- Features configuradas
- MAS: nenhum usuário vinculado

---

## ⚠️ IMPACTO NA IMPLEMENTAÇÃO

### O QUE PODE SER FEITO COM SEGURANÇA:

✅ **Implementar sistema de assinaturas do zero**
- Não há risco de quebrar funcionalidades existentes
- Tabelas estão prontas mas vazias
- Podemos popular conforme necessário

✅ **Criar novos campos se necessário**
- `asaas_subscription_id` em `user_subscriptions`
- `asaas_customer_id` em `profiles`
- Não afetará dados existentes

✅ **Implementar fluxo de filiação completo**
- Nenhum usuário passou por filiação ainda
- Sistema está "virgem" para implementação

### O QUE PRECISA SER FEITO:

1. **Adicionar coluna `asaas_subscription_id` em `user_subscriptions`**
2. **Adicionar colunas Asaas em `profiles` (opcional)**
3. **Implementar Edge Function para criar assinaturas**
4. **Atualizar hook `useFiliacaoPayment`**
5. **Testar fluxo completo end-to-end**

---

## 📋 PRÓXIMOS PASSOS RECOMENDADOS

### FASE 1: Migração do Banco (OBRIGATÓRIA)
```sql
-- Adicionar coluna para ID da assinatura do Asaas
ALTER TABLE user_subscriptions 
ADD COLUMN IF NOT EXISTS asaas_subscription_id TEXT;

-- Opcional: adicionar campos Asaas em profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS asaas_customer_id TEXT,
ADD COLUMN IF NOT EXISTS asaas_subscription_id TEXT;
```

### FASE 2: Atualizar Código
- ✅ Edge Function criada: `asaas-create-subscription`
- ✅ Hook criado: `useAsaasSubscriptions`
- 🔄 Hook em atualização: `useFiliacaoPayment`

### FASE 3: Testes
- Criar conta nova
- Selecionar plano
- Processar pagamento
- Verificar criação de assinatura no Asaas
- Verificar registro em `user_subscriptions`

---

## ✅ SEGURANÇA DA IMPLEMENTAÇÃO

**RISCO: BAIXO** 🟢

- Sistema nunca foi usado em produção
- Não há dados a serem preservados
- Tabelas existem mas estão vazias
- Implementação não afetará usuários existentes

**RECOMENDAÇÃO: PROSSEGUIR COM IMPLEMENTAÇÃO**
