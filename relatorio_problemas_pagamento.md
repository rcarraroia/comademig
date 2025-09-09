# Relatório Consolidado - Problemas de Pagamento COMADEMIG

## Resumo Executivo

Esta auditoria técnica identificou múltiplos problemas críticos no sistema de pagamentos do COMADEMIG que explicam as falhas reportadas nos formulários de filiação, certificados, regularização e sistema de afiliados. Os problemas abrangem desde configurações de ambiente até falhas na integração entre frontend e backend.

## Status da Auditoria

### ✅ Fases Concluídas
1. **Análise das Edge Functions** - Identificados problemas estruturais no código
2. **Investigação de variáveis de ambiente** - Identificadas configurações críticas faltantes
3. **Revisão da estrutura do banco e RLS** - Identificados possíveis bloqueios de acesso
4. **Análise do fluxo frontend** - Identificados problemas de integração e UX

### ⏳ Pendente
- **Análise dos logs das Edge Functions** - Aguardando acesso ao painel Supabase

## Problemas Críticos Identificados

### 🔴 1. Inconsistência na Criação de Clientes Asaas
**Localização:** `asaas-create-payment/index.ts` (linhas 65-75)
**Problema:** Lógica de busca de cliente existente pode retornar `undefined`
**Impacto:** Falha na criação de pagamentos quando cliente já existe
**Código problemático:**
```typescript
const searchData = await searchResponse.json()
customerId = searchData.data[0]?.id // ⚠️ Pode ser undefined
```

### 🔴 2. Diferenças entre Edge Functions
**Problema:** `asaas-create-payment-with-split` não implementa criação de cliente
**Impacto:** Inconsistência entre pagamentos simples e com split
**Solução:** Padronizar lógica de criação de clientes

### 🔴 3. Falta de Redirecionamento para Checkout
**Localização:** Frontend - `Filiacao.tsx` e `PaymentForm.tsx`
**Problema:** Após criar cobrança, usuário não é redirecionado para pagamento
**Impacto:** Usuário não consegue completar o pagamento
**Código atual:**
```typescript
const handlePaymentSuccess = (cobranca: any) => {
  // Redirecionar para página de sucesso ou mostrar confirmação
  console.log('Pagamento criado com sucesso:', cobranca); // ⚠️ Só faz log
};
```

### 🔴 4. Possível Bloqueio RLS para Service Role
**Problema:** Edge Functions podem não conseguir ler dados de afiliados
**Impacto:** Falha no sistema de split de pagamentos
**Causa:** Políticas RLS podem estar bloqueando acesso do service_role

### 🟡 5. Configurações Hardcoded
**Problema:** Valores e IDs fixos no código
**Exemplos:**
- `RENUM_WALLET_ID = 'f9c7d1dd-9e52-4e81-8194-8b666f276405'`
- Percentuais de split (40%, 40%, 20%)
- Valor da filiação (R$ 250,00)

### 🟡 6. Falta de Validações no Frontend
**Problemas:**
- Sem validação de CPF/CNPJ
- Sem timeout nas requisições
- Sem retry logic
- Sem validação de afiliado inválido

## Mapeamento dos Problemas Reportados

### ❌ "Formulário de nova filiação não redireciona para checkout"
**Causa Raiz:** Problema #3 - Falta de redirecionamento
**Fluxo Atual:**
1. ✅ Usuário preenche formulário
2. ✅ Sistema cria cobrança (se Edge Function funcionar)
3. ❌ **FALHA:** Não há redirecionamento para URL de pagamento

### ❌ "Sistema de certificados não gera métodos de pagamento"
**Possíveis Causas:**
- Problema #1 - Falha na criação de clientes
- Problema #4 - Bloqueio RLS
- Variáveis de ambiente não configuradas

### ❌ "Sistema de regularização não gera métodos de pagamento"
**Possíveis Causas:** Mesmas do sistema de certificados

### ❌ "Sistema de afiliados com divisão de pagamento não funciona"
**Causas Prováveis:**
- Problema #2 - Inconsistência entre Edge Functions
- Problema #4 - Bloqueio RLS para leitura de afiliados
- Problema #5 - `RENUM_WALLET_ID` inválido

## Variáveis de Ambiente Críticas

### ⚠️ Não Verificadas (Aguardando Acesso)
- `ASAAS_API_KEY` - **CRÍTICA** para todas as operações
- `SUPABASE_SERVICE_ROLE_KEY` - **CRÍTICA** para webhooks
- Validação de conectividade com API Asaas

### 📋 Recomendadas para Implementar
```bash
# Split de Pagamentos
RENUM_WALLET_ID=f9c7d1dd-9e52-4e81-8194-8b666f276405
CONVENTION_SPLIT_PERCENTAGE=40
RENUM_SPLIT_PERCENTAGE=40
AFFILIATE_SPLIT_PERCENTAGE=20

# Configurações de API
ASAAS_API_TIMEOUT=30000
ASAAS_API_BASE_URL=https://www.asaas.com/api/v3
```

## Correções Prioritárias

### 🔥 Prioridade Crítica (Implementar Imediatamente)

