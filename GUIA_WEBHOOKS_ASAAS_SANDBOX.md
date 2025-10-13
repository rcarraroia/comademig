# 🔔 GUIA COMPLETO - Webhooks Asaas (Sandbox e Produção)

**Data:** 11/01/2025  
**Ambiente:** Sandbox e Produção

---

## 📋 ÍNDICE

1. [Eventos Disponíveis](#eventos-disponíveis)
2. [Configuração no Painel Asaas](#configuração-no-painel-asaas)
3. [Estrutura do Payload](#estrutura-do-payload)
4. [Edge Function Implementada](#edge-function-implementada)
5. [Testes no Sandbox](#testes-no-sandbox)
6. [Fluxos Automatizados](#fluxos-automatizados)

---

## 🎯 EVENTOS DISPONÍVEIS

### 📊 Eventos de Pagamento (Payment Events)

#### 1. **PAYMENT_CREATED**
- **Quando:** Cobrança criada no Asaas
- **Status:** `PENDING`
- **Uso:** Registrar cobrança no banco, enviar notificação inicial

#### 2. **PAYMENT_AWAITING_RISK_ANALYSIS**
- **Quando:** Pagamento em análise de risco (cartão de crédito)
- **Status:** `AWAITING_RISK_ANALYSIS`
- **Uso:** Informar usuário que pagamento está em análise

#### 3. **PAYMENT_APPROVED_BY_RISK_ANALYSIS**
- **Quando:** Pagamento aprovado pela análise de risco
- **Status:** `CONFIRMED`
- **Uso:** Liberar acesso temporário, aguardar confirmação final

#### 4. **PAYMENT_REPROVED_BY_RISK_ANALYSIS**
- **Quando:** Pagamento reprovado pela análise de risco
- **Status:** `RECEIVED_IN_CASH` ou `REFUNDED`
- **Uso:** Notificar usuário, solicitar novo método de pagamento

#### 5. **PAYMENT_AUTHORIZED** ⭐
- **Quando:** Pagamento autorizado (cartão de crédito)
- **Status:** `CONFIRMED`
- **Uso:** Considerar como pago, liberar acesso

#### 6. **PAYMENT_RECEIVED** ⭐⭐⭐
- **Quando:** Pagamento recebido (boleto, PIX, transferência)
- **Status:** `RECEIVED`
- **Uso:** **PRINCIPAL** - Ativar assinatura, liberar acesso, processar splits

#### 7. **PAYMENT_CONFIRMED** ⭐⭐⭐
- **Quando:** Pagamento confirmado (compensação bancária)
- **Status:** `CONFIRMED`
- **Uso:** **PRINCIPAL** - Confirmar definitivamente, processar comissões

#### 8. **PAYMENT_OVERDUE** ⚠️
- **Quando:** Pagamento venceu e não foi pago
- **Status:** `OVERDUE`
- **Uso:** Suspender acesso, enviar cobrança, notificar usuário

#### 9. **PAYMENT_DELETED**
- **Quando:** Cobrança foi deletada
- **Status:** `DELETED`
- **Uso:** Cancelar solicitação, remover do sistema

#### 10. **PAYMENT_RESTORED**
- **Quando:** Cobrança deletada foi restaurada
- **Status:** `PENDING`
- **Uso:** Reativar cobrança no sistema

#### 11. **PAYMENT_REFUNDED** 💰
- **Quando:** Pagamento foi estornado
- **Status:** `REFUNDED`
- **Uso:** Cancelar assinatura, remover acesso, processar estorno

#### 12. **PAYMENT_RECEIVED_IN_CASH**
- **Quando:** Pagamento marcado como recebido em dinheiro
- **Status:** `RECEIVED_IN_CASH`
- **Uso:** Confirmar pagamento manual, liberar acesso

#### 13. **PAYMENT_CHARGEBACK_REQUESTED**
- **Quando:** Cliente solicitou chargeback
- **Status:** `CHARGEBACK_REQUESTED`
- **Uso:** Suspender acesso, iniciar processo de disputa

#### 14. **PAYMENT_CHARGEBACK_DISPUTE**
- **Quando:** Chargeback em disputa
- **Status:** `CHARGEBACK_DISPUTE`
- **Uso:** Acompanhar disputa, manter acesso suspenso

#### 15. **PAYMENT_AWAITING_CHARGEBACK_REVERSAL**
- **Quando:** Aguardando reversão de chargeback
- **Status:** `AWAITING_CHARGEBACK_REVERSAL`
- **Uso:** Monitorar reversão

#### 16. **PAYMENT_DUNNING_RECEIVED**
- **Quando:** Pagamento recebido após cobrança
- **Status:** `RECEIVED`
- **Uso:** Reativar acesso, confirmar pagamento

#### 17. **PAYMENT_DUNNING_REQUESTED**
- **Quando:** Cobrança automática solicitada
- **Status:** `PENDING`
- **Uso:** Registrar tentativa de cobrança

#### 18. **PAYMENT_BANK_SLIP_VIEWED**
- **Quando:** Boleto foi visualizado pelo cliente
- **Status:** `PENDING`
- **Uso:** Analytics, remarketing

#### 19. **PAYMENT_CHECKOUT_VIEWED**
- **Quando:** Página de checkout foi visualizada
- **Status:** `PENDING`
- **Uso:** Analytics, remarketing

---

### 📅 Eventos de Assinatura (Subscription Events)

#### 20. **SUBSCRIPTION_CREATED**
- **Quando:** Assinatura criada
- **Uso:** Registrar assinatura, enviar boas-vindas

#### 21. **SUBSCRIPTION_UPDATED**
- **Quando:** Assinatura atualizada (valor, ciclo, etc.)
- **Uso:** Atualizar dados no banco

#### 22. **SUBSCRIPTION_DELETED**
- **Quando:** Assinatura cancelada
- **Uso:** Cancelar acesso, processar cancelamento

#### 23. **SUBSCRIPTION_PAYMENT_OVERDUE**
- **Quando:** Pagamento da assinatura venceu
- **Uso:** Suspender acesso, enviar cobrança

---

### 💳 Eventos de Transferência (Transfer Events)

#### 24. **TRANSFER_CREATED**
- **Quando:** Transferência criada
- **Uso:** Registrar transferência de split

#### 25. **TRANSFER_PENDING**
- **Quando:** Transferência pendente
- **Uso:** Aguardar processamento

#### 26. **TRANSFER_BANK_PROCESSING**
- **Quando:** Transferência em processamento bancário
- **Uso:** Monitorar transferência

#### 27. **TRANSFER_DONE**
- **Quando:** Transferência concluída
- **Uso:** Confirmar pagamento de comissão

#### 28. **TRANSFER_FAILED**
- **Quando:** Transferência falhou
- **Uso:** Notificar erro, tentar novamente

#### 29. **TRANSFER_CANCELLED**
- **Quando:** Transferência cancelada
- **Uso:** Reverter comissão

---

### 📧 Eventos de Notificação (Bill Events)

#### 30. **BILL_CREATED**
- **Quando:** Fatura criada
- **Uso:** Enviar fatura por email

#### 31. **BILL_UPDATED**
- **Quando:** Fatura atualizada
- **Uso:** Atualizar dados da fatura

#### 32. **BILL_DELETED**
- **Quando:** Fatura deletada
- **Uso:** Remover fatura do sistema

---

### 🔐 Eventos de Conta Digital (Account Events)

#### 33. **MOBILE_PHONE_RECHARGE_PROVIDER_NOT_AVAILABLE**
- **Quando:** Recarga de celular indisponível
- **Uso:** Notificar usuário

---

## 🔧 CONFIGURAÇÃO NO PAINEL ASAAS

### Ambiente Sandbox

**URL do Painel:** https://sandbox.asaas.com/

#### Passo 1: Acessar Configurações de Webhook

1. Faça login no painel Sandbox
2. Vá em **Configurações** > **Integrações** > **Webhooks**
3. Clique em **Adicionar Webhook**

#### Passo 2: Configurar URL do Webhook

**URL da Edge Function:**
```
https://amkelczfwazutrciqtlk.supabase.co/functions/v1/asaas-webhook
```

**Método:** POST

**Autenticação:** Nenhuma (validação por IP ou token pode ser adicionada)

#### Passo 3: Selecionar Eventos

**Eventos Essenciais (Mínimo):**
- ✅ PAYMENT_RECEIVED
- ✅ PAYMENT_CONFIRMED
- ✅ PAYMENT_OVERDUE
- ✅ PAYMENT_REFUNDED
- ✅ PAYMENT_DELETED

**Eventos Recomendados (Completo):**
- ✅ PAYMENT_CREATED
- ✅ PAYMENT_RECEIVED
- ✅ PAYMENT_CONFIRMED
- ✅ PAYMENT_OVERDUE
- ✅ PAYMENT_REFUNDED
- ✅ PAYMENT_DELETED
- ✅ PAYMENT_RESTORED
- ✅ PAYMENT_AWAITING_RISK_ANALYSIS
- ✅ PAYMENT_APPROVED_BY_RISK_ANALYSIS
- ✅ PAYMENT_REPROVED_BY_RISK_ANALYSIS
- ✅ SUBSCRIPTION_CREATED
- ✅ SUBSCRIPTION_UPDATED
- ✅ SUBSCRIPTION_DELETED
- ✅ TRANSFER_DONE
- ✅ TRANSFER_FAILED

#### Passo 4: Configurar Autenticação (Opcional)

**Token de Webhook:**
```
webhook_sandbox_[seu_token_aqui]
```

**Adicionar no Header:**
```
X-Webhook-Token: webhook_sandbox_[seu_token_aqui]
```

#### Passo 5: Testar Webhook

1. Clique em **Testar Webhook**
2. Selecione evento: `PAYMENT_RECEIVED`
3. Clique em **Enviar Teste**
4. Verifique resposta: `200 OK`

---

### Ambiente Produção

**URL do Painel:** https://www.asaas.com/

**Mesmos passos do Sandbox, mas com:**
- URL de produção
- Token de produção: `webhook_prod_36a882b2b9ff39b4106009bd1c554a00901d507ee3758dce`

---

## 📦 ESTRUTURA DO PAYLOAD

### Exemplo de Payload - PAYMENT_RECEIVED

```json
{
  "event": "PAYMENT_RECEIVED",
  "payment": {
    "id": "pay_1234567890",
    "customer": "cus_0987654321",
    "subscription": "sub_1122334455",
    "installment": null,
    "value": 150.00,
    "netValue": 145.50,
    "originalValue": 150.00,
    "interestValue": 0.00,
    "description": "Assinatura COMADEMIG - Pastor",
    "billingType": "PIX",
    "status": "RECEIVED",
    "pixTransaction": "pix_abc123def456",
    "confirmedDate": "2025-01-11",
    "paymentDate": "2025-01-11",
    "clientPaymentDate": "2025-01-11",
    "installmentNumber": null,
    "invoiceUrl": "https://www.asaas.com/i/1234567890",
    "bankSlipUrl": null,
    "transactionReceiptUrl": "https://www.asaas.com/r/1234567890",
    "invoiceNumber": "00001234",
    "externalReference": "subscription_user123_1736611200000",
    "originalDueDate": "2025-01-18",
    "paymentLink": null,
    "dueDate": "2025-01-18",
    "dateCreated": "2025-01-11"
  }
}
```

### Campos Importantes

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `event` | string | Tipo do evento |
| `payment.id` | string | ID único do pagamento no Asaas |
| `payment.customer` | string | ID do cliente no Asaas |
| `payment.subscription` | string | ID da assinatura (se aplicável) |
| `payment.value` | number | Valor total do pagamento |
| `payment.netValue` | number | Valor líquido (após taxas) |
| `payment.status` | string | Status atual do pagamento |
| `payment.billingType` | string | Método de pagamento (PIX, BOLETO, CREDIT_CARD) |
| `payment.externalReference` | string | Referência externa (user_id, etc.) |
| `payment.confirmedDate` | string | Data de confirmação |
| `payment.paymentDate` | string | Data do pagamento |

---

## 🔌 EDGE FUNCTION IMPLEMENTADA

### Localização
`supabase/functions/asaas-webhook/index.ts`

### Funcionalidades Implementadas

#### 1. Validação de Payload
```typescript
if (!payload.event || !payload.payment) {
  return new Response(
    JSON.stringify({ error: 'Invalid webhook payload' }),
    { status: 400 }
  )
}
```

#### 2. Registro/Atualização de Cobrança
```typescript
// Busca cobrança existente
const { data: cobranca } = await supabaseClient
  .from('asaas_cobrancas')
  .select('*')
  .eq('asaas_payment_id', payment.id)
  .single()

// Cria ou atualiza
if (!cobranca) {
  await supabaseClient.from('asaas_cobrancas').insert({...})
} else {
  await supabaseClient.from('asaas_cobrancas').update({...})
}
```

#### 3. Registro de Transação Financeira
```typescript
await supabaseClient
  .from('financial_transactions')
  .insert({
    user_id: cobranca?.user_id,
    asaas_payment_id: payment.id,
    transaction_type: 'payment',
    amount: payment.value,
    status: payment.status,
    // ...
  })
```

#### 4. Processamento por Evento

**PAYMENT_RECEIVED / PAYMENT_CONFIRMED:**
- ✅ Ativa assinatura do usuário
- ✅ Processa splits automaticamente
- ✅ Atualiza status de indicação de afiliado
- ✅ Envia notificação de comissão
- ✅ Cria solicitação de serviço (se aplicável)
- ✅ Envia notificações para usuário e admins

**PAYMENT_OVERDUE:**
- ⚠️ Marca assinatura como vencida
- ⚠️ Suspende benefícios (pode ser implementado)
- ⚠️ Envia notificação de vencimento

**PAYMENT_DELETED / PAYMENT_REFUNDED:**
- ❌ Cancela assinatura
- ❌ Remove acesso
- ❌ Processa estorno (se aplicável)

---

## 🧪 TESTES NO SANDBOX

### Método 1: Painel Asaas (Recomendado)

1. Acesse: https://sandbox.asaas.com/
2. Vá em **Configurações** > **Webhooks**
3. Clique em **Testar** ao lado do webhook configurado
4. Selecione evento: `PAYMENT_RECEIVED`
5. Clique em **Enviar Teste**
6. Verifique resposta: `200 OK`

### Método 2: cURL Manual

```bash
curl -X POST https://amkelczfwazutrciqtlk.supabase.co/functions/v1/asaas-webhook \
  -H "Content-Type: application/json" \
  -d '{
    "event": "PAYMENT_RECEIVED",
    "payment": {
      "id": "pay_test_123",
      "customer": "cus_test_456",
      "subscription": "sub_test_789",
      "value": 150.00,
      "netValue": 145.50,
      "description": "Teste Sandbox",
      "billingType": "PIX",
      "status": "RECEIVED",
      "confirmedDate": "2025-01-11",
      "paymentDate": "2025-01-11",
      "dueDate": "2025-01-18",
      "dateCreated": "2025-01-11"
    }
  }'
```

### Método 3: Simulador de Webhook (Código)

**Criar arquivo:** `test_webhook_sandbox.ts`

```typescript
const testWebhook = async () => {
  const payload = {
    event: 'PAYMENT_RECEIVED',
    payment: {
      id: `pay_test_${Date.now()}`,
      customer: 'cus_test_123',
      subscription: 'sub_test_456',
      value: 150.00,
      netValue: 145.50,
      description: 'Teste Sandbox - Filiação Pastor',
      billingType: 'PIX',
      status: 'RECEIVED',
      confirmedDate: new Date().toISOString().split('T')[0],
      paymentDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      dateCreated: new Date().toISOString().split('T')[0]
    }
  };

  const response = await fetch(
    'https://amkelczfwazutrciqtlk.supabase.co/functions/v1/asaas-webhook',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }
  );

  const result = await response.json();
  console.log('Resposta:', result);
};

testWebhook();
```

### Verificar Logs

```bash
# Ver logs da Edge Function
supabase functions logs asaas-webhook --tail

# Procurar por:
# - "Webhook recebido: ..."
# - "Solicitação criada com sucesso: ..."
# - "Splits processed successfully: ..."
```

---

## 🔄 FLUXOS AUTOMATIZADOS

### Fluxo 1: Filiação Completa

```
1. Usuário preenche formulário de filiação
2. Sistema cria cobrança no Asaas
3. Usuário paga via PIX
4. Asaas envia webhook: PAYMENT_RECEIVED
5. Edge Function processa:
   ✅ Atualiza status da cobrança
   ✅ Ativa assinatura do usuário
   ✅ Processa splits (COMADEMIG + Afiliado)
   ✅ Atualiza status de indicação
   ✅ Envia notificação de comissão para afiliado
   ✅ Envia notificação de boas-vindas para usuário
6. Usuário recebe acesso ao dashboard
7. Afiliado recebe notificação de comissão
```

### Fluxo 2: Solicitação de Certidão

```
1. Usuário solicita certidão
2. Sistema cria cobrança com service_data
3. Usuário paga via Boleto
4. Asaas envia webhook: PAYMENT_CONFIRMED
5. Edge Function processa:
   ✅ Cria solicitação de serviço
   ✅ Gera protocolo único
   ✅ Processa splits
   ✅ Envia notificação para usuário (com protocolo)
   ✅ Envia notificação para admins
   ✅ Registra em audit_logs
6. Admin processa solicitação
7. Certidão é emitida
```

### Fluxo 3: Pagamento Vencido

```
1. Cobrança vence sem pagamento
2. Asaas envia webhook: PAYMENT_OVERDUE
3. Edge Function processa:
   ⚠️ Marca assinatura como vencida
   ⚠️ Suspende acesso (pode ser implementado)
   ⚠️ Envia notificação de vencimento
4. Usuário recebe email de cobrança
5. Se pagar: PAYMENT_RECEIVED → Reativa acesso
6. Se não pagar: Após X dias → Cancela assinatura
```

### Fluxo 4: Estorno/Cancelamento

```
1. Cliente solicita estorno
2. Asaas processa estorno
3. Asaas envia webhook: PAYMENT_REFUNDED
4. Edge Function processa:
   ❌ Cancela assinatura
   ❌ Remove acesso
   ❌ Reverte splits (se aplicável)
   ❌ Atualiza status de indicação
   ❌ Envia notificação para usuário
5. Usuário perde acesso ao sistema
```

---

## 📋 CHECKLIST DE CONFIGURAÇÃO

### Sandbox

- [ ] Acessar painel Sandbox: https://sandbox.asaas.com/
- [ ] Configurar webhook com URL da Edge Function
- [ ] Selecionar eventos essenciais (mínimo 5)
- [ ] Testar webhook com evento PAYMENT_RECEIVED
- [ ] Verificar resposta 200 OK
- [ ] Verificar logs da Edge Function
- [ ] Confirmar que cobrança foi registrada no banco
- [ ] Testar fluxo completo de filiação

### Produção

- [ ] Acessar painel Produção: https://www.asaas.com/
- [ ] Configurar webhook com URL da Edge Function
- [ ] Adicionar token de autenticação
- [ ] Selecionar todos os eventos recomendados
- [ ] Testar webhook com evento PAYMENT_RECEIVED
- [ ] Verificar resposta 200 OK
- [ ] Monitorar logs em produção
- [ ] Configurar alertas de erro

---

## 🚨 TROUBLESHOOTING

### Problema: Webhook retorna 500

**Causa:** Erro na Edge Function

**Solução:**
```bash
supabase functions logs asaas-webhook --tail
```
Verificar erro específico nos logs.

### Problema: Webhook não é recebido

**Causa:** URL incorreta ou firewall

**Solução:**
1. Verificar URL: `https://amkelczfwazutrciqtlk.supabase.co/functions/v1/asaas-webhook`
2. Testar com cURL
3. Verificar se Edge Function está ativa

### Problema: Splits não são processados

**Causa:** Edge Function `asaas-process-splits` não configurada

**Solução:**
1. Verificar se Edge Function existe
2. Verificar configuração de splits no banco
3. Ver logs: `supabase functions logs asaas-process-splits`

### Problema: Notificações não são enviadas

**Causa:** Tabela `notifications` sem permissões RLS

**Solução:**
1. Verificar políticas RLS da tabela `notifications`
2. Verificar se usuário existe no banco
3. Ver logs da Edge Function

---

## 📚 DOCUMENTAÇÃO ADICIONAL

- [Documentação Oficial Asaas - Webhooks](https://docs.asaas.com/reference/webhooks)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- `supabase/functions/asaas-webhook/index.ts` - Código da Edge Function

---

## ✅ CONCLUSÃO

**Eventos Essenciais para Sandbox:**
1. PAYMENT_RECEIVED ⭐⭐⭐
2. PAYMENT_CONFIRMED ⭐⭐⭐
3. PAYMENT_OVERDUE ⚠️
4. PAYMENT_REFUNDED 💰
5. PAYMENT_DELETED

**Próximos Passos:**
1. Configurar webhook no painel Sandbox
2. Testar com evento PAYMENT_RECEIVED
3. Verificar logs e banco de dados
4. Testar fluxo completo de filiação
5. Configurar em produção quando validado

---

**Gerado por:** Kiro AI  
**Data:** 11/01/2025
