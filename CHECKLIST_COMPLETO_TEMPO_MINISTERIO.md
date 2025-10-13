# ✅ CHECKLIST COMPLETO: Implementação do campo tempo_ministerio

**Opção:** A - Adicionar campo tempo_ministerio separado  
**Data:** 13/10/2025

---

## 📋 TODOS OS ARQUIVOS QUE PRECISAM SER MODIFICADOS

### 1️⃣ BANCO DE DADOS

#### ✅ Migração SQL (CRIAR)
**Arquivo:** `supabase/migrations/20251013_add_tempo_ministerio.sql`

**Ação:** CRIAR arquivo novo
```sql
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS tempo_ministerio TEXT;

COMMENT ON COLUMN profiles.tempo_ministerio IS 'Tempo de ministério em formato livre (ex: "5 anos", "10 anos")';

CREATE INDEX IF NOT EXISTS idx_profiles_tempo_ministerio 
ON profiles(tempo_ministerio) 
WHERE tempo_ministerio IS NOT NULL;
```

---

### 2️⃣ TIPOS TYPESCRIPT

#### ✅ src/integrations/supabase/types.ts
**Linha:** ~975 (Row), ~994 (Insert), ~1013 (Update)

**Ação:** ADICIONAR campo em 3 lugares

**ANTES:**
```typescript
Row: {
  data_ordenacao: string | null
  // ...
}
Insert: {
  data_ordenacao?: string | null
  // ...
}
Update: {
  data_ordenacao?: string | null
  // ...
}
```

**DEPOIS:**
```typescript
Row: {
  data_ordenacao: string | null
  tempo_ministerio: string | null  // ✅ ADICIONAR
  // ...
}
Insert: {
  data_ordenacao?: string | null
  tempo_ministerio?: string | null  // ✅ ADICIONAR
  // ...
}
Update: {
  data_ordenacao?: string | null
  tempo_ministerio?: string | null  // ✅ ADICIONAR
  // ...
}
```

---

#### ✅ src/hooks/useAuthState.ts
**Linha:** ~19

**Ação:** ADICIONAR campo

**ANTES:**
```typescript
export interface Profile {
  data_ordenacao?: string;
  // ...
}
```

**DEPOIS:**
```typescript
export interface Profile {
  data_ordenacao?: string;
  tempo_ministerio?: string;  // ✅ ADICIONAR
  // ...
}
```

---

#### ✅ src/hooks/useAdminData.ts
**Linha:** ~23

**Ação:** ADICIONAR campo

**ANTES:**
```typescript
interface UserData {
  data_ordenacao?: string;
  // ...
}
```

**DEPOIS:**
```typescript
interface UserData {
  data_ordenacao?: string;
  tempo_ministerio?: string;  // ✅ ADICIONAR
  // ...
}
```

---

#### ✅ src/hooks/useCreateUser.ts
**Linha:** ~21 e ~54

**Ação:** ADICIONAR campo em 2 lugares

**ANTES:**
```typescript
interface UserData {
  data_ordenacao?: string
  // ...
}

// Linha 54
if (userData.data_ordenacao) insertData.data_ordenacao = userData.data_ordenacao
```

**DEPOIS:**
```typescript
interface UserData {
  data_ordenacao?: string
  tempo_ministerio?: string  // ✅ ADICIONAR
  // ...
}

// Linha 54
if (userData.data_ordenacao) insertData.data_ordenacao = userData.data_ordenacao
if (userData.tempo_ministerio) insertData.tempo_ministerio = userData.tempo_ministerio  // ✅ ADICIONAR
```

---

#### ✅ src/hooks/useUpdateUser.ts
**Linha:** ~22

**Ação:** ADICIONAR campo

**ANTES:**
```typescript
interface UpdateUserData {
  data_ordenacao?: string
  // ...
}
```

**DEPOIS:**
```typescript
interface UpdateUserData {
  data_ordenacao?: string
  tempo_ministerio?: string  // ✅ ADICIONAR
  // ...
}
```

---

### 3️⃣ FORMULÁRIO DE FILIAÇÃO

#### ✅ src/components/payments/PaymentFormEnhanced.tsx
**Linha:** ~60 (schema) e ~360 (campo no formulário)

**Ação:** ADICIONAR campo no schema Zod e no formulário

**Schema Zod (linha ~60):**
```typescript
const PaymentFormSchema = z.object({
  // ... outros campos
  tempo_ministerio: z.string().optional(),  // ✅ ADICIONAR
});
```

**Formulário (linha ~360 - após campo "igreja"):**
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

---

#### ✅ src/hooks/useFiliacaoPayment.ts
**Linha:** ~15 (interface) e ~325 (salvamento)

**Ação:** ADICIONAR campo na interface e CORRIGIR salvamento

**Interface FiliacaoData (linha ~15):**
```typescript
export interface FiliacaoData {
  tempo_ministerio?: string;  // ✅ ADICIONAR
  // ... outros campos
}
```

