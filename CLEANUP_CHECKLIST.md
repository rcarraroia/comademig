# 🧹 CHECKLIST DE LIMPEZA TOTAL - SISTEMA DE PAGAMENTOS

## ✅ JÁ CONCLUÍDO:
- [x] Tabelas principais removidas (asaas_cobrancas, asaas_webhooks, etc.)
- [x] Políticas RLS principais removidas
- [x] Edge Functions de pagamento removidas
- [x] APIs Node.js de pagamento removidas

## 🔄 PENDENTE - BANCO DE DADOS:
- [ ] Executar `CLEANUP_FINAL_PAYMENTS.sql`
- [ ] Remover políticas restantes de `member_type_subscriptions`
- [ ] Verificar se `member_type_subscriptions` deve ser mantida ou removida

## 🔄 PENDENTE - ARQUIVOS DE CÓDIGO:

### ARQUIVOS PARA DELETAR COMPLETAMENTE:
```
src/hooks/useAsaasPayments.ts
src/components/payments/PaymentForm.tsx
supabase/functions/affiliates-management/ (se não for usado)
```

### ARQUIVOS PARA LIMPAR/REFATORAR:
```
src/hooks/useSubscriptions.ts (remover referências a member_type_subscriptions)
src/pages/Filiacao.tsx (remover imports e código de pagamento)
src/pages/Checkout.tsx (verificar se ainda é necessário)
```

### VERIFICAR DEPENDÊNCIAS:
```
src/hooks/useUserSubscriptions.ts
src/pages/dashboard/admin/Subscriptions.tsx
```

## 🎯 APÓS LIMPEZA - RECONSTRUÇÃO:

### 1. NOVA ESTRUTURA DE BANCO:
```sql
-- Tabela simples para pagamentos
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  asaas_payment_id TEXT UNIQUE,
  amount DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  payment_method TEXT NOT NULL,
  description TEXT,
  due_date DATE,
  paid_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabela para webhooks
CREATE TABLE payment_webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  processed BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 2. NOVAS APIS NODE.JS:
```
api/
├── payments/
│   ├── create.js          # POST /api/payments/create
│   ├── status.js          # GET /api/payments/status/:id
│   └── webhook.js         # POST /api/payments/webhook
└── health.js              # GET /api/health
```

### 3. NOVO HOOK FRONTEND:
```typescript
// src/hooks/usePayments.ts
export const usePayments = () => {
  const createPayment = async (data) => { /* implementação limpa */ }
  const checkStatus = async (id) => { /* implementação limpa */ }
  return { createPayment, checkStatus, loading }
}
```

### 4. NOVO COMPONENTE:
```typescript
// src/components/PaymentForm.tsx
export const PaymentForm = ({ onSuccess }) => {
  // Implementação limpa e simples
}
```

## 📋 ORDEM DE EXECUÇÃO:

1. **EXECUTAR** `CLEANUP_FINAL_PAYMENTS.sql` no Supabase
2. **DELETAR** arquivos de código listados
3. **LIMPAR** referências nos arquivos restantes
4. **CRIAR** nova estrutura de banco
5. **IMPLEMENTAR** novas APIs Node.js
6. **CRIAR** novo hook e componente
7. **TESTAR** fluxo completo

## 🎯 RESULTADO ESPERADO:
- ✅ Sistema 100% limpo
- ✅ Arquitetura simples e clara
- ✅ Código fácil de manter
- ✅ Sem conflitos ou código legado
- ✅ Pronto para implementação Node.js + Webhooks