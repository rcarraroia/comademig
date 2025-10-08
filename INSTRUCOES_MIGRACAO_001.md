# 🚨 INSTRUÇÕES PARA EXECUÇÃO MANUAL - MIGRAÇÃO 001

## ⚠️ ATENÇÃO: EXECUÇÃO MANUAL OBRIGATÓRIA

**Kiro AI NÃO PODE EXECUTAR esta migração automaticamente.**
**VOCÊ DEVE executar manualmente no painel do Supabase.**

## 📋 MIGRAÇÃO: Correção Schema Cargos e Planos

### 🎯 Objetivo
Corrigir o relacionamento entre `member_types` e `subscription_plans` para permitir múltiplas periodicidades por cargo (mensal, semestral, anual).

### 🔍 Problemas que serão corrigidos:
- ✅ Relacionamento 1:N entre member_types → subscription_plans
- ✅ Criação de planos padrão para todos os cargos existentes
- ✅ Correção de TODOS os registros órfãos em user_subscriptions (genérico)
- ✅ Adição segura de constraints NOT NULL
- ✅ Inclusão da coluna recurrence obrigatória (sempre 'monthly' devido ao constraint)
- ✅ Limpeza de dados inconsistentes de migrações anteriores
- ✅ Políticas RLS adequadas (corrigidas para usar cargo/tipo_membro)
- ✅ Triggers para updated_at

## 📝 INSTRUÇÕES DE EXECUÇÃO

### PASSO 1: Acessar o Painel Supabase
1. Abra o navegador e acesse: https://supabase.com/dashboard
2. Faça login na sua conta
3. Selecione o projeto COMADEMIG
4. No menu lateral, clique em **"SQL Editor"**

### PASSO 2: Executar a Migração
1. Copie TODO o conteúdo do arquivo: `supabase/migrations/001_fix_member_types_subscription_plans.sql`
2. Cole no editor SQL do Supabase
3. Clique no botão **"Run"** (▶️)
4. Aguarde a execução completa

### PASSO 3: Verificar Resultado
Após a execução, você deve ver:

```
✅ Resultado esperado na query final:

cargo          | plano              | price  | duration_months | is_active
---------------|-------------------|--------|-----------------|----------
Bispo          | Bispo - Mensal    | 10.00  | 1              | true
Bispo          | Bispo - Semestral | 55.00  | 6              | true  
Bispo          | Bispo - Anual     | 100.00 | 12             | true
Pastor         | Pastor - Mensal   | 15.00  | 1              | true
Pastor         | Pastor - Semestral| 85.00  | 6              | true
Pastor         | Pastor - Anual    | 150.00 | 12             | true
... (e assim por diante para todos os cargos)

NOTA: 
- Todos os planos terão recurrence='monthly' devido ao constraint do banco
- A diferenciação entre mensal/semestral/anual é feita pela coluna duration_months
- Políticas RLS usam profiles.cargo/tipo_membro (não existe coluna 'role')
```

### PASSO 4: Confirmar Contagem
A query final deve mostrar:
```
tabela            | total | ativos
------------------|-------|-------
member_types      | 7     | 6-7
subscription_plans| 18-21 | 18-21

user_subscriptions_corrigidos:
total_registros | com_plano_valido | ainda_orfaos
1               | 1                | 0
```

## ✅ CONFIRMAÇÃO NECESSÁRIA

**Após executar o script, confirme:**

1. ✅ Script executado sem erros
2. ✅ Todos os cargos têm 3 planos (mensal, semestral, anual)  
3. ✅ Tabela subscription_plans não está mais vazia
4. ✅ Registro órfão em user_subscriptions foi corrigido

## 🚨 EM CASO DE ERRO

Se houver algum erro durante a execução:

1. **Copie a mensagem de erro completa**
2. **Informe qual PASSO falhou**
3. **NÃO tente executar novamente** sem análise
4. **Solicite ajuda** fornecendo o erro específico

## 📞 PRÓXIMOS PASSOS

Após confirmar que a migração foi executada com sucesso:

1. ✅ Confirme: "Migração 001 executada com sucesso"
2. 🔄 Prosseguiremos para a **Tarefa 2** (Criar tabelas faltantes)
3. 🔧 Depois implementaremos os hooks corrigidos

---

**⚠️ LEMBRE-SE: Esta migração é CRÍTICA para o funcionamento do sistema de filiação!**