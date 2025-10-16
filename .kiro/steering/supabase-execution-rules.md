# 🚨 REGRAS CRÍTICAS DE EXECUÇÃO SUPABASE

## ✅ REGRA FUNDAMENTAL ATUALIZADA - CLI CONFIGURADO E OPERACIONAL

### CONTEXTO ATUALIZADO (14/10/2025)
- ✅ **Kiro AI AGORA TEM ACESSO via Supabase CLI**
- ✅ **Kiro AI PODE EXECUTAR migrações, criar tabelas, alterar estruturas via CLI**
- ✅ **Kiro AI PODE fazer deploy de Edge Functions automaticamente**
- ✅ **Kiro AI PODE gerenciar secrets de forma segura**
- ✅ **Kiro AI PODE executar queries SQL diretamente**
- ⚠️ **Python continua sendo usado APENAS para leitura e análise**
- ⚠️ **Operações críticas ainda podem requerer confirmação do usuário**

### PROTOCOLO ATUALIZADO COM CLI

#### 0. VERIFICAÇÃO PRÉVIA OBRIGATÓRIA - ANÁLISE DO ESTADO ATUAL DO BANCO
**MÉTODO PREFERENCIAL: CLI + Python**
- **SEMPRE verificar condições atuais do banco ANTES de qualquer implementação**
- **OBRIGATÓRIO: Analisar o que temos no banco atualmente para não apagar ou corromper nada que já esteja funcionando**
- **Usar scripts Python com supabase-py para conectar e verificar estado real do banco**
- **Usar comandos grepSearch, readFile para analisar código e referências**
- **Avaliar se novas implementações podem prejudicar funcionalidades existentes**
- **Identificar dependências e relacionamentos entre tabelas**
- **Verificar políticas RLS existentes antes de criar novas**
- **Identificar conflitos potenciais com estruturas existentes**
- **Documentar estado atual antes de propor alterações**
- **NUNCA criar migrações que possam destruir dados existentes sem verificação prévia**

#### 1. CRIAÇÃO DE MIGRAÇÕES (VIA CLI)
- **Kiro cria migrações usando:** `supabase migration new nome_descritivo`
- Scripts são salvos automaticamente em `supabase/migrations/` com timestamp
- Cada migração é autocontida e versionada
- Migrações incluem verificações de compatibilidade

#### 2. EXECUÇÃO AUTOMÁTICA VIA CLI
- **Kiro aplica migrações com:** `supabase db push`
- Execução é direta e automática
- Histórico de migrações é mantido automaticamente
- Rollback facilitado se necessário

#### 3. ORDEM DE EXECUÇÃO
- CLI gerencia ordem automaticamente via timestamps
- Dependências são respeitadas pela ordem de criação
- Verificações de pré-requisitos incluídas nas migrações

#### 4. VALIDAÇÃO PÓS-EXECUÇÃO
- **Kiro verifica com:** `supabase db execute "SELECT ..."`
- Confirmação automática de tabelas/funções criadas
- Logs disponíveis para auditoria
- Testes de conectividade automáticos

### COMUNICAÇÃO ATUALIZADA COM CLI

#### Quando Kiro cria e aplica migrações via CLI:
```
✅ MIGRAÇÃO APLICADA VIA CLI

Migração criada e executada automaticamente:
- Arquivo: supabase/migrations/[timestamp]_[nome].sql
- Comando executado: supabase db push
- Status: Aplicada com sucesso
- Verificação: [resultado da validação]

PRÓXIMOS PASSOS:
- Verificar funcionalidade no frontend
- Testar integração com código existente
```

#### Verificação de Status:
- Kiro executa e verifica automaticamente via CLI
- Logs de execução são documentados
- Confirmação de sucesso é automática
- Usuário é notificado apenas se houver problemas

### EXEMPLOS DE COMUNICAÇÃO ATUALIZADOS

✅ **CORRETO (com CLI):**
"Migração criada e aplicada com sucesso via CLI"
"Tabelas criadas no Supabase - verificado via CLI"
"Sistema atualizado e testado"

⚠️ **SE HOUVER ERRO:**
"Erro ao aplicar migração via CLI: [detalhes]"
"Necessário intervenção manual no Dashboard"
"Rollback recomendado"