#### 1. Corrigir Redirecionamento para Checkout
```typescript
// Filiacao.tsx
const handlePaymentSuccess = (cobranca: any) => {
  if (cobranca.url_pagamento) {
    window.open(cobranca.url_pagamento, '_blank');
  } else if (cobranca.asaas_data?.invoiceUrl) {
    window.open(cobranca.asaas_data.invoiceUrl, '_blank');
  } else {
    // Fallback: mostrar dados de pagamento
    showPaymentDetails(cobranca);
  }
};
```

#### 2. Corrigir Lógica de Criação de Cliente
```typescript
// asaas-create-payment/index.ts
if (customerResponse.status === 400) {
  const searchResponse = await fetch(`https://www.asaas.com/api/v3/customers?cpfCnpj=${paymentData.customer.cpfCnpj}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'access_token': asaasApiKey,
    }
  })
  
  if (!searchResponse.ok) {
    throw new Error('Erro ao buscar cliente existente');
  }
  
  const searchData = await searchResponse.json()
  
  if (!searchData.data || searchData.data.length === 0) {
    throw new Error('Cliente não encontrado após erro de criação');
  }
  
  customerId = searchData.data[0].id;
} else if (!customerResponse.ok) {
  throw new Error('Erro ao criar cliente no Asaas');
} else {
  const customerData = await customerResponse.json()
  customerId = customerData.id
}
```

#### 3. Padronizar Edge Functions
- Implementar mesma lógica de criação de cliente em ambas as funções
- Usar mesma estrutura de tratamento de erros
- Padronizar formato de resposta

### 🟡 Prioridade Alta (Implementar em Seguida)

#### 1. Adicionar Validações no Frontend
```typescript
// Validação de CPF/CNPJ
const validateCpfCnpj = (value: string) => {
  const cleaned = value.replace(/\D/g, '');
  return cleaned.length === 11 || cleaned.length === 14;
};

// Timeout nas requisições
const createPaymentWithTimeout = async (paymentData: PaymentData) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);
  
  try {
    const { data, error } = await supabase.functions.invoke(functionName, {
      body: paymentData,
      signal: controller.signal
    });
    return { data, error };
  } finally {
    clearTimeout(timeoutId);
  }
};
```

#### 2. Verificar e Corrigir Políticas RLS
```sql
-- Permitir service_role ler afiliados ativos
CREATE POLICY "Service role pode ler afiliados ativos"
  ON public.affiliates
  FOR SELECT
  USING (
    current_setting('role') = 'service_role' OR
    (status = 'active' AND is_adimplent = true)
  );
```

### 🟢 Prioridade Média (Melhorias)

1. **Mover configurações hardcoded** para variáveis de ambiente
2. **Implementar logging estruturado** nas Edge Functions
3. **Adicionar retry logic** para chamadas da API Asaas
4. **Implementar cache** para dados de afiliados
5. **Adicionar métricas** de conversão e performance

## Plano de Implementação

### Fase 1: Correções Críticas (1-2 dias)
1. ✅ Implementar redirecionamento para checkout
2. ✅ Corrigir lógica de criação de cliente
3. ✅ Verificar variáveis de ambiente no Supabase
4. ✅ Testar fluxo completo de pagamento

### Fase 2: Melhorias de Robustez (2-3 dias)
1. ✅ Padronizar Edge Functions
2. ✅ Adicionar validações no frontend
3. ✅ Corrigir políticas RLS se necessário
4. ✅ Implementar tratamento de timeout

### Fase 3: Otimizações (1-2 dias)
1. ✅ Mover configurações para variáveis de ambiente
2. ✅ Implementar logging e métricas
3. ✅ Adicionar retry logic
4. ✅ Testes de carga e performance

## Riscos e Considerações

### 🚨 Riscos Altos
- **Perda de receita** enquanto pagamentos não funcionam
- **Experiência ruim do usuário** com formulários quebrados
- **Problemas de compliance** se dados não forem tratados corretamente

### ⚠️ Considerações Técnicas
- **Backup do banco** antes de alterar políticas RLS
- **Testes em ambiente de desenvolvimento** antes de produção
- **Monitoramento** após deploy das correções
- **Rollback plan** em caso de problemas

## Próximos Passos Imediatos

1. 🔄 **Aguardar acesso aos logs** do Supabase para confirmar diagnósticos
2. 🔄 **Verificar variáveis de ambiente** no painel do Supabase
3. 🔄 **Implementar correção de redirecionamento** (pode ser feita imediatamente)
4. 🔄 **Testar API Asaas** com chaves atuais
5. 🔄 **Validar dados de afiliados** no banco de dados

## Conclusão

Os problemas identificados são **solucionáveis** e a maioria pode ser corrigida rapidamente. O problema mais crítico é a **falta de redirecionamento para checkout**, que pode ser implementado imediatamente. 

A **análise dos logs** confirmará os diagnósticos e permitirá implementar as correções com maior precisão.

---
*Relatório gerado em: 09/09/2025*
*Status: Aguardando acesso aos logs para finalizar diagnóstico*

