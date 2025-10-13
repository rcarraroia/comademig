# 🔍 INSTRUÇÕES PARA DEBUG DO ERRO DE FILIAÇÃO

## 📋 PROBLEMA IDENTIFICADO

**Sintoma:** Edge Function `asaas-create-customer` retorna HTTP 400 quando chamada pelo frontend, mas funciona em teste manual Python.

**Hipótese Principal:** CPF, telefone ou CEP estão sendo enviados com formatação (pontos, traços, parênteses) quando deveriam ser apenas números.

## ✅ CORREÇÕES APLICADAS

### 1. Logs Detalhados Adicionados

Foram adicionados logs extensivos em 3 pontos do fluxo:

- **PaymentFormEnhanced.tsx**: Mostra dados do formulário antes e depois da limpeza
- **useFiliacaoPayment.ts**: Mostra dados preparados para envio
- **useAsaasCustomers.ts**: Mostra dados exatos enviados à Edge Function

### 2. Limpeza de Formatação

Adicionada função `cleanNumericField()` que remove toda formatação de:
- CPF (remove pontos e traços)
- Telefone (remove parênteses, espaços, traços)
- CEP (remove traços)

## 🧪 COMO TESTAR

### Passo 1: Abrir Console do Navegador

1. Abra o navegador (Chrome/Edge recomendado)
2. Pressione **F12** para abrir DevTools
3. Vá para a aba **Console**
4. Limpe o console (ícone 🚫 ou Ctrl+L)

### Passo 2: Abrir Network Tab

1. Ainda no DevTools, vá para a aba **Network**
2. Certifique-se que está gravando (botão vermelho ●)
3. Limpe a lista (ícone 🚫)

### Passo 3: Fazer Teste de Filiação

1. Acesse: http://localhost:8080/filiacao
2. Selecione um tipo de membro
3. Clique em "Prosseguir com a Filiação"
4. Preencha o formulário com dados de teste:

```
Nome: TESTE DEBUG
CPF: 111.444.777-35 (pode digitar com pontos e traços)
Telefone: (31) 98765-4321 (pode digitar com formatação)
Email: teste.debug@teste.com
CEP: 30130-100 (pode digitar com traço)
Endereço: Rua Teste
Número: 123
Bairro: Centro
Cidade: Belo Horizonte
Estado: MG
Igreja: Igreja Teste
Senha: Teste123
Confirmar Senha: Teste123
Método de Pagamento: PIX
✅ Aceitar termos
✅ Aceitar privacidade
```

5. Clique em "Finalizar Filiação"

### Passo 4: Capturar Logs do Console

No console, você verá logs detalhados como:

```
📤 ========================================
📤 DADOS LIMPOS (sem formatação):
📤 ========================================
  CPF original: 111.444.777-35 → limpo: 11144477735
  Telefone original: (31) 98765-4321 → limpo: 31987654321
  CEP original: 30130-100 → limpo: 30130100

📤 ========================================
📤 useFiliacaoPayment - DADOS DO FORMULÁRIO:
📤 ========================================
📤 currentUserId: bfe7372d-2c39-4268-91ec-b3981b7b69e2
📤 customerData preparado:
{
  "name": "TESTE DEBUG",
  "email": "teste.debug@teste.com",
  "phone": "31987654321",
  "cpfCnpj": "11144477735",
  "postalCode": "30130100",
  "address": "Rua Teste",
  "addressNumber": "123",
  "province": "Centro",
  "city": "Belo Horizonte",
  "state": "MG"
}

📤 ========================================
📤 BODY COMPLETO ENVIADO À EDGE FUNCTION:
📤 ========================================
{
  "user_id": "bfe7372d-2c39-4268-91ec-b3981b7b69e2",
  "customer_data": {
    "name": "TESTE DEBUG",
    "email": "teste.debug@teste.com",
    "phone": "31987654321",
    "cpfCnpj": "11144477735",
    "postalCode": "30130100",
    "address": "Rua Teste",
    "addressNumber": "123",
    "province": "Centro",
    "city": "Belo Horizonte",
    "state": "MG"
  }
}

📥 ========================================
📥 RESPOSTA DA EDGE FUNCTION:
📥 ========================================
📥 data: { ... }
📥 error: { ... }
```

**COPIE TODOS ESSES LOGS** e me envie.