### CONSEQUÊNCIAS DE NÃO SEGUIR

- Sistema frontend implementado sem backend funcional
- Erros 404/500 em produção
- Funcionalidades quebradas
- Perda de tempo e retrabalho
- Frustração do usuário

### CHECKLIST OBRIGATÓRIO ATUALIZADO (COM CLI)

Antes de qualquer implementação que envolva banco de dados:

**FASE DE ANÁLISE PRÉVIA:**
- [ ] **Conexão real com Supabase testada via Python ou CLI**
- [ ] Estado atual do banco verificado com dados reais
- [ ] Tabelas existentes identificadas via queries reais
- [ ] Contagem de registros verificada por tabela
- [ ] Estrutura de dados analisada com exemplos reais
- [ ] Políticas RLS atuais mapeadas
- [ ] Dependências e relacionamentos verificados
- [ ] Impacto em funcionalidades existentes avaliado
- [ ] Conflitos potenciais identificados

**FASE DE IMPLEMENTAÇÃO (VIA CLI):**
- [ ] Migração criada com `supabase migration new nome`
- [ ] Script SQL editado e revisado
- [ ] Validações incluídas no script
- [ ] Verificações de compatibilidade incluídas
- [ ] **Migração aplicada com `supabase db push`**
- [ ] **Resultado verificado automaticamente**
- [ ] **Logs de execução documentados**
- [ ] Funcionalidade testada no frontend

**FASE DE VALIDAÇÃO PÓS-EXECUÇÃO:**
- [ ] Tabelas/funções criadas confirmadas via CLI
- [ ] Dados de teste inseridos e verificados
- [ ] Políticas RLS testadas
- [ ] Integração com código frontend validada
- [ ] Performance verificada (se aplicável)

## 🎯 APLICAÇÃO IMEDIATA

Esta regra se aplica a:
- Criação de tabelas
- Alteração de estruturas
- Criação de funções/triggers
- Políticas RLS
- Índices de performance
- Qualquer operação SQL no Supabase

### COMANDOS DE VERIFICAÇÃO DISPONÍVEIS
- `grepSearch` - Para buscar referências no código
- `readFile` - Para analisar arquivos existentes
- `readMultipleFiles` - Para análise comparativa
- `listDirectory` - Para mapear estrutura de arquivos
- **Scripts Python com supabase-py** - Para acessar dados reais do banco

### MÉTODOS CORRETOS PARA ACESSAR BANCO REAL
**NUNCA confiar apenas no arquivo `src/integrations/supabase/types.ts`** - ele pode estar desatualizado!

#### MÉTODO 1: Python com supabase-py (APENAS LEITURA/VERIFICAÇÃO)

```python
from supabase import create_client, Client

# Configurações (extrair de src/integrations/supabase/client.ts)
SUPABASE_URL = "https://amkelczfwazutrciqtlk.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Conectar e APENAS LER dados
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
response = supabase.table('nome_tabela').select('*').limit(1).execute()  # APENAS SELECT
```

**⚠️ OPERAÇÕES PROIBIDAS VIA PYTHON:**
- `supabase.table().insert()` - PROIBIDO
- `supabase.table().update()` - PROIBIDO  
- `supabase.table().delete()` - PROIBIDO
- `supabase.rpc()` com operações de escrita - PROIBIDO

**Exemplo de script completo:** `test_supabase_connection.py`

#### MÉTODO 2: Supabase CLI (LEITURA E ESCRITA PERMITIDAS)

**✅ COMANDOS CLI PERMITIDOS:**

```powershell
# Executar queries SQL (leitura e escrita)
supabase db execute "SELECT * FROM profiles LIMIT 5"
supabase db execute "INSERT INTO tabela (campo) VALUES ('valor')"

# Aplicar migrações
supabase db push

# Criar nova migração
supabase migration new nome_da_migracao

# Ver estrutura do banco
supabase db dump --schema public

# Gerenciar Edge Functions
supabase functions deploy nome_da_function
supabase functions logs nome_da_function

# Gerenciar Secrets
supabase secrets set CHAVE=valor
supabase secrets list
```

