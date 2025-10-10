# 🚀 Instruções para Redeploy das Edge Functions de Split

## ✅ O que foi atualizado

Duas Edge Functions foram atualizadas para implementar a **divisão tripla de pagamentos**:

### 1. `asaas-configure-split` (Tarefa 6.2)
**Localização:** `supabase/functions/asaas-configure-split/index.ts`

**Mudanças implementadas:**
- ✅ Cria 3 splits ao invés de 1 (COMADEMIG, RENUM, Afiliado)
- ✅ Lógica de divisão por tipo de serviço:
  - **Filiação**: 40% COMADEMIG, 40% RENUM, 20% Afiliado
  - **Serviços**: 60% COMADEMIG, 40% RENUM
  - **Publicidade**: 100% COMADEMIG
  - **Eventos**: 70% COMADEMIG, 30% RENUM
  - **Outros**: 100% COMADEMIG
- ✅ COMADEMIG: não cria split no Asaas (recebe direto), apenas registra localmente
- ✅ RENUM: cria split no Asaas com Wallet ID fixo (variável `RENUM_WALLET_ID`)
- ✅ Afiliado: cria split no Asaas com Wallet ID dinâmico
- ✅ Registra os 3 splits na tabela `asaas_splits` com `recipient_type` correto

### 2. `asaas-process-splits` (Tarefa 6.3)
**Localização:** `supabase/functions/asaas-process-splits/index.ts`

**Mudanças implementadas:**
- ✅ Processa múltiplos splits por pagamento (não apenas 1)
- ✅ Busca TODOS os splits pendentes da cobrança
- ✅ Processa cada split individualmente:
  - **COMADEMIG**: apenas marca como processado (recebe direto)
  - **RENUM**: ativa split no Asaas
  - **Afiliado**: ativa split no Asaas + registra comissão
- ✅ Atualiza status de cada split individualmente
- ✅ Registra comissões em `affiliate_commissions` apenas para afiliados
- ✅ Tratamento de erros individual por split (um erro não bloqueia os outros)

---

## 📋 Como fazer o Redeploy

### Opção 1: Via Painel do Supabase (RECOMENDADO)

1. **Acesse o painel do Supabase:**
   - Vá para: https://supabase.com/dashboard
   - Selecione seu projeto COMADEMIG

2. **Navegue até Edge Functions:**
   - No menu lateral, clique em **"Edge Functions"**

3. **Redeploy da função `asaas-configure-split`:**
   - Encontre a função `asaas-configure-split` na lista
   - Clique no botão **"Redeploy"** ou **"Deploy"**
   - Aguarde a confirmação de sucesso ✅

4. **Redeploy da função `asaas-process-splits`:**
   - Encontre a função `asaas-process-splits` na lista
   - Clique no botão **"Redeploy"** ou **"Deploy"**
   - Aguarde a confirmação de sucesso ✅

### Opção 2: Via CLI do Supabase (Alternativa)

Se preferir usar o terminal:

```bash
# Fazer login no Supabase (se ainda não estiver logado)
supabase login

# Fazer link com o projeto
supabase link --project-ref SEU_PROJECT_REF

# Deploy da primeira função
supabase functions deploy asaas-configure-split

# Deploy da segunda função
supabase functions deploy asaas-process-splits
```

---

## ⚠️ IMPORTANTE: Variável de Ambiente

Antes de fazer o redeploy, **certifique-se de que a variável `RENUM_WALLET_ID` está configurada**:

1. No painel do Supabase, vá em **"Settings" > "Edge Functions"**
2. Na seção **"Environment Variables"**, verifique se existe:
   - **Nome:** `RENUM_WALLET_ID`
   - **Valor:** O Wallet ID da RENUM no Asaas

3. Se não existir, adicione a variável:
   - Clique em **"Add variable"**
   - Nome: `RENUM_WALLET_ID`
   - Valor: `[WALLET_ID_DA_RENUM]` (você precisa obter este valor do painel do Asaas)
   - Clique em **"Save"**

---

## 🧪 Como Testar Após o Redeploy

### Teste 1: Configurar Split de Filiação

