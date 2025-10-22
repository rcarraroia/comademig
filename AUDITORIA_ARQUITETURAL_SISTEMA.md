# 🔍 SISTEMA DE AUDITORIA ARQUITETURAL

## 🎯 OBJETIVO

Criar scripts automatizados que identificam:
1. **Duplicidade de dados** (campos redundantes)
2. **Inconsistências arquiteturais** (constraints vs lógica de negócio)
3. **Fontes de verdade conflitantes** (múltiplas tabelas com mesma informação)
4. **Validações duplicadas** (frontend + backend + banco)
5. **Código morto** (campos/tabelas não usados)

---

## 📋 TIPOS DE PROBLEMAS A DETECTAR

### 1. REDUNDÂNCIA DE DADOS
**Exemplo atual:**
- `profiles.member_type_id` (FK para member_types) ✅
- `profiles.tipo_membro` (texto duplicado) ❌

**Como detectar:**
- Campos que armazenam mesma informação
- FKs + campos de texto com mesmo propósito
- Tabelas que duplicam dados de outras

### 2. CONSTRAINTS HARDCODED
**Exemplo atual:**
- `CHECK (tipo_membro IN ('membro', 'pastor', 'super_admin'))` ❌
- Mas `member_types` tem 4 tipos ativos

**Como detectar:**
- Constraints CHECK com listas fixas
- Comparar com dados reais nas tabelas relacionadas
- Identificar constraints que limitam sistemas dinâmicos

### 3. VALIDAÇÕES MÚLTIPLAS
**Exemplo:**
- Validação de CPF no frontend (Zod)
- Validação de CPF no backend (Edge Function)
- Validação de CPF no Asaas (API externa)

**Como detectar:**
- Mesma lógica de validação em múltiplos lugares
- Regras de negócio duplicadas

### 4. FONTES DE VERDADE CONFLITANTES
**Exemplo:**
- `member_types` (tabela mestre)
- `tipo_membro` (campo texto)
- Qual é a fonte de verdade?

**Como detectar:**
- Múltiplas tabelas/campos com mesma informação
- Falta de FKs onde deveria haver
- Dados que não sincronizam

### 5. CÓDIGO MORTO
**Exemplo:**
- Campos criados mas nunca usados
- Tabelas antigas não referenciadas
- Funções/triggers obsoletos

**Como detectar:**
- Campos sem referências no código
- Tabelas sem queries
- Triggers sem uso

---

## 🛠️ SCRIPTS DE AUDITORIA

### Script 1: Detector de Redundância
```python
#!/usr/bin/env python3
"""
Detecta campos redundantes no banco de dados
"""

def detect_redundancy():
    # 1. Buscar todas as FKs
    # 2. Para cada FK, verificar se há campo texto relacionado
    # 3. Comparar dados para confirmar redundância
    
    redundancies = []
    
    # Exemplo: profiles
    # - member_type_id (FK) + tipo_membro (TEXT)
    # - asaas_customer_id (TEXT) + customer em outra tabela?
    
    return redundancies
```

### Script 2: Detector de Constraints Problemáticos
```python
#!/usr/bin/env python3
"""
Detecta constraints que limitam sistemas dinâmicos
"""

def detect_problematic_constraints():
    # 1. Buscar todos os CHECK constraints
    # 2. Identificar listas fixas (IN (...))
    # 3. Verificar se há tabela relacionada com mais valores
    # 4. Reportar inconsistências
    
    problems = []
    
    # Exemplo:
    # CHECK (tipo_membro IN ('a', 'b', 'c'))
    # Mas member_types tem 5 registros ativos
    
    return problems
```

### Script 3: Mapeador de Fontes de Verdade
```python
#!/usr/bin/env python3
"""
Identifica qual é a fonte de verdade para cada entidade
"""

def map_sources_of_truth():
    # 1. Listar todas as entidades do sistema
    # 2. Para cada entidade, identificar onde está armazenada
    # 3. Detectar múltiplas fontes
    # 4. Sugerir fonte única
    
    entities = {
        'member_type': {
            'sources': [
                'member_types.id (FK)',
                'profiles.tipo_membro (TEXT)'
            ],
            'recommended': 'member_types.id',
            'action': 'Remove profiles.tipo_membro'
        }
    }
    
    return entities
```

### Script 4: Analisador de Uso de Campos
```python
#!/usr/bin/env python3
"""
Detecta campos não usados no código
"""

def analyze_field_usage():
    # 1. Listar todos os campos de todas as tabelas
    # 2. Buscar referências no código (grep)
    # 3. Identificar campos sem uso
    # 4. Sugerir remoção
    
    unused_fields = []
    
    return unused_fields
```

