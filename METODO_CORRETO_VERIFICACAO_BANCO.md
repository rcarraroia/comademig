# 🔒 MÉTODO CORRETO PARA VERIFICAÇÃO DO BANCO DE DADOS

## ❌ PROBLEMA IDENTIFICADO

**Método atual (INCORRETO):**
- Uso da `anon key` do Supabase
- Sujeito às políticas RLS (Row Level Security)
- **Retorna 0 registros mesmo quando há dados**
- Causa análises incorretas e decisões erradas

**Exemplo do erro:**
```python
SUPABASE_KEY = "eyJ...anon..." # ❌ ANON KEY
response = supabase.table('asaas_cobrancas').select('*').execute()
# Retorna: 0 registros (FALSO - há 8 registros reais)
```

---

## ✅ MÉTODOS CORRETOS

### Método 1: Supabase CLI (RECOMENDADO)

**Vantagens:**
- ✅ Acesso direto ao banco
- ✅ Ignora políticas RLS
- ✅ Dados reais sempre
- ✅ Já configurado e funcionando

**Como usar:**
```powershell
# Listar todas as cobranças
supabase db execute "SELECT COUNT(*) as total FROM asaas_cobrancas"

# Ver detalhes
supabase db execute "SELECT asaas_id, status, value, created_at FROM asaas_cobrancas ORDER BY created_at DESC LIMIT 10"

# Verificar solicitações
supabase db execute "SELECT COUNT(*) as total FROM solicitacoes_servicos"

# Ver últimas solicitações
supabase db execute "SELECT protocolo, status, valor_pago, created_at FROM solicitacoes_servicos ORDER BY created_at DESC LIMIT 10"
```

**Saída esperada:**
```
 total 
-------
     8
(1 row)
```

---

### Método 2: Supabase Dashboard (VISUAL)

**Vantagens:**
- ✅ Interface visual
- ✅ Fácil de usar
- ✅ Mostra dados reais
- ✅ Permite edição

**Como usar:**
1. Acessar: https://supabase.com/dashboard/project/amkelczfwazutrciqtlk
2. Ir em: Table Editor
3. Selecionar tabela: `asaas_cobrancas` ou `solicitacoes_servicos`
4. Ver dados reais

---

### Método 3: Python com Service Role Key (AVANÇADO)

**⚠️ CUIDADO: Service Role Key tem acesso total**

```python
# NÃO COMMITAR ESTA KEY NO GIT!
SUPABASE_SERVICE_KEY = "eyJ...service_role..."

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
response = supabase.table('asaas_cobrancas').select('*').execute()
# Retorna: Dados reais (ignora RLS)
```

**Onde encontrar Service Role Key:**
- Dashboard > Project Settings > API > `service_role` key (secret)

---

## 📋 PROTOCOLO OBRIGATÓRIO

### ANTES de qualquer análise de banco:

1. **NUNCA confiar em scripts Python com anon key**
2. **SEMPRE usar Supabase CLI ou Dashboard**
3. **DOCUMENTAR o método usado**
4. **Verificar visualmente no Dashboard se houver dúvida**

### Comandos CLI para análise rápida:

```powershell
# Verificar cobranças
supabase db execute "SELECT COUNT(*) FROM asaas_cobrancas"

# Verificar solicitações
supabase db execute "SELECT COUNT(*) FROM solicitacoes_servicos"

# Ver últimas cobranças
supabase db execute "SELECT asaas_id, user_id, status, value FROM asaas_cobrancas ORDER BY created_at DESC LIMIT 5"

# Ver últimas solicitações
supabase db execute "SELECT protocolo, user_id, status, valor_pago FROM solicitacoes_servicos ORDER BY created_at DESC LIMIT 5"
```

---

## 🔍 ANÁLISE CORRETA DO PROBLEMA ATUAL

Agora vou usar o método correto para analisar:

### Passo 1: Verificar cobranças (CLI)
```powershell
supabase db execute "SELECT asaas_id, status, billing_type, service_type, value, created_at FROM asaas_cobrancas ORDER BY created_at DESC"
```

### Passo 2: Verificar solicitações (CLI)
```powershell
supabase db execute "SELECT id, protocolo, user_id, servico_id, status, valor_pago, created_at FROM solicitacoes_servicos ORDER BY created_at DESC"
```

### Passo 3: Verificar relação entre cobranças e solicitações
```powershell
supabase db execute "
SELECT 
  c.asaas_id,
  c.status as cobranca_status,
  s.protocolo,
  s.status as solicitacao_status
FROM asaas_cobrancas c
LEFT JOIN solicitacoes_servicos s ON s.payment_reference = c.asaas_id
ORDER BY c.created_at DESC
"
```

---

## 📝 TEMPLATE DE ANÁLISE

```markdown
## Análise do Banco de Dados

**Data:** [data]
**Método usado:** Supabase CLI
**Comando executado:**
```powershell
supabase db execute "SELECT COUNT(*) FROM tabela"
```

**Resultado:**
```
 count 
-------
    8
```

**Conclusão:** [sua conclusão baseada em dados reais]
```

---

## ⚠️ NUNCA MAIS FAZER

- ❌ Usar Python com anon key para verificar dados
- ❌ Confiar em scripts que retornam 0 quando há dados
- ❌ Tomar decisões baseadas em dados filtrados por RLS
- ❌ Dizer "tabela vazia" sem verificar no Dashboard

---

## ✅ SEMPRE FAZER

- ✅ Usar Supabase CLI para verificações
- ✅ Confirmar visualmente no Dashboard
- ✅ Documentar o método usado
- ✅ Verificar políticas RLS se houver discrepância
