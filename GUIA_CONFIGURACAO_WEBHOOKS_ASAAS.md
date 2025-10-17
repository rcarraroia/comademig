# 🔔 Guia de Configuração: Webhooks Asaas

**Data:** 16/10/2025  
**Sistema:** COMADEMIG - Integração Asaas

---

## 📋 INFORMAÇÕES DO WEBHOOK

### URL do Webhook
```
https://amkelczfwazutrciqtlk.supabase.co/functions/v1/asaas-webhook
```

### Método
```
POST
```

### Autenticação
```
Header: asaas-access-token
Valor: [Configurar secret ASAAS_WEBHOOK_TOKEN]
```

---

## 🎯 EVENTOS QUE O SISTEMA PROCESSA

### ✅ Eventos de Pagamento (OBRIGATÓRIOS)

#### 1. **PAYMENT_RECEIVED** ⭐ CRÍTICO
- **Quando:** Pagamento recebido (PIX/Cartão aprovado)
- **Ação:** Ativa assinatura (status → 'active')
- **Impacto:** Libera acesso do usuário ao sistema

#### 2. **PAYMENT_CONFIRMED** ⭐ CRÍTICO
- **Quando:** Pagamento confirmado (após compensação)
- **Ação:** Confirma ativação da assinatura
- **Impacto:** Garante que pagamento foi processado

#### 3. **PAYMENT_OVERDUE** ⚠️ IMPORTANTE
- **Quando:** Pagamento vencido
- **Ação:** Marca assinatura como vencida (status → 'overdue')
- **Impacto:** Usuário pode perder acesso

#### 4. **PAYMENT_DELETED** 
- **Quando:** Pagamento deletado
- **Ação:** Cancela assinatura (status → 'cancelled')
- **Impacto:** Remove acesso do usuário

#### 5. **PAYMENT_REFUNDED**
- **Quando:** Pagamento estornado
- **Ação:** Cancela assinatura (status → 'cancelled')
- **Impacto:** Remove acesso do usuário

### ✅ Eventos de Assinatura

#### 6. **SUBSCRIPTION_UPDATED**
- **Quando:** Assinatura atualizada no Asaas
- **Ação:** Sincroniza dados (status, valor, ciclo)
- **Impacto:** Mantém dados consistentes

### ✅ Eventos de Split (Afiliados)

#### 7. **PAYMENT_SPLIT_DONE** 💰
- **Quando:** Split processado com sucesso
- **Ação:** Atualiza status do split (status → 'done')
- **Impacto:** Confirma comissão do afiliado

#### 8. **PAYMENT_SPLIT_CANCELLED**
- **Quando:** Split cancelado
- **Ação:** Atualiza status do split (status → 'cancelled')
- **Impacto:** Cancela comissão do afiliado

---

## ⚙️ EVENTOS ADICIONAIS RECOMENDADOS

### Eventos de Pagamento (Informativos)

#### **PAYMENT_CREATED**
- Pagamento criado (cobrança gerada)
- Útil para tracking

#### **PAYMENT_AWAITING_RISK_ANALYSIS**
- Pagamento em análise de risco
- Informativo

#### **PAYMENT_APPROVED_BY_RISK_ANALYSIS**
- Pagamento aprovado pela análise
- Informativo

#### **PAYMENT_REPROVED_BY_RISK_ANALYSIS**
- Pagamento reprovado
- Pode ser usado para notificar usuário

#### **PAYMENT_UPDATED**
- Dados do pagamento atualizados
- Informativo

#### **PAYMENT_RESTORED**
- Pagamento restaurado após cancelamento
- Pode reativar assinatura

#### **PAYMENT_REFUND_IN_PROGRESS**
- Estorno em andamento
- Informativo

#### **PAYMENT_RECEIVED_IN_CASH_UNDONE**
- Confirmação de pagamento desfeita
- Pode desativar assinatura

#### **PAYMENT_CHARGEBACK_REQUESTED**
- Chargeback solicitado
- Importante para segurança

#### **PAYMENT_CHARGEBACK_DISPUTE**
- Disputa de chargeback
- Importante para segurança

#### **PAYMENT_AWAITING_CHARGEBACK_REVERSAL**
- Aguardando reversão de chargeback
- Informativo

