# 📊 ANÁLISE: CAMPO data_ordenacao vs TEMPO DE MINISTÉRIO

**Data:** 13/10/2025  
**Problema:** Campo `data_ordenacao` está sendo usado para armazenar "tempo de ministério" mas os labels ainda dizem "Data de Ordenação"

---

## 🔍 SITUAÇÃO ATUAL

### Mudança Implementada:

No `useFiliacaoPayment.ts`, o campo foi alterado para:
```typescript
data_ordenacao: data.tempo_ministerio || null, // ✅ Salvar tempo de ministério
```

**Problema:** O campo no banco se chama `data_ordenacao` (tipo DATE) mas agora está recebendo texto livre como "5 anos", "10 anos", etc.

---

## 📋 LOCAIS QUE USAM data_ordenacao

### ❌ COMPONENTES COM LABEL INCORRETO:

#### 1. `src/pages/dashboard/MeusDados.tsx` (2 ocorrências)
**Linha 375:**
```tsx
<Label htmlFor="data_ordenacao">Data de Ordenação</Label>
<Input
  id="data_ordenacao"
  type="date"  // ❌ Tipo errado para texto livre
  value={formData.data_ordenacao}
  onChange={(e) => handleInputChange('data_ordenacao', e.target.value)}
  disabled={!isEditing}
/>
```

**Problema:**
- Label diz "Data de Ordenação"
- Input é tipo `date` (calendário)
- Deveria ser texto livre para "5 anos", "10 anos"

---

#### 2. `src/pages/dashboard/PerfilCompleto.tsx` (2 ocorrências)
**Linha 772:**
```tsx
<Label htmlFor="data_ordenacao">Data de Ordenação</Label>
<Input
  id="data_ordenacao"
  type="date"  // ❌ Tipo errado
  value={formData.data_ordenacao}
  onChange={(e) => handleInputChange('data_ordenacao', e.target.value)}
  disabled={!isEditing}
/>
```

**Problema:** Mesmo problema - label e tipo incorretos

---

#### 3. `src/pages/dashboard/PerfilPublico.tsx` (2 ocorrências)
**Linha 275:**
```tsx
<p className="text-sm text-gray-600">Data de Ordenação</p>
<p className="font-medium">{formatDate(publicProfile.data_ordenacao)}</p>
```

**Problema:**
- Label diz "Data de Ordenação"
- Tenta formatar como data com `formatDate()`
- Vai quebrar se tiver "5 anos" ao invés de data

---

#### 4. `src/pages/dashboard/Dashboard.tsx`
**Linha 138:**
```tsx
{profile?.data_ordenacao ? 
  new Date(profile.data_ordenacao).getFullYear() :  // ❌ Vai quebrar com texto
  'N/A'
}
```

**Problema:** Tenta extrair ano de uma data, mas agora é texto livre

---

### ✅ ARQUIVOS QUE APENAS REFERENCIAM (OK):

- `src/hooks/useAuthState.ts` - Apenas define tipo
- `src/hooks/useAdminData.ts` - Apenas define tipo
- `src/hooks/useProfileValidation.ts` - Apenas valida completude
- `src/hooks/useCreateUser.ts` - Apenas insere valor
- `src/hooks/useUpdateUser.ts` - Apenas atualiza valor
- `src/integrations/supabase/types.ts` - Definição de tipo do banco

---

## 🎯 DECISÃO NECESSÁRIA

### Opção A: Manter data_ordenacao como DATA (Recomendado)

**Vantagens:**
- ✅ Consistente com nome do campo
- ✅ Tipo correto no banco (DATE)
- ✅ Permite cálculos (anos de ministério)
- ✅ Não quebra código existente

**Mudanças necessárias:**
1. Reverter `useFiliacaoPayment.ts` para salvar data real
2. Adicionar novo campo `tempo_ministerio` no banco (TEXT)
3. Atualizar formulário para ter 2 campos separados

**Formulário ficaria:**
```
Data de Ordenação: [__/__/____] (calendário)
Tempo de Ministério: [_________] (texto livre: "5 anos")
```

---

### Opção B: Renomear campo para tempo_ministerio (Mais trabalho)

**Vantagens:**
- ✅ Nome do campo reflete o conteúdo
- ✅ Tipo TEXT permite "5 anos", "10 anos"

**Desvantagens:**
- ❌ Precisa migração SQL (ALTER TABLE)
- ❌ Precisa atualizar TODOS os arquivos
- ❌ Pode quebrar dados existentes

**Mudanças necessárias:**
1. Migração SQL: `ALTER TABLE profiles RENAME COLUMN data_ordenacao TO tempo_ministerio`
2. Migração SQL: `ALTER TABLE profiles ALTER COLUMN tempo_ministerio TYPE TEXT`
3. Atualizar 15+ arquivos
4. Atualizar todos os labels
5. Mudar inputs de `type="date"` para `type="text"`

