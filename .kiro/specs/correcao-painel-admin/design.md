# Design Document - Correção do Painel Administrativo

## Overview

Este documento descreve o design técnico para integrar completamente o frontend do painel administrativo com o backend existente, transformando dados mockados em funcionalidades reais conectadas ao banco de dados.

**Arquitetura Atual:**
- Backend: Supabase (PostgreSQL + Auth + RLS)
- Frontend: React + TypeScript + TanStack Query
- Hooks existentes: `useAdminData`, `useFinancialMetrics`, `useAudit`
- Componentes: AdminLayout, AdminSidebar, páginas admin

**Objetivo do Design:**
Aproveitar a infraestrutura existente e adicionar as camadas de interação necessárias para um CRUD completo.

---

## Architecture

### Camadas do Sistema

```
┌─────────────────────────────────────────┐
│         UI Layer (React)                │
│  - UsersAdmin.tsx                       │
│  - Modals (Create, Edit, Delete)       │
│  - Forms com validação                  │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│      Business Logic Layer               │
│  - Custom Hooks                         │
│  - useAdminData (existente)             │
│  - useCreateUser (novo)                 │
│  - useUpdateUser (novo)                 │
│  - useDeleteUser (novo)                 │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│      Data Layer (TanStack Query)        │
│  - Query cache                          │
│  - Mutations                            │
│  - Optimistic updates                   │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│      Backend (Supabase)                 │
│  - PostgreSQL                           │
│  - RLS Policies                         │
│  - Triggers & Functions                 │
└─────────────────────────────────────────┘
```

---

## Components and Interfaces

### 1. UsersAdmin Component (Atualizado)

**Responsabilidades:**
- Exibir lista de usuários reais
- Implementar busca e filtros
- Coordenar modals de CRUD
- Gerenciar estado local

**Props:** Nenhuma (página standalone)

**State:**
```typescript
const [searchTerm, setSearchTerm] = useState('')
const [selectedUser, setSelectedUser] = useState<AdminProfile | null>(null)
const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
const [isEditModalOpen, setIsEditModalOpen] = useState(false)
const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
```

**Hooks Utilizados:**
```typescript
const { profiles, stats, isLoading, refetchProfiles } = useAdminData()
const { mutate: createUser } = useCreateUser()
const { mutate: updateUser } = useUpdateUser()
const { mutate: deleteUser } = useDeleteUser()
```

---

### 2. UserCreateModal (Novo)

**Responsabilidades:**
- Formulário de criação de usuário
- Validação de campos
- Submissão de dados

**Props:**
```typescript
interface UserCreateModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}
```

**Campos do Formulário:**
- nome_completo (obrigatório)
- cpf (obrigatório, validação)
- telefone (obrigatório)
- igreja (obrigatório)
- cargo (obrigatório)
- tipo_membro (select: membro, pastor, moderador, admin)
- status (select: ativo, inativo, pendente)
- data_nascimento (opcional)
- endereco (opcional)
- cidade (opcional)
- estado (opcional)
- cep (opcional)

**Validações:**
- CPF: formato válido (XXX.XXX.XXX-XX)
- Telefone: formato válido
- Email: formato válido (se fornecido)
- Campos obrigatórios preenchidos

---

### 3. UserEditModal (Novo)

**Responsabilidades:**
- Formulário de edição de usuário
- Pré-preencher com dados atuais
- Validação de campos
- Submissão de alterações

**Props:**
```typescript
interface UserEditModalProps {
  isOpen: boolean
  user: AdminProfile
  onClose: () => void
  onSuccess: () => void
}
```

**Comportamento:**
- Carregar dados atuais do usuário
- Permitir edição de todos os campos
- Validar antes de salvar
- Exibir feedback de sucesso/erro

---

### 4. UserDeleteDialog (Novo)

**Responsabilidades:**
- Confirmar exclusão de usuário
- Exibir informações do usuário a ser excluído
- Executar exclusão

**Props:**
```typescript
interface UserDeleteDialogProps {
  isOpen: boolean
  user: AdminProfile
  onClose: () => void
  onConfirm: () => void
}
```

**Comportamento:**
- Exibir nome e informações do usuário
- Solicitar confirmação explícita
- Executar exclusão após confirmação
- Exibir feedback