```javascript
// Fazer requisição para configurar split
const response = await fetch('https://[SEU_PROJECT_REF].supabase.co/functions/v1/asaas-configure-split', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer [SEU_ANON_KEY]',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    cobrancaId: 'pay_123456789',
    serviceType: 'filiacao',
    totalValue: 1000.00,
    affiliateId: 'uuid-do-afiliado' // Opcional
  })
});

const result = await response.json();
console.log(result);

// Resultado esperado:
// {
//   "success": true,
//   "message": "Divisão tripla configurada: 3 beneficiários",
//   "data": {
//     "splits": [
//       { "recipientName": "COMADEMIG", "percentage": 40, "amount": 400 },
//       { "recipientName": "RENUM", "percentage": 40, "amount": 400 },
//       { "recipientName": "Afiliado", "percentage": 20, "amount": 200 }
//     ]
//   }
// }
```

### Teste 2: Processar Splits

```javascript
// Fazer requisição para processar splits
const response = await fetch('https://[SEU_PROJECT_REF].supabase.co/functions/v1/asaas-process-splits', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer [SEU_ANON_KEY]',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    cobrancaId: 'pay_123456789',
    paymentValue: 1000.00,
    serviceType: 'filiacao'
  })
});

const result = await response.json();
console.log(result);

// Resultado esperado:
// {
//   "success": true,
//   "message": "3 splits processados com sucesso",
//   "data": {
//     "processedSplits": [
//       { "recipientName": "COMADEMIG", "status": "PROCESSED" },
//       { "recipientName": "RENUM", "status": "PROCESSED" },
//       { "recipientName": "Afiliado", "status": "PROCESSED" }
//     ]
//   }
// }
```

---

## 📊 Verificar no Banco de Dados

Após os testes, verifique na tabela `asaas_splits`:

```sql
-- Ver splits criados
SELECT 
  recipient_type,
  recipient_name,
  percentage,
  commission_amount,
  status,
  asaas_split_id
FROM asaas_splits
WHERE cobranca_id = 'pay_123456789'
ORDER BY created_at DESC;

-- Resultado esperado: 3 registros
-- 1. COMADEMIG (40%, R$ 400, asaas_split_id = NULL)
-- 2. RENUM (40%, R$ 400, asaas_split_id = 'split_xxx')
-- 3. Afiliado (20%, R$ 200, asaas_split_id = 'split_yyy')
```

---

## ❓ Troubleshooting

### Erro: "RENUM_WALLET_ID não encontrado"
**Solução:** Configure a variável de ambiente `RENUM_WALLET_ID` no painel do Supabase.

### Erro: "Split não criado no Asaas"
**Solução:** Verifique se o Wallet ID da RENUM ou do Afiliado está correto.

### Erro: "Valor abaixo do mínimo"
**Solução:** O valor mínimo para transferência é R$ 10,00. Valores menores são cancelados automaticamente.

### Splits não aparecem no banco
**Solução:** Verifique os logs da Edge Function no painel do Supabase em "Edge Functions" > [nome da função] > "Logs".

---

## ✅ Checklist Final

Após o redeploy, confirme:

- [ ] Variável `RENUM_WALLET_ID` configurada
- [ ] Função `asaas-configure-split` deployada com sucesso
- [ ] Função `asaas-process-splits` deployada com sucesso
- [ ] Teste de configuração de split executado
- [ ] Teste de processamento de split executado
- [ ] Verificação no banco de dados realizada
- [ ] 3 splits criados corretamente (COMADEMIG, RENUM, Afiliado)

---

## 📞 Suporte

Se encontrar problemas:
1. Verifique os logs das Edge Functions no painel do Supabase
2. Verifique a tabela `asaas_splits` no banco de dados
3. Verifique se as migrações SQL foram executadas corretamente

**Arquivos relacionados:**
- `supabase/migrations/20250110_update_asaas_splits_table.sql`
- `supabase/migrations/20250110_create_split_configuration_tables.sql`
- `src/hooks/useAsaasSplits.ts`
- `src/hooks/useSplitConfiguration.ts`
- `src/utils/splitCalculations.ts`
