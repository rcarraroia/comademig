# 📡 Guia Completo - Webhooks Asaas

## 🎯 Baseado na Documentação Oficial

Este guia foi criado com base na documentação oficial do Asaas e no código implementado.

---

## 📋 Eventos Disponíveis (Documentação Oficial)

### 🔥 Eventos Essenciais para COMADEMIG:

#### Pagamentos Principais:
- **`PAYMENT_CREATED`** - Cobrança criada no sistema
- **`PAYMENT_CONFIRMED`** - Pagamento confirmado (cartão/PIX)
- **`PAYMENT_RECEIVED`** - Pagamento recebido (boleto/transferência)
- **`PAYMENT_OVERDUE`** - Pagamento vencido
- **`PAYMENT_REFUNDED`** - Pagamento estornado

#### Eventos de Risco:
- **`PAYMENT_CHARGEBACK_REQUESTED`** - Chargeback solicitado
- **`PAYMENT_CHARGEBACK_DISPUTE`** - Disputa de chargeback
- **`PAYMENT_AWAITING_CHARGEBACK_REVERSAL`** - Aguardando reversão

### 📊 Eventos Opcionais (Monitoramento):

#### Gestão de Cobranças:
- **`PAYMENT_UPDATED`** - Cobrança atualizada
- **`PAYMENT_DELETED`** - Cobrança excluída
- **`PAYMENT_RESTORED`** - Cobrança restaurada

#### Negativação:
- **`PAYMENT_DUNNING_RECEIVED`** - Cobrança negativada
- **`PAYMENT_DUNNING_REQUESTED`** - Negativação solicitada

#### Interação do Cliente:
- **`PAYMENT_BANK_SLIP_VIEWED`** - Boleto visualizado
- **`PAYMENT_CHECKOUT_VIEWED`** - Checkout visualizado

---

## ✅ CONFIRMADO: Assinaturas e Webhooks

### 📚 Baseado na Interface Real do Asaas:
O Asaas possui eventos específicos de assinatura que devem ser configurados para monitorar anuidades.

### 🔄 Como Funciona:
1. **Assinatura criada** → Webhook `SUBSCRIPTION_CREATED`
2. **Cobrança gerada** → Webhook `PAYMENT_CREATED` (com `subscription` ID)
3. **Assinatura suspensa** → Webhook `SUBSCRIPTION_SUSPENDED`
4. **Assinatura reativada** → Webhook `SUBSCRIPTION_REACTIVATED`

### 💡 Implementação no COMADEMIG:
- ✅ Monitoramos via `SUBSCRIPTION_*` eventos para ciclo de vida
- ✅ Monitoramos via `PAYMENT_*` eventos para cobranças
- ✅ Identificamos assinaturas pelo campo `subscription` no payload
- ✅ Processamos anuidades como assinaturas recorrentes

---

## 🔧 Configuração Recomendada

### Para Sistema COMADEMIG:
```
🔥 EVENTOS DE PAGAMENTOS (Obrigatórios):
☑️ PAYMENT_CREATED
☑️ PAYMENT_CONFIRMED  
☑️ PAYMENT_RECEIVED
☑️ PAYMENT_OVERDUE
☑️ PAYMENT_REFUNDED

📋 EVENTOS DE ASSINATURAS (Para anuidades):
☑️ SUBSCRIPTION_CREATED
☑️ SUBSCRIPTION_UPDATED
☑️ SUBSCRIPTION_DELETED
☑️ SUBSCRIPTION_SUSPENDED
☑️ SUBSCRIPTION_REACTIVATED

🛡️ EVENTOS DE SEGURANÇA:
☑️ PAYMENT_CHARGEBACK_REQUESTED
☑️ PAYMENT_CHARGEBACK_DISPUTE

📊 EVENTOS DE MONITORAMENTO:
☑️ PAYMENT_UPDATED
☑️ PAYMENT_DELETED
```

### ❌ NÃO Configure:
- `PAYMENT_BANK_SLIP_VIEWED` (muito volume, pouco valor)
- `PAYMENT_CHECKOUT_VIEWED` (apenas analytics)
- Eventos de `DUNNING` (se não usar negativação)