---

### Opção C: Usar data_ordenacao como TEXT (Gambiarra)

**Vantagens:**
- ✅ Menos mudanças no código

**Desvantagens:**
- ❌ Nome do campo enganoso
- ❌ Tipo do campo no banco errado (DATE vs TEXT)
- ❌ Vai quebrar quando tentar salvar "5 anos" em campo DATE
- ❌ Código existente que formata como data vai quebrar

**Mudanças necessárias:**
1. Migração SQL: `ALTER TABLE profiles ALTER COLUMN data_ordenacao TYPE TEXT`
2. Atualizar labels em 4 componentes
3. Mudar inputs de `type="date"` para `type="text"`
4. Remover `formatDate()` e `getFullYear()`

---

## 💡 RECOMENDAÇÃO

### **OPÇÃO A: Manter data_ordenacao como DATA + Adicionar tempo_ministerio**

**Justificativa:**
1. Mantém consistência com nome do campo
2. Não quebra código existente
3. Permite ter AMBAS as informações:
   - Data de ordenação (quando foi ordenado)
   - Tempo de ministério (quanto tempo tem)

**Implementação:**

#### 1. Migração SQL:
```sql
ALTER TABLE profiles 
ADD COLUMN tempo_ministerio TEXT;

COMMENT ON COLUMN profiles.tempo_ministerio IS 'Tempo de ministério em formato livre (ex: "5 anos", "10 anos")';
```

#### 2. Atualizar `useFiliacaoPayment.ts`:
```typescript
// Manter data_ordenacao como está (não salvar nada se não tiver)
// Adicionar novo campo:
tempo_ministerio: data.tempo_ministerio || null,
```

#### 3. Atualizar formulário de filiação:
```tsx
<div>
  <Label htmlFor="tempo_ministerio">Tempo de Ministério</Label>
  <Input
    id="tempo_ministerio"
    {...register('tempo_ministerio')}
    placeholder="Ex: 5 anos, 10 anos"
  />
</div>
```

#### 4. Atualizar componentes de perfil:
- Adicionar campo `tempo_ministerio` ao lado de `data_ordenacao`
- Manter `data_ordenacao` como calendário
- Adicionar `tempo_ministerio` como texto

---

## 📊 IMPACTO POR OPÇÃO

| Aspecto | Opção A | Opção B | Opção C |
|---------|---------|---------|---------|
| Migração SQL | 1 (ADD COLUMN) | 2 (RENAME + ALTER TYPE) | 1 (ALTER TYPE) |
| Arquivos a modificar | 5 | 15+ | 8 |
| Risco de quebrar | Baixo | Alto | Médio |
| Consistência | Alta | Alta | Baixa |
| Tempo estimado | 30 min | 2 horas | 1 hora |
| Mantém dados existentes | ✅ Sim | ⚠️ Precisa migrar | ⚠️ Precisa converter |

---

## ✅ PLANO DE AÇÃO RECOMENDADO

### Opção A - Adicionar campo tempo_ministerio:

1. [ ] Criar migração SQL para adicionar coluna
2. [ ] Atualizar `useFiliacaoPayment.ts`
3. [ ] Atualizar `PaymentFormEnhanced.tsx` (formulário de filiação)
4. [ ] Atualizar `MeusDados.tsx` (adicionar campo)
5. [ ] Atualizar `PerfilCompleto.tsx` (adicionar campo)
6. [ ] Atualizar `PerfilPublico.tsx` (adicionar campo)
7. [ ] Atualizar types e hooks
8. [ ] Testar filiação completa
9. [ ] Testar edição de perfil

**Tempo estimado:** 30-45 minutos

---

## 🚨 PROBLEMA ATUAL

**URGENTE:** O código atual está tentando salvar texto ("5 anos") em um campo DATE do banco!

```typescript
// useFiliacaoPayment.ts
data_ordenacao: data.tempo_ministerio || null,  // ❌ Salvando texto em campo DATE
```

**Isso vai causar erro no banco de dados quando tentar inserir!**

**Erro esperado:**
```
ERROR: invalid input syntax for type date: "5 anos"
```

---

## 📝 RESUMO

**Status Atual:** ⚠️ CÓDIGO INCONSISTENTE
- Campo no banco: `data_ordenacao` (tipo DATE)
- Código tentando salvar: texto livre ("5 anos")
- Labels nos componentes: "Data de Ordenação"
- Inputs nos componentes: `type="date"`

**Ação Necessária:** DECIDIR qual opção seguir e implementar ANTES de próximo teste

**Recomendação:** Opção A (adicionar campo tempo_ministerio separado)

---

**Aguardando sua decisão para implementar as correções!**
