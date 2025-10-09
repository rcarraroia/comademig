# 🚨 CORREÇÃO URGENTE: Foreign Key Faltando + Dados Órfãos

## Problema Identificado
O dashboard financeiro está quebrando por **2 motivos**:
1. **Falta a Foreign Key** entre `user_subscriptions` e `subscription_plans`
2. **Existem dados órfãos** - registros apontando para planos que não existem

### Erros no Console:
```
Could not find a relationship between 'user_subscriptions' and 'subscription_plans' in the schema cache

Key (subscription_plan_id)=(aefbb7b3-c1dd-4f46-ba4b-6af8bdbe9640) is not present in table "subscription_plans"
```

## ✅ Solução (EXECUTAR NA ORDEM!)

### PASSO 1: Limpar Dados Órfãos (PRIMEIRO!)
1. Abra o **Painel do Supabase** → **SQL Editor**
2. Copie o conteúdo do arquivo: `supabase/migrations/20250108_cleanup_orphan_subscriptions.sql`
3. Cole no editor SQL
4. Clique em **RUN**
5. **Verifique a saída** - vai mostrar quantos registros órfãos foram encontrados e corrigidos

### PASSO 2: Adicionar Foreign Key (DEPOIS!)
1. No mesmo **SQL Editor**
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

## 📋 O que Cada Migração Faz

### Migração 1 (Cleanup):
- Identifica registros órfãos em `user_subscriptions`
- Mostra os registros problemáticos para auditoria
- **Seta subscription_plan_id como NULL** nos registros órfãos (opção segura)
- Valida que não restaram órfãos

### Migração 2 (Foreign Key):
- Remove constraint antiga (se existir)
- Adiciona Foreign Key correta: `subscription_plan_id` → `subscription_plans(id)`
- Cria índice para melhorar performance
- Valida que tudo foi criado corretamente

## ⚠️ IMPORTANTE
- **Execute na ORDEM correta** (cleanup primeiro, FK depois)
- A limpeza seta `subscription_plan_id = NULL` nos órfãos (não deleta registros)
- Sem a Foreign Key, o Supabase não consegue fazer os JOINs automáticos
- Depois de executar, os usuários afetados precisarão reativar suas assinaturas
