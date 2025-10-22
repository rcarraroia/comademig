# 🔍 DIAGNÓSTICO BASEADO NAS SCREENSHOTS

**Data:** 2025-10-21  
**Fonte:** Screenshots fornecidas pelo usuário

---

## 📊 DADOS IDENTIFICADOS NAS SCREENSHOTS

### 1️⃣ PAINEL DO USUÁRIO (Teste Afiliado)

**Screenshot 1 - Dashboard do Usuário:**
```
Nome: Teste Afiliado
Status: Pendente de aprovação
Cargo: não informado
Igreja: Não informado
Localização: Não informado
Membro desde: N/A
```

**Campos obrigatórios pendentes:**
- ✅ CPF
- ✅ RG
- ✅ Endereço
- ✅ Cidade
- ✅ Estado
- + mais 3 campos

**Completude do Perfil:** 8%

**Mensagem:** "Análise em Andamento - Sua documentação está sendo analisada pela nossa equipe. Este processo pode levar até 5 dias úteis. Você receberá um email quando for aprovado."

---

### 2️⃣ PAINEL ADMINISTRATIVO

**Screenshot 2 - Gerenciamento de Usuários:**

| Nome | CPF/Telefone | Tipo | Cargo | Igreja | Status | Cadastro |
|------|--------------|------|-------|--------|--------|----------|
| Teste Afiliado | 24971565792 / 11987954322 | diácono | - | - | **Ativo** | 21/10/2025 |
| BEATRIZ FATIMA ALMEIDA CARRARO | 10800095823 / 31988336177 | Pastor | Pastor | Igreja Teste | **Ativo** | 06/09/2025 |
| Renato Carraro | 71598109672 / 31998334177 | Super Admin | Administrador | Life in Christ | **Ativo** | 26/07/2025 |

**✅ Usuário "Teste Afiliado" está ATIVO no painel admin!**

---

### 3️⃣ PAINEL DO ASAAS

**Screenshot 3 - Detalhes da Cobrança:**

**Cliente:** Teste Afiliado  
**Valor:** R$ 29,00  
**Status:** ✅ **Recebida** (Confirmada Teste - 21/10/2025)  
**Forma de pagamento:** Cartão de crédito  
**Parcelamento:** 1x de R$ 29,00  

**Assinatura:**
- Valor: R$ 29,00
- Ciclo: Mensal
- Próximo vencimento: 20/11/2025
- Status: ✅ **Ativa**

**Splits configurados:**
- ✅ Transferência para COMADEMIG - CEL: R$ 11,60 (40%)
- ✅ Transferência para RENUM: R$ 11,60 (40%)
- ✅ Transferência para Beatriz Fatima Almeida Carraro: R$ 5,80 (20%)

**✅ SPLITS FORAM CRIADOS CORRETAMENTE!**

---

### 4️⃣ PAINEL DE AFILIADOS (Beatriz)

**Screenshot 4 - Programa de Afiliados:**

**Afiliado:** BEATRIZ FATIMA ALMEIDA CARRARO  
**Status:** Afiliado Ativo  
**Código:** 2AE24DCA

**Minhas Indicações:** 1

| Usuário | Data | Status |
|---------|------|--------|
| Usuário | 21/10/2025 | **Em Aberto** |

**⚠️ Status da indicação: "Em Aberto" (deveria ser "Confirmada")**

---

### 5️⃣ PAINEL ADMIN - GESTÃO DE AFILIADOS

**Screenshot 5 - Gestão de Afiliados:**

**Total:** 1 afiliado  
**Pendentes:** 0  
**Convertidos:** 0  
**Taxa de Conversão:** 0.00%

| Afiliado | Indicado | Código | Status | Data de Indicação | Data de Conversão | Valor |
|----------|----------|--------|--------|-------------------|-------------------|-------|
| BEATRIZ FATIMA ALMEIDA CARRARO | Teste Afiliado | 2AE24DCA | **Pendente** | 21/10/2025 | - | - |

**⚠️ Status: "Pendente" (deveria ser "Confirmado")**

---

### 6️⃣ WEBHOOKS DO ASAAS

**Screenshot 6 - Logs de Webhooks:**

**Todos os webhooks retornando:** ✅ **Status 200**

**Últimos webhooks (21/10/2025):**
- 10:44 - Comademig Teste - webhook - ✅ 200
- 10:44 - Comademig Teste - webhook - ✅ 200
- 09:41 - Comademig Teste - webhook - ✅ 200
- 09:41 - Comademig Teste - webhook - ✅ 200
- 09:16 - Comademig Teste - webhook - ✅ 200
- 09:16 - Comademig Teste - webhook - ✅ 200
- 09:05 - Comademig Teste - webhook - ✅ 200
- 09:05 - Comademig Teste - webhook - ✅ 200
- 08:38 - Comademig Teste - webhook - ✅ 200
- 08:38 - Comademig Teste - webhook - ✅ 200

