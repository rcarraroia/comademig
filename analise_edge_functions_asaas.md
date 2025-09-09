# Análise das Edge Functions de Pagamento Asaas - COMADEMIG

## Resumo Executivo

Esta análise examina as quatro Edge Functions relacionadas ao sistema de pagamentos Asaas no projeto COMADEMIG, identificando problemas estruturais e de implementação que podem estar causando as falhas reportadas nos fluxos de pagamento.

## Edge Functions Analisadas

### 1. asaas-create-payment
**Função:** Criação de pagamentos simples
**Arquivo:** `/supabase/functions/asaas-create-payment/index.ts`

### 2. asaas-create-payment-with-split
**Função:** Criação de pagamentos com divisão para afiliados
**Arquivo:** `/supabase/functions/asaas-create-payment-with-split/index.ts`

### 3. asaas-webhook
**Função:** Processamento de webhooks do Asaas
**Arquivo:** `/supabase/functions/asaas-webhook/index.ts`

### 4. asaas-check-payment
**Função:** Verificação de status de pagamentos
**Arquivo:** `/supabase/functions/asaas-check-payment/index.ts`

## Problemas Identificados

### 🔴 Problemas Críticos

#### 1. Inconsistência na Criação de Clientes (asaas-create-payment)
**Problema:** A lógica de criação/busca de clientes no Asaas está incompleta
```typescript
// Linha 65-75: Lógica problemática
if (customerResponse.status === 400) {
  // Cliente já existe, buscar pelo CPF
  const searchResponse = await fetch(`https://www.asaas.com/api/v3/customers?cpfCnpj=${paymentData.customer.cpfCnpj}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'access_token': asaasApiKey,
    }
  })
  const searchData = await searchResponse.json()
  customerId = searchData.data[0]?.id // ⚠️ Pode ser undefined
}
```
**Impacto:** Falha na criação de pagamentos quando cliente já existe
**Solução:** Implementar verificação adequada e tratamento de erro

#### 2. Diferenças na Implementação entre Funções
**Problema:** `asaas-create-payment-with-split` não implementa a mesma lógica de criação de cliente
```typescript
// asaas-create-payment-with-split não cria/busca cliente
// Assume que o cliente já existe no payload
```
**Impacto:** Inconsistência no comportamento entre pagamentos simples e com split
**Solução:** Padronizar a lógica de criação de clientes

#### 3. Tratamento Inadequado de Erros da API Asaas
**Problema:** Respostas de erro não são adequadamente tratadas
```typescript
// Linha 95-101 em asaas-create-payment
if (!paymentResponse.ok) {
  const errorData = await paymentResponse.json()
  console.error('Erro na API do Asaas:', errorData)
  return new Response(JSON.stringify({ error: errorData }), { 
    status: 400, 
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}
```
**Impacto:** Usuários recebem mensagens de erro técnicas não amigáveis

### 🟡 Problemas Moderados

#### 4. Configuração Hardcoded de Split
**Problema:** Percentuais de split estão hardcoded
```typescript
// Linha 45-55 em asaas-create-payment-with-split
finalPaymentData.split = [
  {
    walletId: RENUM_WALLET_ID,
    percentualValue: 40.0
  },
  {
    walletId: affiliate.asaas_wallet_id,
    percentualValue: 20.0
  }
  // 40% restante fica para a conta principal (Convenção)
]
```
**Impacto:** Falta de flexibilidade para ajustar percentuais
**Solução:** Mover configurações para variáveis de ambiente ou tabela de configuração

#### 5. Falta de Validação de Dados de Entrada
**Problema:** Não há validação adequada dos dados recebidos
**Impacto:** Possíveis erros em runtime por dados inválidos
**Solução:** Implementar validação com schemas (Zod, Joi, etc.)

#### 6. Inconsistência no Salvamento de Dados PIX
**Problema:** Diferentes campos sendo usados para QR Code PIX
```typescript
// asaas-create-payment (linha 140-150)
qr_code_pix: pixQrCode

// asaas-create-payment-with-split (linha 95)
qr_code_pix: asaasPayment.encodedImage || asaasPayment.payload
```

### 🟢 Problemas Menores

#### 7. Logs Insuficientes para Debugging
**Problema:** Falta de logs detalhados para rastreamento de problemas
**Solução:** Implementar logging estruturado

#### 8. Falta de Timeout nas Requisições HTTP
**Problema:** Requisições podem ficar pendentes indefinidamente
**Solução:** Implementar timeouts apropriados

## Análise de Fluxo de Dados

### Fluxo Esperado - Pagamento Simples
1. Frontend → `asaas-create-payment`
2. Criar/buscar cliente no Asaas
3. Criar cobrança no Asaas
4. Salvar no banco `asaas_cobrancas`
5. Retornar dados para frontend

### Fluxo Esperado - Pagamento com Split
1. Frontend → `asaas-create-payment-with-split`
2. Verificar afiliado ativo
3. Configurar split de pagamento
4. Criar cobrança no Asaas
5. Registrar referral
6. Salvar no banco

### Pontos de Falha Identificados
- ❌ Criação de cliente (step 2 do fluxo simples)
- ❌ Validação de afiliado (step 2 do fluxo split)
- ❌ Tratamento de erros da API Asaas
- ❌ Inconsistência entre implementações

## Estrutura do Banco de Dados

### Tabelas Relacionadas
- `asaas_cobrancas` - Armazena cobranças criadas
- `affiliates` - Dados dos afiliados
- `referrals` - Registros de indicações
- `transactions` - Transações de split
- `webhook_events` - Eventos de webhook

### Campos Críticos Identificados
```sql
-- asaas_cobrancas
user_id, asaas_id, customer_id, valor, status, 
forma_pagamento, url_pagamento, qr_code_pix, 
tipo_cobranca, referencia_id

-- affiliates  
asaas_wallet_id, status, is_adimplent

-- referrals
affiliate_id, status, charge_id
```

## Recomendações de Correção

### Prioridade Alta
1. **Corrigir lógica de criação de clientes** em `asaas-create-payment`
2. **Padronizar implementação** entre as duas funções de criação
3. **Implementar tratamento robusto de erros** da API Asaas
4. **Adicionar validação de dados** de entrada

### Prioridade Média
1. **Mover configurações hardcoded** para variáveis de ambiente
2. **Padronizar campos PIX** entre as funções
3. **Implementar logging estruturado**
4. **Adicionar timeouts** nas requisições HTTP

### Prioridade Baixa
1. **Otimizar queries** do banco de dados
2. **Implementar cache** para dados de afiliados
3. **Adicionar métricas** de performance

## Próximos Passos

1. ✅ **Análise das Edge Functions** - CONCLUÍDA
2. 🔄 **Investigação das variáveis de ambiente** - PRÓXIMA
3. ⏳ **Análise dos logs de execução**
4. ⏳ **Revisão das políticas RLS**
5. ⏳ **Análise do fluxo frontend**
6. ⏳ **Implementação de correções**

---
*Análise realizada em: 09/09/2025*
*Próxima etapa: Verificação das variáveis de ambiente e configurações*

