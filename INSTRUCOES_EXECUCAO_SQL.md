# 🎯 INSTRUÇÕES PARA EXECUTAR SCRIPTS SQL - CORREÇÃO DO SISTEMA DE FILIAÇÃO

## 📋 PROBLEMA IDENTIFICADO

Após análise do banco de dados REAL (não local), descobri:

### ❌ Problema Real:
- Tabela `member_type_subscriptions` tem **6 registros**
- **TODOS os 6 registros** têm `subscription_plan_id = NULL`
- Isso quebra a query unificada do frontend
- Usuários não conseguem ver planos ao selecionar tipo de membro

### ✅ Estrutura Real da Tabela:
```
member_type_subscriptions:
  - id (UUID)
  - member_type_id (UUID) ✅ Preenchido
  - subscription_plan_id (UUID) ❌ NULL em todos!
  - created_at (timestamp)
  - created_by (UUID nullable)
  
❌ NÃO TEM: updated_at
```

### 📊 Dados Encontrados:
- **Tipos ativos:** 2 (Diácono, Membro)
- **Planos ativos:** 15 (5 mensais, 5 semestrais, 5 anuais)
- **Relacionamentos:** 6 (todos com subscription_plan_id NULL)

---

## 🚀 PASSO A PASSO PARA CORREÇÃO

### PASSO 1: Executar Script Principal

1. Abra o Supabase Dashboard
2. Vá em **SQL Editor**
3. Copie o conteúdo do arquivo: `supabase/migrations/fix_filiacao_system.sql`
4. Cole no editor
5. Clique em **Run** (ou Ctrl+Enter)

**O que o script faz:**
- ✅ Mostra diagnóstico dos dados atuais
- ✅ Cria backup temporário
- ✅ Deleta os 6 registros inválidos (com subscription_plan_id NULL)
- ✅ Cria 2 relacionamentos corretos:
  - Diácono → Diácono - Mensal (R$ 8.00)
  - Membro → Membro - Mensal (R$ 5.00)
- ✅ Corrige recorrência dos planos (semestral e annual)
- ✅ Mostra verificações finais

**Resultado esperado:**
```
VERIFICAÇÃO: Relacionamentos
┌─────────────┬──────────────────┬────────┬─────────────┐
│ tipo_membro │ plano            │ valor  │ recorrencia │
├─────────────┼──────────────────┼────────┼─────────────┤
│ Diácono     │ Diácono - Mensal │ 8.00   │ monthly     │
│ Membro      │ Membro - Mensal  │ 5.00   │ monthly     │
└─────────────┴──────────────────┴────────┴─────────────┘
```

---

### PASSO 2: Executar Script de Políticas RLS (OPCIONAL)

1. No mesmo SQL Editor
2. Copie o conteúdo do arquivo: `supabase/migrations/fix_filiacao_rls_policies.sql`
3. Cole no editor
4. Clique em **Run**

**O que o script faz:**
- ✅ Habilita RLS em todas as tabelas
- ✅ Cria políticas de leitura pública para tipos e planos
- ✅ Cria políticas de usuário para profiles e assinaturas
- ✅ Cria políticas de admin para gerenciamento

**Quando executar:**
- Se usuários não conseguirem ver tipos/planos (erro de permissão)
- Se formulário não conseguir criar assinatura
- Se perfil não atualizar após pagamento

---

### PASSO 3: Testar no Frontend

1. Abra: https://comademig.vercel.app/filiacao
2. Selecione **"Diácono"**
3. **Verifique se aparece:**
   - ✅ Nome do plano: "Diácono - Mensal"
   - ✅ Valor: R$ 8,00
   - ✅ Recorrência: Mensal
   - ✅ Desconto PIX: R$ 7,60 (5% off)

4. Clique em **"Prosseguir com a Filiação"**
5. **Verifique se:**
   - ✅ Formulário abre
   - ✅ Todos os campos estão visíveis
   - ✅ Métodos de pagamento disponíveis (PIX, Cartão, Boleto)

---

### PASSO 4: Validar com Script de Teste (OPCIONAL)

1. No SQL Editor
2. Copie o conteúdo do arquivo: `supabase/migrations/test_filiacao_system.sql`
3. Cole no editor
4. Clique em **Run**

**O que o script faz:**
- ✅ Executa 10 testes automatizados
- ✅ Valida tipos, planos, relacionamentos
- ✅ Simula query do frontend
- ✅ Verifica políticas RLS
- ✅ Testa fluxo de filiação

---

## 📊 SCRIPTS DISPONÍVEIS

