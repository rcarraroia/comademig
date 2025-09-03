# Solução: Erro no Gerenciador de Conteúdo - Menu Início

## 🔍 Problema Identificado

O erro no menu "Gerenciar Conteúdo > Início" estava ocorrendo devido a múltiplos problemas:

### Erro Original
```
Failed to load resource: the server responded with a status of 400 ()
record "new" has no field "updated_at"
```

## 🛠️ Correções Implementadas

### 1. Correção do Campo `updated_at` vs `last_updated_at`

**Problema**: O código estava tentando usar o campo `updated_at` que não existe na tabela `content_management`. A tabela usa `last_updated_at`.

**Arquivos Corrigidos**:

#### `src/hooks/useContent.ts`
```typescript
// ANTES
export interface ContentData {
  page_name: string;
  content_json: any;
  updated_at?: string; // ❌ Campo incorreto
}

// DEPOIS
export interface ContentData {
  page_name: string;
  content_json: any;
  last_updated_at?: string; // ✅ Campo correto
}
```

#### `src/hooks/useContentMutation.ts`
```typescript
// ANTES - Usando select('*') que incluía campos inexistentes
.select('*')

// DEPOIS - Usando select específico
.select('page_name, content_json, last_updated_at')
```

### 2. Remoção do `.single()` Problemático

**Problema**: O `.single()` estava causando erro quando o update não retornava dados.

```typescript
// ANTES
.select()
.single();

// DEPOIS
.select('page_name, content_json, last_updated_at');
```

### 3. Correção de Queries SELECT

**Problema**: Queries usando `select('*')` estavam tentando acessar campos que não existem.

```typescript
// ANTES
.select('*')

// DEPOIS
.select('page_name, content_json, last_updated_at, created_at')
```

## 🔒 Problema Principal: Trigger com Campo Incorreto

### Diagnóstico Final
- ✅ Usuário tem role 'admin'
- ✅ SELECT funciona
- ❌ UPDATE falha com erro: `record "new" has no field "updated_at"`
- ❌ Trigger está tentando usar campo inexistente

### Causa Raiz IDENTIFICADA
O trigger `update_content_management_timestamp` foi criado com referência ao campo `updated_at`, mas a tabela usa `last_updated_at`.

### Solução Definitiva
Execute o script completo `fix_rls_policies.sql` no painel do Supabase:

```sql
-- 1. CORRIGIR TRIGGER
DROP TRIGGER IF EXISTS update_content_management_timestamp ON public.content_management;
DROP FUNCTION IF EXISTS update_content_timestamp();
DROP FUNCTION IF EXISTS update_content_management_timestamp();

-- Criar função corrigida
CREATE OR REPLACE FUNCTION update_content_management_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_updated_at = now();  -- Campo correto!
  IF auth.uid() IS NOT NULL THEN
    NEW.last_updated_by = auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger corrigido
CREATE TRIGGER update_content_management_timestamp
  BEFORE UPDATE ON public.content_management
  FOR EACH ROW
  EXECUTE FUNCTION update_content_management_timestamp();

-- 2. CORRIGIR POLÍTICAS RLS
-- (Ver arquivo fix_rls_policies.sql para script completo)
```

## 📋 Status das Correções

### ✅ Implementadas
1. Correção do campo `updated_at` → `last_updated_at`
2. Remoção do `.single()` problemático
3. Correção de queries SELECT específicas
4. Melhoria no tratamento de erros

### ⏳ Pendentes (Requer Acesso ao Painel Supabase)
1. **CRÍTICO**: Correção do trigger com campo `updated_at` → `last_updated_at`
2. Ajuste das políticas RLS
3. Teste com usuário autenticado

## 🧪 Como Testar

1. **Fazer login** como admin no sistema
2. **Navegar** para Dashboard > Admin > Gerenciar Conteúdo > Início
3. **Editar** qualquer campo do banner principal
4. **Salvar** as alterações
5. **Verificar** se não há erros no console
6. **Confirmar** se as alterações foram salvas

## 🔧 Scripts de Diagnóstico Criados

- `check_content_management.py` - Verifica estrutura da tabela
- `test_rls_policies.py` - Testa políticas RLS
- `debug_content.py` - Debug detalhado do problema
- `check_user_permissions.py` - Verifica permissões do usuário

## 📞 Próximos Passos

1. **EXECUTAR** o script `fix_rls_policies.sql` completo no painel do Supabase
2. **TESTAR** o gerenciador de conteúdo (deve funcionar sem erros)
3. **VERIFICAR** se o conteúdo está sendo salvo corretamente
4. **MONITORAR** logs para confirmar que não há mais erros

---

**Status**: ✅ Correções de código implementadas | 🔧 Script SQL pronto para execução | ⏳ Aguardando correção do trigger