---

## 🛡️ Segurança dos Webhooks

### 🔐 Token de Autenticação:
- **Header**: `asaas-access-token`
- **Valor**: `webhook_prod_36a882b2b9ff39b4106009bd1c554a00901d507ee3758dce`
- **Validação**: Obrigatória em produção

### 📦 Estrutura do Payload:
```json
{
  "event": "PAYMENT_CONFIRMED",
  "payment": {
    "id": "pay_123456789",
    "customer": "cus_123456789",
    "billingType": "PIX",
    "value": 150.00,
    "status": "CONFIRMED",
    "subscription": "sub_123456789", // Se for assinatura
    // ... outros campos
  },
  "dateCreated": "2024-01-15T10:30:00.000Z"
}
```

---

## 🔄 Processamento Implementado

### No COMADEMIG, processamos:

#### `PAYMENT_CONFIRMED` / `PAYMENT_RECEIVED`:
1. ✅ Atualizar status local da cobrança
2. ✅ Processar splits (comissões de afiliados)
3. ✅ Executar ações pós-pagamento:
   - **Filiação**: Ativar assinatura do usuário
   - **Certidão**: Processar solicitação
   - **Evento**: Confirmar inscrição
   - **Taxa Anual**: Atualizar adimplência

#### `PAYMENT_OVERDUE`:
1. ✅ Atualizar status para vencido
2. 📧 Notificar usuário (implementar se necessário)

#### `PAYMENT_REFUNDED`:
1. ✅ Atualizar status para estornado
2. 🔄 Reverter ações se necessário

#### `PAYMENT_CHARGEBACK_REQUESTED`:
1. ✅ Atualizar status
2. 🚨 Alertar administração

---

## 📊 Monitoramento e Logs

### 🗄️ Tabela `asaas_webhooks`:
- Registra TODOS os webhooks recebidos
- Status de processamento
- Payload completo para auditoria
- Mensagens de erro se houver falha

### 📈 Métricas Importantes:
- Taxa de sucesso de processamento
- Tempo de resposta aos webhooks
- Eventos duplicados (idempotência)
- Falhas de comunicação

---

## 🚨 Boas Práticas (Documentação Oficial)

### ✅ Fazer:
1. **Responder com status 200-299** para sucesso
2. **Implementar idempotência** (mesmo evento pode chegar 2x)
3. **Processar de forma assíncrona** para evitar timeout
4. **Validar token de autenticação** sempre
5. **Configurar apenas eventos necessários**

### ❌ Não Fazer:
1. **Não usar polling** para verificar status
2. **Não configurar todos os eventos** (sobrecarrega)
3. **Não processar de forma síncrona** (pode dar timeout)
4. **Não ignorar validação de token**

### ⏰ Limites Importantes:
- **14 dias**: Tempo que o Asaas guarda eventos
- **15 tentativas**: Falhas consecutivas pausam a fila
- **10 URLs**: Máximo de webhooks diferentes
- **Timeout**: Resposta deve ser rápida (< 30s)

---

## 🔧 Configuração Final

### URL do Webhook:
```
https://amkelczfwazutrciqtlk.supabase.co/functions/v1/asaas-process-webhook
```

### Token de Autenticação:
```
webhook_prod_36a882b2b9ff39b4106009bd1c554a00901d507ee3758dce
```

### Eventos Configurados:
```
PAYMENT_CREATED
PAYMENT_CONFIRMED
PAYMENT_RECEIVED
PAYMENT_OVERDUE
PAYMENT_REFUNDED
PAYMENT_CHARGEBACK_REQUESTED
PAYMENT_UPDATED
```

---

## 🧪 Teste de Webhook

### Após configurar:
1. Criar uma cobrança de teste (valor baixo)
2. Fazer pagamento via PIX ou cartão
3. Verificar logs no Supabase Edge Functions
4. Confirmar atualização na tabela `asaas_cobrancas`
5. Validar processamento de splits se aplicável

---

**✅ Com esta configuração, o sistema COMADEMIG estará 100% sincronizado com o Asaas!**