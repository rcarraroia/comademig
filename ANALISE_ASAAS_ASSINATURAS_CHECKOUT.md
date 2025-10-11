# 🔍 ANÁLISE: ASAAS ASSINATURAS vs IMPLEMENTAÇÃO ATUAL

**Data:** 11/01/2025  
**Objetivo:** Comparar fluxo correto do Asaas com implementação atual

---

## 📚 DOCUMENTAÇÃO ASAAS - PONTOS CRÍTICOS

### 1. ASSINATURAS (Recorrência)

**Fonte:** `docs/asaas_documentacao_completa/asaas_docs/referencia_reference/introdução.md`

#### Conceito:
> "Assinaturas devem ser utilizadas quando a cobrança é feita periodicamente de forma recorrente"

#### Diferença Crítica:
- **Assinatura:** Cria UMA cobrança por vez, automaticamente a cada período
- **Parcelamento:** Cria TODAS as parcelas de uma vez

#### Comportamento com Cartão:
- **Assinatura:** Nova transação a cada mês no cartão
- **Parcelamento:** Valor total cobrado de uma vez, parcelado

#### Geração de Cobranças:
> "Cobranças recorrentes pertencentes a uma assinatura são geradas **40 dias antes** do vencimento"

**Exemplo:**
- Assinatura criada hoje com vencimento em 5 dias
- Sistema já cria 2 cobranças:
  - 1ª cobrança: vence em 5 dias
  - 2ª cobrança: vence em 35 dias (5 + 30)

#### Webhooks:
> "Asaas não possui webhooks próprios para assinaturas, apenas das cobranças"

- Webhook: `PAYMENT_CREATED` contém `subscription` id
- Gerenciar via webhooks de cobrança, não de assinatura

---

### 2. ASAAS CHECKOUT (Checkout Transparente)

**Fonte:** `docs/asaas_documentacao_completa/asaas_docs/guias_docs/asaas_checkout.md`

#### Conceito:
> "Formulário pronto para usar no fechamento de vendas digitais"

#### Vantagens:
- ✅ Fácil implementação
- ✅ Múltiplas opções de pagamento (PIX, Cartão)
- ✅ Suporta: à vista, parcelado OU assinatura
- ✅ Tempo de expiração configurável
- ✅ Dados do cliente pré-preenchidos
- ✅ Imagem e detalhes do produto
- ✅ Redirecionamento após conclusão
- ✅ Suporta split de pagamentos

---

## 🔍 ANÁLISE DA IMPLEMENTAÇÃO ATUAL

### Módulo: Solicitação de Serviços (✅ CORRETO)

**Arquivo:** `src/pages/dashboard/CheckoutServico.tsx`

#### Fluxo Implementado:
```
1. Usuário seleciona serviço
   ↓
2. Preenche formulário de exigências
   ↓
3. Redireciona para CheckoutServico
   ↓
4. Preenche dados do cliente
   ↓
5. Escolhe forma de pagamento (PIX ou Cartão)
   ↓
6. Hook useCheckoutTransparente processa:
   - Cria cliente no Asaas
   - Cria cobrança única (não assinatura)
   - Processa pagamento
   ↓
7. Se PIX: Mostra QR Code
   Se Cartão: Redireciona para sucesso
```

#### Características:
- ✅ Checkout transparente (formulário próprio)
- ✅ Suporta PIX e Cartão
- ✅ Desconto PIX (5%)
- ✅ Parcelamento em cartão
- ✅ Cria cobrança ÚNICA (não recorrente)
- ✅ Usuário JÁ ESTÁ LOGADO

**Tipo de cobrança:** ÚNICA (não é assinatura)

---

### Módulo: Filiação (❌ INCORRETO)

**Arquivo:** `src/pages/Filiacao.tsx` + `src/hooks/useFiliacaoPayment.ts`

#### Fluxo Atual (ERRADO):
```
1. Usuário acessa /filiacao (SEM login)
   ↓
2. Seleciona tipo de membro
   ↓
3. Clica em "Prosseguir"
   ↓
4. ❌ Sistema verifica if (!user) → BLOQUEIA
   ↓
5. ❌ Tenta redirecionar para /login (404)
   ↓
6. PROCESSO INTERROMPIDO
```

#### Problemas Identificados:

##### Problema 1: Exige autenticação
```tsx
// src/pages/Filiacao.tsx (linha 58)
if (!user) {
  navigate('/login');  // ❌ ERRADO
  return;
}
```

##### Problema 2: Hook também exige autenticação
```tsx
// src/hooks/useFiliacaoPayment.ts (linha 73)
if (!user?.id) {
  throw new Error('Usuário não autenticado');  // ❌ ERRADO
}
```

##### Problema 3: Cria cobrança ÚNICA ao invés de ASSINATURA
```tsx
// src/hooks/useFiliacaoPayment.ts (linha 107-120)
switch (data.payment_method) {
  case 'pix':
    paymentResult = await createPixPayment.mutateAsync({
      customer: customer.id,
      billingType: 'PIX',
      value: finalPrice,
      // ❌ FALTANDO: cycle, nextDueDate (campos de assinatura)
    });
    break;
}
```

