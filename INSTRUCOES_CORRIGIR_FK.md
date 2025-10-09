# 🚨 CORREÇÃO URGENTE: Foreign Key Faltando

## Problema Identificado
O dashboard financeiro está quebrando porque **falta a Foreign Key** entre `user_subscriptions` e `subscription_plans`.

### Erro no Console:
```
Could not find a relationship between 'user_subscriptions' and 'subscription_plans' in the schema cache
```

## ✅ Solução

### PASSO 1: Executar Migração SQL
1. Abra o **Painel do Supabase** → **SQL Editor**
2. Copie o conteúdo do arquivo: `supabase/migrations/20250108_fix_user_subscriptions_fk.sql`
3. Cole no editor SQL
4. Clique em **RUN**

### PASSO 2: Verificar se Funcionou
Execute este comando Python para testar:
```bash
python verificar_relacionamentos.py
```

Deve mostrar:
```
✅ Relacionamento funciona!
```

### PASSO 3: Recarregar o Dashboard
1. Volte ao navegador
2. Recarregue a página do Dashboard Financeiro (F5)
3. Os erros 400 devem desaparecer

## 📋 O que a Migração Faz
- Remove constraint antiga (se existir)
- Adiciona Foreign Key correta: `subscription_plan_id` → `subscription_plans(id)`
- Cria índice para melhorar performance
- Valida que tudo foi criado corretamente

## ⚠️ IMPORTANTE
Sem essa Foreign Key, o Supabase não consegue fazer os JOINs automáticos que o código frontend espera!
