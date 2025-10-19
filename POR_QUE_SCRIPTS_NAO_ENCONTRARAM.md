# 🔍 POR QUE MEUS SCRIPTS PYTHON NÃO ENCONTRARAM OS DADOS?

## 🎯 PROBLEMA

**Situação:**
- Dashboard do Supabase mostra 4 registros em `asaas_cobrancas`
- Meus scripts Python retornaram 0 registros
- Usuário forneceu JSON com dados que "não existem" segundo meus scripts

---

## 🔍 POSSÍVEIS CAUSAS

### 1. Políticas RLS Bloqueando Leitura 🔒

**Hipótese:** Scripts usam chave `anon`, que tem RLS ativo

**Evidência:**
```python
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." # anon key
```

**Políticas RLS atuais:**
```sql
-- Usuários podem ver apenas suas cobranças
CREATE POLICY "Users can view own cobrancas"
ON asaas_cobrancas
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Admins podem ver todas
CREATE POLICY "Admins can view all cobrancas"
ON asaas_cobrancas
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.tipo_membro IN ('admin', 'super_admin')
  )
);
```

**Problema:** Scripts Python usam chave `anon` **SEM autenticação de usuário**
- Não há `auth.uid()`
- RLS bloqueia acesso
- Retorna 0 registros

---

### 2. Chave Anon vs Service Role 🔑

**O que usei:**
```python
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." # anon key
```

**O que deveria usar:**
```python
SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." # service_role key
```

**Diferença:**
- `anon key`: Sujeita a RLS, precisa autenticação
- `service_role key`: Bypassa RLS, acesso total

---

### 3. Projeto Errado ❓

**Improvável, mas possível:**
- Conectando em projeto diferente
- URL ou chave incorreta

**Verificação:**
```python
SUPABASE_URL = "https://amkelczfwazutrciqtlk.supabase.co"
```

**Status:** ✅ URL está correta (visível nas imagens)

---

## 🎯 CAUSA RAIZ CONFIRMADA

### RLS ESTÁ BLOQUEANDO MEUS SCRIPTS

**Por quê:**
1. Scripts usam `anon key`
2. `anon key` requer autenticação de usuário
3. Scripts não fazem login
4. RLS bloqueia acesso
5. Retorna 0 registros

**Mas os dados EXISTEM no banco!**

---

## 🔧 COMO CORRIGIR OS SCRIPTS

### Opção 1: Usar Service Role Key (RECOMENDADO)

```python
# Usar service_role key que bypassa RLS
SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
```

**Vantagem:** Acesso total, sem RLS

---

### Opção 2: Fazer Login com Usuário

```python
# Fazer login antes de buscar dados
supabase.auth.sign_in_with_password({
    "email": "rcarraro2015@gmail.com",
    "password": "senha"
})

# Agora pode buscar dados do usuário
response = supabase.table('asaas_cobrancas').select('*').execute()
```

**Vantagem:** Respeita RLS, mais seguro

---

### Opção 3: Desabilitar RLS Temporariamente

```sql
-- APENAS PARA TESTE
ALTER TABLE asaas_cobrancas DISABLE ROW LEVEL SECURITY;

-- Buscar dados

-- REABILITAR DEPOIS
ALTER TABLE asaas_cobrancas ENABLE ROW LEVEL SECURITY;
```

**Vantagem:** Teste rápido  
**Desvantagem:** Inseguro, não usar em produção

---

## 📊 COMPARAÇÃO: O QUE CADA MÉTODO VÊ

| Método | RLS Ativo? | Precisa Auth? | Vê Dados? |
|--------|-----------|---------------|-----------|
| anon key (sem login) | ✅ Sim | ✅ Sim | ❌ Não |
| anon key (com login) | ✅ Sim | ✅ Sim | ✅ Sim (apenas seus) |
| service_role key | ❌ Não | ❌ Não | ✅ Sim (todos) |
| Dashboard Supabase | ❌ Não | ✅ Sim (admin) | ✅ Sim (todos) |

---

## 🎯 POR QUE O DASHBOARD MOSTRA OS DADOS?

**Dashboard do Supabase:**
- Usa credenciais de admin
- Bypassa RLS automaticamente
- Mostra TODOS os dados

**Meus scripts:**
- Usam `anon key`
- RLS ativo
- Sem autenticação
- Bloqueados

---

## 📋 LIÇÕES APRENDIDAS

### 1. Sempre verificar RLS
- ✅ Verificar se tabela tem RLS ativo
- ✅ Verificar políticas de acesso
- ✅ Usar chave apropriada

### 2. Não confiar apenas em scripts
- ✅ Verificar também no Dashboard
- ✅ Cruzar informações
- ✅ Testar com diferentes métodos

### 3. Documentar limitações
- ✅ Scripts Python têm limitações
- ✅ RLS pode bloquear acesso
- ✅ Sempre mencionar isso nos relatórios

---

## ✅ CONCLUSÃO

**Por que scripts não encontraram dados:**
- ✅ RLS está ativo
- ✅ Scripts usam `anon key` sem autenticação
- ✅ RLS bloqueia acesso
- ✅ Retorna 0 registros

**Mas os dados EXISTEM:**
- ✅ Dashboard mostra 4 registros
- ✅ Usuário forneceu JSON com dados
- ✅ Webhook está salvando

**Meu erro:**
- ❌ Não considerei RLS
- ❌ Não verifiquei no Dashboard
- ❌ Confiei apenas nos scripts
- ❌ Disse que banco estava vazio (estava errado)

**Correção para futuros scripts:**
```python
# Usar service_role key para diagnóstico
SUPABASE_SERVICE_KEY = "..." # Pegar do .env
supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
```

---

**LIÇÃO:** Sempre verificar múltiplas fontes antes de concluir que dados não existem!
