# 🔒 CORREÇÃO DE SEGURANÇA - API KEY ASAAS

## ⚠️ PROBLEMA IDENTIFICADO

A API Key do Asaas estava sendo exposta no frontend através da variável `VITE_ASAAS_API_KEY`, o que representa um **RISCO CRÍTICO DE SEGURANÇA**.

### Riscos:
- ✅ API Key visível no código JavaScript do navegador
- ✅ Qualquer usuário pode inspecionar e copiar a chave
- ✅ Possibilidade de uso indevido da conta Asaas
- ✅ Cobranças não autorizadas
- ✅ Acesso a dados sensíveis de clientes

## ✅ CORREÇÃO IMPLEMENTADA

### 1. Remoção da API Key do Frontend

**Arquivos corrigidos:**
- `src/lib/asaas.ts` - Removida referência a `VITE_ASAAS_API_KEY`
- `src/lib/asaas/config.ts` - Removida API Key e Webhook Token
- `src/utils/asaasApi.ts` - Marcado como obsoleto
- `src/utils/diagnostics.ts` - Atualizado para não verificar API Key
- `.env` - API Key movida para variável sem prefixo `VITE_`

### 2. Arquitetura Segura

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                              │
│  (React + TypeScript)                                        │
│                                                              │
│  ✅ Hooks: useAsaasCustomers, useAsaasSubscriptions         │
│  ✅ Chamadas via supabase.functions.invoke()                │
│  ❌ SEM acesso direto à API Key                             │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ HTTPS
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                  SUPABASE EDGE FUNCTIONS                     │
│  (Backend Serverless - Deno)                                 │
│                                                              │
│  ✅ API Key armazenada em Deno.env.get('ASAAS_API_KEY')    │
│  ✅ Validação de autenticação                               │
│  ✅ Validação de permissões                                 │
│  ✅ Rate limiting                                            │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ HTTPS + API Key
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                      API ASAAS                               │
│  (Gateway de Pagamento)                                      │
└─────────────────────────────────────────────────────────────┘
```

### 3. Variáveis de Ambiente

**ANTES (INSEGURO):**
```env
VITE_ASAAS_API_KEY="$aact_prod_..."  # ❌ Exposto no frontend
VITE_ASAAS_WEBHOOK_TOKEN="webhook_..." # ❌ Exposto no frontend
```

**DEPOIS (SEGURO):**
```env
# Backend (Edge Functions) - NÃO exposto no frontend
ASAAS_API_KEY="$aact_prod_..."
ASAAS_WEBHOOK_TOKEN="webhook_..."

# Frontend - Apenas configurações públicas
VITE_ASAAS_ENVIRONMENT="production"
VITE_ASAAS_BASE_URL="https://api.asaas.com/v3"
```

## 📋 COMO USAR AGORA

### ❌ NÃO FAÇA MAIS ISSO:
```typescript
// ❌ ERRADO - Chamada direta à API Asaas
import { getAsaasAPI } from '@/utils/asaasApi';

const asaas = getAsaasAPI();
const customer = await asaas.createCustomer(data);
```

### ✅ FAÇA ASSIM:
```typescript
// ✅ CORRETO - Use hooks que chamam Edge Functions
import { useAsaasCustomers } from '@/hooks/useAsaasCustomers';

const { createCustomer } = useAsaasCustomers();
const result = await createCustomer(data);
```

## 🔧 EDGE FUNCTIONS DISPONÍVEIS

Todas as operações com Asaas devem passar por Edge Functions:

1. **asaas-create-customer** - Criar cliente
2. **asaas-create-subscription** - Criar assinatura
3. **asaas-create-boleto** - Gerar boleto
4. **asaas-create-pix-payment** - Criar pagamento PIX
5. **asaas-process-card** - Processar cartão de crédito
6. **asaas-webhook** - Receber webhooks do Asaas
7. **asaas-process-webhook** - Processar eventos de webhook

## 🚀 CONFIGURAÇÃO NO SUPABASE

### 1. Configurar Secrets nas Edge Functions

No painel do Supabase:
1. Vá em **Edge Functions** > **Settings**
2. Adicione as variáveis:
   - `ASAAS_API_KEY` = `$aact_prod_...`
   - `ASAAS_WEBHOOK_TOKEN` = `webhook_prod_...`
   - `ASAAS_BASE_URL` = `https://api.asaas.com/v3`
   - `ASAAS_ENVIRONMENT` = `production`

### 2. Verificar Configuração

Execute o diagnóstico:
```typescript
import { diagnosticService } from '@/utils/diagnostics';

const report = await diagnosticService.runAllTests();
console.log(diagnosticService.formatReport(report));
```

## 📝 CHECKLIST DE MIGRAÇÃO

- [x] Remover `VITE_ASAAS_API_KEY` de todos os arquivos frontend
- [x] Atualizar `.env` para usar variáveis sem prefixo `VITE_`
- [x] Marcar `getAsaasAPI()` como obsoleto
- [x] Atualizar documentação
- [ ] **VOCÊ DEVE:** Configurar secrets no Supabase Dashboard
- [ ] **VOCÊ DEVE:** Testar Edge Functions em produção
- [ ] **VOCÊ DEVE:** Verificar que pagamentos funcionam

## ⚠️ AÇÕES NECESSÁRIAS

### VOCÊ PRECISA FAZER MANUALMENTE:

1. **Configurar Secrets no Supabase:**
   - Acesse: https://supabase.com/dashboard/project/amkelczfwazutrciqtlk/settings/functions
   - Adicione as variáveis listadas acima

2. **Testar Fluxo de Pagamento:**
   - Acesse `/filiacao`
   - Preencha formulário
   - Verifique que Edge Functions são chamadas
   - Confirme que pagamento é criado no Asaas

3. **Verificar Logs:**
   - Monitore logs das Edge Functions
   - Verifique erros de autenticação
   - Confirme que API Key está sendo lida corretamente

## 🎯 BENEFÍCIOS

✅ **Segurança:** API Key não é mais exposta no frontend  
✅ **Controle:** Todas as chamadas passam por validação no backend  
✅ **Auditoria:** Logs centralizados nas Edge Functions  
✅ **Rate Limiting:** Proteção contra abuso  
✅ **Manutenção:** Fácil rotação de credenciais sem rebuild do frontend

## 📚 REFERÊNCIAS

- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Asaas API Documentation](https://docs.asaas.com/)
- [Security Best Practices](https://owasp.org/www-project-top-ten/)