**Tipo de cobrança:** ÚNICA (deveria ser ASSINATURA)

---

## 🎯 FLUXO CORRETO PARA FILIAÇÃO COM ASSINATURA

### Baseado na Documentação Asaas:

```
1. Usuário acessa /filiacao (SEM login) ✅
   ↓
2. Seleciona tipo de membro ✅
   ↓
3. Seleciona periodicidade (Mensal/Semestral/Anual) ❌ FALTANDO
   ↓
4. Clica em "Prosseguir" ✅
   ↓
5. Preenche formulário COMPLETO:
   - Dados pessoais ✅
   - Endereço ✅
   - Dados ministeriais ✅
   - SENHA ❌ FALTANDO
   - Forma de pagamento ✅
   - Dados do cartão (se cartão) ✅
   ↓
6. Sistema CRIA CONTA no Supabase Auth ❌ FALTANDO
   ↓
7. Sistema cria CLIENTE no Asaas ✅
   ↓
8. Sistema cria ASSINATURA no Asaas ❌ FALTANDO
   (não cobrança única!)
   ↓
9. Asaas gera PRIMEIRA COBRANÇA automaticamente ✅
   ↓
10. Sistema processa pagamento da primeira cobrança ✅
    ↓
11. Sistema cria perfil no banco ✅
    ↓
12. Sistema cria registro de assinatura (user_subscriptions) ✅
    ↓
13. Webhook PAYMENT_CREATED ativa assinatura ❌ FALTANDO
    ↓
14. Redireciona para /auth com mensagem ❌ FALTANDO
    ↓
15. Usuário faz login pela primeira vez ❌ FALTANDO
```

---

## 📋 DIFERENÇAS CRÍTICAS

### Solicitação de Serviços (Correto):
| Aspecto | Implementação |
|---------|---------------|
| Tipo de cobrança | ✅ Única (correto para serviços) |
| Autenticação | ✅ Exige login (correto) |
| Checkout | ✅ Transparente |
| Fluxo | ✅ Completo |

### Filiação (Incorreto):
| Aspecto | Implementação | Deveria ser |
|---------|---------------|-------------|
| Tipo de cobrança | ❌ Única | ✅ Assinatura recorrente |
| Autenticação | ❌ Exige login | ✅ Criar conta durante processo |
| Seleção de periodicidade | ❌ Não tem | ✅ Mensal/Semestral/Anual |
| Campo senha | ❌ Não tem | ✅ Obrigatório |
| Webhook handler | ❌ Não tem | ✅ Ativar assinatura |

---

## 🔧 API ASAAS - ENDPOINTS NECESSÁRIOS

### Para Filiação (Assinatura):

#### 1. Criar Cliente
```
POST /v3/customers
```
✅ JÁ IMPLEMENTADO em `useAsaasCustomers`

#### 2. Criar Assinatura (NÃO cobrança única!)
```
POST /v3/subscriptions
```
❌ NÃO IMPLEMENTADO

**Payload necessário:**
```json
{
  "customer": "cus_000005401977",
  "billingType": "CREDIT_CARD",
  "value": 8.00,
  "nextDueDate": "2025-01-15",
  "cycle": "MONTHLY",  // ou QUARTERLY, SEMIANNUALLY, YEARLY
  "description": "Filiação COMADEMIG - Diácono",
  "creditCard": {
    "holderName": "João Silva",
    "number": "5162306219378829",
    "expiryMonth": "05",
    "expiryYear": "2026",
    "ccv": "318"
  },
  "creditCardHolderInfo": {
    "name": "João Silva",
    "email": "joao@email.com",
    "cpfCnpj": "12345678900",
    "postalCode": "30000000",
    "addressNumber": "123",
    "phone": "31999999999"
  }
}
```

**Resposta:**
```json
{
  "object": "subscription",
  "id": "sub_000005401977",
  "customer": "cus_000005401977",
  "billingType": "CREDIT_CARD",
  "value": 8.00,
  "nextDueDate": "2025-01-15",
  "cycle": "MONTHLY",
  "status": "ACTIVE"
}
```

#### 3. Webhook de Cobrança
```
POST /webhook (configurado no Asaas)
```
✅ JÁ IMPLEMENTADO em `supabase/functions/asaas-webhook`

**Payload recebido:**
```json
{
  "event": "PAYMENT_CREATED",
  "payment": {
    "id": "pay_123",
    "subscription": "sub_000005401977",  // ← ID da assinatura
    "customer": "cus_000005401977",
    "value": 8.00,
    "status": "PENDING"
  }
}
```

---

## 🆚 COMPARAÇÃO: Cobrança Única vs Assinatura

