# 📋 RELATÓRIO COMPLETO: SISTEMA DE CERTIDÕES

**Data:** 09/10/2025  
**Status:** ⚠️ SISTEMA COM PROBLEMAS CRÍTICOS

---

## 🔴 PROBLEMAS IDENTIFICADOS

### 1. **Tabelas Vazias no Banco de Dados**
- ❌ `solicitacoes_certidoes` - 0 registros
- ❌ `certidoes` (tipos disponíveis) - 0 registros  
- ❌ `valores_certidoes` - Tabela não existe ou vazia

**Impacto:** Sistema não consegue buscar valores nem tipos de certidões do banco.

### 2. **Fluxo de Pagamento Quebrado**
**Problema:** Solicitação não redireciona para checkout

**Fluxo Esperado:**
```
Usuário preenche formulário 
  → Clica "Prosseguir para Pagamento"
  → solicitarCertidaoComPagamento() prepara dados
  → onProceedToPayment() é chamado
  → Redireciona para PaymentCheckout
  → Após pagamento, cria registro em solicitacoes_certidoes
```

**Fluxo Atual (QUEBRADO):**
```
Usuário preenche formulário
  → Clica "Prosseguir para Pagamento"
  → solicitarCertidaoComPagamento() retorna dados
  → ✅ Toast "Dados preparados para pagamento"
  → ❌ NÃO redireciona para checkout
  → ❌ NÃO cria registro no banco
```

### 3. **Valores Hardcoded no Frontend**
O sistema usa valores fixos no código ao invés de buscar do banco:

```typescript
const certidaoTypes = [
  { value: "ministerio", valor: 45.00 },
  { value: "vinculo", valor: 35.00 },
  { value: "atuacao", valor: 40.00 },
  { value: "historico", valor: 55.00 },
  { value: "ordenacao", valor: 50.00 }
];
```

**Problema:** Se admin mudar preços no banco, frontend não reflete.

---

## 📊 ESTRUTURA ATUAL DO CÓDIGO

### **Arquivos Principais:**

1. **`src/pages/dashboard/Certidoes.tsx`**
   - Página principal do usuário
   - Gerencia estados: 'list' | 'form' | 'checkout' | 'payment-result'
   - ✅ Tem lógica de navegação entre views
   - ❌ Mas não está funcionando corretamente

2. **`src/components/certidoes/FormSolicitacaoCertidao.tsx`**
   - Formulário de solicitação
   - ✅ Calcula valor da certidão
   - ✅ Chama `solicitarCertidaoComPagamento()`
   - ⚠️ Callback `onProceedToPayment` pode não estar sendo chamado

3. **`src/hooks/useCertidoesWithPayment.ts`**
   - Hook principal com toda lógica de negócio
   - ✅ Integração com Asaas (PIX, Cartão, Boleto)
   - ✅ Desconto de 5% para PIX
   - ✅ Função `processarPagamentoCertidao()` completa
   - ❌ Mas não está sendo chamada no fluxo atual

4. **`src/hooks/useCertidoes.ts`**
   - Hook antigo (sem pagamento)
   - ⚠️ Pode estar causando conflito
   - Cria solicitação direto sem pagamento

---

## 🔍 ANÁLISE DO FLUXO QUEBRADO

### **Problema no FormSolicitacaoCertidao.tsx:**

```typescript
const handleSubmit = async () => {
  // 1. Prepara dados
  const certidaoData = await solicitarCertidaoComPagamento.mutateAsync({
    tipo_certidao: selectedType,
    justificativa: justificativa.trim()
  });
  
  // 2. Tenta chamar callback
  if (onProceedToPayment) {
    onProceedToPayment(certidaoData, calculatedValue);  // ← AQUI!
  }
  
  // 3. Fecha formulário ANTES do pagamento
  onClose();  // ← PROBLEMA: Fecha antes de pagar!
};
```

**Erro:** O formulário fecha (`onClose()`) ANTES do usuário fazer o pagamento!

### **Problema no useCertidoesWithPayment.ts:**

```typescript
const solicitarCertidaoComPagamento = useSupabaseMutation(
  async (data: CertidaoRequest): Promise<CertidaoWithPayment> => {
    // Apenas RETORNA dados, não cria nada no banco
    return {
      ...data,
      valor,
      requiresPayment: true,
      serviceData: { ... }
    };
  },
  {
    successMessage: 'Dados da certidão preparados para pagamento',  // ← Toast que você viu
  }
);
```