### Script 5: Validador de Integridade Referencial
```python
#!/usr/bin/env python3
"""
Verifica se FKs estão corretas e se há dados órfãos
"""

def validate_referential_integrity():
    # 1. Verificar todas as FKs
    # 2. Buscar registros órfãos
    # 3. Identificar FKs faltantes
    # 4. Reportar problemas
    
    integrity_issues = []
    
    return integrity_issues
```

---

## 📊 RELATÓRIO DE AUDITORIA

### Formato do Relatório:
```markdown
# AUDITORIA ARQUITETURAL - [DATA]

## 🔴 PROBLEMAS CRÍTICOS (Impedem funcionalidades)
1. Constraint hardcoded bloqueia tipos dinâmicos
   - Tabela: profiles
   - Campo: tipo_membro
   - Constraint: check_tipo_membro_values
   - Impacto: Não aceita novos member_types
   - Solução: Remover constraint

## 🟡 PROBLEMAS MÉDIOS (Causam inconsistências)
1. Redundância de dados
   - Tabela: profiles
   - Campos: member_type_id + tipo_membro
   - Impacto: Dados podem dessincronizar
   - Solução: Deprecar tipo_membro

## 🟢 MELHORIAS (Otimizações)
1. Campos não usados
   - Tabela: profiles
   - Campo: campo_antigo
   - Impacto: Ocupa espaço
   - Solução: Remover após validação
```

---

## 🔧 IMPLEMENTAÇÃO

### Estrutura de Arquivos:
```
/auditoria/
├── 01_detect_redundancy.py
├── 02_detect_constraints.py
├── 03_map_sources_of_truth.py
├── 04_analyze_field_usage.py
├── 05_validate_integrity.py
├── run_full_audit.py (executa todos)
└── reports/
    └── audit_YYYYMMDD_HHMMSS.md
```

### Execução:
```bash
# Auditoria completa
python auditoria/run_full_audit.py

# Auditoria específica
python auditoria/01_detect_redundancy.py
```

---

## 📈 BENEFÍCIOS

### Imediatos:
- ✅ Identifica problemas antes de virarem bugs
- ✅ Documenta inconsistências existentes
- ✅ Prioriza correções por impacto

### Médio Prazo:
- ✅ Previne novos problemas arquiteturais
- ✅ Facilita refatoração
- ✅ Melhora qualidade do código

### Longo Prazo:
- ✅ Sistema mais consistente
- ✅ Menos bugs de sincronização
- ✅ Manutenção mais fácil

---

## 🎯 CASOS DE USO

### 1. Antes de Deploy
```bash
# Rodar auditoria
python auditoria/run_full_audit.py

# Se houver problemas críticos: NÃO FAZER DEPLOY
# Corrigir problemas primeiro
```

### 2. Após Adicionar Feature
```bash
# Verificar se nova feature criou redundâncias
python auditoria/01_detect_redundancy.py
```

### 3. Manutenção Mensal
```bash
# Auditoria completa
# Revisar relatório
# Planejar correções
```

### 4. Antes de Refatoração
```bash
# Identificar código morto
python auditoria/04_analyze_field_usage.py

# Remover com segurança
```

---

## 🚀 PRÓXIMOS PASSOS

### Fase 1: Criar Scripts Base
1. Script de redundância
2. Script de constraints
3. Script de fontes de verdade

### Fase 2: Automatizar
1. CI/CD integration
2. Alertas automáticos
3. Relatórios periódicos

### Fase 3: Expandir
1. Análise de performance
2. Detecção de N+1 queries
3. Análise de segurança (RLS)

---

## 💡 EXEMPLO PRÁTICO

### Problema Atual Detectado:
```
🔴 CRÍTICO: Constraint hardcoded bloqueia sistema dinâmico

Tabela: profiles
Campo: tipo_membro
Constraint: CHECK (tipo_membro IN ('membro', 'pastor', 'super_admin'))

Conflito com:
- Tabela member_types tem 4 tipos ativos
- Módulo "Gestão de Cargos" permite criar tipos dinamicamente

Impacto:
- Usuários não conseguem se filiar como "Diácono"
- Admin não pode criar novos tipos funcionais
- Sistema quebra ao usar tipos não hardcoded

Solução:
ALTER TABLE profiles DROP CONSTRAINT check_tipo_membro_values;

Prioridade: IMEDIATA
Risco de não corrigir: ALTO (funcionalidade quebrada)
```

---

## ✅ CONCLUSÃO

**SIM, É POSSÍVEL criar sistema de auditoria automática!**

**Benefícios:**
- Detecta problemas ANTES de virarem bugs
- Documenta inconsistências
- Prioriza correções
- Previne novos problemas

**Posso implementar:**
1. Scripts de auditoria completos
2. Relatórios automáticos
3. Integração com CI/CD
4. Alertas de problemas críticos

**Quer que eu crie o sistema completo de auditoria?**