**📋 QUANDO USAR CADA MÉTODO:**
- **Python**: Para análise, verificação e diagnóstico (somente leitura)
- **CLI**: Para executar migrações, aplicar mudanças, gerenciar functions e secrets
- **Dashboard Manual**: Para operações críticas que precisam de confirmação visual

### REGRAS FUNDAMENTAIS ATUALIZADAS (CLI DISPONÍVEL)

#### ✅ AGORA POSSO FAZER (via CLI):
- **EXECUTAR migrações automaticamente** com `supabase db push`
- **CRIAR novas migrações** com `supabase migration new nome`
- **EXECUTAR queries SQL diretamente** com `supabase db execute "SQL"`
- **FAZER DEPLOY de Edge Functions** com `supabase functions deploy nome`
- **GERENCIAR secrets** com `supabase secrets set KEY=value`
- **VER LOGS em tempo real** com `supabase functions logs nome --tail`
- **APLICAR mudanças no banco** sem copiar/colar no Dashboard

#### ⚠️ AINDA DEVO FAZER (boas práticas):
- **SEMPRE verificar estado atual ANTES de implementar** (via Python ou CLI)
- **SEMPRE avaliar impacto em funcionalidades existentes**
- **SEMPRE documentar comandos CLI executados**
- **SEMPRE testar migrações antes de aplicar em produção**
- **SEMPRE fazer backup antes de mudanças críticas**

#### ❌ NUNCA FAZER:
- **NUNCA tentar executar operações de escrita via Python** (usar CLI)
- **NUNCA aplicar migrações sem análise prévia do banco**
- **NUNCA fazer DROP TABLE sem confirmação explícita do usuário**
- **NUNCA assumir que mudanças foram bem-sucedidas sem verificar**
## 🛠️ SUPABASE CLI - FERRAMENTA PRINCIPAL DE EXECUÇÃO

### ✅ STATUS: CONFIGURADO E OPERACIONAL

**Versão instalada:** 2.51.0  
**Projeto linkado:** amkelczfwazutrciqtlk (Comademig)  
**Autenticação:** Ativa  
**Data de configuração:** 14/10/2025

### VERIFICAÇÃO DE STATUS
```powershell
# Verificar instalação
supabase --version

# Verificar se está linkado ao projeto
supabase status

# Listar projetos disponíveis
supabase projects list
```

### COMANDOS PRINCIPAIS PARA USO DIÁRIO

#### Gerenciamento de Migrações
```powershell
# Criar nova migração
supabase migration new descricao_da_mudanca

# Aplicar migrações pendentes ao banco remoto
supabase db push

# Ver histórico de migrações
supabase migration list

# Verificar status das migrações
supabase migration repair
```

#### Execução de SQL
```powershell
# Executar query SQL diretamente
supabase db execute "SELECT * FROM profiles LIMIT 5"

# Executar arquivo SQL
supabase db execute -f caminho/para/arquivo.sql

# Fazer dump do banco
supabase db dump --schema public -f backup.sql
```

#### Gerenciamento de Edge Functions
```powershell
# Listar functions
supabase functions list

# Deploy de function
supabase functions deploy webhook-asaas

# Ver logs em tempo real
supabase functions logs webhook-asaas --tail

# Testar function localmente
supabase functions serve webhook-asaas
```

#### Gerenciamento de Secrets
```powershell
# Listar secrets (não mostra valores)
supabase secrets list

# Definir secret
supabase secrets set ASAAS_API_KEY=valor_da_chave

# Definir múltiplos secrets de uma vez
supabase secrets set KEY1=valor1 KEY2=valor2

# Remover secret
supabase secrets unset ASAAS_API_KEY
```

### FLUXO DE TRABALHO RECOMENDADO

#### Para Criar e Aplicar Migração:
1. **Analisar estado atual** (via Python)
2. **Criar migração**: `supabase migration new nome_descritivo`
3. **Editar arquivo SQL** gerado em `supabase/migrations/`
4. **Testar localmente** (se possível)
5. **Aplicar ao banco remoto**: `supabase db push`
6. **Verificar resultado** (via Python ou CLI)
7. **Documentar mudança**