**✅ Webhooks estão funcionando normalmente!**

---

## 🔍 ANÁLISE DOS PROBLEMAS

### PROBLEMA #1: Status Inconsistente

**Evidências:**
- ✅ Admin vê: **"Ativo"**
- ❌ Usuário vê: **"Pendente de aprovação"**
- ✅ Asaas mostra: **Pagamento confirmado**
- ✅ Assinatura: **Ativa**

**Causa Identificada:**
O componente do dashboard do usuário está mostrando mensagem genérica de "Análise em Andamento" independente do status real no banco.

**Arquivo provável:** `src/pages/dashboard/Dashboard.tsx` ou similar

---

### PROBLEMA #2: Indicação Não Confirmada

**Evidências:**
- ✅ Splits criados corretamente (40% + 40% + 20%)
- ✅ Afiliado recebeu R$ 5,80 (20% de R$ 29,00)
- ❌ Status da indicação: **"Pendente"** (deveria ser "Confirmada")
- ❌ Painel do afiliado mostra: **"Em Aberto"**

**Causa Identificada:**
O webhook processou os splits MAS não atualizou o status de `affiliate_referrals` de `pending` para `confirmed`.

**Arquivo:** `supabase/functions/asaas-webhook/index.ts` (linha ~540)

---

## 💡 SOLUÇÕES IDENTIFICADAS

### SOLUÇÃO #1: Corrigir Dashboard do Usuário

**Problema:** Componente mostra "Pendente" mesmo quando status é "ativo"

**Correção necessária:**
1. Verificar query que busca status do perfil
2. Garantir que está lendo campo `status` corretamente
3. Remover mensagem hardcoded de "Análise em Andamento"
4. Mostrar status real do banco

---

### SOLUÇÃO #2: Atualizar Status da Indicação

**Problema:** Webhook cria splits mas não atualiza `affiliate_referrals.status`

**Código atual (linha ~540):**
```typescript
// 6. Atualizar status da indicação para 'confirmed'
if (referralId) {
  try {
    await supabaseClient
      .from('affiliate_referrals')
      .update({ status: 'confirmed' })
      .eq('id', referralId)

    console.log(`✅ Indicação confirmada: ${referralId}`)
  } catch (error) {
    console.error('⚠️ Erro ao confirmar indicação (não crítico):', error)
  }
}
```

**✅ Código está correto!**

**MAS:** Precisa verificar se `referralId` está sendo encontrado corretamente.

**Possível problema:**
- Busca por `status = 'pending'` pode não encontrar se já foi confirmado
- Ou busca está falhando por outro motivo

---

## 🎯 CONCLUSÕES

### ✅ O QUE ESTÁ FUNCIONANDO:

1. **Sistema de afiliados:** ✅ Indicação registrada
2. **Pagamento:** ✅ Processado e confirmado
3. **Assinatura:** ✅ Criada e ativa
4. **Splits:** ✅ Criados corretamente (40% + 40% + 20%)
5. **Comissão:** ✅ Afiliado recebeu R$ 5,80
6. **Webhooks:** ✅ Todos retornando 200

### ❌ O QUE PRECISA CORRIGIR:

1. **Dashboard do usuário:** Mostra "Pendente" quando deveria mostrar "Ativo"
2. **Status da indicação:** Continua "Pendente" quando deveria ser "Confirmada"

---

## 📋 PRÓXIMOS PASSOS

### 1. Corrigir Dashboard do Usuário
- Identificar componente que mostra status
- Corrigir query ou lógica de exibição
- Testar com usuário "Teste Afiliado"

### 2. Investigar Por Que Indicação Não Foi Confirmada
- Verificar logs do webhook
- Verificar se `referralId` foi encontrado
- Verificar se update foi executado
- Se necessário, atualizar manualmente via SQL

### 3. Testar Novamente
- Novo cadastro com código de indicação
- Verificar se ambos os problemas foram resolvidos

---

## 🔧 CORREÇÕES MANUAIS TEMPORÁRIAS

### Atualizar status da indicação manualmente:

```sql
-- Atualizar indicação para confirmada
UPDATE affiliate_referrals
SET status = 'confirmed',
    confirmed_at = NOW()
WHERE referred_user_id = (
  SELECT id FROM profiles WHERE nome_completo = 'Teste Afiliado'
)
AND status = 'pending';
```

**Isso vai fazer:**
- ✅ Status mudar de "Pendente" para "Confirmada"
- ✅ Painel do afiliado mostrar "Confirmada"
- ✅ Métricas atualizarem

---

**AGUARDANDO AUTORIZAÇÃO PARA APLICAR CORREÇÕES.**
