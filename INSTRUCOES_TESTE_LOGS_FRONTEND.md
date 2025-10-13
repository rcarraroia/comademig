# 📋 INSTRUÇÕES PARA TESTE DE LOGS DO FRONTEND

## ✅ Logs Adicionados

Foram adicionados logs em dois pontos críticos do fluxo de filiação:

### 1️⃣ Em `useFiliacaoPayment.ts` (ANTES de chamar createCustomer)
```typescript
console.log('📤 Dados enviados ao createCustomer:', {
  user_id: currentUserId,
  customer_data: customerData
});
```

### 2️⃣ Em `useAsaasCustomers.ts` (DENTRO do createCustomer)
```typescript
console.log('📤 Body enviado à Edge Function:', {
  user_id: effectiveUserId,
  customer_data: customerData
});
```

---

## 🧪 COMO EXECUTAR O TESTE

### Passo 1: Abrir o Console do Navegador
1. Abra o site da filiação no navegador
2. Pressione **F12** para abrir o DevTools
3. Vá para a aba **Console**
4. Limpe o console (botão 🚫 ou Ctrl+L)

### Passo 2: Iniciar Processo de Filiação
1. Preencha o formulário de filiação com dados de teste
2. Escolha um método de pagamento (PIX, Boleto ou Cartão)
3. Clique em **Finalizar Filiação**

### Passo 3: Capturar os Logs
Você verá dois logs no console:

**Log 1 - useFiliacaoPayment:**
```
📤 Dados enviados ao createCustomer: {
  user_id: "...",
  customer_data: { ... }
}
```

**Log 2 - useAsaasCustomers:**
```
📤 Body enviado à Edge Function: {
  user_id: "...",
  customer_data: { ... }
}
```

### Passo 4: Copiar e Reportar
1. Clique com botão direito em cada log
2. Selecione "Copy object" ou "Store as global variable"
3. Copie o conteúdo completo de ambos os logs
4. Cole aqui para análise

---

## 🎯 O QUE ESTAMOS VERIFICANDO

Vamos comparar:
- ✅ Se o `user_id` está sendo passado corretamente
- ✅ Se os dados do `customer_data` estão completos
- ✅ Se há diferenças entre o que é enviado e o que chega na Edge Function
- ✅ Se algum campo está sendo perdido no caminho

---

## 📊 FORMATO ESPERADO DOS LOGS

### Log 1 (useFiliacaoPayment):
```json
{
  "user_id": "e1406ff4-a0f4-4189-93b4-8a832ecbdd40",
  "customer_data": {
    "name": "Nome Completo",
    "email": "email@teste.com",
    "phone": "11987654321",
    "cpfCnpj": "12345678900",
    "postalCode": "12345678",
    "address": "Rua Teste",
    "addressNumber": "123",
    "complement": "Apto 1",
    "province": "Bairro",
    "city": "Cidade",
    "state": "SP"
  }
}
```

### Log 2 (useAsaasCustomers):
```json
{
  "user_id": "e1406ff4-a0f4-4189-93b4-8a832ecbdd40",
  "customer_data": {
    "name": "Nome Completo",
    "email": "email@teste.com",
    "phone": "11987654321",
    "cpfCnpj": "12345678900",
    "postalCode": "12345678",
    "address": "Rua Teste",
    "addressNumber": "123",
    "complement": "Apto 1",
    "province": "Bairro",
    "city": "Cidade",
    "state": "SP"
  }
}
```

---

## ⚠️ POSSÍVEIS PROBLEMAS A IDENTIFICAR

1. **user_id undefined ou null**
   - Indica problema de autenticação
   
2. **Campos faltando em customer_data**
   - Indica problema no mapeamento de dados
   
3. **Diferença entre Log 1 e Log 2**
   - Indica transformação indevida dos dados
   
4. **Formato incorreto de campos**
   - Ex: CPF com pontos/traços, telefone sem DDD, etc.

---

## 🚀 APÓS CAPTURAR OS LOGS

Cole aqui os dois logs completos no formato:

```
=== LOG 1 - useFiliacaoPayment ===
[cole aqui]

=== LOG 2 - useAsaasCustomers ===
[cole aqui]

=== ERRO (se houver) ===
[cole aqui]
```

Isso permitirá identificar exatamente onde está o problema no fluxo de dados.
