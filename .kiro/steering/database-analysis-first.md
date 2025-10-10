# 🔍 REGRA CRÍTICA: ANÁLISE PRÉVIA OBRIGATÓRIA DO BANCO DE DADOS

## ⚠️ PRINCÍPIO FUNDAMENTAL

**SEMPRE que for necessário qualquer tipo de intervenção no banco de dados, você PRIMEIRO deve analisar o que temos no banco atualmente para não apagar ou corromper nada que já esteja funcionando. Alem de identificar se ja existe alguma tabela referente ao que pretendemos implementar**

## 🎯 OBJETIVO

Garantir que todas as alterações no banco de dados sejam feitas com conhecimento completo do estado atual, evitando:
- Perda de dados existentes
- Quebra de funcionalidades em produção
- Conflitos com estruturas já implementadas
- Corrupção de relacionamentos entre tabelas
- Violação de políticas RLS existentes

## 📋 PROTOCOLO OBRIGATÓRIO

### ANTES de criar qualquer migração ou script SQL:

#### 1. CONECTAR AO BANCO REAL
```python
# Criar script Python para análise
from supabase import create_client, Client

SUPABASE_URL = "https://amkelczfwazutrciqtlk.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
```

#### 2. VERIFICAR TABELAS EXISTENTES
```python
# Verificar se tabela já existe
try:
    response = supabase.table('nome_tabela').select('*').limit(1).execute()
    print(f"✅ Tabela existe com {response.count} registros")
except Exception as e:
    print(f"❌ Tabela não existe: {e}")
```

#### 3. ANALISAR ESTRUTURA ATUAL
```python
# Pegar amostra de dados para ver estrutura
response = supabase.table('nome_tabela').select('*').limit(3).execute()
print("Estrutura atual:", response.data)
```

#### 4. VERIFICAR RELACIONAMENTOS
```python
# Verificar foreign keys e relacionamentos
response = supabase.table('tabela_principal').select('*, tabela_relacionada(*)').limit(1).execute()
```

#### 5. CONTAR REGISTROS EXISTENTES
```python
# Verificar quantidade de dados
response = supabase.table('nome_tabela').select('*', count='exact').execute()
print(f"Total de registros: {response.count}")
```

#### 6. VERIFICAR POLÍTICAS RLS
```python
# Testar se políticas RLS estão ativas
# Tentar acessar dados e verificar permissões
```

## 🚨 SITUAÇÕES QUE EXIGEM ANÁLISE PRÉVIA

### SEMPRE analisar antes de:

1. **Criar nova tabela**
   - Verificar se tabela com nome similar já existe
   - Verificar se há tabelas relacionadas que precisam de foreign keys
   - Verificar convenções de nomenclatura existentes

2. **Alterar estrutura de tabela existente**
   - Verificar quantos registros existem
   - Verificar se campos a serem alterados têm dados
   - Verificar impacto em queries existentes no código

3. **Adicionar/Remover colunas**
   - Verificar se coluna já existe
   - Verificar se há dados que seriam perdidos
   - Verificar se código frontend depende da coluna

4. **Criar/Alterar políticas RLS**
   - Verificar políticas existentes
   - Verificar se mudança não bloqueará acesso legítimo
   - Testar com diferentes roles (user, admin, super_admin)

5. **Criar índices**
   - Verificar se índice similar já existe
   - Verificar tamanho da tabela
   - Avaliar impacto em performance

6. **Criar triggers/functions**
   - Verificar se função com mesmo nome existe
   - Verificar se há triggers conflitantes
   - Verificar impacto em operações existentes

## ✅ CHECKLIST DE ANÁLISE PRÉVIA

Antes de criar qualquer script SQL, responder:

- [ ] Conectei ao banco real via Python?
- [ ] Verifiquei se a tabela/estrutura já existe?
- [ ] Contei quantos registros existem?
- [ ] Analisei a estrutura atual dos dados?
- [ ] Identifiquei relacionamentos com outras tabelas?
- [ ] Verifiquei políticas RLS existentes?
- [ ] Busquei no código referências à estrutura que vou alterar?
- [ ] Avaliei o impacto em funcionalidades existentes?
- [ ] Documentei o estado atual antes da mudança?
- [ ] Criei estratégia de rollback se necessário?

## 🔧 FERRAMENTAS PARA ANÁLISE

