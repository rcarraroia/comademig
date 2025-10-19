import { useState } from 'react';
import { useServiceCategories } from '@/hooks/useServiceCategories';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Edit, Trash2, Tag, Loader2 } from 'lucide-react';

export default function ServicoCategorias() {
  const { categories, isLoading, createCategory, updateCategory, deleteCategory, isCreating, isUpdating, isDeleting } = useServiceCategories();
  
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
    if (confirm(`Tem certeza que deseja deletar a categoria "${name}"?\n\nServiços usando esta categoria não poderão ser criados.`)) {
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
        <Button onClick={() => setModalAberto(true)} disabled={isCreating}>
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
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : categories.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Tag className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma categoria cadastrada</p>
            </div>
          ) : (
            <div className="space-y-4">
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Tag className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{cat.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        Código: <code className="bg-muted px-2 py-0.5 rounded">{cat.code}</code>
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
                      disabled={isUpdating || isDeleting}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(cat.id, cat.name)}
                      disabled={isDeleting || isUpdating}
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

      <Dialog open={modalAberto} onOpenChange={(open) => {
        setModalAberto(open);
        if (!open) resetForm();
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {categoriaEditando ? 'Editar Categoria' : 'Nova Categoria'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="code">Código *</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') })}
                placeholder="ex: certidao"
                required
                disabled={!!categoriaEditando}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {categoriaEditando 
                  ? 'Código não pode ser alterado após criação'
                  : 'Apenas letras minúsculas, números e underscore. Não pode ser alterado depois.'}
              </p>
            </div>
            <div>
              <Label htmlFor="name">Nome *</Label>
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
                placeholder="Descrição da categoria (opcional)"
                rows={3}
              />
            </div>
            <div className="flex gap-2 justify-end pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setModalAberto(false);
                  resetForm();
                }}
                disabled={isCreating || isUpdating}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isCreating || isUpdating}>
                {(isCreating || isUpdating) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {categoriaEditando ? 'Atualizar' : 'Criar'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
