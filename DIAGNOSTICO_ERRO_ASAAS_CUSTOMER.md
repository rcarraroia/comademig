# 🔍 DIAGNÓSTICO - Erro ao Criar Cliente Asaas

**Data:** 11/01/2025  
**Status:** ❌ PROBLEMA IDENTIFICADO

---

## 📊 SITUAÇÃO ATUAL

### ✅ O que funcionou:
1. Usuário Auth criado: `7929a3d9-13f3-4e6c-ad93-5f825fc936f3`
2. Profile criado no Supabase
3. Fluxo de autenticação correto

### ❌ O que falhou:
- Criação de cliente no Asaas
- Erro: "Erro ao criar cliente no Asaas"

---

## 🔍 ANÁLISE DO CÓDIGO

### 1. Edge Function `asaas-create-customer`

**Localização:** `supabase/functions/asaas-create-customer/index.ts`

**Parâmetros esperados:**
```typescript
{
  user_id: string,        // ✅ OBRIGATÓRIO
  customer_data: {        // ✅ OBRIGATÓRIO
    name: string,
    cpfCnpj: string,
    email: string,
    phone?: string,
    // ... outros campos
  }
}
```

**Validações:**
- ✅ Verifica se `user_id` e `customer_data` estão presentes
- ✅ Valida dados do cliente (CPF, email, etc.)
- ✅ Verifica se cliente já existe antes de criar
- ✅ Usa `asaasClient` que requer `ASAAS_API_KEY`

---

### 2. Hook `useAsaasCustomers`

**Localização:** `src/hooks/useAsaasCustomers.ts`

**Como funciona:**
```typescript
const createCustomer = async (customerData: CreateCustomerData) => {
  // ⚠️ PROBLEMA: Pega user do contexto de autenticação
  if (!user) {
    toast({ title: "Erro", description: "Usuário não autenticado" });
    return null;
  }

  // Chama Edge Function
  const { data, error } = await supabase.functions.invoke('asaas-create-customer', {
    body: {
      user_id: user.id,  // ⚠️ user pode ser null se acabou de ser criado
      customer_data: customerData
    }
  });
}
```

**PROBLEMA IDENTIFICADO:**
- Hook depende de `user` do contexto `AuthContext`
- Quando usuário é criado, contexto pode não estar atualizado imediatamente
- `user` pode ser `null` ou `undefined` no momento da chamada

---

### 3. Hook `useFiliacaoPayment`

**Localização:** `src/hooks/useFiliacaoPayment.ts`

**Fluxo atual:**
```typescript
// 1. Criar usuário Auth
const { data: authData } = await supabase.auth.signUp({...});
currentUserId = authData.user.id;  // ✅ Temos o ID

// 2. Criar cliente Asaas
const customerResponse = await createCustomer(customerData);
// ❌ PROBLEMA: createCustomer usa user do contexto, não currentUserId
```

**PROBLEMA:**
- `useFiliacaoPayment` tem o `currentUserId` correto
- Mas `createCustomer` não recebe esse ID como parâmetro
- `createCustomer` tenta pegar do contexto que pode não estar atualizado

---

## 🎯 CAUSA RAIZ DO PROBLEMA

### Cenário 1: Contexto de Autenticação Não Atualizado

```
1. Usuário preenche formulário (não logado)
2. useFiliacaoPayment cria conta Auth ✅
3. currentUserId = authData.user.id ✅
4. Contexto AuthContext ainda não atualizou ❌
5. createCustomer() verifica user do contexto ❌
6. user === null ❌
7. Retorna erro "Usuário não autenticado" ❌
```

### Cenário 2: Edge Function Sem Credenciais

```
1. createCustomer() consegue pegar user.id ✅
2. Chama Edge Function com user_id ✅
3. Edge Function tenta usar ASAAS_API_KEY ❌
4. ASAAS_API_KEY não configurada no Supabase ❌
5. asaasClient.post() falha ❌
6. Retorna erro 500 ❌
```

---

## 🔧 SOLUÇÕES PROPOSTAS

### Solução 1: Passar `user_id` Explicitamente (RECOMENDADO)

**Modificar `useAsaasCustomers.ts`:**

```typescript
// ANTES (usa contexto)
const createCustomer = async (customerData: CreateCustomerData) => {
  if (!user) {
    toast({ title: "Erro", description: "Usuário não autenticado" });
    return null;
  }
  
  const { data, error } = await supabase.functions.invoke('asaas-create-customer', {
    body: {
      user_id: user.id,  // ❌ Depende do contexto
      customer_data: customerData
    }
  });
}

// DEPOIS (recebe user_id)
const createCustomer = async (
  customerData: CreateCustomerData,
  userId?: string  // ✅ Parâmetro opcional
) => {
  const effectiveUserId = userId || user?.id;
  
  if (!effectiveUserId) {
    toast({ title: "Erro", description: "Usuário não autenticado" });
    return null;
  }
  
  const { data, error } = await supabase.functions.invoke('asaas-create-customer', {
    body: {
      user_id: effectiveUserId,  // ✅ Usa ID passado ou do contexto
      customer_data: customerData
    }
  });
}
```

**Modificar `useFiliacaoPayment.ts`:**

```typescript
// Passar currentUserId explicitamente
const customerResponse = await createCustomer(customerData, currentUserId);
```

---

### Solução 2: Configurar Secrets no Supabase (OBRIGATÓRIO)

**Se o problema for falta de credenciais:**

1. Acesse: https://supabase.com/dashboard/project/amkelczfwazutrciqtlk/settings/functions