### 1. Script Python de Análise
```python
#!/usr/bin/env python3
from supabase import create_client, Client
import json

SUPABASE_URL = "https://amkelczfwazutrciqtlk.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

def analyze_table(table_name):
    """Análise completa de uma tabela"""
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    
    print(f"\n{'='*60}")
    print(f"ANÁLISE DA TABELA: {table_name}")
    print(f"{'='*60}\n")
    
    try:
        # 1. Verificar existência e contar registros
        count_response = supabase.table(table_name).select('*', count='exact').execute()
        print(f"✅ Tabela existe")
        print(f"📊 Total de registros: {count_response.count}")
        
        # 2. Pegar amostra de dados
        sample_response = supabase.table(table_name).select('*').limit(5).execute()
        print(f"\n📋 Amostra de dados (primeiros 5 registros):")
        for i, record in enumerate(sample_response.data, 1):
            print(f"\nRegistro {i}:")
            print(json.dumps(record, indent=2, default=str))
        
        # 3. Identificar colunas
        if sample_response.data:
            columns = list(sample_response.data[0].keys())
            print(f"\n📝 Colunas identificadas ({len(columns)}):")
            for col in columns:
                print(f"  - {col}")
        
        return True
        
    except Exception as e:
        print(f"❌ Erro ao analisar tabela: {str(e)}")
        return False

if __name__ == "__main__":
    # Analisar tabela específica
    table_name = input("Digite o nome da tabela para analisar: ")
    analyze_table(table_name)
```

### 2. Busca no Código
```bash
# Buscar referências à tabela no código
grepSearch: "nome_tabela"
```

### 3. Análise de Tipos TypeScript
```bash
# Verificar tipos definidos
readFile: "src/integrations/supabase/types.ts"
```

## ❌ EXEMPLOS DE VIOLAÇÕES

### ERRADO - Criar migração sem verificar:
```sql
-- ❌ NUNCA fazer isso sem verificar antes
CREATE TABLE support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ...
);
```

### CORRETO - Verificar primeiro:
```python
# ✅ Primeiro verificar
response = supabase.table('support_tickets').select('*').limit(1).execute()
# Se tabela já existe, ajustar estratégia
```

### ERRADO - Alterar coluna sem verificar dados:
```sql
-- ❌ Pode perder dados
ALTER TABLE users DROP COLUMN old_field;
```

### CORRETO - Verificar dados primeiro:
```python
# ✅ Verificar se há dados na coluna
response = supabase.table('users').select('old_field').not_.is_('old_field', 'null').execute()
print(f"Registros com dados na coluna: {response.count}")
```

## 🎯 APLICAÇÃO IMEDIATA

Esta regra se aplica a:
- ✅ Criação de tabelas
- ✅ Alteração de estruturas
- ✅ Adição/remoção de colunas
- ✅ Criação de índices
- ✅ Criação/alteração de políticas RLS
- ✅ Criação de triggers/functions
- ✅ Alteração de constraints
- ✅ Qualquer operação DDL (Data Definition Language)

## 📝 DOCUMENTAÇÃO OBRIGATÓRIA

Ao criar script SQL, incluir comentário com análise prévia:

```sql
-- ============================================
-- ANÁLISE PRÉVIA REALIZADA
-- ============================================
-- Data: 2025-01-10
-- Tabela analisada: support_tickets
-- Status atual: Tabela existe com 150 registros
-- Impacto: Adição de nova coluna (não destrutivo)
-- Verificações:
--   ✅ Tabela existe e está em uso
--   ✅ Nenhum dado será perdido
--   ✅ Código frontend não será afetado
--   ✅ Políticas RLS compatíveis
-- ============================================

ALTER TABLE support_tickets 
ADD COLUMN IF NOT EXISTS new_field TEXT;
```

## 🚀 BENEFÍCIOS

Seguir esta regra garante:
- ✅ Zero perda de dados
- ✅ Zero quebra de funcionalidades
- ✅ Migrações seguras e reversíveis
- ✅ Conhecimento completo do sistema
- ✅ Confiança nas alterações
- ✅ Documentação do estado atual
- ✅ Facilita debugging futuro

## ⚠️ LEMBRE-SE

**"Medir duas vezes, cortar uma vez"**

Tempo gasto em análise prévia é SEMPRE menor que tempo gasto corrigindo dados corrompidos ou funcionalidades quebradas.

**NUNCA pule a análise prévia. SEMPRE verifique o estado atual do banco antes de qualquer intervenção.**
