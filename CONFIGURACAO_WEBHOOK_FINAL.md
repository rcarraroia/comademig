# 🎯 Configuração Final de Webhook - Asaas + COMADEMIG

## ✅ BASEADO NA INTERFACE REAL DO ASAAS

### 📡 Configuração do Webhook:
```
URL: https://amkelczfwazutrciqtlk.supabase.co/functions/v1/asaas-process-webhook
Token: webhook_prod_36a882b2b9ff39b4106009bd1c554a00901d507ee3758dce
```

---

## 🔥 EVENTOS OBRIGATÓRIOS PARA COMADEMIG

### 💳 Eventos de Pagamentos:
- ☑️ **PAYMENT_CREATED** - Cobrança criada
- ☑️ **PAYMENT_CONFIRMED** - Pagamento confirmado (cartão/PIX)
- ☑️ **PAYMENT_RECEIVED** - Pagamento recebido (boleto/transferência)
- ☑️ **PAYMENT_OVERDUE** - Pagamento vencido
- ☑️ **PAYMENT_REFUNDED** - Pagamento estornado

### 📋 Eventos de Assinaturas (Para Anuidades):
- ☑️ **SUBSCRIPTION_CREATED** - Assinatura criada
- ☑️ **SUBSCRIPTION_UPDATED** - Assinatura atualizada
- ☑️ **SUBSCRIPTION_DELETED** - Assinatura cancelada
- ☑️ **SUBSCRIPTION_SUSPENDED** - Assinatura suspensa
- ☑️ **SUBSCRIPTION_REACTIVATED** - Assinatura reativada

### 🛡️ Eventos de Segurança:
- ☑️ **PAYMENT_CHARGEBACK_REQUESTED** - Chargeback solicitado

---

## 📊 EVENTOS OPCIONAIS (Recomendados)

### 📈 Monitoramento:
- ☑️ **PAYMENT_UPDATED** - Cobrança atualizada
- ☑️ **PAYMENT_DELETED** - Cobrança excluída
- ☑️ **PAYMENT_RESTORED** - Cobrança restaurada

### 🔍 Análise (Se necessário):
- ☐ **PAYMENT_CHARGEBACK_DISPUTE** - Disputa de chargeback
- ☐ **PAYMENT_AWAITING_CHARGEBACK_REVERSAL** - Aguardando reversão
- ☐ **PAYMENT_DUNNING_RECEIVED** - Cobrança negativada
- ☐ **PAYMENT_DUNNING_REQUESTED** - Negativação solicitada

---

## ❌ EVENTOS NÃO RECOMENDADOS (Alto Volume)

### 📊 Analytics (Muito volume, pouco valor):
- ❌ **PAYMENT_BANK_SLIP_VIEWED** - Boleto visualizado
- ❌ **PAYMENT_CHECKOUT_VIEWED** - Checkout visualizado

---

## 🔄 PROCESSAMENTO IMPLEMENTADO

### Para Eventos de Pagamento:
1. ✅ **PAYMENT_CONFIRMED/RECEIVED** → Ativar serviços + processar splits
2. ✅ **PAYMENT_OVERDUE** → Notificar vencimento
3. ✅ **PAYMENT_REFUNDED** → Reverter ações
4. ✅ **PAYMENT_CHARGEBACK_REQUESTED** → Alertar administração

### Para Eventos de Assinatura:
1. ✅ **SUBSCRIPTION_CREATED** → Registrar nova assinatura
2. ✅ **SUBSCRIPTION_SUSPENDED** → Suspender acesso do usuário
3. ✅ **SUBSCRIPTION_REACTIVATED** → Reativar acesso
4. ✅ **SUBSCRIPTION_DELETED** → Cancelar assinatura

---

## 🎯 CASOS DE USO NO COMADEMIG

### 💼 Filiação de Profissionais:
- **Pagamento confirmado** → Ativar filiação
- **Assinatura criada** → Registrar anuidade
- **Assinatura suspensa** → Suspender carteira digital

### 📜 Certidões e Documentos:
- **Pagamento confirmado** → Processar solicitação
- **Pagamento vencido** → Notificar pendência

### 🎓 Eventos e Cursos:
- **Pagamento confirmado** → Confirmar inscrição
- **Pagamento estornado** → Cancelar inscrição

### 💰 Sistema de Afiliados:
- **Pagamento confirmado** → Processar comissões
- **Split processado** → Creditar afiliados

---

## 🔧 CONFIGURAÇÃO PASSO A PASSO

### 1. Acesse o Painel do Asaas:
- Vá em **Configurações** → **Integrações** → **Webhooks**

### 2. Clique em "Novo Webhook":
- **URL**: `https://amkelczfwazutrciqtlk.supabase.co/functions/v1/asaas-process-webhook`
- **Token**: `webhook_prod_36a882b2b9ff39b4106009bd1c554a00901d507ee3758dce`

### 3. Selecione os Eventos:
Marque EXATAMENTE os eventos listados acima na seção "EVENTOS OBRIGATÓRIOS"

### 4. Salve a Configuração:
- Clique em **Salvar**
- Teste com uma cobrança pequena

---

## 🧪 TESTE DE VALIDAÇÃO

### Após configurar:
1. **Criar cobrança de teste** (R$ 1,00)
2. **Fazer pagamento via PIX**
3. **Verificar logs** no Supabase Edge Functions
4. **Confirmar webhook recebido** na tabela `asaas_webhooks`
5. **Validar processamento** na tabela `asaas_cobrancas`

### Logs para Verificar:
```sql
-- Verificar webhooks recebidos
SELECT * FROM asaas_webhooks 
ORDER BY created_at DESC 
LIMIT 10;

-- Verificar cobranças atualizadas
SELECT * FROM asaas_cobrancas 
WHERE status = 'CONFIRMED' 
ORDER BY updated_at DESC;
```

---

## 🚨 IMPORTANTE

### ✅ Fazer:
- Configurar TODOS os eventos de pagamento essenciais
- Configurar TODOS os eventos de assinatura para anuidades
- Testar com pagamento real de valor baixo
- Monitorar logs após configuração

### ❌ Não Fazer:
- Marcar eventos desnecessários (sobrecarrega)
- Esquecer eventos de assinatura (crítico para anuidades)
- Configurar sem token de segurança
- Ignorar testes de validação

---

**🎯 Com esta configuração, o sistema COMADEMIG estará 100% sincronizado com o Asaas para pagamentos E assinaturas!**