2. Adicione as variáveis:
   ```
   ASAAS_API_KEY=$aact_prod_000MzkwODA2MWY2OGM3MWRlMDU2NWM3MzJlNzZmNGZhZGY6OjAzMDJhMTdhLTkyYTItNDI1MS1iODk4LTZmZTYxZTkyNzA3Yzo6JGFhY2hfOWNlYTMzMjUtMWJjYi00OTliLTliZWQtMmYzZDlhNzM4MWRj
   
   ASAAS_WEBHOOK_TOKEN=webhook_prod_36a882b2b9ff39b4106009bd1c554a00901d507ee3758dce
   
   ASAAS_BASE_URL=https://api.asaas.com/v3
   
   ASAAS_ENVIRONMENT=production
   ```

3. Reinicie as Edge Functions

---

### Solução 3: Adicionar Logs Detalhados

**Modificar `useAsaasCustomers.ts` para debug:**

```typescript
const createCustomer = async (customerData: CreateCustomerData) => {
  console.log('🔍 DEBUG createCustomer:');
  console.log('  - user do contexto:', user?.id);
  console.log('  - customerData:', customerData);
  
  if (!user) {
    console.error('❌ Usuário não autenticado no contexto');
    toast({ title: "Erro", description: "Usuário não autenticado" });
    return null;
  }
  
  console.log('✅ Chamando Edge Function com user_id:', user.id);
  
  const { data, error } = await supabase.functions.invoke('asaas-create-customer', {
    body: {
      user_id: user.id,
      customer_data: customerData
    }
  });
  
  console.log('📥 Resposta da Edge Function:');
  console.log('  - data:', data);
  console.log('  - error:', error);
  
  if (error) {
    console.error('❌ Erro da Edge Function:', error);
    throw new Error(error.message || 'Erro ao comunicar com o servidor');
  }
  
  // ... resto do código
}
```

---

## 🧪 TESTES PARA IDENTIFICAR O PROBLEMA

### Teste 1: Verificar Contexto de Autenticação

**No console do navegador (F12):**

```javascript
// Após criar conta, verificar se user está no contexto
console.log('User no contexto:', window.__AUTH_CONTEXT__?.user);
```

### Teste 2: Verificar Logs da Edge Function

**No terminal:**

```bash
# Ver logs em tempo real
supabase functions logs asaas-create-customer --tail

# Procurar por:
# - "Usuário não autenticado" (problema de contexto)
# - "ASAAS_API_KEY não configurada" (problema de credenciais)
# - Erros da API Asaas (problema de dados)
```

### Teste 3: Testar Edge Function Diretamente

**No terminal:**

```bash
curl -X POST https://amkelczfwazutrciqtlk.supabase.co/functions/v1/asaas-create-customer \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "7929a3d9-13f3-4e6c-ad93-5f825fc936f3",
    "customer_data": {
      "name": "Teste",
      "email": "teste@teste.com",
      "cpfCnpj": "12345678900",
      "phone": "11987654321"
    }
  }'
```

**Respostas esperadas:**

- ✅ Sucesso: `{"success":true,"customer_id":"cus_xxx"}`
- ❌ Sem credenciais: `{"error":"ASAAS_API_KEY não configurada"}`
- ❌ Dados inválidos: `{"error":"Dados inválidos","details":[...]}`

---

## 📋 CHECKLIST DE DIAGNÓSTICO

Execute na ordem:

- [ ] **1. Verificar secrets no Supabase**
  - Acesse: https://supabase.com/dashboard/project/amkelczfwazutrciqtlk/settings/functions
  - Confirme que `ASAAS_API_KEY` está configurada
  - Se não estiver, adicione conforme Solução 2

- [ ] **2. Verificar logs da Edge Function**
  ```bash
  supabase functions logs asaas-create-customer --tail
  ```
  - Procure por erros específicos
  - Anote a mensagem de erro exata

- [ ] **3. Testar Edge Function diretamente**
  - Use o curl do Teste 3
  - Verifique se retorna sucesso ou erro
  - Anote a resposta

- [ ] **4. Adicionar logs no código**
  - Implemente Solução 3 (logs detalhados)
  - Teste fluxo de filiação novamente
  - Verifique console do navegador

- [ ] **5. Implementar Solução 1**
  - Modificar `useAsaasCustomers.ts`
  - Modificar `useFiliacaoPayment.ts`
  - Testar novamente

---

## 🎯 PRÓXIMOS PASSOS

### Imediato:

1. **Verificar se secrets estão configurados no Supabase**
   - Se não estiverem: Configurar (Solução 2)
   - Se estiverem: Prosseguir para passo 2

2. **Verificar logs da Edge Function**
   - Identificar erro específico
   - Reportar erro encontrado

3. **Implementar Solução 1**
   - Passar `user_id` explicitamente
   - Evitar dependência do contexto

### Após correção:

1. Testar fluxo completo de filiação
2. Verificar que cliente Asaas é criado
3. Confirmar que assinatura é criada
4. Validar no painel do Asaas

---

## 📞 COMANDOS ÚTEIS

```bash
# Ver logs da Edge Function
supabase functions logs asaas-create-customer --tail

# Listar Edge Functions
supabase functions list

# Testar Edge Function
curl -X POST https://amkelczfwazutrciqtlk.supabase.co/functions/v1/asaas-create-customer \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"user_id":"USER_ID","customer_data":{...}}'
```

---

## ✅ CONCLUSÃO

**Problema mais provável:** Contexto de autenticação não atualizado quando `createCustomer` é chamado.

**Solução recomendada:** Implementar Solução 1 (passar `user_id` explicitamente).

**Ação obrigatória:** Verificar se secrets estão configurados no Supabase (Solução 2).

---

**Gerado por:** Kiro AI  
**Data:** 11/01/2025