#### **PAYMENT_DUNNING_RECEIVED**
- Cobrança de inadimplência recebida
- Pode reativar assinatura

#### **PAYMENT_DUNNING_REQUESTED**
- Cobrança de inadimplência solicitada
- Informativo

#### **PAYMENT_BANK_SLIP_VIEWED**
- Boleto visualizado
- Analytics

#### **PAYMENT_CHECKOUT_VIEWED**
- Checkout visualizado
- Analytics

### Eventos de Assinatura

#### **SUBSCRIPTION_CREATED**
- Assinatura criada
- Informativo

#### **SUBSCRIPTION_DELETED**
- Assinatura deletada
- Pode cancelar acesso

#### **SUBSCRIPTION_PAYMENT_OVERDUE**
- Pagamento de assinatura vencido
- Redundante com PAYMENT_OVERDUE

#### **SUBSCRIPTION_EXPIRED**
- Assinatura expirada
- Pode cancelar acesso

### Eventos de Transferência (Splits)

#### **TRANSFER_CREATED**
- Transferência criada
- Informativo

#### **TRANSFER_PENDING**
- Transferência pendente
- Informativo

#### **TRANSFER_DONE**
- Transferência concluída
- Confirma pagamento ao afiliado

#### **TRANSFER_FAILED**
- Transferência falhou
- Importante para resolver problemas

#### **TRANSFER_CANCELLED**
- Transferência cancelada
- Importante para resolver problemas

---

## 📝 CONFIGURAÇÃO NO DASHBOARD ASAAS

### Passo 1: Acessar Configurações

1. Login no Dashboard Asaas
2. Menu lateral → **Configurações**
3. Aba **Webhooks**

### Passo 2: Adicionar Webhook

1. Clicar em **"Adicionar Webhook"** ou **"Novo Webhook"**
2. Preencher dados:

```
Nome: COMADEMIG - Webhook Principal
URL: https://amkelczfwazutrciqtlk.supabase.co/functions/v1/asaas-webhook
Versão da API: v3 (mais recente)
Status: Ativo
```

### Passo 3: Configurar Token de Autenticação

1. Gerar um token seguro (ex: UUID)
2. Configurar no Asaas:
   - Campo: **Token de Autenticação**
   - Valor: `[seu_token_aqui]`

3. Configurar no Supabase:
```powershell
supabase secrets set ASAAS_WEBHOOK_TOKEN=[seu_token_aqui]
```

### Passo 4: Selecionar Eventos

#### ⭐ MÍNIMO OBRIGATÓRIO (Sistema Funcional):
```
✅ PAYMENT_RECEIVED
✅ PAYMENT_CONFIRMED
✅ PAYMENT_OVERDUE
✅ PAYMENT_DELETED
✅ PAYMENT_REFUNDED
✅ SUBSCRIPTION_UPDATED
✅ PAYMENT_SPLIT_DONE
✅ PAYMENT_SPLIT_CANCELLED
```

#### 🎯 RECOMENDADO (Sistema Completo):
```
Adicionar aos obrigatórios:

✅ PAYMENT_CREATED
✅ PAYMENT_REPROVED_BY_RISK_ANALYSIS
✅ PAYMENT_RESTORED
✅ PAYMENT_CHARGEBACK_REQUESTED
✅ SUBSCRIPTION_DELETED
✅ SUBSCRIPTION_EXPIRED
✅ TRANSFER_DONE
✅ TRANSFER_FAILED
```

#### 📊 COMPLETO (Máximo Controle):
```
Marcar TODOS os eventos disponíveis
```

### Passo 5: Salvar e Testar

1. Clicar em **"Salvar"**
2. Usar botão **"Testar Webhook"** (se disponível)
3. Verificar logs no Supabase

---

## 🧪 TESTAR WEBHOOK

### Método 1: Via Dashboard Asaas

1. Após configurar, usar botão "Testar Webhook"
2. Verificar resposta (deve ser 200 OK)

### Método 2: Via cURL

```powershell
curl -X POST https://amkelczfwazutrciqtlk.supabase.co/functions/v1/asaas-webhook `
  -H "Content-Type: application/json" `
  -H "asaas-access-token: [SEU_TOKEN]" `
  -d '{
    "event": "PAYMENT_RECEIVED",
    "payment": {
      "id": "pay_test_123",
      "subscription": "sub_test_456",
      "status": "RECEIVED",
      "value": 100.00
    }
  }'
