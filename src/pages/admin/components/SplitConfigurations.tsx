import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Loader2, Edit, Plus, Save } from 'lucide-react';
import { useSplitConfiguration } from '@/hooks/useSplitConfiguration';
import { formatCurrency, formatPercentage, getRecipientBadgeColor } from '@/utils/splitCalculations';
import { toast } from 'sonner';

/**
 * Componente para gerenciar configurações de split
 * Permite visualizar e editar percentuais por categoria de receita
 */
export default function SplitConfigurations() {
  const { configurations, isLoadingConfigurations, updateConfiguration } = useSplitConfiguration();
  const [selectedConfig, setSelectedConfig] = useState<any | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    category_label: '',
    description: '',
    is_active: true
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleEdit = (config: any) => {
    setSelectedConfig(config);
    setEditForm({
      category_label: config.category_label,
      description: config.description,
      is_active: config.is_active
    });
    setIsEditModalOpen(true);
  };

  const handleSave = async () => {
    if (!selectedConfig) return;

    setIsSaving(true);
    try {
      await updateConfiguration.mutateAsync({
        id: selectedConfig.id,
        updates: editForm
      });

      toast.success('Configuração atualizada com sucesso!');
      setIsEditModalOpen(false);
      setSelectedConfig(null);
    } catch (error) {
      console.error('Erro ao atualizar configuração:', error);
      toast.error('Erro ao atualizar configuração');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoadingConfigurations) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!configurations || configurations.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 mb-4">Nenhuma configuração encontrada</p>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nova Configuração
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {configurations.map((config) => (
          <ConfigurationCard
            key={config.id}
            config={config}
            onEdit={() => handleEdit(config)}
          />
        ))}
      </div>

      {/* Modal de Edição */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Configuração</DialogTitle>
            <DialogDescription>
              Atualize as informações da configuração de split
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="category_label">Nome da Categoria</Label>
              <Input
                id="category_label"
                value={editForm.category_label}
                onChange={(e) => setEditForm({ ...editForm, category_label: e.target.value })}
                placeholder="Ex: Serviços"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                placeholder="Descreva o tipo de receita..."
                rows={3}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="is_active">Configuração Ativa</Label>
              <Switch
                id="is_active"
                checked={editForm.is_active}
                onCheckedChange={(checked) => setEditForm({ ...editForm, is_active: checked })}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setIsEditModalOpen(false)}
              disabled={isSaving}
            >
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Salvar
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function ConfigurationCard({ config, onEdit }: any) {
  const { getRecipientsByConfiguration } = useSplitConfiguration();
  const { data: recipients, isLoading } = getRecipientsByConfiguration(config.id);

  return (
    <div className="border rounded-lg p-4 border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold">{config.category_label}</h3>
          <p className="text-sm text-gray-500">{config.description}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={config.is_active ? 'default' : 'secondary'}>
            {config.is_active ? 'Ativa' : 'Inativa'}
          </Badge>
          <Button variant="outline" size="sm" onClick={onEdit}>
            <Edit className="h-4 w-4 mr-2" />
            Editar
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-4 w-4 animate-spin" />
        </div>
      ) : (
        <div className="space-y-2">
          {recipients?.map((recipient: any) => (
            <div key={recipient.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <div className="flex items-center gap-3">
                <Badge className={getRecipientBadgeColor(recipient.recipient_identifier)}>
                  {recipient.recipient_name}
                </Badge>
                <span className="text-sm text-gray-600">
                  {recipient.recipient_type === 'fixed' ? 'Fixo' : 'Dinâmico'}
                </span>
              </div>
              <div className="text-right">
                <div className="font-semibold">{formatPercentage(recipient.percentage)}</div>
                {recipient.wallet_id && (
                  <div className="text-xs text-gray-500">
                    Wallet: {recipient.wallet_id.substring(0, 8)}...
                  </div>
                )}
              </div>
            </div>
          ))}

          {recipients && recipients.length > 0 && (
            <div className="flex items-center justify-between p-3 bg-primary/5 rounded font-semibold">
              <span>Total</span>
              <span>{formatPercentage(recipients.reduce((sum: number, r: any) => sum + r.percentage, 0))}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
