# 🚨 INSTRUÇÕES DE MIGRAÇÃO - PAINEL ADMINISTRATIVO

## ⚠️ ATENÇÃO: EXECUÇÃO MANUAL OBRIGATÓRIA

Estas migrações SQL **NÃO foram executadas automaticamente**.

Você deve executá-las manualmente no painel do Supabase.

---

## 📋 Ordem de Execução

Execute os scripts **NA ORDEM INDICADA**:

### 1️⃣ Correção de Subscription Plans
**Arquivo**: `supabase/migrations/20250108_fix_subscription_plans.sql`

**O que faz**:
- Adiciona coluna `member_type_id` na tabela `subscription_plans`
- Cria relacionamento com `member_types`
- Atualiza dados existentes
- Adiciona índices para performance

**Status**: ⏳ AGUARDANDO EXECUÇÃO

---

### 2️⃣ Criação de Audit Logs
**Arquivo**: `supabase/migrations/20250108_create_audit_logs.sql`

**O que faz**:
- Cria tabela `audit_logs` para registro de ações
- Configura índices para performance
- Configura RLS policies (apenas admins podem visualizar)
- Permite registro automático de todas operações CRUD

**Status**: ⏳ AGUARDANDO EXECUÇÃO

---

## 🔧 Como Executar

### Passo 1: Acessar o Painel do Supabase
1. Abra o navegador
2. Acesse: https://supabase.com/dashboard
3. Faça login na sua conta
4. Selecione o projeto COMADEMIG

### Passo 2: Abrir o Editor SQL
1. No menu lateral, clique em **"SQL Editor"**
2. Clique em **"New Query"**

### Passo 3: Executar Migração 1
1. Abra o arquivo: `supabase/migrations/20250108_fix_subscription_plans.sql`
2. **Copie TODO o conteúdo** do arquivo
3. **Cole** no Editor SQL do Supabase
4. Clique em **"Run"** (ou pressione Ctrl+Enter)
5. ✅ Aguarde a mensagem de sucesso
6. ⚠️ Se houver erro, **NÃO prossiga** - reporte o erro

### Passo 4: Executar Migração 2
1. Abra o arquivo: `supabase/migrations/20250108_create_audit_logs.sql`
2. **Copie TODO o conteúdo** do arquivo
3. **Cole** no Editor SQL do Supabase
4. Clique em **"Run"** (ou pressione Ctrl+Enter)
5. ✅ Aguarde a mensagem: "✅ Tabela audit_logs criada com sucesso!"
6. ⚠️ Se houver erro, **NÃO prossiga** - reporte o erro

### Passo 5: Validar Migração 2 (OPCIONAL mas RECOMENDADO)
1. Abra o arquivo: `supabase/migrations/VALIDAR_AUDIT_LOGS.sql`
2. **Copie TODO o conteúdo** do arquivo
3. **Cole** no Editor SQL do Supabase
4. Clique em **"Run"**
5. ✅ Verifique se todos os checks passaram
6. ⚠️ Se algum check falhar, reporte o problema

---

## ✅ Validação Pós-Execução

### Verificar Tabela subscription_plans
```sql
-- Executar no Editor SQL
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'subscription_plans';

-- Deve mostrar a coluna 'member_type_id'
```

### Verificar Tabela audit_logs
```sql
-- Executar no Editor SQL
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'audit_logs';

-- Deve mostrar todas as colunas: id, user_id, action, entity_type, etc.
```

### Verificar RLS Policies
```sql
-- Executar no Editor SQL
SELECT tablename, policyname 
FROM pg_policies 
WHERE tablename = 'audit_logs';

-- Deve mostrar as policies criadas
```

---

## 🐛 Solução de Problemas

### Erro: "relation already exists"
**Causa**: Tabela já foi criada anteriormente

**Solução**: 
- Verificar se a tabela já existe
- Se sim, pular esta migração
- Se não, verificar o erro específico

### Erro: "column already exists"
**Causa**: Coluna já foi adicionada anteriormente

**Solução**:
- Verificar se a coluna existe
- Se sim, pular esta parte da migração
- Se não, verificar o erro específico

### Erro: "permission denied"
**Causa**: Usuário sem permissões suficientes

**Solução**:
- Verificar se está logado como owner do projeto
- Verificar permissões do usuário no Supabase

---

## 📝 Checklist de Execução

Marque conforme for executando:

- [ ] Acessei o painel do Supabase
- [ ] Abri o Editor SQL
- [ ] Executei migração 1 (subscription_plans)
- [ ] ✅ Migração 1 executada com sucesso
- [ ] Executei migração 2 (audit_logs)
- [ ] ✅ Migração 2 executada com sucesso
- [ ] Validei tabela subscription_plans
- [ ] Validei tabela audit_logs
- [ ] Validei RLS policies
- [ ] ✅ Todas as migrações concluídas

---

## 🎯 Após Execução

Quando todas as migrações forem executadas com sucesso:

1. ✅ O sistema de audit log estará funcional
2. ✅ Todas as operações CRUD serão registradas
3. ✅ O schema de subscription_plans estará correto
4. ✅ O painel administrativo estará 100% funcional

---

## 🆘 Precisa de Ajuda?

Se encontrar problemas durante a execução:

1. **Copie a mensagem de erro completa**
2. **Anote qual migração estava executando**
3. **Reporte o problema com detalhes**
4. **NÃO tente executar as próximas migrações**

---

## 📊 Status das Migrações

| Migração | Arquivo | Status | Data |
|----------|---------|--------|------|
| 1 | 20250108_fix_subscription_plans.sql | ⏳ Pendente | - |
| 2 | 20250108_create_audit_logs.sql | ⏳ Pendente | - |

**Atualize esta tabela após executar cada migração!**

---

## ✅ Confirmação Final

Após executar TODAS as migrações, confirme:

- [ ] Todas as migrações foram executadas sem erros
- [ ] Todas as tabelas foram criadas/atualizadas
- [ ] Todas as validações passaram
- [ ] O sistema está funcionando corretamente

**Somente após esta confirmação, o sistema estará pronto para uso em produção!**
