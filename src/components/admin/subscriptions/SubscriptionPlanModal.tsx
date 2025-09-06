import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { X, Plus } from 'lucide-react';
import { useSubscriptionPlans, SubscriptionPlan } from '@/hooks/useSubscriptions';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

interface SubscriptionPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan?: SubscriptionPlan | null;
  mode: 'create' | 'edit';
}

const SubscriptionPlanModal = ({ isOpen, onClose, plan, mode }: SubscriptionPlanModalProps) => {
  const { createPlan, updatePlan } = useSubscriptionPlans();
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 0,
    recurrence: 'monthly' as 'monthly' | 'semestral' | 'annual',
    permissions: {},
    is_active: true,
    sort_order: 0,
  });



  useEffect(() => {
    if (plan && mode === 'edit') {
      setFormData({
        name: plan.name,
        description: plan.description,
        price: plan.price,
        recurrence: plan.recurrence,
        permissions: plan.permissions || {},
        is_active: plan.is_active,
        sort_order: plan.sort_order,
      });
    } else {
      // Reset form for create mode
      setFormData({
        name: '',
        description: '',
        price: 0,
        recurrence: 'monthly',
        permissions: {},
        is_active: true,
        sort_order: 0,
      });
    }
  }, [plan, mode, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (mode === 'create') {
        await createPlan.mutateAsync(formData);
      } else if (plan) {
        await updatePlan.mutateAsync({ id: plan.id, ...formData });
      }
      onClose();
    } catch (error) {
      console.error('Erro ao salvar plano:', error);
    }
  };



  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const isLoading = createPlan.isPending || updatePlan.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Criar Novo Plano' : 'Editar Plano'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informações Básicas */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Informações Básicas</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Nome do Plano *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Ex: Plano Premium"
                  required
                />
              </div>

              <div>
                <Label htmlFor="price">Preço *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) => handleInputChange('price', parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Descreva os benefícios deste plano..."
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="recurrence">Recorrência *</Label>
              <Select 
                value={formData.recurrence} 
                onValueChange={(value) => handleInputChange('recurrence', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Mensal</SelectItem>
                  <SelectItem value="semestral">Semestral</SelectItem>
                  <SelectItem value="annual">Anual</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>



          {/* Configurações */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Configurações</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => handleInputChange('is_active', checked)}
                />
                <Label htmlFor="is_active">Plano Ativo</Label>
              </div>

              <div>
                <Label htmlFor="sort_order">Ordem de Exibição</Label>
                <Input
                  id="sort_order"
                  type="number"
                  min="0"
                  value={formData.sort_order}
                  onChange={(e) => handleInputChange('sort_order', parseInt(e.target.value) || 0)}
                />
              </div>
            </div>
          </div>

          {/* Botões */}
          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  {mode === 'create' ? 'Criando...' : 'Salvando...'}
                </>
              ) : (
                mode === 'create' ? 'Criar Plano' : 'Salvar Alterações'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default SubscriptionPlanModal;