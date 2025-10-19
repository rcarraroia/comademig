# 🔐 GUIA COMPLETO: ACESSO E VERIFICAÇÃO DO SUPABASE

**Versão:** 2.0  
**Data:** 2025-10-19  
**Objetivo:** Documento de referência unificado para acesso ao Supabase em qualquer projeto

---

## 📋 ÍNDICE

1. [Visão Geral](#visão-geral)
2. [Métodos de Acesso](#métodos-de-acesso)
3. [Configuração do Supabase CLI](#configuração-do-supabase-cli)
4. [Comandos CLI Essenciais](#comandos-cli-essenciais)
5. [Scripts Python para Análise](#scripts-python-para-análise)
6. [Políticas RLS e Segurança](#políticas-rls-e-segurança)
7. [Protocolo de Verificação](#protocolo-de-verificação)
8. [Troubleshooting](#troubleshooting)
9. [Boas Práticas](#boas-práticas)

---

## 🎯 VISÃO GERAL

### Problema Comum
Ao trabalhar com Supabase, é comum encontrar situações onde:
- Scripts retornam 0 registros mas dados existem
- Políticas RLS bloqueiam acesso
- Tipos TypeScript estão desatualizados
- Não há certeza sobre o estado real do banco

### Solução
Este guia fornece métodos confiáveis para:
- ✅ Verificar dados reais no banco
- ✅ Executar migrações com segurança
- ✅ Fazer deploy de Edge Functions
- ✅ Diagnosticar problemas de acesso
- ✅ Garantir integridade dos dados

---

## 🔧 MÉTODOS DE ACESSO

### Comparação Rápida

| Método | RLS Ativo? | Acesso | Uso Recomendado | Disponibilidade |
|--------|-----------|--------|-----------------|-----------------|
| **Supabase CLI** | ❌ Não | Total | Migrações, queries, deploy | ✅ Sempre usar |
| **Dashboard Web** | ❌ Não | Visual | Verificação visual, edição manual | ✅ Sempre disponível |
| **Python (anon key)** | ✅ Sim | Limitado | ❌ NÃO RECOMENDADO | ⚠️ Evitar |
| **Python (service_role)** | ❌ Não | Total | Scripts de análise | ⚠️ Usar com cuidado |

---

## 🚀 CONFIGURAÇÃO DO SUPABASE CLI

### Pré-requisitos

**O que você precisa:**
- Windows com PowerShell
- Permissões de administrador
- Access Token do Supabase
- Project Reference ID

### Passo 1: Verificar Instalação

```powershell
# Verificar se CLI já está instalado
where supabase

# Se retornar caminho: CLI já instalado ✅
# Se retornar erro: Prosseguir para instalação
```

### Passo 2: Instalar Scoop (Gerenciador de Pacotes)

```powershell
# Permitir execução de scripts
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser -Force

# Instalar Scoop
irm get.scoop.sh | iex
```

**Por que Scoop?**
- ✅ Método oficial recomendado pelo Supabase
- ✅ Instalação limpa e versionada
- ✅ Fácil atualização e remoção
- ❌ NPM não suporta Supabase CLI global

### Passo 3: Adicionar Repositório do Supabase

```powershell
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
```

### Passo 4: Instalar Supabase CLI

```powershell
scoop install supabase
```

**Resultado esperado:**
```
'supabase' (2.51.0) was installed successfully!
```

### Passo 5: Verificar Instalação

```powershell
supabase --version
```

**Deve retornar:** `2.51.0` (ou versão mais recente)

### Passo 6: Obter Access Token

**⚠️ IMPORTANTE: Este token dá acesso a TODOS os seus projetos**

1. Acessar: https://supabase.com/dashboard/account/tokens
2. Clicar em "Generate new token"
3. Dar nome descritivo (ex: "Kiro CLI - Projeto X")
4. Copiar token (formato: `sbp_xxxxx...`)

**Diferença entre tokens:**

| Token | Onde Encontrar | Para Que Serve | Usar no CLI? |
|-------|---------------|----------------|--------------|
| **Access Token** | Account > Access Tokens | Autenticar CLI | ✅ **SIM** |
| JWT Secret | Project > API Settings | Assinar tokens JWT | ❌ NÃO |
| Anon Key | Project > API Settings | Frontend público | ❌ NÃO |
| Service Role | Project > API Settings | Backend privado | ❌ NÃO |

### Passo 7: Fazer Login

```powershell
# Método interativo (recomendado)
supabase login

# Método automático (para scripts)
echo "sbp_seu_token_aqui" | supabase login
```

**Resultado esperado:**
```
You are now logged in. Happy coding!
```

### Passo 8: Obter Project Reference ID

**Onde encontrar:**
- Dashboard > Project Settings > General > Reference ID
- Ou na URL: `https://supabase.com/dashboard/project/[PROJECT_REF]`

**Exemplo:** `amkelczfwazutrciqtlk`

### Passo 9: Linkar ao Projeto

```powershell
supabase link --project-ref seu_project_ref_aqui
```

**Resultado esperado:**
```
Initialising login role...
Connecting to remote database...
Finished supabase link.
```

### Passo 10: Validar Configuração

```powershell
# Listar projetos
supabase projects list

# Listar migrações
supabase migration list

# Testar query
supabase db execute "SELECT 1 as test"
```

**Se todos retornarem dados: Configuração completa! ✅**

---

## 📝 COMANDOS CLI ESSENCIAIS

### Gerenciamento de Migrações

```powershell
# Criar nova migração
supabase migration new nome_descritivo_da_mudanca

# Aplicar migrações pendentes ao banco remoto
supabase db push

# Ver histórico de migrações
supabase migration list

# Verificar status das migrações
supabase migration repair

# Reverter última migração (cuidado!)
supabase migration repair --status reverted
```

### Execução de SQL

```powershell
# Executar query simples
supabase db execute "SELECT COUNT(*) FROM tabela"

# Executar query complexa
supabase db execute "
SELECT 
  t1.id,
  t1.nome,
  t2.valor
FROM tabela1 t1
LEFT JOIN tabela2 t2 ON t1.id = t2.tabela1_id
WHERE t1.status = 'ativo'
ORDER BY t1.created_at DESC
LIMIT 10
"

# Executar arquivo SQL
supabase db execute -f caminho/para/script.sql

# Fazer dump do banco
supabase db dump --schema public -f backup.sql

# Fazer dump apenas de estrutura
supabase db dump --schema public --data-only=false -f estrutura.sql
```

### Gerenciamento de Edge Functions

```powershell
# Listar todas as functions
supabase functions list

# Deploy de uma function
supabase functions deploy nome-da-function

# Deploy de todas as functions
supabase functions deploy

# Ver logs em tempo real
supabase functions logs nome-da-function --tail

# Ver logs das últimas 100 linhas
supabase functions logs nome-da-function --limit 100

# Testar function localmente
supabase functions serve nome-da-function

# Deletar function
supabase functions delete nome-da-function
```

### Gerenciamento de Secrets

```powershell
# Listar secrets (não mostra valores)
supabase secrets list

# Definir um secret
supabase secrets set CHAVE=valor

# Definir múltiplos secrets
supabase secrets set KEY1=valor1 KEY2=valor2 KEY3=valor3

# Remover secret
supabase secrets unset CHAVE

# Definir secrets de arquivo .env
supabase secrets set --env-file .env.production
```

### Verificação e Diagnóstico

```powershell
# Ver status do projeto
supabase status

# Ver informações do projeto
supabase projects list

# Testar conectividade
supabase db execute "SELECT NOW() as current_time"

# Ver estrutura de uma tabela
supabase db execute "
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'nome_tabela'
ORDER BY ordinal_position
"

# Ver todas as tabelas
supabase db execute "
SELECT 
  table_name,
  table_type
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name
"

# Contar registros de todas as tabelas
supabase db execute "
SELECT 
  schemaname,
  tablename,
  n_live_tup as row_count
FROM pg_stat_user_tables
ORDER BY n_live_tup DESC
"
```

---

## 🐍 SCRIPTS PYTHON PARA ANÁLISE

### ⚠️ REGRA CRÍTICA: RLS e Chaves de Acesso

**NUNCA use `anon key` para verificação de dados!**

**Por quê?**
- `anon key` está sujeita a políticas RLS
- Retorna 0 registros mesmo quando dados existem
- Causa análises incorretas

**Use:**
- ✅ Supabase CLI (recomendado)
- ✅ Dashboard Web (verificação visual)
- ⚠️ `service_role key` (apenas para scripts de análise)

### Template de Script Correto

```python
#!/usr/bin/env python3
"""
Script de Análise do Banco Supabase
IMPORTANTE: Use service_role key, não anon key!
"""
from supabase import create_client, Client
import json
from datetime import datetime

# ⚠️ USAR SERVICE_ROLE KEY (não commitar no Git!)
SUPABASE_URL = "https://seu-projeto.supabase.co"
SUPABASE_SERVICE_KEY = "eyJ...service_role_key..."  # NÃO COMMITAR!

def analyze_database():
    """Análise completa do banco de dados"""
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    
    print("=" * 80)
    print("ANÁLISE DO BANCO DE DADOS SUPABASE")
    print(f"Data: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 80)
    
    # Lista de tabelas para verificar
    tables = [
        'profiles',
        'asaas_cobrancas',
        'solicitacoes_servicos',
        'servicos',
        # Adicione suas tabelas aqui
    ]
    
    results = {}
    
    for table in tables:
        print(f"\n{'='*60}")
        print(f"Tabela: {table}")
        print(f"{'='*60}")
        
        try:
            # 1. Contar registros
            count_response = supabase.table(table).select('*', count='exact').execute()
            count = count_response.count
            
            print(f"✅ Total de registros: {count}")
            
            # 2. Pegar amostra de dados
            if count > 0:
                sample_response = supabase.table(table).select('*').limit(3).execute()
                sample = sample_response.data
                
                print(f"\n📋 Amostra de dados (primeiros 3 registros):")
                for i, record in enumerate(sample, 1):
                    print(f"\n--- Registro {i} ---")
                    print(json.dumps(record, indent=2, default=str))
                
                # 3. Identificar colunas
                if sample:
                    columns = list(sample[0].keys())
                    print(f"\n📝 Colunas ({len(columns)}):")
                    for col in columns:
                        print(f"  - {col}")
            
            results[table] = {
                'exists': True,
                'count': count,
                'status': 'OK'
            }
            
        except Exception as e:
            print(f"❌ Erro ao acessar tabela: {str(e)}")
            results[table] = {
                'exists': False,
                'error': str(e),
                'status': 'ERROR'
            }
    
    # Resumo final
    print(f"\n{'='*80}")
    print("RESUMO DA ANÁLISE")
    print(f"{'='*80}")
    
    total_tables = len(tables)
    success_tables = sum(1 for r in results.values() if r.get('status') == 'OK')
    total_records = sum(r.get('count', 0) for r in results.values() if r.get('status') == 'OK')
    
    print(f"\nTabelas analisadas: {total_tables}")
    print(f"Tabelas acessíveis: {success_tables}")
    print(f"Total de registros: {total_records}")
    
    return results

def verify_specific_record(table: str, field: str, value: str):
    """Verificar se um registro específico existe"""
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    
    print(f"\n🔍 Buscando em {table} onde {field} = {value}")
    
    try:
        response = supabase.table(table).select('*').eq(field, value).execute()
        
        if response.data:
            print(f"✅ Registro encontrado!")
            print(json.dumps(response.data[0], indent=2, default=str))
            return response.data[0]
        else:
            print(f"❌ Registro não encontrado")
            return None
            
    except Exception as e:
        print(f"❌ Erro: {str(e)}")
        return None

def compare_tables_count():
    """Comparar contagem de registros entre tabelas relacionadas"""
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    
    print(f"\n{'='*80}")
    print("COMPARAÇÃO DE TABELAS RELACIONADAS")
    print(f"{'='*80}")
    
    # Exemplo: Comparar cobranças vs solicitações
    try:
        cobrancas = supabase.table('asaas_cobrancas').select('*', count='exact').execute()
        solicitacoes = supabase.table('solicitacoes_servicos').select('*', count='exact').execute()
        
        print(f"\n📊 Cobranças: {cobrancas.count}")
        print(f"📊 Solicitações: {solicitacoes.count}")
        
        diff = cobrancas.count - solicitacoes.count
        if diff > 0:
            print(f"\n⚠️ ATENÇÃO: {diff} cobranças sem solicitação correspondente!")
        elif diff < 0:
            print(f"\n⚠️ ATENÇÃO: {abs(diff)} solicitações sem cobrança correspondente!")
        else:
            print(f"\n✅ Tabelas sincronizadas!")
            
    except Exception as e:
        print(f"❌ Erro: {str(e)}")

if __name__ == "__main__":
    # Executar análise completa
    results = analyze_database()
    
    # Comparar tabelas relacionadas
    compare_tables_count()
    
    # Exemplo: Verificar registro específico
    # verify_specific_record('asaas_cobrancas', 'asaas_id', 'pay_xxxxx')
```

### Como Usar o Script

```powershell
# 1. Instalar biblioteca (se necessário)
pip install supabase

# 2. Executar script
python analyze_database.py
```

### ⚠️ SEGURANÇA

**NUNCA commitar service_role key no Git!**

**Opções seguras:**
1. Usar variáveis de ambiente
2. Arquivo `.env` (adicionar ao `.gitignore`)
3. Solicitar key ao executar script

```python
# Opção 1: Variável de ambiente
import os
SUPABASE_SERVICE_KEY = os.getenv('SUPABASE_SERVICE_KEY')

# Opção 2: Arquivo .env
from dotenv import load_dotenv
load_dotenv()
SUPABASE_SERVICE_KEY = os.getenv('SUPABASE_SERVICE_KEY')

# Opção 3: Input do usuário
SUPABASE_SERVICE_KEY = input("Digite a service_role key: ")
```

---