---

### 5. UserPermissionsModal (Novo)

**Responsabilidades:**
- Gerenciar tipo_membro do usuário
- Validar permissões do admin atual
- Registrar mudanças no audit log

**Props:**
```typescript
interface UserPermissionsModalProps {
  isOpen: boolean
  user: AdminProfile
  onClose: () => void
  onSuccess: () => void
}
```

**Campos:**
- tipo_membro (select com opções)
- Explicação de cada role
- Confirmação de mudança

---

## Data Models

### AdminProfile (Existente)

```typescript
export interface AdminProfile {
  id: string
  nome_completo: string
  cpf: string
  telefone: string
  igreja: string
  cargo: string
  status: string
  tipo_membro: string
  created_at: string
  // Campos opcionais
  rg?: string
  data_nascimento?: string
  endereco?: string
  cidade?: string
  estado?: string
  cep?: string
  data_ordenacao?: string
  foto_url?: string
}
```

### CreateUserInput (Novo)

```typescript
export interface CreateUserInput {
  nome_completo: string
  cpf: string
  telefone: string
  igreja: string
  cargo: string
  tipo_membro: 'membro' | 'pastor' | 'moderador' | 'admin'
  status: 'ativo' | 'inativo' | 'pendente'
  // Opcionais
  rg?: string
  data_nascimento?: string
  endereco?: string
  cidade?: string
  estado?: string
  cep?: string
  data_ordenacao?: string
}
```

### UpdateUserInput (Novo)

```typescript
export interface UpdateUserInput {
  id: string
  // Todos os campos são opcionais para update parcial
  nome_completo?: string
  cpf?: string
  telefone?: string
  igreja?: string
  cargo?: string
  tipo_membro?: 'membro' | 'pastor' | 'moderador' | 'admin'
  status?: 'ativo' | 'inativo' | 'pendente'
  rg?: string
  data_nascimento?: string
  endereco?: string
  cidade?: string
  estado?: string
  cep?: string
  data_ordenacao?: string
}
```

---

## Error Handling

### Estratégia de Tratamento de Erros

1. **Erros de Validação:**
   - Exibir mensagens inline no formulário
   - Destacar campos com erro
   - Bloquear submissão até correção

2. **Erros de Rede:**
   - Exibir toast com mensagem de erro
   - Oferecer opção de tentar novamente
   - Manter dados do formulário

3. **Erros de Permissão:**
   - Exibir mensagem clara de acesso negado
   - Redirecionar se necessário
   - Registrar tentativa no audit log

4. **Erros de Banco de Dados:**
   - Capturar erros do Supabase
   - Traduzir para mensagens amigáveis
   - Registrar erro para debug

### Mensagens de Erro Padrão

```typescript
const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Erro de conexão. Verifique sua internet.',
  PERMISSION_DENIED: 'Você não tem permissão para esta ação.',
  VALIDATION_ERROR: 'Verifique os campos e tente novamente.',
  USER_NOT_FOUND: 'Usuário não encontrado.',
  DUPLICATE_CPF: 'CPF já cadastrado no sistema.',
  UNKNOWN_ERROR: 'Erro inesperado. Tente novamente.',
}
```

---

## Testing Strategy

### Testes Unitários

**Componentes a testar:**
- UsersAdmin: renderização, busca, filtros
- UserCreateModal: validação, submissão
- UserEditModal: pré-preenchimento, edição
- Hooks: useCreateUser, useUpdateUser, useDeleteUser

**Ferramentas:**
- Vitest
- React Testing Library

### Testes de Integração

**Cenários:**
1. Criar usuário → Verificar na lista
2. Editar usuário → Verificar alterações
3. Excluir usuário → Verificar remoção
4. Buscar usuário → Verificar filtro
5. Aplicar filtros → Verificar resultados

### Testes Manuais

**Checklist:**
- [ ] Criar usuário com todos os campos
- [ ] Criar usuário com campos mínimos
- [ ] Editar cada campo individualmente
- [ ] Excluir usuário e confirmar
- [ ] Buscar por nome, CPF, telefone, igreja
- [ ] Aplicar múltiplos filtros
- [ ] Exportar lista para CSV
- [ ] Importar CSV com dados válidos
- [ ] Importar CSV com dados inválidos
- [ ] Testar com 100+ usuários
- [ ] Testar permissões (admin vs super_admin)
- [ ] Testar em mobile/tablet/desktop