### 1. `fix_filiacao_system.sql` ⭐ **PRINCIPAL**
- **Quando usar:** AGORA (primeira execução)
- **O que faz:** Corrige dados e relacionamentos
- **Tempo:** ~30 segundos
- **Obrigatório:** ✅ SIM

### 2. `fix_filiacao_rls_policies.sql`
- **Quando usar:** Se houver erro de permissão
- **O que faz:** Configura políticas RLS
- **Tempo:** ~20 segundos
- **Obrigatório:** ⚠️ Apenas se necessário

### 3. `test_filiacao_system.sql`
- **Quando usar:** Após executar script principal
- **O que faz:** Valida que tudo está OK
- **Tempo:** ~10 segundos
- **Obrigatório:** ❌ Opcional (mas recomendado)

---

## ✅ CRITÉRIOS DE SUCESSO

Após executar o script principal, você deve ter:

### No Banco de Dados:
- ✅ 2 relacionamentos válidos (Diácono e Membro)
- ✅ 0 registros com subscription_plan_id NULL
- ✅ 5 planos com recurrence = 'monthly'
- ✅ 5 planos com recurrence = 'semestral'
- ✅ 5 planos com recurrence = 'annual'

### No Frontend:
- ✅ Ao selecionar tipo, aparece valor do plano
- ✅ Botão "Prosseguir" funciona
- ✅ Formulário abre corretamente
- ✅ Todos os campos são preenchíveis
- ✅ Métodos de pagamento disponíveis

---

## 🔧 SCRIPTS PYTHON DE DIAGNÓSTICO

### `diagnose_member_type_subscriptions.py`
**O que faz:**
- Mostra TODOS os registros da tabela
- Identifica quais têm subscription_plan_id NULL
- Sugere comandos SQL para correção

**Como executar:**
```bash
python diagnose_member_type_subscriptions.py
```

### `check_real_table_structure.py`
**O que faz:**
- Mostra estrutura real de todas as tabelas
- Lista todas as colunas e tipos
- Útil para criar scripts SQL corretos

**Como executar:**
```bash
python check_real_table_structure.py
```

---

## ⚠️ AVISOS IMPORTANTES

### 1. Backup Automático
O script cria um backup temporário antes de deletar:
```sql
CREATE TEMP TABLE backup_member_type_subscriptions AS
SELECT * FROM member_type_subscriptions;
```

### 2. IDs Específicos
Os IDs usados no script são os REAIS do seu banco:
- Diácono: `615dc80a-870b-4b98-bb44-d48e778f1208`
- Membro: `fb3a0d99-9190-412a-8784-f3fd91a234d3`
- Diácono - Mensal: `71626827-5d8d-48a8-9587-93d34c2318da`
- Membro - Mensal: `063de54b-4bba-4fd1-b520-e4992072f211`

### 3. Não Executar Múltiplas Vezes
O script deleta e recria relacionamentos. Se executar 2x:
- Primeira vez: ✅ Funciona
- Segunda vez: ❌ Erro (registros já existem)

Se precisar executar novamente, delete os relacionamentos primeiro:
```sql
DELETE FROM member_type_subscriptions;
```

---

## 🎯 PRÓXIMOS PASSOS APÓS CORREÇÃO

### 1. Ativar Mais Tipos de Membro
Se quiser ativar Pastor, Evangelista, Bispo:
```sql
UPDATE member_types 
SET is_active = true 
WHERE name IN ('Pastor', 'Evangelista', 'Bispo');
```

### 2. Criar Mais Relacionamentos
Para associar outros tipos aos planos:
```sql
-- Pastor → Pastor - Mensal
INSERT INTO member_type_subscriptions (member_type_id, subscription_plan_id)
VALUES ('2c3f1823-6ad0-4e6d-b97c-68f064d9bd8e', 'b3bdbc0b-809d-47a3-a28d-0f7b774dac05');
```

### 3. Testar Fluxo Completo
1. Criar conta de teste
2. Fazer filiação completa
3. Processar pagamento PIX
4. Verificar assinatura criada
5. Validar perfil atualizado

---

## 📞 SUPORTE

Se após executar o script ainda houver problemas:

1. **Execute o script de teste:**
   ```bash
   # No Supabase SQL Editor:
   supabase/migrations/test_filiacao_system.sql
   ```

2. **Execute o diagnóstico Python:**
   ```bash
   python diagnose_member_type_subscriptions.py
   ```

3. **Verifique o console do navegador:**
   - Abra DevTools (F12)
   - Vá na aba Console
   - Procure por erros em vermelho

4. **Compartilhe os resultados** para análise

---

**Boa sorte! 🚀**
