# ⚡ Configurar Webhook Asaas - AÇÃO IMEDIATA

**URL:** `https://amkelczfwazutrciqtlk.supabase.co/functions/v1/asaas-webhook`

---

## 🎯 EVENTOS MÍNIMOS OBRIGATÓRIOS

Marque estes 8 eventos no Dashboard Asaas:

### Pagamentos (5 eventos)
- ✅ **PAYMENT_RECEIVED** ⭐ (Ativa assinatura)
- ✅ **PAYMENT_CONFIRMED** ⭐ (Confirma pagamento)
- ✅ **PAYMENT_OVERDUE** (Marca como vencido)
- ✅ **PAYMENT_DELETED** (Cancela assinatura)
- ✅ **PAYMENT_REFUNDED** (Estorna pagamento)

### Assinaturas (1 evento)
- ✅ **SUBSCRIPTION_UPDATED** (Sincroniza dados)

### Splits/Afiliados (2 eventos)
- ✅ **PAYMENT_SPLIT_DONE** (Confirma comissão)
- ✅ **PAYMENT_SPLIT_CANCELLED** (Cancela comissão)

---

## 📋 PASSO A PASSO RÁPIDO

### 1. Acessar Dashboard Asaas
```
https://www.asaas.com/
Login → Configurações → Webhooks
```

### 2. Adicionar Webhook
```
Nome: COMADEMIG Webhook
URL: https://amkelczfwazutrciqtlk.supabase.co/functions/v1/asaas-webhook
Status: Ativo
```

### 3. Configurar Token
```
Gerar token (UUID ou string aleatória)
Adicionar no campo "Token de Autenticação"
```

### 4. Configurar Token no Supabase
```powershell
supabase secrets set ASAAS_WEBHOOK_TOKEN=[seu_token]
```

### 5. Selecionar os 8 Eventos Acima

### 6. Salvar e Testar

---

## 🧪 TESTAR AGORA

```powershell
# Health check
curl https://amkelczfwazutrciqtlk.supabase.co/functions/v1/asaas-webhook
```

**Resposta esperada:**
```json
{"status":"ok","message":"Webhook endpoint is active"}
```

---

## ✅ EVENTOS ATUALMENTE CONFIGURADOS

**Você precisa verificar no Dashboard Asaas:**
1. Acessar Configurações → Webhooks
2. Ver quais eventos estão marcados
3. Comparar com a lista de 8 obrigatórios acima
4. Adicionar os que estiverem faltando

---

## 📊 EVENTOS RECOMENDADOS (OPCIONAL)

Se quiser controle total, adicione também:

- PAYMENT_CREATED
- PAYMENT_REPROVED_BY_RISK_ANALYSIS
- PAYMENT_RESTORED
- PAYMENT_CHARGEBACK_REQUESTED
- SUBSCRIPTION_DELETED
- SUBSCRIPTION_EXPIRED
- TRANSFER_DONE
- TRANSFER_FAILED

---

## 🚨 IMPORTANTE

**SEM estes webhooks configurados:**
- ❌ Assinaturas não serão ativadas automaticamente
- ❌ Pagamentos não serão confirmados
- ❌ Comissões de afiliados não serão processadas
- ❌ Status de vencimento não será atualizado

**COM webhooks configurados:**
- ✅ Sistema totalmente automático
- ✅ Assinaturas ativadas em tempo real
- ✅ Splits processados automaticamente
- ✅ Status sempre sincronizado

---

**AÇÃO:** Configure agora no Dashboard Asaas!
