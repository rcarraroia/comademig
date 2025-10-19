# 📋 PROCESSO DE AUDITORIA E LIMPEZA COMPLETA DO BANCO DE DADOS

**Documento:** Guia para auditoria e limpeza segura do banco de dados Supabase  
**Criado em:** 17/10/2025  
**Status:** 📌 Para aplicação futura  
**Objetivo:** Documentar processo seguro para identificar e remover tabelas não utilizadas

---

## 🎯 OBJETIVO

Realizar auditoria completa do banco de dados para:
1. Documentar TODAS as tabelas existentes
2. Identificar tabelas em uso vs não utilizadas
3. Remover tabelas desnecessárias de forma segura
4. Manter banco organizado e performático

---

## ⚠️ QUANDO APLICAR ESTE PROCESSO

- ✅ Após grandes implementações (como esta spec)
- ✅ Quando houver muitas tabelas vazias
- ✅ Antes de deploys importantes
- ✅ Periodicamente (trimestral/semestral)
- ✅ Quando performance do banco degradar

---

## 📊 FASE 1: BACKUP E DOCUMENTAÇÃO

### 1.1 Fazer Backup Completo

```powershell
# Backup do schema completo
supabase db dump --schema public -f backup_schema_$(Get-Date -Format "yyyyMMdd_HHmmss").sql

# Backup dos dados (opcional, se quiser dados também)
supabase db dump --data-only -f backup_data_$(Get-Date -Format "yyyyMMdd_HHmmss").sql
```

**Resultado:** Arquivo SQL com backup completo

---

### 1.2 Listar TODAS as Tabelas

**Opção A - Via Dashboard:**
1. Acessar: https://supabase.com/dashboard/project/amkelczfwazutrciqtlk/sql
2. Executar query:

```sql
-- Lista TODAS as tabelas
SELECT 
    tablename as "Tabela",
    schemaname as "Schema",
    tableowner as "Owner"
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

**Opção B - Via Script Python:**

```python
# Usar script: analyze_database_complete.py
# Modificar para descobrir tabelas automaticamente
```

---

### 1.3 Contar Registros em TODAS as Tabelas

```sql
-- Conta registros em todas as tabelas
SELECT 
    schemaname as "Schema",
    tablename as "Tabela",
    n_live_tup as "Registros",
    n_dead_tup as "Registros Mortos",
    last_vacuum as "Último Vacuum",
    last_autovacuum as "Último Autovacuum"
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY n_live_tup DESC;
```

---

### 1.4 Listar Estrutura de TODAS as Tabelas

```sql
-- Lista todas as colunas de todas as tabelas
SELECT 
    table_name as "Tabela",
    column_name as "Coluna",
    data_type as "Tipo",
    is_nullable as "Nullable",
    column_default as "Padrão"
FROM information_schema.columns
WHERE table_schema = 'public'
ORDER BY table_name, ordinal_position;
```

---

### 1.5 Listar Relacionamentos (Foreign Keys)

```sql
-- Lista todas as foreign keys
SELECT
    tc.table_name as "Tabela",
    kcu.column_name as "Coluna",
    ccu.table_name AS "Tabela Referenciada",
    ccu.column_name AS "Coluna Referenciada"
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
ORDER BY tc.table_name;
```

---

## 🔍 FASE 2: ANÁLISE DE USO

### 2.1 Verificar Uso no Código

Para cada tabela encontrada, buscar referências no código:

```powershell
# Buscar referências no código TypeScript/JavaScript
Get-ChildItem -Path src -Recurse -Include *.ts,*.tsx,*.js,*.jsx | 
    Select-String -Pattern "nome_da_tabela" | 
    Select-Object Path, LineNumber, Line

# Ou usar grep
grep -r "nome_da_tabela" src/
```

---

### 2.2 Verificar Uso em Migrações

```powershell
# Buscar em migrações
Get-ChildItem -Path supabase/migrations -Filter *.sql | 
    Select-String -Pattern "nome_da_tabela"
```

---

### 2.3 Criar Planilha de Análise

Criar arquivo `AUDITORIA_TABELAS.md` com:

```markdown
| Tabela | Registros | Usado no Código | Foreign Keys | Status | Ação |
|--------|-----------|-----------------|--------------|--------|------|
| users  | 150       | ✅ Sim          | 5 tabelas    | Ativo  | Manter |
| temp_x | 0         | ❌ Não          | Nenhuma      | Vazia  | Deletar |
```

---

## 🗑️ FASE 3: IDENTIFICAÇÃO DE TABELAS A REMOVER

### 3.1 Critérios para Remoção

Uma tabela pode ser removida SE:
- ✅ Está vazia (0 registros)
- ✅ Não tem referências no código
- ✅ Não tem foreign keys apontando para ela
- ✅ Não faz parte de funcionalidade futura planejada
- ✅ Não é tabela do sistema (auth, storage, etc)

### 3.2 Tabelas que NUNCA devem ser removidas

- ❌ Tabelas com dados (mesmo que poucos)
- ❌ Tabelas do sistema Supabase (auth.*, storage.*)
- ❌ Tabelas com foreign keys de outras tabelas
- ❌ Tabelas de funcionalidades planejadas
- ❌ Tabelas de auditoria/logs

---

## ✅ FASE 4: APROVAÇÃO E PLANEJAMENTO

### 4.1 Criar Lista de Remoção

```markdown
# TABELAS PARA REMOÇÃO