### Passo 5: Capturar Requisição HTTP

Na aba **Network**:

1. Procure pela requisição `asaas-create-customer`
2. Clique nela
3. Vá para a aba **Payload** ou **Request**
4. Copie o JSON completo que foi enviado
5. Vá para a aba **Response**
6. Copie a resposta completa

## 📊 O QUE ESPERAR

### ✅ Se a correção funcionou:

```
📥 data: {
  "success": true,
  "customer_id": "cus_000007106514",
  "message": "Cliente criado com sucesso"
}
📥 error: null
```

### ❌ Se ainda houver erro:

```
📥 data: null
📥 error: {
  "message": "Edge Function returned a non-2xx status code"
}
```

Neste caso, a resposta HTTP na aba Network mostrará o erro exato:

```json
{
  "error": "Dados inválidos",
  "details": [
    "CPF/CNPJ deve ter formato válido"
  ]
}
```

## 🔧 PRÓXIMOS PASSOS BASEADOS NO RESULTADO

### Cenário A: Erro de Validação de CPF

Se o erro for "CPF/CNPJ deve ter formato válido":
- Verificar se CPF está sendo limpo corretamente
- Verificar se CPF de teste é válido (111.444.777-35 é válido)

### Cenário B: Erro de Campo Obrigatório

Se o erro for "Campo X é obrigatório":
- Verificar se campo está sendo enviado
- Verificar se campo não está undefined ou null

### Cenário C: Erro 500 (Interno)

Se o erro for 500:
- Problema na Edge Function (não no frontend)
- Verificar logs da Edge Function no Supabase Dashboard

### Cenário D: Sucesso!

Se funcionar:
- Confirmar que cliente foi criado no Asaas
- Confirmar que filiação foi completada
- Testar com usuário real

## 📝 INFORMAÇÕES PARA ME ENVIAR

Por favor, me envie:

1. **Logs completos do Console** (copiar tudo que aparecer com 📤 e 📥)
2. **Payload da requisição** (aba Network → asaas-create-customer → Payload)
3. **Response da requisição** (aba Network → asaas-create-customer → Response)
4. **Status HTTP** (200, 400, 500, etc.)
5. **Screenshot do erro** (se houver mensagem de erro na tela)

## 🎯 COMPARAÇÃO COM TESTE MANUAL

### Teste Manual Python (que funcionou):

```json
{
  "user_id": "e1406ff4-a0f4-4189-93b4-8a832ecbdd40",
  "customer_data": {
    "name": "Nome Completo do Teste",
    "email": "teste@teste.com",
    "cpfCnpj": "11144477735",
    "phone": "11987654321"
  }
}
```

**Status:** 201 Created ✅

### Frontend (que estava falhando):

Agora com a correção, deve enviar no mesmo formato:

```json
{
  "user_id": "bfe7372d-2c39-4268-91ec-b3981b7b69e2",
  "customer_data": {
    "name": "TESTE DEBUG",
    "email": "teste.debug@teste.com",
    "cpfCnpj": "11144477735",  ← SEM formatação
    "phone": "31987654321",     ← SEM formatação
    "postalCode": "30130100",   ← SEM formatação
    "address": "Rua Teste",
    "addressNumber": "123",
    "province": "Centro",
    "city": "Belo Horizonte",
    "state": "MG"
  }
}
```

**Status esperado:** 201 Created ✅

## ⚠️ IMPORTANTE

- **NÃO** saia da conta durante o teste (use a conta já logada)
- **NÃO** recarregue a página antes de copiar os logs
- **COPIE** todos os logs antes de tentar novamente
- Se der erro, **NÃO** tente múltiplas vezes (pode criar múltiplos usuários)

## 🚀 APÓS O TESTE

Quando me enviar os logs, poderei:

1. Confirmar se a correção funcionou
2. Identificar exatamente qual campo está causando problema (se ainda houver)
3. Comparar dados enviados vs dados esperados
4. Propor correção específica se necessário

---

**Data:** 13/10/2025  
**Correções aplicadas:** Limpeza de formatação de CPF, telefone e CEP  
**Arquivos modificados:**
- `src/components/payments/PaymentFormEnhanced.tsx`
- `src/hooks/useFiliacaoPayment.ts`
- `src/hooks/useAsaasCustomers.ts`
