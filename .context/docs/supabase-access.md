# Guia de Acesso ao Supabase - COMADEMIG

## 🎯 Visão Geral

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

## 🔧 Métodos de Acesso

### Comparação Rápida

| Método | RLS Ativo? | Acesso | Uso Recomendado | Disponibilidade |
|--------|-----------|--------|-----------------|-----------------|
| **Power Supabase** | ❌ Não | Total | Análise, queries, migrations | ✅ **USAR SEMPRE** |
| **Supabase CLI** | ❌ Não | Total | Migrações, queries, deploy | ✅ Alternativo |
| **Dashboard Web** | ❌ Não | Visual | Verificação visual, edição manual | ✅ Confirmação |
| **Python (service_role)** | ❌ Não | Total | Scripts de análise | ⚠️ Usar com cuidado |

## 🔌 Método Oficial: Power Supabase

### Como Usar o Power Supabase

#### 1. Ativar o Power
```
Use o comando kiroPowers para ativar o power "supabase-hosted"
```

#### 2. Verificar Estrutura de Tabelas
```
Use as ferramentas do power para listar tabelas e verificar estruturas
```

#### 3. Executar Queries de Verificação
```
Use as ferramentas do power para executar queries SELECT e verificar dados
```

#### 4. Aplicar Migrations
```
Use as ferramentas do power para aplicar mudanças no banco
```

### Comandos Básicos via Power

#### Verificar Estrutura Geral
- Listar todas as tabelas do schema public
- Verificar estrutura de tabelas específicas
- Contar registros em tabelas

#### Verificar Dados Existentes
- Executar queries SELECT para análise
- Verificar relacionamentos entre tabelas
- Analisar políticas RLS ativas

#### Aplicar Mudanças
- Executar migrations de forma segura
- Criar/alterar tabelas quando necessário
- Aplicar políticas RLS

## 🚀 Configuração do Supabase CLI (Alternativo)

### Pré-requisitos
- Windows com PowerShell
- Permissões de administrador
- Access Token do Supabase
- Project Reference ID: `amkelczfwazutrciqtlk`

### Comandos CLI Essenciais

#### Gerenciamento de Migrações
```powershell
# Criar nova migração
supabase migration new nome_descritivo_da_mudanca

# Aplicar migrações pendentes ao banco remoto
supabase db push

# Ver histórico de migrações
supabase migration list

# Verificar status das migrações
supabase migration repair
```

#### Execução de SQL
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

# Fazer dump do banco
supabase db dump --schema public -f backup.sql
```

#### Gerenciamento de Edge Functions
```powershell
# Listar todas as functions
supabase functions list

# Deploy de uma function
supabase functions deploy nome-da-function

# Ver logs em tempo real
supabase functions logs nome-da-function --tail
```

## 🐍 Scripts Python para Análise

### ⚠️ REGRA CRÍTICA: RLS e Chaves de Acesso

**NUNCA use `anon key` para verificação de dados!**

**Por quê?**
- `anon key` está sujeita a políticas RLS
- Retorna 0 registros mesmo quando dados existem
- Causa análises incorretas

**Use:**
- ✅ Power Supabase (recomendado)
- ✅ Supabase CLI (alternativo)
- ⚠️ `service_role key` (apenas para scripts de análise)

### Template de Script Correto

```python
#!/usr/bin/env python3
"""
Script de Análise do Banco Supabase COMADEMIG
IMPORTANTE: Use service_role key, não anon key!
"""
from supabase import create_client, Client
import json
from datetime import datetime

# ⚠️ USAR SERVICE_ROLE KEY (não commitar no Git!)
SUPABASE_URL = "https://amkelczfwazutrciqtlk.supabase.co"
SUPABASE_SERVICE_KEY = "eyJ...service_role_key..."  # NÃO COMMITAR!

def analyze_database():
    """Análise completa do banco de dados"""
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    
    print("=" * 80)
    print("ANÁLISE DO BANCO DE DADOS SUPABASE - COMADEMIG")
    print(f"Data: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 80)
    
    # Lista de tabelas principais do COMADEMIG
    tables = [
        'profiles',
        'member_types',
        'subscription_plans',
        'user_subscriptions',
        'asaas_cobrancas',
        'solicitacoes_servicos',
        'servicos',
        'affiliates',
        'commissions'
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
    
    return results

if __name__ == "__main__":
    analyze_database()
```

## 🔒 Segurança e Boas Práticas

### ✅ O que fazer:
- Usar Power Supabase como método principal
- Gerar Access Token específico para o CLI
- Dar nome descritivo ao token (ex: "Kiro CLI - COMADEMIG")
- Revogar token se não for mais necessário

### ❌ O que NÃO fazer:
- Nunca commitar Access Token no Git
- Nunca compartilhar token publicamente
- Nunca usar JWT Secret do projeto (é diferente!)
- Nunca usar service_role key para o CLI
- Nunca usar anon key para análise de dados

### 🔐 Diferença entre tokens:

| Token | Onde encontrar | Para que serve | Usar no CLI? |
|-------|---------------|----------------|--------------|
| Access Token | Account > Access Tokens | Autenticar CLI | ✅ SIM |
| JWT Secret | Project > API Settings | Assinar tokens JWT | ❌ NÃO |
| Anon Key | Project > API Settings | Frontend público | ❌ NÃO |
| Service Role | Project > API Settings | Backend privado | ❌ NÃO |

## 🎯 Protocolo de Verificação

### Exemplo de Verificação Completa via Power

```
1. Ativar Power Supabase:
   - Usar kiroPowers para ativar "supabase-hosted"
   - Verificar conexão com o projeto

2. Verificar tabelas do COMADEMIG:
   - Listar tabelas relacionadas à funcionalidade
   - Verificar estrutura das tabelas existentes
   - Contar registros em cada tabela

3. Analisar dados existentes:
   - Verificar dados em profiles, member_types, etc.
   - Identificar relacionamentos
   - Verificar políticas RLS ativas

4. Documentar estado atual:
   - Registrar estruturas encontradas
   - Documentar dados importantes
   - Planejar mudanças necessárias
```

## 🐛 Troubleshooting

### Erro: "Tabela não encontrada"
**Causa:** Nome da tabela incorreto ou não existe
**Solução:** Verificar lista de tabelas via Power Supabase

### Erro: "0 registros retornados"
**Causa:** Políticas RLS bloqueando acesso
**Solução:** Usar Power Supabase ou service_role key

### Erro: "Permissão negada"
**Causa:** Token incorreto ou sem permissões
**Solução:** Verificar se está usando o método correto (Power Supabase)