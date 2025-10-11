# 🚨 INSTRUÇÕES OBRIGATÓRIAS - EXECUÇÃO MANUAL DE MIGRAÇÃO

## ⚠️ ATENÇÃO: EXECUÇÃO MANUAL NECESSÁRIA

Este script SQL foi criado mas **NÃO foi executado automaticamente**.

---

## 📋 O QUE FOI FEITO

### ✅ Análise Prévia Completa
- ✅ Conectado ao banco real via Python
- ✅ Verificado estado atual de todas as tabelas
- ✅ Confirmado que `asaas_subscription_id` NÃO EXISTE
- ✅ Confirmado que sistema nunca foi usado (tabelas vazias)
- ✅ Avaliado impacto: **BAIXO RISCO** 🟢

### ✅ Código Atualizado
- ✅ Hook `useFiliacaoPayment.ts` atualizado para usar assinaturas
- ✅ Edge Function `asaas-create-subscription` criada
- ✅ Hook `useAsaasSubscriptions.ts` criado
- ✅ Componente `MemberTypeSelector.tsx` com seleção de periodicidade

### ⏳ PENDENTE: Migração do Banco de Dados
- ⏳ Script SQL criado mas NÃO executado
- ⏳ Colunas `asaas_subscription_id` ainda não existem

---

## 🎯 VOCÊ DEVE EXECUTAR AGORA

### PASSO 1: Abrir Supabase Dashboard
1. Acesse: https://supabase.com/dashboard
2. Selecione o projeto COMADEMIG
3. Vá em **SQL Editor** no menu lateral

### PASSO 2: Copiar e Executar o Script
1. Abra o arquivo: `supabase/migrations/20250110_add_asaas_subscription_fields.sql`
2. **COPIE TODO O CONTEÚDO** do arquivo
3. **COLE** no SQL Editor do Supabase
4. Clique em **RUN** (ou pressione Ctrl+Enter)

### PASSO 3: Verificar Sucesso
Você deve ver mensagens como:
```
✅ Coluna asaas_subscription_id adicionada em user_subscriptions
✅ Coluna asaas_customer_id adicionada em profiles
```

### PASSO 4: Confirmar Aqui
Após executar, responda:
- ✅ "Migração executada com sucesso"
- ❌ "Erro ao executar: [descrever erro]"

---

## 📄 CONTEÚDO DO SCRIPT

**Arquivo:** `supabase/migrations/20250110_add_asaas_subscription_fields.sql`

**O que faz:**
1. Adiciona coluna `asaas_subscription_id` em `user_subscriptions`
2. Adiciona colunas `asaas_customer_id` e `asaas_subscription_id` em `profiles`
3. Cria índices para melhorar performance
4. Adiciona comentários explicativos
5. Valida que colunas foram criadas

**Impacto:**
- ✅ Não destrutivo (apenas adiciona colunas)
- ✅ Não afeta dados existentes
- ✅ Não quebra funcionalidades
- ✅ Seguro para executar

---

## ⏭️ APÓS EXECUTAR A MIGRAÇÃO

### Próximos Passos:
1. ✅ Confirmar que migração foi executada
2. 🔄 Atualizar código para usar novo campo
3. 🧪 Testar fluxo completo de filiação
4. 📊 Verificar criação de assinatura no Asaas

### Código a Descomentar:
Após migração, no arquivo `src/hooks/useFiliacaoPayment.ts`, descomentar:
```typescript
// NOTA: asaas_subscription_id será adicionado após executar migração SQL
// asaas_subscription_id: subscriptionResult.id,
```

Para:
```typescript
asaas_subscription_id: subscriptionResult.id,
```

---

## 🆘 EM CASO DE ERRO

Se encontrar erro ao executar, me informe:
1. Mensagem de erro completa
2. Linha que causou o erro
3. Screenshot se possível

Vou ajudar a resolver!

---

## ✅ CHECKLIST

Antes de prosseguir, confirme:
- [ ] Abri o Supabase Dashboard
- [ ] Copiei o script SQL completo
- [ ] Colei no SQL Editor
- [ ] Executei o script (RUN)
- [ ] Vi mensagens de sucesso
- [ ] Confirmei que colunas foram criadas

**AGUARDANDO SUA CONFIRMAÇÃO PARA PROSSEGUIR** ⏳