#### Para Deploy de Edge Function:
1. **Editar código** da function em `supabase/functions/`
2. **Testar localmente**: `supabase functions serve nome-function`
3. **Deploy**: `supabase functions deploy nome-function`
4. **Verificar logs**: `supabase functions logs nome-function`
5. **Testar endpoint** em produção

### VANTAGENS DO CLI

✅ **Execução direta** - Não precisa copiar/colar no Dashboard
✅ **Versionamento** - Migrações ficam no Git
✅ **Automação** - Pode ser usado em scripts
✅ **Logs em tempo real** - Debugging mais fácil
✅ **Rollback facilitado** - Histórico de migrações
✅ **Secrets seguros** - Não aparecem no código

### QUANDO USAR CLI vs DASHBOARD vs PYTHON (ATUALIZADO)

| Operação | Método Recomendado | Motivo | Status |
|----------|-------------------|---------|--------|
| Análise de dados | Python | Leitura segura, scripts reutilizáveis | ✅ Disponível |
| Criar migração | **CLI** | Versionamento automático | ✅ **USAR AGORA** |
| Aplicar migração | **CLI** | Execução direta, sem copiar/colar | ✅ **USAR AGORA** |
| Deploy de function | **CLI** | Processo automatizado | ✅ **USAR AGORA** |
| Gerenciar secrets | **CLI** | Segurança, não expõe valores | ✅ **USAR AGORA** |
| Verificar estrutura | Python ou CLI | Ambos funcionam bem | ✅ Disponível |
| Executar SQL | **CLI** | Direto e rápido | ✅ **USAR AGORA** |
| Ver logs | **CLI** | Tempo real | ✅ **USAR AGORA** |
| Operação crítica | Dashboard Manual | Confirmação visual | ⚠️ Apenas se necessário |
| Debug de function | **CLI** | Logs em tempo real | ✅ **USAR AGORA** |

**PRIORIDADE:** Usar CLI sempre que possível. Dashboard apenas para operações que exigem confirmação visual.

---

## 🔗 MÉTODO VALIDADO DE CONEXÃO COM SUPABASE (PYTHON)

### DESCOBERTA CRÍTICA
- **O arquivo `types.ts` NÃO reflete a realidade do banco**
- **Única forma confiável é conexão direta via Python ou CLI**
- **Biblioteca supabase-py funciona perfeitamente para análise**

### TEMPLATE DE SCRIPT DE VERIFICAÇÃO

```python
#!/usr/bin/env python3
from supabase import create_client, Client

# Extrair configurações de src/integrations/supabase/client.ts
SUPABASE_URL = "https://amkelczfwazutrciqtlk.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

def analyze_database():
    """Análise completa do banco de dados"""
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    
    # Lista de tabelas para verificar
    tables = ['member_types', 'subscription_plans', 'user_subscriptions', 
              'profiles', 'asaas_cobrancas', 'solicitacoes_certidoes']
    
    results = {}
    for table in tables:
        try:
            # Contar registros
            count_response = supabase.table(table).select('*', count='exact').execute()
            count = count_response.count
            
            # Pegar amostra de dados
            sample_response = supabase.table(table).select('*').limit(3).execute()
            sample = sample_response.data
            
            results[table] = {
                'exists': True,
                'count': count,
                'sample': sample
            }
            print(f"✅ {table}: {count} registros")
            
        except Exception as e:
            results[table] = {
                'exists': False,
                'error': str(e)
            }
            print(f"❌ {table}: {str(e)}")
    
    return results

if __name__ == "__main__":
    analyze_database()
```

### REGRA FUNDAMENTAL ATUALIZADA
**SEMPRE criar e executar script Python ANTES de qualquer análise ou implementação**

### VANTAGENS DO MÉTODO PYTHON
- ✅ Acesso direto aos dados reais
- ✅ Contagem precisa de registros
- ✅ Visualização de estrutura real
- ✅ Teste de conectividade
- ✅ Validação de políticas RLS
- ✅ Identificação de problemas reais

### APLICAÇÃO OBRIGATÓRIA
Este método deve ser usado para:
- Verificação de existência de tabelas
- Análise de dados existentes
- Validação pós-migração
- Diagnóstico de problemas
- Planejamento de implementações