## Aprovadas para Deleção (X tabelas):
1. tabela_x - Vazia, sem uso, sem FK
2. tabela_y - Vazia, sem uso, sem FK
3. tabela_z - Vazia, sem uso, sem FK

## Manter (Y tabelas):
1. tabela_a - Tem dados
2. tabela_b - Usada no código
3. tabela_c - Funcionalidade futura
```

### 4.2 Obter Aprovação

- [ ] Revisar lista com equipe
- [ ] Confirmar que nenhuma tabela importante será deletada
- [ ] Documentar motivo de cada remoção
- [ ] Obter aprovação final

---

## 🚀 FASE 5: EXECUÇÃO DA LIMPEZA

### 5.1 Criar Migração de Limpeza

```powershell
# Criar nova migração
supabase migration new cleanup_unused_tables_audit

# Editar arquivo gerado
```

### 5.2 Escrever SQL de Remoção

```sql
-- ============================================
-- LIMPEZA DE TABELAS - AUDITORIA COMPLETA
-- ============================================
-- Data: [DATA]
-- Aprovado por: [NOME]
-- Tabelas a remover: [QUANTIDADE]
-- ============================================

-- Deletar tabelas aprovadas
DROP TABLE IF EXISTS tabela_x CASCADE;
DROP TABLE IF EXISTS tabela_y CASCADE;
DROP TABLE IF EXISTS tabela_z CASCADE;

-- ============================================
-- VERIFICAÇÃO
-- ============================================
-- Total de tabelas removidas: X
-- Backup realizado: backup_schema_YYYYMMDD.sql
-- ============================================
```

### 5.3 Aplicar Migração

```powershell
# Aplicar migração
supabase db push

# Verificar resultado
supabase migration list
```

---

## 🔍 FASE 6: VALIDAÇÃO PÓS-LIMPEZA

### 6.1 Verificar Tabelas Restantes

```sql
-- Contar tabelas após limpeza
SELECT COUNT(*) as "Total de Tabelas"
FROM pg_tables
WHERE schemaname = 'public';
```

### 6.2 Testar Sistema

- [ ] Testar funcionalidades principais
- [ ] Verificar se nada quebrou
- [ ] Checar logs de erro
- [ ] Validar com usuários

### 6.3 Documentar Resultado

Criar arquivo `RESULTADO_AUDITORIA.md`:

```markdown
# Resultado da Auditoria e Limpeza

**Data:** [DATA]
**Executado por:** [NOME]

## Antes:
- Total de tabelas: X
- Tabelas com dados: Y
- Tabelas vazias: Z

## Depois:
- Total de tabelas: A
- Tabelas com dados: Y (mantido)
- Tabelas vazias: B (reduzido)

## Tabelas Removidas: [LISTA]

## Benefícios:
- Banco mais organizado
- Melhor performance
- Mais fácil de manter
```

---

## 📋 CHECKLIST COMPLETO

### Preparação:
- [ ] Fazer backup completo do schema
- [ ] Fazer backup dos dados (opcional)
- [ ] Documentar estado atual

### Análise:
- [ ] Listar TODAS as tabelas
- [ ] Contar registros em cada tabela
- [ ] Verificar uso no código
- [ ] Verificar foreign keys
- [ ] Criar planilha de análise

### Planejamento:
- [ ] Identificar tabelas a remover
- [ ] Aplicar critérios de remoção
- [ ] Criar lista de remoção
- [ ] Obter aprovação

### Execução:
- [ ] Criar migração de limpeza
- [ ] Escrever SQL de remoção
- [ ] Aplicar migração
- [ ] Verificar resultado

### Validação:
- [ ] Testar sistema completo
- [ ] Verificar logs de erro
- [ ] Documentar resultado
- [ ] Commit no Git

---

## 🛠️ FERRAMENTAS E SCRIPTS

### Scripts Criados:
1. `analyze_database_complete.py` - Análise automática
2. `list_all_tables.sql` - Query para listar tabelas
3. `cleanup_migrations.ps1` - Limpeza de migrações

### Comandos Úteis:

```powershell
# Backup
supabase db dump --schema public -f backup.sql

# Listar migrações
supabase migration list

# Criar migração
supabase migration new nome_descritivo

# Aplicar migrações
supabase db push

# Verificar status
supabase status
```

---

## ⚠️ AVISOS IMPORTANTES

### ⛔ NUNCA:
- Deletar tabelas sem backup
- Deletar tabelas com dados sem análise
- Deletar tabelas do sistema Supabase
- Aplicar em produção sem testar

### ✅ SEMPRE:
- Fazer backup antes
- Verificar uso no código
- Obter aprovação
- Testar após limpeza
- Documentar tudo

---

## 📚 REFERÊNCIAS

- Documentação Supabase CLI: https://supabase.com/docs/reference/cli
- PostgreSQL pg_tables: https://www.postgresql.org/docs/current/view-pg-tables.html
- PostgreSQL pg_stat_user_tables: https://www.postgresql.org/docs/current/monitoring-stats.html

---

## 📝 HISTÓRICO DE AUDITORIAS

### Auditoria 1 - 17/10/2025
- **Escopo:** Limpeza inicial de 3 tabelas (noticias, multimidia, eventos)
- **Resultado:** 3 tabelas removidas com sucesso
- **Método:** Migração via Supabase CLI
- **Status:** ✅ Concluído

### Próxima Auditoria: [A DEFINIR]
- **Escopo:** Auditoria completa de todas as tabelas
- **Método:** Seguir este processo documentado

---

**FIM DO DOCUMENTO**
