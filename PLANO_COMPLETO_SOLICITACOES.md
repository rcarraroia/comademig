# 📋 PLANO COMPLETO: RESOLVER SOLICITAÇÕES NÃO APARECEM

**Objetivo:** Fazer solicitações aparecerem nos painéis (usuário e admin)  
**Data:** 2025-10-19

---

## 🎯 PROBLEMA ORIGINAL

**Solicitações NÃO aparecem:**
- ❌ Painel do usuário (`/dashboard/solicitacao-servicos`)
- ❌ Painel administrativo (`/admin/solicitacoes`)

---

## 📋 PLANO DE IMPLEMENTAÇÃO

### **FASE 1: Banco de Dados - Categorias Dinâmicas**

#### 1.1. Criar Tabela de Categorias
```sql
CREATE TABLE service_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  color TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 1.2. Popular Categorias Iniciais
```sql
-- APENAS 2 CATEGORIAS AUTORIZADAS
INSERT INTO service_categories (code, name, description) VALUES
  ('certidao', 'Certidões', 'Emissão de certidões e documentos'),
  ('regularizacao', 'Regularização', 'Regularização de situação cadastral');

-- NOTA: Outras categorias serão criadas pelo usuário via interface admin se necessário
```

#### 1.3. Substituir CHECK por FK
```sql
-- Remover constraint CHECK
ALTER TABLE asaas_cobrancas
DROP CONSTRAINT IF EXISTS asaas_cobrancas_service_type_check;

-- Adicionar FK (permitindo NULL para filiacao que usa módulo próprio)
ALTER TABLE asaas_cobrancas
ADD CONSTRAINT fk_service_type
FOREIGN KEY (service_type) 
REFERENCES service_categories(code)
ON DELETE RESTRICT;

-- Fazer o mesmo para servicos
ALTER TABLE servicos
ADD CONSTRAINT fk_categoria
FOREIGN KEY (categoria)
REFERENCES service_categories(code)
ON DELETE RESTRICT;

-- NOTA: Cobranças de filiação podem ter service_type = 'filiacao' 
-- mas não precisam estar em service_categories (módulo separado)
```

#### 1.4. Políticas RLS
```sql
-- Todos podem ler categorias ativas
CREATE POLICY "Anyone can view active categories"
ON service_categories
FOR SELECT
USING (active = true);

-- Apenas admins podem gerenciar
CREATE POLICY "Admins can manage categories"
ON service_categories
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.tipo_membro IN ('admin', 'super_admin')
  )
);

ALTER TABLE service_categories ENABLE ROW LEVEL SECURITY;
```

#### 1.5. Remover Categoria "outros"
```sql
-- Verificar se há serviços usando 'outros'
SELECT id, nome FROM servicos WHERE categoria = 'outros';

-- Se houver, atualizar para categoria apropriada
-- UPDATE servicos SET categoria = 'certidao' WHERE categoria = 'outros';

-- Deletar categoria 'outros' se não estiver em uso
-- (Será feito via interface admin)
```

---

### **FASE 2: Interface Admin - Gerenciar Categorias**

#### 2.1. Criar Hook `useServiceCategories`
**Arquivo:** `src/hooks/useServiceCategories.ts`

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ServiceCategory {
  id: string;
  code: string;
  name: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export function useServiceCategories() {
  const queryClient = useQueryClient();

  // Listar todas
  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['service-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('service_categories')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data as ServiceCategory[];
    },
  });

  // Criar
  const createCategory = useMutation({
    mutationFn: async (data: Partial<ServiceCategory>) => {
      const { data: result, error } = await supabase
        .from('service_categories')
        .insert(data)
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-categories'] });
      toast.success('Categoria criada com sucesso!');
    },
  });

  // Atualizar
  const updateCategory = useMutation({
    mutationFn: async ({ id, ...data }: Partial<ServiceCategory> & { id: string }) => {
      const { data: result, error } = await supabase
        .from('service_categories')
        .update(data)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-categories'] });
      toast.success('Categoria atualizada com sucesso!');
    },
  });

  // Deletar
  const deleteCategory = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('service_categories')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-categories'] });
      toast.success('Categoria deletada com sucesso!');
    },
  });

  return {
    categories,
    isLoading,
    createCategory: createCategory.mutate,
    updateCategory: updateCategory.mutate,
    deleteCategory: deleteCategory.mutate,
    isCreating: createCategory.isPending,
    isUpdating: updateCategory.isPending,
    isDeleting: deleteCategory.isPending,
  };
}
```

#### 2.2. Criar Página Admin
**Arquivo:** `src/pages/admin/ServicoCategorias.tsx`

