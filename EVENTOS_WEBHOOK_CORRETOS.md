# ✅ Eventos de Webhook - Lista Corrigida

**Baseado nos eventos disponíveis no Dashboard Asaas**

---

## 🎯 EVENTOS OBRIGATÓRIOS

### 📦 Pagamentos (Cobrança)

#### ✅ **PAYMENT_RECEIVED**
- **Quando:** Pagamento recebido (PIX confirmado OU Cartão aprovado)
- **Ação:** Ativa assinatura
- **PIX:** ✅ SIM - Este evento é disparado quando PIX é pago
- **Cartão:** ✅ SIM - Disparado quando cartão é aprovado

#### ✅ **PAYMENT_CONFIRMED** 
- **Quando:** Pagamento confirmado após compensação
- **Ação:** Confirma ativação
- **PIX:** ✅ SIM - Confirmação final do PIX
- **Cartão:** ✅ SIM - Confirmação após análise

#### ✅ **PAYMENT_OVERDUE**
- **Quando:** Pagamento vencido
- **Ação:** Marca assinatura como vencida
- **Importante:** Para renovações de assinatura

#### ✅ **PAYMENT_DELETED**
- **Quando:** Cobrança deletada
- **Ação:** Cancela assinatura

#### ✅ **PAYMENT_REFUNDED**
- **Quando:** Pagamento estornado
- **Ação:** Cancela assinatura e devolve valor

---

### 📋 Assinaturas

#### ✅ **SUBSCRIPTION_UPDATED**
- **Quando:** Dados da assinatura alterados
- **Ação:** Sincroniza status, valor, ciclo

---

### 💰 Splits (Transferências)

**IMPORTANTE:** Os eventos de split no Asaas são:

#### ✅ **TRANSFER_CREATED**
- Transferência (split) criada
- Informativo

#### ✅ **TRANSFER_PENDING**
- Transferência pendente
- Informativo

#### ✅ **TRANSFER_DONE** ⭐
- **Transferência concluída**
- **Ação:** Confirma que comissão foi paga
- **Importante para afiliados**

#### ✅ **TRANSFER_FAILED**
- Transferência falhou
- Importante para resolver problemas

#### ✅ **TRANSFER_CANCELLED**
- Transferência cancelada
- Importante para resolver problemas

**NOTA:** Os eventos `PAYMENT_SPLIT_DONE` e `PAYMENT_SPLIT_CANCELLED` que mencionei **NÃO EXISTEM** no Asaas. Use os eventos `TRANSFER_*` acima.

---

## 🔵 PIX - EVENTOS ESPECÍFICOS

### ✅ **PAYMENT_RECEIVED** é suficiente para PIX!

**Como funciona:**
1. Usuário gera cobrança PIX
2. Usuário paga o PIX
3. Asaas detecta pagamento
4. **PAYMENT_RECEIVED** é disparado ✅
5. Sistema ativa assinatura

**Eventos adicionais úteis para PIX:**

#### ✅ **PAYMENT_CREATED**
- Cobrança PIX criada
- QR Code gerado
- Informativo

#### ✅ **PAYMENT_UPDATED**
- Dados da cobrança atualizados
- Informativo

**NÃO há eventos específicos de PIX!** O Asaas trata PIX como um método de pagamento normal, usando os mesmos eventos de `PAYMENT_*`.

---

## 📊 EVENTOS RECOMENDADOS ADICIONAIS

### Pagamentos

#### ✅ **PAYMENT_CREATED**
- Cobrança criada
- Útil para tracking

#### ✅ **PAYMENT_UPDATED**
- Cobrança atualizada
- Informativo

#### ✅ **PAYMENT_AWAITING_RISK_ANALYSIS**
- Em análise de risco
- Informativo

#### ✅ **PAYMENT_APPROVED_BY_RISK_ANALYSIS**
- Aprovado pela análise
- Informativo

#### ✅ **PAYMENT_REPROVED_BY_RISK_ANALYSIS**
- Reprovado pela análise
- Importante para notificar usuário

