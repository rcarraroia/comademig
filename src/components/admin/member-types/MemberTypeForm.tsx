import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useMemberTypes, type MemberType } from '@/hooks/useMemberTypes';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

interface MemberTypeFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  memberType?: MemberType | null;
  mode: 'create' | 'edit';
}

export const MemberTypeForm = ({ 
  isOpen, 
  onClose, 
  onSuccess, 
  memberType, 
  mode 
}: MemberTypeFormProps) => {
  const { createMemberType, updateMemberType } = useMemberTypes();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    is_active: true,
    sort_order: 0
  });

  useEffect(() => {
    if (memberType && mode === 'edit') {
      setFormData({
        name: memberType.name,
        description: memberType.description || '',
        is_active: memberType.is_active,
        sort_order: memberType.sort_order
      });
    } else {
      setFormData({
        name: '',
        description: '',
        is_active: true,
        sort_order: 0
      });
    }
  }, [memberType, mode, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (mode === 'create') {
        await createMemberType.mutateAsync(formData);
      } else if (memberType) {
        await updateMemberType.mutateAsync({
          id: memberType.id,
          ...formData
        });
      }
      onSuccess();
    } catch (error) {
      // Erro já tratado no hook
    }
  };

  const handleInputChange = (field: string, value: string | boolean | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const isLoading = createMemberType.isPending || updateMemberType.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Criar Novo Tipo de Membro' : 'Editar Tipo de Membro'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create' 
              ? 'Preencha os dados para criar um novo tipo de membro'
              : 'Altere os dados do tipo de membro'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Nome *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Ex: Pastor, Diácono, Presbítero"
              required
              disabled={isLoading}
            />
          </div>

          <div>
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Descreva as responsabilidades e características deste tipo de membro"
              rows={3}
              disabled={isLoading}
            />
          </div>

          <div>
            <Label htmlFor="sort_order">Ordem de Exibição</Label>
            <Input
              id="sort_order"
              type="number"
              value={formData.sort_order}
              onChange={(e) => handleInputChange('sort_order', parseInt(e.target.value) || 0)}
              placeholder="0"
              disabled={isLoading}
            />
            <p className="text-xs text-gray-500 mt-1">
              Menor número aparece primeiro na lista
            </p>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="is_active">Ativo</Label>
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => handleInputChange('is_active', checked)}
              disabled={isLoading}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading} className="bg-comademig-blue hover:bg-comademig-blue/90">
              {isLoading ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  {mode === 'create' ? 'Criando...' : 'Salvando...'}
                </>
              ) : (
                mode === 'create' ? 'Criar Tipo' : 'Salvar Alterações'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};