```typescript
import { useState } from 'react';
import { useServiceCategories } from '@/hooks/useServiceCategories';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Edit, Trash2, Tag } from 'lucide-react';
import { toast } from 'sonner';

export default function ServicoCategorias() {
  const { categories, isLoading, createCategory, updateCategory, deleteCategory } = useServiceCategories();
  
  const [modalAberto, setModalAberto] = useState(false);
  const [categoriaEditando, setCategoriaEditando] = useState<any>(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (categoriaEditando) {
      updateCategory({ id: categoriaEditando.id, ...formData });
    } else {
      createCategory(formData);
    }
    
    setModalAberto(false);
    resetForm();
  };

  const handleEdit = (categoria: any) => {
    setCategoriaEditando(categoria);
    setFormData({
      code: categoria.code,
      name: categoria.name,
      description: categoria.description || '',
    });
    setModalAberto(true);
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Tem certeza que deseja deletar a categoria "${name}"?`)) {
      deleteCategory(id);
    }
  };

  const resetForm = () => {
    setCategoriaEditando(null);
    setFormData({ code: '', name: '', description: '' });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Categorias de Serviços</h1>
          <p className="text-muted-foreground">
            Gerencie as categorias disponíveis para serviços
          </p>
        </div>
        <Button onClick={() => setModalAberto(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Categoria
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Categorias Cadastradas</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p>Carregando...</p>
          ) : (
            <div className="space-y-4">
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <Tag className="h-5 w-5 text-primary" />
                    <div>
                      <h3 className="font-semibold">{cat.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        Código: {cat.code}
                      </p>
                      {cat.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {cat.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(cat)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(cat.id, cat.name)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={modalAberto} onOpenChange={setModalAberto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {categoriaEditando ? 'Editar Categoria' : 'Nova Categoria'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="code">Código</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="ex: certidao"
                required
                disabled={!!categoriaEditando}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Usado internamente. Não pode ser alterado depois.
              </p>
            </div>
            <div>
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="ex: Certidões"
                required
              />
            </div>
            <div>
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descrição da categoria"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setModalAberto(false);
                  resetForm();
                }}
              >
                Cancelar
              </Button>
              <Button type="submit">
                {categoriaEditando ? 'Atualizar' : 'Criar'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
```

#### 2.3. Adicionar Rota
**Arquivo:** `src/App.tsx`

```typescript
// Adicionar import
import ServicoCategorias from '@/pages/admin/ServicoCategorias';

// Adicionar rota
<Route path="/admin/servicos/categorias" element={<ServicoCategorias />} />
```

#### 2.4. Adicionar Link no Menu Admin
**Arquivo:** `src/components/dashboard/DashboardSidebar.tsx`

```typescript
// Adicionar no menu de Serviços
{
  label: 'Categorias',
  path: '/admin/servicos/categorias',
  icon: Tag,
}
```

---

### **FASE 3: Frontend - Categoria Dinâmica**

#### 3.1. Atualizar CheckoutServico
**Arquivo:** `src/pages/dashboard/CheckoutServico.tsx`

```typescript
// Adicionar servico_categoria ao processarCheckout
const resultado = await processarCheckout({
  servico_id: servico.id,
  servico_nome: servico.nome,
  servico_valor: valorOriginal,
  servico_categoria: servico.categoria,  // ✅ ADICIONAR
  dados_formulario: dadosFormulario,
  forma_pagamento: formaPagamento,
  cliente: dadosCliente,
  cartao: formaPagamento === 'cartao' ? dadosCartao! : undefined,
});
```

#### 3.2. Atualizar Hook
**Arquivo:** `src/hooks/useCheckoutTransparente.ts`

```typescript
// Atualizar interface
export interface CheckoutData {
  servico_id: string;
  servico_nome: string;
  servico_valor: number;
  servico_categoria: string;  // ✅ ADICIONAR
  dados_formulario: Record<string, any>;
  forma_pagamento: 'pix' | 'cartao';
  cliente: DadosCliente;
  cartao?: DadosCartao;
}

// Usar categoria dinâmica
service_type: data.servico_categoria,  // ✅ MUDAR de 'certidao'
```

---

### **FASE 4: Teste e Validação**

#### 4.1. Testar Nova Solicitação
1. Fazer solicitação de "Certidão teste"
2. Verificar console (sem erro 400)
3. Verificar banco (`asaas_cobrancas` e `solicitacoes_servicos`)
4. Verificar histórico do usuário
5. Verificar painel admin

#### 4.2. Testar Webhook
1. Ver logs do webhook
2. Verificar se cria solicitação
3. Corrigir se necessário

#### 4.3. Testar Interface de Categorias
1. Acessar `/admin/servicos/categorias`
2. Deletar categoria "outros"
3. Criar nova categoria de teste
4. Criar serviço com nova categoria
5. Fazer solicitação
6. Verificar se funciona

---

## 📊 CHECKLIST DE IMPLEMENTAÇÃO

### Fase 1: Banco de Dados
- [ ] Criar tabela `service_categories`
- [ ] Popular categorias iniciais
- [ ] Substituir CHECK por FK em `asaas_cobrancas`
- [ ] Substituir CHECK por FK em `servicos`
- [ ] Criar políticas RLS
- [ ] Aplicar migração

### Fase 2: Interface Admin
- [ ] Criar hook `useServiceCategories`
- [ ] Criar página `ServicoCategorias.tsx`
- [ ] Adicionar rota em `App.tsx`
- [ ] Adicionar link no menu admin
- [ ] Testar CRUD de categorias
- [ ] Deletar categoria "outros"

### Fase 3: Frontend
- [ ] Atualizar `CheckoutServico.tsx`
- [ ] Atualizar interface em `useCheckoutTransparente.ts`
- [ ] Usar categoria dinâmica
- [ ] Testar com diferentes categorias

### Fase 4: Validação
- [ ] Fazer nova solicitação
- [ ] Verificar salvamento em `asaas_cobrancas`
- [ ] Verificar criação em `solicitacoes_servicos`
- [ ] Confirmar aparece no histórico do usuário
- [ ] Confirmar aparece no painel admin
- [ ] Verificar logs do webhook
- [ ] Testar com diferentes categorias

---

## 🎯 RESULTADO ESPERADO

**Após todas as fases:**
- ✅ Categorias gerenciáveis via interface admin
- ✅ Categoria "outros" removida
- ✅ service_type dinâmico (usa categoria do serviço)
- ✅ Solicitações aparecem no histórico do usuário
- ✅ Solicitações aparecem no painel admin
- ✅ Sistema funciona com qualquer categoria
- ✅ Fácil adicionar novas categorias no futuro

---

**AGUARDANDO AUTORIZAÇÃO PARA INICIAR IMPLEMENTAÇÃO** ✋
