# 🚀 INSTRUÇÕES: Executar Migrations da Fase 2

**Data:** 09/01/2025  
**Fase:** 2 - Estrutura do Banco de Dados  
**Status:** ⏳ AGUARDANDO EXECUÇÃO MANUAL

---

## 📋 Migrations Criadas

Foram criadas **5 migrations SQL** que devem ser executadas **NA ORDEM**:

1. ✅ `20250109_create_servicos_table.sql`
2. ✅ `20250109_create_servico_exigencias_table.sql`
3. ✅ `20250109_create_solicitacoes_servicos_table.sql`
4. ✅ `20250109_rls_policies_servicos.sql`
5. ✅ `20250109_rls_policies_solicitacoes.sql`

---

## 🔧 Como Executar

### Opção 1: Via Painel do Supabase (RECOMENDADO)

1. **Acesse o Painel do Supabase**
   - URL: https://supabase.com/dashboard
   - Projeto: amkelczfwazutrciqtlk

2. **Abra o SQL Editor**
   - Menu lateral → SQL Editor
   - Ou: https://supabase.com/dashboard/project/amkelczfwazutrciqtlk/sql

3. **Execute cada migration NA ORDEM:**

   **Migration 1:** `20250109_create_servicos_table.sql`
   - Copie o conteúdo do arquivo
   - Cole no SQL Editor
   - Clique em "RUN"
   - Aguarde mensagem: "✅ Tabela servicos criada com sucesso!"

   **Migration 2:** `20250109_create_servico_exigencias_table.sql`
   - Copie o conteúdo do arquivo
   - Cole no SQL Editor
   - Clique em "RUN"
   - Aguarde mensagem: "✅ Tabela servico_exigencias criada com sucesso!"

   **Migration 3:** `20250109_create_solicitacoes_servicos_table.sql`
   - Copie o conteúdo do arquivo
   - Cole no SQL Editor
   - Clique em "RUN"
   - Aguarde mensagem: "✅ Tabela solicitacoes_servicos criada com sucesso!"

   **Migration 4:** `20250109_rls_policies_servicos.sql`
   - Copie o conteúdo do arquivo
   - Cole no SQL Editor
   - Clique em "RUN"
   - Aguarde mensagem: "✅ RLS policies configuradas com sucesso..."

   **Migration 5:** `20250109_rls_policies_solicitacoes.sql`
   - Copie o conteúdo do arquivo
   - Cole no SQL Editor
   - Clique em "RUN"
   - Aguarde mensagens de confirmação

---

## ✅ Validação Pós-Execução

Após executar todas as migrations, **VALIDE** que tudo foi criado corretamente:

### 1. Verificar Tabelas Criadas

Execute no SQL Editor:

```sql
SELECT table_name, 
       (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as num_columns
FROM information_schema.tables t
WHERE table_schema = 'public' 
AND table_name IN ('servicos', 'servico_exigencias', 'solicitacoes_servicos')
ORDER BY table_name;
```

**Resultado Esperado:**
```
servicos                  | 13 colunas
servico_exigencias        | 9 colunas
solicitacoes_servicos     | 15 colunas
```

### 2. Verificar Índices Criados

```sql
SELECT tablename, indexname
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename IN ('servicos', 'servico_exigencias', 'solicitacoes_servicos')
ORDER BY tablename, indexname;
```

**Resultado Esperado:** Pelo menos 10 índices criados

### 3. Verificar RLS Ativo

```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('servicos', 'servico_exigencias', 'solicitacoes_servicos');
```

**Resultado Esperado:** Todas as tabelas com `rowsecurity = true`

### 4. Verificar Policies Criadas

```sql
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE tablename IN ('servicos', 'servico_exigencias', 'solicitacoes_servicos')
ORDER BY tablename, policyname;
```

**Resultado Esperado:** Pelo menos 11 policies criadas

### 5. Testar Acesso Público a Serviços

Execute via Python ou diretamente:

```python
from supabase import create_client

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# Deve funcionar (SELECT público em serviços ativos)
result = supabase.table('servicos').select('*').execute()
print(f"✅ SELECT em servicos: {len(result.data)} registros")

# Deve funcionar (SELECT público em exigências)
result = supabase.table('servico_exigencias').select('*').execute()
print(f"✅ SELECT em servico_exigencias: {len(result.data)} registros")

# Deve funcionar (mas retornar 0 se não autenticado)
result = supabase.table('solicitacoes_servicos').select('*').execute()
print(f"✅ SELECT em solicitacoes_servicos: {len(result.data)} registros")
```

---

## ⚠️ Problemas Comuns

### Erro: "relation already exists"
**Causa:** Tabela já foi criada anteriormente  
**Solução:** Verificar se migration já foi executada. Se sim, pular para próxima.

### Erro: "permission denied"
**Causa:** Usuário não tem permissão para criar tabelas  
**Solução:** Usar usuário admin do Supabase (postgres)

### Erro: "foreign key constraint"
**Causa:** Tabela referenciada não existe  
**Solução:** Executar migrations na ordem correta

### Erro: "function uuid_generate_v4() does not exist"
**Causa:** Extensão uuid-ossp não está ativa  
**Solução:** Executar `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`

---

## 📊 Estrutura Criada

### Tabela: `servicos`
- **Propósito:** Serviços unificados (certidões + regularização + outros)
- **Colunas:** 13
- **Índices:** 4
- **RLS:** ✅ Ativo
- **Policies:** 5

### Tabela: `servico_exigencias`
- **Propósito:** Exigências/documentos de cada serviço
- **Colunas:** 9
- **Índices:** 2
- **RLS:** ✅ Ativo
- **Policies:** 3

### Tabela: `solicitacoes_servicos`
- **Propósito:** Solicitações dos usuários
- **Colunas:** 15
- **Índices:** 6
- **RLS:** ✅ Ativo
- **Policies:** 4

---

## 🎯 Próximos Passos

Após executar e validar as migrations:

1. ✅ Marcar Tarefa 9 como concluída
2. ✅ Iniciar Fase 3: Migração de Dados
   - Migrar valores_certidoes → servicos
   - Migrar servicos_regularizacao → servicos
3. ✅ Validar dados migrados
4. ✅ Iniciar implementação dos hooks e componentes

---

## 📝 Checklist de Execução

- [ ] Migration 1 executada (servicos)
- [ ] Migration 2 executada (servico_exigencias)
- [ ] Migration 3 executada (solicitacoes_servicos)
- [ ] Migration 4 executada (RLS servicos)
- [ ] Migration 5 executada (RLS solicitacoes)
- [ ] Validação 1: Tabelas criadas ✓
- [ ] Validação 2: Índices criados ✓
- [ ] Validação 3: RLS ativo ✓
- [ ] Validação 4: Policies criadas ✓
- [ ] Validação 5: Acesso testado ✓

---

**⚠️ IMPORTANTE:** Não prossiga para a Fase 3 sem validar que TODAS as migrations foram executadas com sucesso!

**Após validação, confirme para prosseguir para a migração de dados.**