### Cobrança Única (Solicitação de Serviços):
```json
POST /v3/payments
{
  "customer": "cus_123",
  "billingType": "PIX",
  "value": 50.00,
  "dueDate": "2025-01-15"
}
```
**Resultado:** 1 cobrança criada, paga 1 vez, acabou.

### Assinatura (Filiação):
```json
POST /v3/subscriptions
{
  "customer": "cus_123",
  "billingType": "CREDIT_CARD",
  "value": 8.00,
  "nextDueDate": "2025-01-15",
  "cycle": "MONTHLY"
}
```
**Resultado:** 
- 1ª cobrança criada automaticamente (vence em 15/01)
- 2ª cobrança criada automaticamente (vence em 15/02)
- 3ª cobrança será criada automaticamente 40 dias antes
- Continua até cancelar a assinatura

---

## 📊 HOOKS NECESSÁRIOS

### ✅ JÁ EXISTEM:
- `useAsaasCustomers` - Criar cliente
- `useAsaasPixPayments` - Pagamento PIX
- `useAsaasCardPayments` - Pagamento Cartão
- `useAsaasBoletoPayments` - Pagamento Boleto

### ❌ FALTAM:
- `useAsaasSubscriptions` - Criar/gerenciar assinaturas
- `useSubscriptionWebhook` - Processar webhooks de assinatura

---

## 🎯 CORREÇÕES NECESSÁRIAS

### 1. Criar hook useAsaasSubscriptions

**Arquivo:** `src/hooks/useAsaasSubscriptions.ts` (CRIAR)

```typescript
export function useAsaasSubscriptions() {
  const createSubscription = useMutation({
    mutationFn: async (data: {
      customer: string;
      billingType: 'CREDIT_CARD' | 'BOLETO' | 'PIX';
      value: number;
      nextDueDate: string;
      cycle: 'MONTHLY' | 'QUARTERLY' | 'SEMIANNUALLY' | 'YEARLY';
      description: string;
      creditCard?: {...};
      creditCardHolderInfo?: {...};
    }) => {
      const response = await fetch(`${ASAAS_BASE_URL}/subscriptions`, {
        method: 'POST',
        headers: {
          'access_token': ASAAS_API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      
      return response.json();
    }
  });
  
  return { createSubscription };
}
```

### 2. Atualizar useFiliacaoPayment

**Arquivo:** `src/hooks/useFiliacaoPayment.ts`

**Mudanças:**
- ❌ Remover verificação `if (!user?.id)`
- ✅ Criar conta no Supabase Auth
- ❌ Remover `createPixPayment` / `processCardPayment`
- ✅ Usar `createSubscription` ao invés de cobrança única
- ✅ Passar `cycle` baseado na periodicidade selecionada

### 3. Adicionar seleção de periodicidade

**Arquivo:** `src/components/public/MemberTypeSelector.tsx`

**Adicionar:**
- Radio buttons para cada plano (Mensal/Semestral/Anual)
- Estado para plano selecionado
- Passar plano selecionado para componente pai

### 4. Adicionar campo de senha

**Arquivo:** `src/components/payments/PaymentFormEnhanced.tsx`

**Adicionar:**
- Campo `password`
- Campo `password_confirmation`
- Validação Zod

### 5. Processar webhook de assinatura

**Arquivo:** `supabase/functions/asaas-webhook/index.ts`

**Adicionar:**
- Detectar `payment.subscription` no webhook
- Ativar assinatura em `user_subscriptions` quando pagamento confirmado
- Atualizar `expires_at` baseado no `cycle`

---

## 📝 MAPEAMENTO: Periodicidade → Cycle

| Periodicidade (Frontend) | Cycle (Asaas) | Duração |
|--------------------------|---------------|---------|
| Mensal | `MONTHLY` | 1 mês |
| Semestral | `SEMIANNUALLY` | 6 meses |
| Anual | `YEARLY` | 12 meses |

---

## ✅ RESUMO EXECUTIVO

### O que está CORRETO:
- ✅ Módulo de Solicitação de Serviços (checkout transparente)
- ✅ Criação de cliente no Asaas
- ✅ Processamento de pagamento único
- ✅ Webhook handler básico

### O que está ERRADO:
- ❌ Filiação exige login (deveria criar conta)
- ❌ Filiação cria cobrança única (deveria criar assinatura)
- ❌ Não tem seleção de periodicidade
- ❌ Não tem campo de senha
- ❌ Não tem hook de assinaturas
- ❌ Webhook não processa assinaturas

### Impacto:
- 🔴 **CRÍTICO:** Filiação não funciona (404)
- 🔴 **CRÍTICO:** Mesmo se funcionasse, não seria recorrente
- 🔴 **CRÍTICO:** Usuário não consegue criar conta
- 🟡 **IMPORTANTE:** Não tem renovação automática
- 🟡 **IMPORTANTE:** Não tem cobrança mensal/semestral/anual

---

**AGUARDANDO AUTORIZAÇÃO PARA IMPLEMENTAR CORREÇÕES**
