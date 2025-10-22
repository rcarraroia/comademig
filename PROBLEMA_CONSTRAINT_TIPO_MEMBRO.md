# ❌ PROBLEMA: Constraint `check_tipo_membro_values`

## 🔍 ERRO IDENTIFICADO

```
new row for relation "profiles" violates check constraint "check_tipo_membro_values"
```

## 📊 ANÁLISE

### Valores de `member_types` no banco:
- Pastor
- Evangelista  
- Membro
- Diácono

### Valores de `tipo_membro` aceitos pelo constraint:
- `membro` ✅
- `pastor` ✅
- `super_admin` ✅
- `diacono` ❌ (REJEITADO)
- `evangelista` ❌ (provavelmente rejeitado)

### O que está acontecendo:
1. Usuário seleciona "Diácono"
2. Sistema converte: "Diácono" → "diacono" (remove acento)
3. Tenta salvar `tipo_membro = 'diacono'`
4. **Constraint rejeita** porque só aceita: `membro`, `pastor`, `super_admin`

## 🎯 CAUSA RAIZ

O constraint `check_tipo_membro_values` está **DESATUALIZADO** e só aceita 3 valores:
- `membro`
- `pastor`  
- `super_admin`

Mas a tabela `member_types` tem 4 tipos ativos:
- Pastor
- Evangelista
- Membro
- Diácono

## 💡 SOLUÇÕES POSSÍVEIS

### Opção 1: Atualizar o constraint (RECOMENDADO)
Modificar o constraint para aceitar todos os tipos:
```sql
ALTER TABLE profiles 
DROP CONSTRAINT check_tipo_membro_values;

ALTER TABLE profiles
ADD CONSTRAINT check_tipo_membro_values
CHECK (tipo_membro IN ('membro', 'pastor', 'evangelista', 'diacono', 'super_admin'));
```

### Opção 2: Remover o campo `tipo_membro` (IDEAL)
O campo `tipo_membro` é **redundante** porque já temos `member_type_id`.

```sql
-- Remover constraint
ALTER TABLE profiles DROP CONSTRAINT check_tipo_membro_values;

-- Tornar campo nullable (para não quebrar código existente)
ALTER TABLE profiles ALTER COLUMN tipo_membro DROP NOT NULL;

-- Eventualmente remover o campo
-- ALTER TABLE profiles DROP COLUMN tipo_membro;
```

### Opção 3: Mapear para valores aceitos (TEMPORÁRIO)
Mapear tipos não aceitos para "membro":
```typescript
const tipoMembroMap = {
  'pastor': 'pastor',
  'evangelista': 'membro', // Mapeia para membro
  'membro': 'membro',
  'diacono': 'membro', // Mapeia para membro
};
```

## ⚠️ RECOMENDAÇÃO

**Opção 1** é a melhor solução imediata:
- Atualiza o constraint para aceitar todos os tipos
- Mantém compatibilidade com código existente
- Permite usar todos os member_types

**Opção 2** é a solução ideal a longo prazo:
- Remove redundância
- Usa apenas `member_type_id` como fonte de verdade
- Elimina necessidade de sincronização

## 🔧 AÇÃO NECESSÁRIA

Preciso de autorização para:
1. Criar migração que atualiza o constraint
2. Fazer deploy da migração
3. Testar novamente

OU

1. Modificar código para mapear tipos não aceitos
2. Testar novamente

**Qual opção você prefere?**