```

### Método 3: Health Check

```powershell
# Verificar se endpoint está ativo
curl https://amkelczfwazutrciqtlk.supabase.co/functions/v1/asaas-webhook
```

**Resposta esperada:**
```json
{
  "status": "ok",
  "message": "Webhook endpoint is active",
  "timestamp": "2025-10-16T..."
}
```

---

## 📊 VERIFICAR LOGS

### Ver logs da Edge Function

```powershell
# Logs em tempo real
supabase functions logs asaas-webhook --tail

# Últimas 100 linhas
supabase functions logs asaas-webhook
```

### Verificar eventos recebidos

```sql
-- Ver últimos webhooks recebidos
SELECT 
  event_type,
  processed,
  created_at,
  payload->>'payment'->>'id' as payment_id
FROM webhook_events
ORDER BY created_at DESC
LIMIT 10;

-- Ver webhooks não processados
SELECT * FROM webhook_events
WHERE processed = false
ORDER BY created_at DESC;

-- Ver webhooks com erro
SELECT * FROM webhook_events
WHERE retry_count > 0
ORDER BY created_at DESC;
```

---

## 🚨 TROUBLESHOOTING

### Webhook não está sendo recebido

**Verificar:**
1. ✅ URL está correta no Asaas
2. ✅ Edge Function está deployada: `supabase functions list`
3. ✅ Token configurado: `supabase secrets list`
4. ✅ Eventos selecionados no Asaas
5. ✅ Webhook está ativo no Asaas

**Testar:**
```powershell
# Deploy da function
supabase functions deploy asaas-webhook

# Ver logs
supabase functions logs asaas-webhook --tail
```

### Webhook retorna erro 401 (Unauthorized)

**Causa:** Token incorreto

**Solução:**
```powershell
# Verificar token configurado
supabase secrets list

# Reconfigurar token
supabase secrets set ASAAS_WEBHOOK_TOKEN=[token_correto]

# Redeploy function
supabase functions deploy asaas-webhook
```

### Webhook recebido mas não processado

**Verificar:**
```sql
-- Ver eventos com erro
SELECT 
  event_type,
  retry_count,
  last_error,
  payload
FROM webhook_events
WHERE processed = false
ORDER BY created_at DESC;
```

**Reprocessar manualmente:**
```sql
-- Marcar para reprocessamento
UPDATE webhook_events
SET processed = false, retry_count = 0
WHERE asaas_event_id = '[event_id]';
```

### Assinatura não está sendo ativada

**Verificar:**
1. ✅ Evento `PAYMENT_RECEIVED` ou `PAYMENT_CONFIRMED` configurado
2. ✅ `asaas_subscription_id` ou `initial_payment_id` correto em `user_subscriptions`
3. ✅ Webhook foi processado sem erro

**Debug:**
```sql
-- Ver assinatura
SELECT * FROM user_subscriptions
WHERE asaas_subscription_id = '[subscription_id]';

-- Ver webhooks relacionados
SELECT * FROM webhook_events
WHERE payload->>'payment'->>'subscription' = '[subscription_id]'
ORDER BY created_at DESC;
```

---

## ✅ CHECKLIST DE CONFIGURAÇÃO

- [ ] URL do webhook configurada no Asaas
- [ ] Token de autenticação gerado
- [ ] Token configurado no Asaas
- [ ] Token configurado no Supabase (`ASAAS_WEBHOOK_TOKEN`)
- [ ] Eventos mínimos selecionados (8 obrigatórios)
- [ ] Webhook ativado no Asaas
- [ ] Edge Function deployada
- [ ] Teste realizado (health check)
- [ ] Logs verificados
- [ ] Teste com pagamento real realizado

---

## 📞 SUPORTE

**Documentação Asaas:**
- https://docs.asaas.com/reference/webhooks

**Logs do Sistema:**
```powershell
supabase functions logs asaas-webhook --tail
```

**Verificar Eventos:**
```sql
SELECT * FROM webhook_events ORDER BY created_at DESC LIMIT 20;
```

---

**Configuração mantida pela equipe de desenvolvimento COMADEMIG**

**Última revisão:** 16/10/2025