---

## Performance Considerations

### Otimizações

1. **Paginação:**
   - Implementar paginação para listas grandes
   - Carregar 50 usuários por página
   - Scroll infinito como alternativa

2. **Cache:**
   - TanStack Query já implementa cache
   - Invalidar cache após mutations
   - Stale time de 5 minutos

3. **Debounce:**
   - Busca com debounce de 300ms
   - Evitar queries desnecessárias

4. **Optimistic Updates:**
   - Atualizar UI antes da resposta do servidor
   - Reverter em caso de erro
   - Melhor UX

5. **Lazy Loading:**
   - Carregar modals apenas quando necessário
   - Code splitting por rota

---

## Security Considerations

### RLS Policies

**Verificar políticas existentes:**
```sql
-- Admins podem ver todos os profiles
CREATE POLICY "admins_can_view_all_profiles" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND tipo_membro IN ('admin', 'super_admin')
    )
  );

-- Admins podem atualizar profiles
CREATE POLICY "admins_can_update_profiles" ON profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND tipo_membro IN ('admin', 'super_admin')
    )
  );
```

### Validações de Segurança

1. **Frontend:**
   - Validar permissões antes de exibir ações
   - Sanitizar inputs
   - Validar formato de dados

2. **Backend:**
   - RLS policies ativas
   - Triggers para audit log
   - Validações de constraint

3. **Audit Log:**
   - Registrar todas as operações CRUD
   - Incluir user_id, action, timestamp
   - Manter histórico de alterações

---

## Migration Plan

### Fase 1: Integração de Dados (✅ COMPLETO)
- [x] Substituir dados mockados por useAdminData
- [x] Implementar busca funcional
- [x] Adicionar loading states
- [x] Calcular estatísticas reais

### Fase 2: CRUD Básico (PRÓXIMO)
- [ ] Criar UserCreateModal
- [ ] Criar UserEditModal
- [ ] Criar UserDeleteDialog
- [ ] Implementar hooks de mutation
- [ ] Adicionar validações

### Fase 3: Funcionalidades Avançadas
- [ ] Sistema de permissões
- [ ] Exportação/Importação
- [ ] Filtros avançados
- [ ] Paginação

### Fase 4: Outras Páginas
- [ ] Validar Financial Admin
- [ ] Validar Audit Logs
- [ ] Corrigir Subscription Plans
- [ ] Validar Support Management
- [ ] Validar Certidões
- [ ] Validar Notifications

### Fase 5: Testes e Produção
- [ ] Testes completos
- [ ] Validação de segurança
- [ ] Performance testing
- [ ] Deploy para produção

---

## Dependencies

### Bibliotecas Necessárias

**Já instaladas:**
- React Hook Form (formulários)
- Zod (validação)
- TanStack Query (data fetching)
- Radix UI (componentes)

**Novas (se necessário):**
- react-csv (exportação CSV)
- papaparse (importação CSV)
- date-fns (manipulação de datas)

---

## Rollback Plan

### Em caso de problemas:

1. **Reverter commit específico:**
   ```bash
   git revert <commit-hash>
   ```

2. **Manter dados mockados como fallback:**
   - Adicionar flag de feature
   - Alternar entre mock e real

3. **Monitoramento:**
   - Logs de erro
   - Métricas de performance
   - Feedback de usuários

---

## Success Metrics

### KPIs para validar sucesso:

1. **Funcionalidade:**
   - ✅ 100% dos botões funcionais
   - ✅ 0% de dados mockados
   - ✅ Todas as operações CRUD funcionando

2. **Performance:**
   - ✅ Tempo de carregamento < 2s
   - ✅ Busca responsiva < 300ms
   - ✅ Suporta 100+ usuários sem lag

3. **Qualidade:**
   - ✅ 0 erros críticos
   - ✅ Mensagens de erro claras
   - ✅ Feedback visual adequado

4. **Segurança:**
   - ✅ RLS policies validadas
   - ✅ Permissões funcionando
   - ✅ Audit log completo
