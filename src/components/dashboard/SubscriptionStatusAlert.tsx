import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  AlertCircle, 
  Clock, 
  CheckCircle, 
  XCircle,
  Calendar,
  CreditCard
} from 'lucide-react';
import { useSubscriptionActions } from '@/hooks/useSubscriptionActions';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function SubscriptionStatusAlert() {
  const { getSubscriptionStatus, redirectToRenewal, isLoading } = useSubscriptionActions();

  if (isLoading) {
    return (
      <Alert>
        <Clock className="h-4 w-4" />
        <AlertDescription>
          Carregando informações da assinatura...
        </AlertDescription>
      </Alert>
    );
  }

  const status = getSubscriptionStatus();

  // Se não tem assinatura, não mostrar alert
  if (!status.hasSubscription) {
    return null;
  }

  // Configurar ícone e cor baseado no status
  const getAlertConfig = () => {
    switch (status.subscription?.status) {
      case 'overdue':
        return {
          icon: XCircle,
          className: 'border-red-200 bg-red-50 text-red-800',
          iconColor: 'text-red-600'
        };
      case 'pending':
        return {
          icon: Clock,
          className: 'border-yellow-200 bg-yellow-50 text-yellow-800',
          iconColor: 'text-yellow-600'
        };
      case 'expired':
        return {
          icon: AlertCircle,
          className: 'border-red-200 bg-red-50 text-red-800',
          iconColor: 'text-red-600'
        };
      case 'active':
        if (status.isNearExpiration) {
          return {
            icon: Calendar,
            className: 'border-orange-200 bg-orange-50 text-orange-800',
            iconColor: 'text-orange-600'
          };
        }
        return {
          icon: CheckCircle,
          className: 'border-green-200 bg-green-50 text-green-800',
          iconColor: 'text-green-600'
        };
      default:
        return {
          icon: AlertCircle,
          className: 'border-gray-200 bg-gray-50 text-gray-800',
          iconColor: 'text-gray-600'
        };
    }
  };

  const config = getAlertConfig();
  const Icon = config.icon;

  // Gerar mensagem baseada no status
  const getMessage = () => {
    const subscription = status.subscription!;
    
    switch (subscription.status) {
      case 'overdue':
        return 'Sua assinatura está vencida. Renove agora para manter o acesso aos serviços.';
      case 'pending':
        return 'Finalize o pagamento da sua assinatura para ativar todos os benefícios.';
      case 'expired':
        return 'Sua assinatura expirou. Renove para continuar aproveitando os serviços.';
      case 'active':
        if (status.isNearExpiration && status.daysUntilExpiration) {
          return `Sua assinatura vence em ${status.daysUntilExpiration} dia${status.daysUntilExpiration > 1 ? 's' : ''}. Renove antecipadamente para evitar interrupções.`;
        }
        if (status.nextDueDate) {
          return `Sua assinatura está ativa até ${format(status.nextDueDate, 'dd/MM/yyyy', { locale: ptBR })}.`;
        }
        return 'Sua assinatura está ativa e em dia.';
      case 'cancelled':
        return 'Sua assinatura foi cancelada. Reative para voltar a ter acesso aos serviços.';
      default:
        return 'Status da assinatura não identificado. Entre em contato com o suporte.';
    }
  };

  return (
    <Alert className={config.className}>
      <Icon className={`h-4 w-4 ${config.iconColor}`} />
      <AlertDescription className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-medium">Status da Assinatura:</span>
            <Badge 
              variant={
                status.subscription?.status === 'active' ? 'default' :
                status.subscription?.status === 'overdue' ? 'destructive' :
                'secondary'
              }
            >
              {status.subscription?.status === 'active' ? 'Ativa' :
               status.subscription?.status === 'overdue' ? 'Vencida' :
               status.subscription?.status === 'pending' ? 'Pendente' :
               status.subscription?.status === 'expired' ? 'Expirada' :
               status.subscription?.status === 'cancelled' ? 'Cancelada' :
               'Desconhecido'}
            </Badge>
          </div>
          <p>{getMessage()}</p>
        </div>
        
        {status.canRenew && (
          <div className="ml-4 flex gap-2">
            <Button
              onClick={redirectToRenewal}
              variant={status.actionVariant}
              size="sm"
              className="whitespace-nowrap"
            >
              <CreditCard className="h-4 w-4 mr-2" />
              {status.actionText}
            </Button>
          </div>
        )}
      </AlertDescription>
    </Alert>
  );
}