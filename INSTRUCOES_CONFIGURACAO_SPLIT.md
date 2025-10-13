# 🔧 INSTRUÇÕES: CONFIGURAÇÃO DO SISTEMA DE SPLIT

**Data:** 13/10/2025  
**Status:** ✅ Código implementado - Aguardando configuração

---

## 📋 CHECKLIST DE ATIVAÇÃO

### ✅ 1. CÓDIGO (CONCLUÍDO)

- [x] Adicionada chamada para `asaas-configure-split` em `useFiliacaoPayment.ts`
- [x] Adicionado registro em `asaas_cobrancas` antes de criar split
- [x] Criada migração para adicionar `asaas_wallet_id` em `affiliates`
- [x] Logs detalhados adicionados para debug

### ⏳ 2. BANCO DE DADOS (PENDENTE - EXECUTAR MANUALMENTE)

#### Migração: Adicionar coluna asaas_wallet_id

**Arquivo:** `supabase/migrations/20251013_add_asaas_wallet_id_to_affiliates.sql`

**Você deve:**
1. Abrir o **Supabase Dashboard**
2. Ir em **SQL Editor**
3. Copiar o conteúdo do arquivo acima
4. Colar e **executar** no SQL Editor
5. Verificar que a coluna foi criada

**Verificação:**
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'affiliates' 
AND column_name = 'asaas_wallet_id';
```

### ⏳ 3. VARIÁVEIS DE AMBIENTE (PENDENTE - CONFIGURAR)

#### Variável: RENUM_WALLET_ID

**Onde configurar:**
1. Abrir **Supabase Dashboard**
2. Ir em **Project Settings** → **Edge Functions**
3. Adicionar variável de ambiente:
   - **Nome:** `RENUM_WALLET_ID`
   - **Valor:** `<wallet_id_da_renum_no_asaas>`

**Como obter o Wallet ID da RENUM:**

1. Acessar **Asaas Dashboard**
2. Ir em **Configurações** → **Contas Bancárias** → **Carteiras**
3. Criar uma carteira para RENUM (se não existir)
4. Copiar o **Wallet ID** (formato: `wal_xxxxxxxxxxxxx`)
5. Colar nas variáveis de ambiente do Supabase

**⚠️ IMPORTANTE:**
- Sandbox: Use wallet ID do ambiente sandbox
- Produção: Use wallet ID do ambiente produção
- **NÃO** misturar IDs de ambientes diferentes!

---

## 🧪 TESTE APÓS CONFIGURAÇÃO

### Passo 1: Verificar variável configurada

```bash
# No Supabase Dashboard → Edge Functions → Secrets
# Verificar que RENUM_WALLET_ID está listado
```

### Passo 2: Fazer filiação de teste

1. Acessar página de filiação
2. Preencher formulário completo
3. Selecionar método de pagamento
4. Finalizar filiação

### Passo 3: Verificar logs no console

**Logs esperados:**
```
🔄 Configurando split de pagamento...
  - Cobrança ID: sub_xxxxxxxxxxxxx
  - Valor: 8
  - Tipo: filiacao
  - Afiliado: Nenhum

✅ Split configurado com sucesso!
  - Total de beneficiários: 2
  - Splits: [...]
```

### Passo 4: Verificar no banco de dados

**Query SQL:**
```sql
-- Verificar splits criados
SELECT * FROM asaas_splits 
ORDER BY created_at DESC 
LIMIT 5;

-- Verificar cobranças registradas
SELECT * FROM asaas_cobrancas 
ORDER BY created_at DESC 
LIMIT 5;
```

**Resultado esperado:**
- 2 splits criados (COMADEMIG 40% + RENUM 40%)
- Status: PENDING
- 1 cobrança registrada

### Passo 5: Simular pagamento no Asaas

1. Acessar **Asaas Dashboard**
2. Ir em **Cobranças**
3. Encontrar a assinatura criada
4. Clicar em **Simular Pagamento** (sandbox)
5. Confirmar pagamento

### Passo 6: Verificar webhook processou splits

**Logs esperados no Supabase:**
```
Processing payment splits for: sub_xxxxxxxxxxxxx
Found 2 splits to process
Processing split xxx for COMADEMIG
COMADEMIG split - marking as processed
Processing split xxx for RENUM
Activating split xxx in Asaas
Split processed successfully: R$ 3.20 for RENUM
Splits processed successfully
```

**Verificar no banco:**
```sql
SELECT * FROM asaas_splits 
WHERE status = 'PROCESSED'
ORDER BY processed_at DESC;
```

---

## 📊 CONFIGURAÇÃO DE SPLITS POR TIPO

### Filiação (Implementado)
- **COMADEMIG:** 40% (recebe direto)
- **RENUM:** 40% (via split Asaas)
- **Afiliado:** 20% (via split Asaas, se houver)

### Serviços (Implementado)
- **COMADEMIG:** 60% (recebe direto)
- **RENUM:** 40% (via split Asaas)

### Eventos (Implementado)
- **COMADEMIG:** 70% (recebe direto)
- **RENUM:** 30% (via split Asaas)

### Publicidade e Outros (Implementado)
- **COMADEMIG:** 100% (recebe direto)

---

## 🔍 TROUBLESHOOTING

### Erro: "RENUM_WALLET_ID não configurado"

**Causa:** Variável de ambiente não foi configurada  
**Solução:** Configurar `RENUM_WALLET_ID` no Supabase (ver seção 3)

### Erro: "column affiliates.asaas_wallet_id does not exist"

**Causa:** Migração não foi executada  
**Solução:** Executar migração SQL no Supabase (ver seção 2)

### Split não aparece no banco

**Causa:** Erro ao chamar Edge Function  
**Solução:** 
1. Verificar logs do console do navegador
2. Verificar logs da Edge Function no Supabase
3. Verificar se `RENUM_WALLET_ID` está configurado

### Split criado mas não processado

**Causa:** Webhook não recebeu confirmação de pagamento  
**Solução:**
1. Verificar se webhook está configurado no Asaas
2. Simular pagamento manualmente no Asaas
3. Verificar logs do webhook no Supabase

---

## 📞 SUPORTE

### Logs importantes:

**Frontend (Console do navegador):**
```
🔄 Configurando split de pagamento...
✅ Split configurado com sucesso!
```

**Backend (Supabase Logs):**
```
Configurando divisão tripla de pagamento
Split criado no Asaas para RENUM
Splits processed successfully
```

### Arquivos modificados:

1. `src/hooks/useFiliacaoPayment.ts` - Adicionada lógica de split
2. `supabase/migrations/20251013_add_asaas_wallet_id_to_affiliates.sql` - Migração

### Edge Functions envolvidas:

1. `asaas-configure-split` - Cria splits
2. `asaas-process-splits` - Ativa splits após pagamento
3. `asaas-webhook` - Recebe confirmação e processa

---

## ✅ VALIDAÇÃO FINAL

Após configurar tudo, validar:

- [ ] Variável `RENUM_WALLET_ID` configurada no Supabase
- [ ] Migração executada (coluna `asaas_wallet_id` existe)
- [ ] Filiação de teste realizada
- [ ] Splits criados no banco (status PENDING)
- [ ] Pagamento simulado no Asaas
- [ ] Splits processados (status PROCESSED)
- [ ] Transferências visíveis no Asaas Dashboard

**Quando todos os itens estiverem ✅, o sistema de split está 100% funcional!**

---

**Criado em:** 13/10/2025  
**Última atualização:** 13/10/2025  
**Status:** Aguardando configuração manual de variáveis
