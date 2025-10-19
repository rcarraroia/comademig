# 📋 SEPARAÇÃO: MÓDULO FILIAÇÃO vs MÓDULO SERVIÇOS

**Data:** 2025-10-19  
**Decisão:** Manter módulos separados

---

## 🎯 DECISÃO

**Filiação NÃO será incluída nas categorias de serviços**

**Motivo:** Filiação tem módulo próprio e pode causar conflito

---

## 📊 ESTRUTURA DOS MÓDULOS

### Módulo de Filiação (Separado)
**Rota:** `/dashboard/filiacao`

**Características:**
- Processo específico de filiação
- Formulário próprio
- Validações específicas
- Fluxo de aprovação diferente
- Pagamento de taxa de filiação

**Tabelas:**
- `user_subscriptions` (ou similar)
- `member_types`
- `subscription_plans`

**service_type:** `'filiacao'` (se usar asaas_cobrancas)

---

### Módulo de Serviços (Este)
**Rota:** `/dashboard/solicitacao-servicos`

**Características:**
- Solicitação de serviços diversos
- Formulário dinâmico por serviço
- Categorias gerenciáveis
- Fluxo de entrega de serviço

**Tabelas:**
- `servicos`
- `solicitacoes_servicos`
- `service_categories` ⭐ **NOVA**

**Categorias:**
- `'certidao'` - Certidões
- `'regularizacao'` - Regularização
- ❌ **NÃO** `'filiacao'` (módulo próprio)
- ❌ **NÃO** `'evento'` (módulo de assinaturas)
- ❌ **NÃO** `'taxa_anual'` (módulo de assinaturas)

---

## 🔧 IMPLEMENTAÇÃO

### Categorias de Serviços (service_categories)

```sql
-- Apenas para SERVIÇOS
INSERT INTO service_categories (code, name, description) VALUES
  ('certidao', 'Certidões', 'Emissão de certidões e documentos'),
  ('regularizacao', 'Regularização', 'Regularização de situação cadastral'),
  ('evento', 'Eventos', 'Inscrições e participação em eventos'),
  ('taxa_anual', 'Taxa Anual', 'Pagamento de anuidades');

-- ❌ NÃO incluir 'filiacao'
```

### Tabela asaas_cobrancas (Compartilhada)

**Pode ter service_type:**
- `'filiacao'` - Vindo do módulo de filiação
- `'certidao'` - Vindo do módulo de serviços
- `'regularizacao'` - Vindo do módulo de serviços
- `'evento'` - Vindo do módulo de serviços
- `'taxa_anual'` - Vindo do módulo de serviços

**Solução para FK:**
```sql
-- Opção 1: FK com NULL permitido
ALTER TABLE asaas_cobrancas
ADD CONSTRAINT fk_service_type
FOREIGN KEY (service_type) 
REFERENCES service_categories(code)
ON DELETE RESTRICT;

-- service_type pode ser NULL ou não estar em service_categories
-- Cobranças de filiação terão service_type = 'filiacao' mas não FK

-- Opção 2: Não usar FK (mais flexível)
-- Apenas validar no código
```

---

## ⚠️ PROBLEMA POTENCIAL

### Se usarmos FK estrito:

```sql
-- Cobrança de filiação
INSERT INTO asaas_cobrancas (service_type, ...) 
VALUES ('filiacao', ...);

-- ❌ ERRO: FK constraint violation
-- 'filiacao' não existe em service_categories
```

### Soluções:

**Opção A: Não usar FK em asaas_cobrancas** ⭐ **RECOMENDADO**
```sql
-- Não adicionar FK
-- Validar service_type no código
-- Mais flexível para múltiplos módulos
```

**Opção B: FK apenas em servicos**
```sql
-- FK apenas na tabela servicos
ALTER TABLE servicos
ADD CONSTRAINT fk_categoria
FOREIGN KEY (categoria)
REFERENCES service_categories(code);

-- asaas_cobrancas sem FK (aceita qualquer valor)
```

**Opção C: Adicionar 'filiacao' mas não gerenciar**
```sql
-- Adicionar na tabela mas marcar como não gerenciável
INSERT INTO service_categories (code, name, active, manageable) 
VALUES ('filiacao', 'Filiação', false, false);

-- Interface admin não mostra/edita esta categoria
```

---

## 🎯 RECOMENDAÇÃO FINAL

### Para asaas_cobrancas:
**NÃO usar FK** - Aceitar qualquer service_type

**Motivo:**
- Tabela compartilhada entre módulos
- Filiação precisa usar 'filiacao'
- Serviços usam categorias gerenciáveis
- Mais flexível para futuros módulos

### Para servicos:
**USAR FK** - Apenas categorias gerenciáveis

**Motivo:**
- Tabela específica do módulo de serviços
- Garante integridade
- Facilita gerenciamento

---

## 📋 PLANO ATUALIZADO

### Fase 1: Banco de Dados

```sql
-- 1. Criar tabela de categorias (apenas serviços)
CREATE TABLE service_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Popular (APENAS 2 CATEGORIAS AUTORIZADAS)
INSERT INTO service_categories (code, name, description) VALUES
  ('certidao', 'Certidões', 'Emissão de certidões e documentos'),
  ('regularizacao', 'Regularização', 'Regularização de situação cadastral');

-- 3. FK apenas em servicos (não em asaas_cobrancas)
ALTER TABLE servicos
ADD CONSTRAINT fk_categoria
FOREIGN KEY (categoria)
REFERENCES service_categories(code)
ON DELETE RESTRICT;

-- 4. asaas_cobrancas SEM FK
-- Remover constraint CHECK
ALTER TABLE asaas_cobrancas
DROP CONSTRAINT IF EXISTS asaas_cobrancas_service_type_check;

-- Não adicionar FK (aceita 'filiacao' e outras)
```

---

## ✅ VANTAGENS DA SEPARAÇÃO

1. **Módulos independentes**
   - Filiação não interfere em Serviços
   - Serviços não interfere em Filiação

2. **Flexibilidade**
   - asaas_cobrancas aceita qualquer tipo
   - Cada módulo gerencia suas categorias

3. **Manutenção**
   - Mudanças em um não afetam o outro
   - Código mais organizado

4. **Escalabilidade**
   - Fácil adicionar novos módulos
   - Cada um com suas categorias

---

## 🎯 RESUMO

**Categorias de Serviços:**
- ✅ certidao
- ✅ regularizacao
- ❌ filiacao (módulo próprio)
- ❌ evento (módulo de assinaturas)
- ❌ taxa_anual (módulo de assinaturas)

**FK:**
- ✅ servicos → service_categories
- ❌ asaas_cobrancas (sem FK, aceita qualquer)

**Interface Admin:**
- Gerencia apenas categorias de serviços
- Não mostra/edita 'filiacao'

---

**DECISÃO APROVADA** ✅
