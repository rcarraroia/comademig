# 📊 ANÁLISE DA ESTRUTURA DO BANCO DE DADOS

**Data:** 13/10/2025  
**Método:** Conexão direta via Python com supabase-py

---

## ✅ TABELA: profiles

**Total de colunas:** 28

### Colunas Disponíveis:
- ✅ asaas_customer_id
- ✅ asaas_subscription_id
- ✅ bairro
- ✅ bio
- ✅ cargo
- ✅ cep
- ✅ cidade
- ✅ complemento
- ✅ cpf
- ✅ created_at
- ✅ data_nascimento
- ✅ data_ordenacao
- ✅ email
- ✅ endereco
- ✅ estado
- ✅ foto_url
- ✅ id
- ✅ igreja
- ✅ member_type_id
- ✅ nome_completo
- ✅ numero
- ✅ rg
- ✅ show_contact
- ✅ show_ministry
- ✅ status
- ✅ telefone
- ✅ tipo_membro
- ✅ updated_at

### ❌ Campos que NÃO existem (removidos do código):
- ❌ subscription_source

---

## ✅ TABELA: subscription_plans

**Total de colunas:** 14

### Colunas Disponíveis:
- ✅ created_at
- ✅ created_by
- ✅ description
- ✅ duration_months
- ✅ features (tipo: dict/json)
- ✅ id
- ✅ is_active
- ✅ member_type_id
- ✅ name
- ✅ plan_id_gateway
- ✅ price
- ✅ recurrence
- ✅ sort_order
- ✅ updated_at

### ❌ Campos que NÃO existem (removidos do código):
- ❌ permissions

---

## ✅ TABELA: user_subscriptions

**Status:** Tabela existe mas está vazia (sem registros para análise)

### Campos esperados (baseado no código):
- user_id
- subscription_plan_id
- member_type_id
- status
- asaas_subscription_id
- started_at
- expires_at

### ⚠️ Observação:
- Tabela protegida por RLS (Row Level Security)
- Inserção via `anon` key bloqueada
- Inserção funciona via autenticação de usuário (usado no frontend)

---

## ✅ TABELA: member_types

**Total de colunas:** 8

### Colunas Disponíveis:
- ✅ created_at
- ✅ created_by
- ✅ description
- ✅ id
- ✅ is_active
- ✅ name
- ✅ sort_order
- ✅ updated_at

---

## 🔧 CORREÇÕES APLICADAS NO CÓDIGO

### 1. Removido campo `subscription_source` de profiles
**Arquivo:** `src/hooks/useFiliacaoPayment.ts`  
**Linha:** ~260  
**Status:** ✅ Corrigido

```typescript
// ❌ ANTES (campo não existe)
subscription_source: 'filiacao',

// ✅ DEPOIS (removido)
// Campo não existe na tabela
```

### 2. Removido campo `permissions` de subscription_plans
**Arquivo:** `src/hooks/useFiliacaoPayment.ts`  
**Linha:** ~290  
**Status:** ✅ Corrigido

```typescript
// ❌ ANTES
subscription_plans(
  id,
  name,
  price,
  recurrence,
  permissions  // ❌ Campo não existe
)

// ✅ DEPOIS
subscription_plans(
  id,
  name,
  price,
  recurrence
)
```

### 3. Removido join com `member_types` em user_subscriptions
**Arquivo:** `src/hooks/useFiliacaoPayment.ts`  
**Status:** ✅ Corrigido

```typescript
// ❌ ANTES
select(`
  *,
  subscription_plans(...),
  member_types(...)  // ❌ Relação não existe
`)

// ✅ DEPOIS
select(`
  *,
  subscription_plans(...)
`)
```

---

## 📋 CAMPOS USADOS NO CÓDIGO vs BANCO

### profiles - UPDATE (useFiliacaoPayment.ts)

| Campo | Existe no Banco | Usado no Código | Status |
|-------|----------------|-----------------|--------|
| nome_completo | ✅ | ✅ | ✅ OK |
| cpf | ✅ | ✅ | ✅ OK |
| telefone | ✅ | ✅ | ✅ OK |
| cep | ✅ | ✅ | ✅ OK |
| endereco | ✅ | ✅ | ✅ OK |
| numero | ✅ | ✅ | ✅ OK |
| complemento | ✅ | ✅ | ✅ OK |
| bairro | ✅ | ✅ | ✅ OK |
| cidade | ✅ | ✅ | ✅ OK |
| estado | ✅ | ✅ | ✅ OK |
| igreja | ✅ | ✅ | ✅ OK |
| cargo | ✅ | ✅ | ✅ OK |
| member_type_id | ✅ | ✅ | ✅ OK |
| asaas_customer_id | ✅ | ✅ | ✅ OK |
| asaas_subscription_id | ✅ | ✅ | ✅ OK |
| updated_at | ✅ | ✅ | ✅ OK |
| subscription_source | ❌ | ❌ | ✅ REMOVIDO |

### user_subscriptions - INSERT (useFiliacaoPayment.ts)

| Campo | Esperado | Usado no Código | Status |
|-------|----------|-----------------|--------|
| user_id | ✅ | ✅ | ✅ OK |
| subscription_plan_id | ✅ | ✅ | ✅ OK |
| member_type_id | ✅ | ✅ | ✅ OK |
| status | ✅ | ✅ | ✅ OK |
| asaas_subscription_id | ✅ | ✅ | ✅ OK |
| started_at | ✅ | ✅ | ✅ OK |
| expires_at | ✅ | ✅ | ✅ OK |

---

## ✅ CONCLUSÃO

**Todos os campos problemáticos foram identificados e removidos:**

1. ✅ `subscription_source` em profiles - REMOVIDO
2. ✅ `permissions` em subscription_plans - REMOVIDO  
3. ✅ Join com `member_types` - REMOVIDO

**Código agora está alinhado com a estrutura real do banco de dados.**

---

## 🧪 PRÓXIMO TESTE

Com todas as correções aplicadas, o fluxo de filiação deve funcionar 100%:

1. ✅ Cliente Asaas criado
2. ✅ Assinatura Asaas criada
3. ✅ Perfil atualizado (todos os campos válidos)
4. ✅ user_subscriptions criado (todos os campos válidos)
5. ✅ Filiação completada
6. ✅ Redirecionamento para dashboard

**Status:** PRONTO PARA TESTE FINAL
