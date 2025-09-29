import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, AlertTriangle, DollarSign, Calendar, Users } from 'lucide-react';
import { useDeleteSubscriptionPlan, type SubscriptionPlan } from '@/hooks/useSubscriptionPlans';

interface SubscriptionPlanDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: SubscriptionPlan | null;
}

export default function SubscriptionPlanDeleteModal({
  isOpen,
  onClose,
  plan
}: SubscriptionPlanDeleteModalProps) {
  const deleteMutation = useDeleteSubscriptionPlan();

  const handleDelete = async () => {
    if (!plan?.id) return;

    try {
      await deleteMutation.mutateAsync(plan.id);
      onClose();
    } catch (error) {
      // Error handling is done in the hook
      console.error('Delete error:', error);
    }
  };

  if (!plan) return null;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const formatRecurrence = (recurrence: string) => {
    const recurrenceMap = {
      'monthly': 'Mensal',
      'semestral': 'Semestral',
      'annual': 'Anual'
    };
    return recurrenceMap[recurrence as keyof typeof recurrenceMap] || recurrence;
  };

  const activePermissions = Object.entries(plan.permissions || {})
    .filter(([_, value]) => value === true)
    .map(([key]) => key);

  const associatedMemberTypes = (plan as any).associated_member_types || [];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Confirmar Exclusão
          </DialogTitle>
          <DialogDescription>
            Esta ação não pode ser desfeita. O plano de assinatura será permanentemente removido.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Informações do plano que será excluído */}
          <div className="p-4 bg-muted rounded-lg space-y-3">
            <h4 className="font-medium mb-2">Plano de Assinatura a ser excluído:</h4>
            
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="font-medium">Nome:</span>
                <span>{plan.name}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="font-medium">Preço:</span>
                <div className="flex items-center">
                  <DollarSign className="h-4 w-4 mr-1 text-green-600" />
                  <span>{formatPrice(plan.price)}</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="font-medium">Recorrência:</span>
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1 text-blue-600" />
                  <span>{formatRecurrence(plan.recurrence)}</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="font-medium">Status:</span>
                <Badge variant={plan.is_active ? "default" : "secondary"}>
                  {plan.is_active ? 'Ativo' : 'Inativo'}
                </Badge>
              </div>

              {plan.description && (
                <div>
                  <span className="font-medium">Descrição:</span>
                  <p className="text-muted-foreground mt-1">{plan.description}</p>
                </div>
              )}
            </div>

            {/* Permissões */}
            {activePermissions.length > 0 && (
              <div>
                <span className="font-medium text-sm">Permissões ({activePermissions.length}):</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {activePermissions.slice(0, 3).map((permission) => (
                    <Badge key={permission} variant="outline" className="text-xs">
                      {permission.replace('_', ' ')}
                    </Badge>
                  ))}
                  {activePermissions.length > 3 && (
                    <Badge variant="secondary" className="text-xs">
                      +{activePermissions.length - 3} mais
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {/* Tipos de membro associados */}
            {associatedMemberTypes.length > 0 && (
              <div>
                <span className="font-medium text-sm flex items-center">
                  <Users className="h-4 w-4 mr-1" />
                  Tipos Associados ({associatedMemberTypes.length}):
                </span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {associatedMemberTypes.slice(0, 2).map((amt: any) => (
                    <Badge key={amt.member_type_id} variant="outline" className="text-xs">
                      {amt.member_types?.name || 'Tipo desconhecido'}
                    </Badge>
                  ))}
                  {associatedMemberTypes.length > 2 && (
                    <Badge variant="secondary" className="text-xs">
                      +{associatedMemberTypes.length - 2} mais
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Aviso sobre consequências */}
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Atenção:</strong> Se este plano estiver sendo usado por usuários 
              com assinaturas ativas, a exclusão falhará. Considere desativar 
              ao invés de excluir para preservar o histórico.
            </AlertDescription>
          </Alert>

          {/* Mensagem de erro se houver */}
          {deleteMutation.error && (
            <Alert variant="destructive">
              <AlertDescription>
                {deleteMutation.error.message}
              </AlertDescription>
            </Alert>
          )}

          {/* Botões */}
          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={deleteMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Excluir Permanentemente
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}