**Problema:** Função apenas prepara dados, não cria registro nem redireciona.

---

## 🗄️ ESTRUTURA DO BANCO DE DADOS

### **Tabela: `solicitacoes_certidoes`**

**Status:** ✅ Existe, mas está **VAZIA**

**Colunas:** (Descobrir ao tentar inserir)

### **Tabela: `certidoes` (Tipos Disponíveis)**

**Status:** ✅ Existe, mas está **VAZIA**

**Problema:** Frontend espera buscar tipos desta tabela, mas ela está vazia.

### **Tabela: `valores_certidoes`**

**Status:** ✅ Existe e está **POPULADA**

**Dados Atuais:**
```
✅ ministerio: R$ 45.00 - Certidão de Ministério (Ativo: True)
✅ vinculo: R$ 35.00 - Certidão de Vínculo (Ativo: True)
✅ atuacao: R$ 40.00 - Certidão de Atuação (Ativo: True)
✅ historico: R$ 55.00 - Histórico Ministerial (Ativo: True)
✅ ordenacao: R$ 50.00 - Certidão de Ordenação (Ativo: True)
```

**Colunas:** `id`, `tipo`, `nome`, `valor`, `descricao`, `is_active`, `created_at`, `updated_at`

### **Tabela: `asaas_cobrancas`**

**Status:** ✅ Existe

**Problema:** Coluna `tipo_cobranca` NÃO EXISTE!  
O código tenta filtrar por `tipo_cobranca='certidao'` mas a coluna não existe.

**Coluna Correta:** Provavelmente `service_type` (verificar)

---

## 🔐 RLS POLICIES

**Status:** ⚠️ NÃO VERIFICADO

**Policies Necessárias:**

1. **SELECT** - Usuário vê apenas suas próprias solicitações
2. **INSERT** - Usuário pode criar solicitações
3. **UPDATE** - Apenas admin pode atualizar status
4. **DELETE** - Ninguém pode deletar (soft delete apenas)

---

## 🔍 DIAGNÓSTICO DO PROBLEMA REPORTADO

### **Sintomas:**
1. ✅ Toast aparece: "Dados da certidão preparados para pagamento"
2. ❌ NÃO redireciona para checkout
3. ❌ Nada é criado no banco de dados

### **Análise do Código:**

**Arquivo:** `src/components/certidoes/FormSolicitacaoCertidao.tsx` (linha ~75)

```typescript
const handleSubmit = async () => {
  // 1. Prepara dados (FUNCIONA)
  const certidaoData = await solicitarCertidaoComPagamento.mutateAsync({
    tipo_certidao: selectedType,
    justificativa: justificativa.trim()
  });
  
  // 2. Tenta chamar callback (PROBLEMA AQUI!)
  if (onProceedToPayment) {
    onProceedToPayment(certidaoData, calculatedValue);
  } else {
    console.log('Redirecionando para checkout:', certidaoData);  // ← Cai aqui?
  }
  
  // 3. ERRO: Fecha formulário ANTES do pagamento
  setSelectedType("");
  setJustificativa("");
  setCalculatedValue(0);
  onClose();  // ← Fecha a view!
};
```

**Problema 1:** `onClose()` é chamado IMEDIATAMENTE após preparar dados  
**Problema 2:** Se `onProceedToPayment` for undefined, apenas loga no console

**Arquivo:** `src/pages/dashboard/Certidoes.tsx` (linha ~60)

```typescript
const handleProceedToPayment = (certidaoData: any, valor: number) => {
  setCheckoutData({
    serviceType: 'certidao',
    serviceData: certidaoData.serviceData,
    calculatedValue: valor,
    title: `Certidão de ${getCertidaoDisplayName(certidaoData.serviceData.tipo_certidao)}`,
    description: certidaoData.serviceData.justificativa
  });
  setCurrentView('checkout');  // ← Deveria mudar para checkout
};
```

**Este callback ESTÁ sendo passado para o FormSolicitacaoCertidao!**

### **Hipótese Principal:**

O callback `onProceedToPayment` **ESTÁ SENDO CHAMADO**, mas:
1. A view muda para 'checkout' 
2. MAS o `onClose()` é chamado logo depois
3. Isso fecha o formulário e volta para 'list'
4. Resultado: Usuário vê um "flash" do checkout e volta para lista

### **Teste para Confirmar:**

Adicionar `console.log` antes de cada mudança de estado:

```typescript
console.log('1. Antes de chamar onProceedToPayment');
onProceedToPayment(certidaoData, calculatedValue);
console.log('2. Depois de chamar onProceedToPayment');
console.log('3. Antes de onClose');
onClose();
console.log('4. Depois de onClose');
```

## 💡 CAUSA RAIZ DO PROBLEMA

### **Fluxo Implementado vs Fluxo Executado:**

**IMPLEMENTADO (correto):**
```
Form → Prepara dados → Chama onProceedToPayment() 
  → Muda view para 'checkout' 
  → PaymentCheckout processa pagamento
  → Webhook confirma pagamento
  → Cria registro em solicitacoes_certidoes
```

**EXECUTADO (quebrado):**
```
Form → Prepara dados → ❌ onProceedToPayment() não funciona
  → ❌ View não muda para 'checkout'
  → ❌ Formulário fecha
  → ❌ Nada é criado no banco
```

### **Possíveis Causas:**

1. **Callback não está sendo passado corretamente**
   - `onProceedToPayment` pode estar undefined
   - Verificar props em `Certidoes.tsx`

2. **Estado da view não está mudando**
   - `setCurrentView('checkout')` não está sendo chamado
   - Verificar lógica em `handleProceedToPayment()`

3. **Dados não estão no formato esperado**
   - `certidaoData` pode não ter estrutura correta
   - `PaymentCheckout` espera formato específico

---

## ✅ SOLUÇÃO PROPOSTA

### **CORREÇÃO IMEDIATA (Problema do Redirecionamento):**

**Arquivo:** `src/components/certidoes/FormSolicitacaoCertidao.tsx`

**ANTES (Errado):**
```typescript
const handleSubmit = async () => {
  const certidaoData = await solicitarCertidaoComPagamento.mutateAsync({...});
  
  if (onProceedToPayment) {
    onProceedToPayment(certidaoData, calculatedValue);
  }
  
  // ERRO: Fecha antes do pagamento!
  setSelectedType("");
  setJustificativa("");
  setCalculatedValue(0);
  onClose();
};
```

**DEPOIS (Correto):**
```typescript
const handleSubmit = async () => {
  const certidaoData = await solicitarCertidaoComPagamento.mutateAsync({...});
  
  if (onProceedToPayment) {
    onProceedToPayment(certidaoData, calculatedValue);
    // NÃO chamar onClose() aqui!
    // O formulário deve permanecer aberto até o checkout
  } else {
    console.error('onProceedToPayment não está definido!');
  }
  
  // Limpar formulário mas NÃO fechar
  setSelectedType("");
  setJustificativa("");
  setCalculatedValue(0);
};
```

**OU MELHOR:** Não limpar nada, deixar o checkout gerenciar o fechamento:

```typescript
const handleSubmit = async () => {
  const certidaoData = await solicitarCertidaoComPagamento.mutateAsync({...});
  
  if (onProceedToPayment) {
    onProceedToPayment(certidaoData, calculatedValue);
    // Checkout vai gerenciar o resto
  }
};
```

### **CORREÇÕES ADICIONAIS:**

1. **Corrigir coluna em asaas_cobrancas:**
   - Código usa `tipo_cobranca` mas coluna não existe
   - Trocar para `service_type`

2. **Popular tabela certidoes (opcional):**
   - Atualmente usa `valores_certidoes` (que está OK)
   - Tabela `certidoes` pode ser removida se não for usada

3. **Adicionar RLS policies:**
   - Verificar se usuário pode inserir em `solicitacoes_certidoes`
   - Verificar se pode ler apenas suas próprias solicitações

### **PRÓXIMOS PASSOS:**

**URGENTE (Fazer AGORA):**
1. ✅ Corrigir `onClose()` no FormSolicitacaoCertidao
2. ✅ Corrigir `tipo_cobranca` → `service_type` no código
3. ✅ Testar fluxo completo de solicitação

**IMPORTANTE (Fazer DEPOIS):**
4. Verificar RLS policies
5. Testar webhook de confirmação de pagamento
6. Implementar geração de PDF das certidões
7. Adicionar logs de auditoria

---

## 📝 OBSERVAÇÕES FINAIS

- Sistema está **50% implementado**
- Lógica de pagamento está **correta e completa**
- Problema é na **navegação entre views**
- Banco de dados precisa ser **populado**
- RLS policies precisam ser **verificadas**

**Prioridade:** 🔴 ALTA - Sistema não funciona para usuários