**Salvamento (linha ~325) - CORRIGIR:**

**ANTES:**
```typescript
const profileUpdateData = {
  data_ordenacao: data.tempo_ministerio || null, // ❌ ERRADO
  // ...
};
```

**DEPOIS:**
```typescript
const profileUpdateData = {
  data_ordenacao: null, // Manter como null (não coletamos no formulário)
  tempo_ministerio: data.tempo_ministerio || null, // ✅ CORRETO
  // ...
};
```

---

### 4️⃣ COMPONENTES DE PERFIL

#### ✅ src/pages/dashboard/MeusDados.tsx
**Linha:** ~38 (formData), ~48 (validação), ~111 (reset), ~375 (formulário)

**Ação:** ADICIONAR campo em 4 lugares

**1. formData (linha ~38):**
```typescript
const [formData, setFormData] = useState({
  data_ordenacao: profile?.data_ordenacao || "",
  tempo_ministerio: profile?.tempo_ministerio || "",  // ✅ ADICIONAR
  // ...
});
```

**2. Validação (linha ~48):**
```typescript
const allFields = [
  'nome_completo', 'cpf', 'rg', 'data_nascimento',
  'endereco', 'cidade', 'estado', 'cep', 'telefone',
  'igreja', 'cargo', 'data_ordenacao', 'tempo_ministerio'  // ✅ ADICIONAR
];
```

**3. Reset (linha ~111):**
```typescript
setFormData({
  data_ordenacao: profile.data_ordenacao || "",
  tempo_ministerio: profile.tempo_ministerio || "",  // ✅ ADICIONAR
  // ...
});
```

**4. Formulário (linha ~375 - ADICIONAR após data_ordenacao):**
```tsx
<div>
  <Label htmlFor="data_ordenacao">Data de Ordenação</Label>
  <Input
    id="data_ordenacao"
    type="date"
    value={formData.data_ordenacao}
    onChange={(e) => handleInputChange('data_ordenacao', e.target.value)}
    disabled={!isEditing}
  />
</div>
<div>
  <Label htmlFor="tempo_ministerio">Tempo de Ministério</Label>
  <Input
    id="tempo_ministerio"
    value={formData.tempo_ministerio}
    onChange={(e) => handleInputChange('tempo_ministerio', e.target.value)}
    disabled={!isEditing}
    placeholder="Ex: 5 anos, 10 anos"
  />
</div>
```

---

#### ✅ src/pages/dashboard/PerfilCompleto.tsx
**Linha:** ~54 (formData), ~128 (reset), ~164 (update), ~243 (reset2), ~327 (userData), ~772 (formulário)

**Ação:** ADICIONAR campo em 6 lugares

**1. formData (linha ~54):**
```typescript
const [formData, setFormData] = useState({
  data_ordenacao: profile?.data_ordenacao || "",
  tempo_ministerio: profile?.tempo_ministerio || "",  // ✅ ADICIONAR
  // ...
});
```

**2. Reset (linha ~128):**
```typescript
setFormData({
  data_ordenacao: profile.data_ordenacao || "",
  tempo_ministerio: profile.tempo_ministerio || "",  // ✅ ADICIONAR
  // ...
});
```

**3. Update (linha ~164):**
```typescript
const updateData = {
  ...formData,
  data_nascimento: formData.data_nascimento || null,
  data_ordenacao: formData.data_ordenacao || null,
  tempo_ministerio: formData.tempo_ministerio || null,  // ✅ ADICIONAR
};
```

**4. Reset2 (linha ~243):**
```typescript
setFormData({
  data_ordenacao: profile.data_ordenacao || "",
  tempo_ministerio: profile.tempo_ministerio || "",  // ✅ ADICIONAR
  // ...
});
```

**5. userData (linha ~327):**
```typescript
data_ordenacao: userData?.data_ordenacao || null,
tempo_ministerio: userData?.tempo_ministerio || null,  // ✅ ADICIONAR
```

**6. Formulário (linha ~772 - ADICIONAR após data_ordenacao):**
```tsx
<div>
  <Label htmlFor="data_ordenacao">Data de Ordenação</Label>
  <Input
    id="data_ordenacao"
    type="date"
    value={formData.data_ordenacao}
    onChange={(e) => handleInputChange('data_ordenacao', e.target.value)}
    disabled={!isEditing}
  />
</div>
<div>
  <Label htmlFor="tempo_ministerio">Tempo de Ministério</Label>
  <Input
    id="tempo_ministerio"
    value={formData.tempo_ministerio}
    onChange={(e) => handleInputChange('tempo_ministerio', e.target.value)}
    disabled={!isEditing}
    placeholder="Ex: 5 anos, 10 anos"
  />
</div>
```

---

#### ✅ src/pages/dashboard/PerfilPublico.tsx
**Linha:** ~33 (interface), ~84 (destructure), ~272 (exibição)

**Ação:** ADICIONAR campo em 3 lugares

