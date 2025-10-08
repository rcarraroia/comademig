# 🚨 INSTRUÇÕES PARA EXECUÇÃO MANUAL - MIGRAÇÃO 002

## ⚠️ ATENÇÃO: EXECUÇÃO MANUAL OBRIGATÓRIA

**Kiro AI NÃO PODE EXECUTAR esta migração automaticamente.**
**VOCÊ DEVE executar manualmente no painel do Supabase.**

## 📋 MIGRAÇÃO: Criar Tabelas Faltantes do Sistema

### 🎯 Objetivo
Criar todas as tabelas faltantes para o sistema de suporte, auditoria e financeiro.

### 🔍 Tabelas que serão criadas:
- ✅ **support_categories** - Categorias de suporte (7 categorias padrão)
- ✅ **support_tickets** - Tickets de atendimento
- ✅ **support_messages** - Mensagens dos tickets
- ✅ **user_activity_log** - Logs de auditoria do sistema
- ✅ **financial_transactions** - Histórico de transações financeiras

### 🛡️ Recursos incluídos:
- ✅ Políticas RLS adequadas por tipo de usuário
- ✅ Índices otimizados para performance
- ✅ Triggers para updated_at automático
- ✅ Sistema de auditoria automática
- ✅ Função para criar transações financeiras
- ✅ Constraints de validação

## 📝 INSTRUÇÕES DE EXECUÇÃO

### PASSO 1: Acessar o Painel Supabase
1. Abra o navegador e acesse: https://supabase.com/dashboard
2. Faça login na sua conta
3. Selecione o projeto COMADEMIG
4. No menu lateral, clique em **"SQL Editor"**

### PASSO 2: Executar a Migração
1. Copie TODO o conteúdo do arquivo: `supabase/migrations/002_create_missing_tables.sql`
2. Cole no editor SQL do Supabase
3. Clique no botão **"Run"** (▶️)
4. Aguarde a execução completa

### PASSO 3: Verificar Resultado
Após a execução, você deve ver:

```
✅ Resultado esperado na query final:

tabela                  | registros
------------------------|----------
support_categories      | 7
support_tickets         | 0
support_messages        | 0
user_activity_log       | 0-3 (triggers de auditoria podem gerar logs)
financial_transactions  | 0
```

### PASSO 4: Verificar Categorias de Suporte
A segunda query deve mostrar:

```
✅ Categorias criadas:

name                    | description                           | sort_order | is_active
------------------------|---------------------------------------|------------|----------
Dúvidas sobre Filiação  | Questões sobre processo de filiação   | 1          | true
Problemas Financeiros   | Pagamentos, boletos, cobranças        | 2          | true
Certidões              | Solicitação e emissão de certidões    | 3          | true
Regularização          | Processos de regularização            | 4          | true
Técnico/Sistema        | Problemas técnicos e bugs             | 5          | true
Alteração Cadastral    | Mudança de dados pessoais             | 6          | true
Outros                 | Outras questões                       | 99         | true
```

## ✅ CONFIRMAÇÃO NECESSÁRIA

**Após executar o script, confirme:**

1. ✅ Script executado sem erros
2. ✅ 5 tabelas criadas com sucesso
3. ✅ 7 categorias de suporte inseridas
4. ✅ Índices e triggers criados
5. ✅ Políticas RLS ativas

## 🚨 EM CASO DE ERRO

Se houver algum erro durante a execução:

1. **Copie a mensagem de erro completa**
2. **Informe qual PASSO falhou**
3. **NÃO tente executar novamente** sem análise
4. **Solicite ajuda** fornecendo o erro específico

## 📞 PRÓXIMOS PASSOS

Após confirmar que a migração foi executada com sucesso:

1. ✅ Confirme: "Migração 002 executada com sucesso"
2. 🔄 Prosseguiremos para a **Tarefa 3** (Implementar hooks corrigidos)
3. 🔧 Depois corrigiremos o componente MemberTypeManagement

---

**⚠️ IMPORTANTE: Esta migração cria a base para o sistema de suporte e auditoria!**