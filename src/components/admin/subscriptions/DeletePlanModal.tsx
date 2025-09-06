import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Users, DollarSign } from 'lucide-react';
import { useSubscriptionPlans, SubscriptionPlan } from '@/hooks/useSubscriptions';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

interface DeletePlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: SubscriptionPlan | null;
}

export const DeletePlanModal = ({ isOpen, onClose, plan }: DeletePlanModalProps) => {
  const { deletePlan } = useSubscriptionPlans();

  if (!plan) return null;

  const hasActiveSubscriptions = (plan._count?.user_subscriptions || 0) > 0;
  const hasAssociations = (plan._count?.member_type_subscriptions || 0) > 0;

  const handleDelete = async () => {
    try {
      await deletePlan.mutateAsync(plan.id);
      onClose();
    } catch (error) {
      console.error('Erro ao excluir plano:', error);
    }
  };

  const formatPrice = (price: number, cycle: string) => {
    const formatted = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);

    return `${formatted}/${cycle === 'monthly' ? 'mês' : 'ano'}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Excluir Plano de Assinatura
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Informações do plano */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-semibold text-lg">{plan.name}</h4>
            <p className="text-sm text-gray-600 mt-1">{plan.description}</p>
            <div className="flex items-center gap-4 mt-2 text-sm">
              <span className="flex items-center gap-1">
                <DollarSign className="h-4 w-4" />
                {formatPrice(plan.price, plan.billing_cycle)}
              </span>
              <span className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                {plan._count?.user_subscriptions || 0} assinantes
              </span>
            </div>
          </div>

          {/* Alertas de dependências */}
          {hasActiveSubscriptions && (
            <Alert variant="destructive">
              <Users className="h-4 w-4" />
              <AlertDescription>
                <strong>Não é possível excluir:</strong> Este plano possui {plan._count?.user_subscriptions} assinatura(s) ativa(s).
                Você deve primeiro cancelar ou transferir essas assinaturas antes de excluir o plano.
              </AlertDescription>
            </Alert>
          )}

          {hasAssociations && !hasActiveSubscriptions && (
            <Alert variant="destructive">
              <AlertDescription>
                <strong>Atenção:</strong> Este plano está associado a {plan._count?.member_type_subscriptions} tipo(s) de membro.
                Essas associações serão removidas automaticamente.
              </AlertDescription>
            </Alert>
          )}

          {!hasActiveSubscriptions && !hasAssociations && (
            <Alert>
              <AlertDescription>
                Este plano pode ser excluído com segurança pois não possui assinaturas ativas ou associações.
              </AlertDescription>
            </Alert>
          )}

          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Esta ação não pode ser desfeita.</strong> O plano será permanentemente removido do sistema.
            </AlertDescription>
          </Alert>
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <Button variant="outline" onClick={onClose} disabled={deletePlan.isPending}>
            Cancelar
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleDelete}
            disabled={hasActiveSubscriptions || deletePlan.isPending}
          >
            {deletePlan.isPending ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Excluindo...
              </>
            ) : (
              'Excluir Plano'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};