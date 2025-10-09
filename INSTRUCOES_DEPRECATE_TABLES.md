# 🚨 INSTRUÇÕES: Marcar Tabelas Antigas como Deprecated

## 📋 Contexto
Após a migração bem-sucedida dos dados para a nova estrutura, precisamos marcar as tabelas antigas como deprecated para evitar uso acidental.

## ✅ Pré-requisitos
- ✅ Migrations da Fase 2 executadas com sucesso
- ✅ Dados migrados (10 serviços: 5 certidões + 5 regularização)
- ✅ Validação completa passou (Score: 6/6 - 100%)

## 📝 Script a Executar

### Script: `20250109_deprecate_old_tables.sql`

**Localização:** `supabase/migrations/20250109_deprecate_old_tables.sql`

**O que faz:**
- Adiciona comentários de depreciação em 5 tabelas antigas
- Marca data de depreciação (2025-01-09)
- Valida que todos os comentários foram aplicados

## 🎯 Passo a Passo

### 1. Abrir Editor SQL do Supabase
1. Acesse: https://supabase.com/dashboard/project/amkelczfwazutrciqtlk
2. Clique em **SQL Editor** no menu lateral
3. Clique em **New Query**

### 2. Copiar e Colar o Script
1. Abra o arquivo: `supabase/migrations/20250109_deprecate_old_tables.sql`
2. Copie TODO o conteúdo
3. Cole no Editor SQL do Supabase

### 3. Executar o Script
1. Clique no botão **Run** (ou pressione Ctrl+Enter)
2. Aguarde a execução

### 4. Verificar Resultado Esperado

Você deve ver mensagens como:

```
NOTICE: ✅ Tabelas marcadas como deprecated: 5
NOTICE: ✅ SUCESSO: Todas as 5 tabelas antigas foram marcadas como deprecated
```

## ✅ Validação Pós-Execução

Execute esta query para confirmar:

```sql
SELECT 
  c.relname as tabela,
  d.description as comentario
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
LEFT JOIN pg_description d ON d.objoid = c.oid AND d.objsubid = 0
WHERE n.nspname = 'public'
  AND c.relname IN (
    'valores_certidoes', 
    'certidoes', 
    'solicitacoes_certidoes',
    'servicos_regularizacao', 
    'solicitacoes_regularizacao'
  )
ORDER BY c.relname;
```

**Resultado esperado:** 5 linhas com comentários contendo "⚠️ DEPRECATED"

## 📊 Tabelas Afetadas

| Tabela Antiga | Status | Nova Tabela |
|---------------|--------|-------------|
| valores_certidoes | ⚠️ DEPRECATED | servicos (categoria: certidao) |
| certidoes | ⚠️ DEPRECATED | servicos |
| solicitacoes_certidoes | ⚠️ DEPRECATED | solicitacoes_servicos |
| servicos_regularizacao | ⚠️ DEPRECATED | servicos (categoria: regularizacao) |
| solicitacoes_regularizacao | ⚠️ DEPRECATED | solicitacoes_servicos |

## ⚠️ Importante

- ✅ Esta operação é **SEGURA** - apenas adiciona comentários
- ✅ **NÃO deleta** dados ou estruturas
- ✅ **NÃO afeta** o funcionamento atual
- ✅ Serve apenas como **documentação** e **aviso**

## 🔧 Troubleshooting

### Erro: "permission denied"
**Solução:** Certifique-se de estar usando uma conexão com permissões de admin

### Erro: "relation does not exist"
**Solução:** Verifique se as migrations anteriores foram executadas corretamente

### Nenhuma mensagem de NOTICE aparece
**Solução:** Execute a query de validação manualmente para confirmar

## 📋 Próximos Passos

Após executar com sucesso:

1. ✅ Confirmar execução
2. ➡️ Iniciar **Fase 4: Implementação dos Hooks**
3. ➡️ Criar hooks customizados para queries
4. ➡️ Implementar componentes do frontend

## ⏱️ Tempo Estimado
- **Execução:** 30 segundos
- **Validação:** 1 minuto
- **Total:** ~2 minutos

---

**Data de criação:** 2025-01-09  
**Fase:** 3 - Migração de Dados (Tarefa 46)