#### ✅ **PAYMENT_RESTORED**
- Pagamento restaurado
- Pode reativar assinatura

#### ✅ **PAYMENT_REFUND_IN_PROGRESS**
- Estorno em andamento
- Informativo

#### ✅ **PAYMENT_RECEIVED_IN_CASH_UNDONE**
- Confirmação desfeita
- Pode desativar assinatura

#### ✅ **PAYMENT_CHARGEBACK_REQUESTED**
- Chargeback solicitado
- Segurança

#### ✅ **PAYMENT_CHARGEBACK_DISPUTE**
- Disputa de chargeback
- Segurança

#### ✅ **PAYMENT_DUNNING_RECEIVED**
- Cobrança de inadimplência recebida
- Pode reativar

#### ✅ **PAYMENT_DUNNING_REQUESTED**
- Cobrança de inadimplência solicitada
- Informativo

### Assinaturas

#### ✅ **SUBSCRIPTION_CREATED**
- Assinatura criada
- Informativo

#### ✅ **SUBSCRIPTION_DELETED**
- Assinatura deletada
- Cancela acesso

#### ✅ **SUBSCRIPTION_PAYMENT_OVERDUE**
- Pagamento de assinatura vencido
- Redundante com PAYMENT_OVERDUE

#### ✅ **SUBSCRIPTION_EXPIRED**
- Assinatura expirada
- Cancela acesso

---

## ✅ LISTA MÍNIMA CORRIGIDA (9 eventos)

**Marque estes no Dashboard Asaas:**

### Pagamentos (5)
1. ✅ PAYMENT_RECEIVED
2. ✅ PAYMENT_CONFIRMED
3. ✅ PAYMENT_OVERDUE
4. ✅ PAYMENT_DELETED
5. ✅ PAYMENT_REFUNDED

### Assinaturas (1)
6. ✅ SUBSCRIPTION_UPDATED

### Transferências/Splits (3)
7. ✅ TRANSFER_DONE
8. ✅ TRANSFER_FAILED
9. ✅ TRANSFER_CANCELLED

---

## 🔵 SOBRE PIX

**Pergunta:** "Para o PIX não é necessário marcar nenhum evento?"

**Resposta:** 

✅ **NÃO há eventos específicos de PIX no Asaas!**

O PIX usa os **mesmos eventos de pagamento** que cartão e boleto:

- **PAYMENT_CREATED** - Quando QR Code PIX é gerado
- **PAYMENT_RECEIVED** ⭐ - Quando PIX é pago (PRINCIPAL)
- **PAYMENT_CONFIRMED** ⭐ - Quando PIX é confirmado (PRINCIPAL)
- **PAYMENT_OVERDUE** - Se PIX não for pago até vencimento

**Conclusão:** Os eventos de `PAYMENT_*` já cobrem PIX, Cartão e Boleto!

---

## 🔄 CORREÇÃO NA EDGE FUNCTION

A Edge Function menciona eventos que não existem:
- ❌ `PAYMENT_SPLIT_DONE` - NÃO EXISTE
- ❌ `PAYMENT_SPLIT_CANCELLED` - NÃO EXISTE

**Deveria processar:**
- ✅ `TRANSFER_DONE` - EXISTE
- ✅ `TRANSFER_CANCELLED` - EXISTE

**Vou corrigir a Edge Function agora!**

---

## 📋 VERIFICAÇÃO DA SUA CONFIGURAÇÃO

Pela imagem, vejo que você marcou vários eventos. Confirme se estão marcados:

**Essenciais:**
- [ ] PAYMENT_RECEIVED
- [ ] PAYMENT_CONFIRMED
- [ ] PAYMENT_OVERDUE
- [ ] PAYMENT_DELETED
- [ ] PAYMENT_REFUNDED
- [ ] SUBSCRIPTION_UPDATED
- [ ] TRANSFER_DONE
- [ ] TRANSFER_FAILED
- [ ] TRANSFER_CANCELLED

**Estes 9 eventos são suficientes para o sistema funcionar completamente!**

---

**PIX está coberto pelos eventos de PAYMENT_* - não precisa de eventos específicos!**