**1. Interface (linha ~33):**
```typescript
interface PublicProfile {
  data_ordenacao?: string;
  tempo_ministerio?: string;  // ✅ ADICIONAR
  // ...
}
```

**2. Destructure (linha ~84):**
```typescript
const {
  data_ordenacao,
  tempo_ministerio,  // ✅ ADICIONAR
  // ...
} = publicProfile;
```

**3. Exibição (linha ~272 - ADICIONAR após data_ordenacao):**
```tsx
{publicProfile.data_ordenacao && (
  <div>
    <p className="text-sm text-gray-600">Data de Ordenação</p>
    <p className="font-medium">{formatDate(publicProfile.data_ordenacao)}</p>
  </div>
)}

{publicProfile.tempo_ministerio && (
  <div>
    <p className="text-sm text-gray-600">Tempo de Ministério</p>
    <p className="font-medium">{publicProfile.tempo_ministerio}</p>
  </div>
)}
```

---

#### ⚠️ src/pages/dashboard/Dashboard.tsx
**Linha:** ~138

**Ação:** MANTER como está (usa data_ordenacao para calcular ano)

**Não precisa alterar** - Este componente usa `data_ordenacao` para mostrar o ano de ordenação, o que está correto.

---

### 5️⃣ HOOKS DE VALIDAÇÃO

#### ✅ src/hooks/useProfileValidation.ts
**Linha:** ~34

**Ação:** ADICIONAR campo na lista de validação

**ANTES:**
```typescript
const allFields = [
  'nome_completo', 'cpf', 'rg', 'data_nascimento',
  'endereco', 'cidade', 'estado', 'cep', 'telefone',
  'igreja', 'cargo', 'data_ordenacao'
];
```

**DEPOIS:**
```typescript
const allFields = [
  'nome_completo', 'cpf', 'rg', 'data_nascimento',
  'endereco', 'cidade', 'estado', 'cep', 'telefone',
  'igreja', 'cargo', 'data_ordenacao', 'tempo_ministerio'  // ✅ ADICIONAR
];
```

---

## 📊 RESUMO DE MUDANÇAS

### Arquivos a CRIAR:
1. `supabase/migrations/20251013_add_tempo_ministerio.sql`

### Arquivos a MODIFICAR:

| Arquivo | Mudanças | Linhas Afetadas |
|---------|----------|-----------------|
| `src/integrations/supabase/types.ts` | Adicionar campo em 3 interfaces | ~975, ~994, ~1013 |
| `src/hooks/useAuthState.ts` | Adicionar campo na interface | ~19 |
| `src/hooks/useAdminData.ts` | Adicionar campo na interface | ~23 |
| `src/hooks/useCreateUser.ts` | Adicionar campo em 2 lugares | ~21, ~54 |
| `src/hooks/useUpdateUser.ts` | Adicionar campo na interface | ~22 |
| `src/hooks/useProfileValidation.ts` | Adicionar campo na validação | ~34 |
| `src/components/payments/PaymentFormEnhanced.tsx` | Adicionar campo no schema e formulário | ~60, ~360 |
| `src/hooks/useFiliacaoPayment.ts` | Adicionar interface + CORRIGIR salvamento | ~15, ~325 |
| `src/pages/dashboard/MeusDados.tsx` | Adicionar campo em 4 lugares | ~38, ~48, ~111, ~375 |
| `src/pages/dashboard/PerfilCompleto.tsx` | Adicionar campo em 6 lugares | ~54, ~128, ~164, ~243, ~327, ~772 |
| `src/pages/dashboard/PerfilPublico.tsx` | Adicionar campo em 3 lugares | ~33, ~84, ~272 |

**Total:** 1 arquivo novo + 11 arquivos modificados

---

## ✅ VALIDAÇÃO FINAL

Após todas as mudanças, verificar:

- [ ] Migração SQL criada
- [ ] Todos os tipos TypeScript atualizados
- [ ] Formulário de filiação coleta tempo_ministerio
- [ ] useFiliacaoPayment salva no campo correto
- [ ] MeusDados exibe e edita tempo_ministerio
- [ ] PerfilCompleto exibe e edita tempo_ministerio
- [ ] PerfilPublico exibe tempo_ministerio
- [ ] Validação de perfil inclui tempo_ministerio
- [ ] Nenhum erro de TypeScript
- [ ] Teste de filiação completo
- [ ] Teste de edição de perfil

---

## 🚀 ORDEM DE EXECUÇÃO

1. Criar migração SQL
2. Atualizar types.ts (base de tudo)
3. Atualizar hooks de interface
4. Atualizar useFiliacaoPayment (CRÍTICO)
5. Atualizar formulário de filiação
6. Atualizar componentes de perfil
7. Atualizar validação
8. Testar tudo

---

**Status:** CHECKLIST COMPLETO - PRONTO PARA IMPLEMENTAÇÃO  
**Tempo estimado:** 30-45 minutos  
**Risco:** BAIXO (apenas adições, sem remoções)
