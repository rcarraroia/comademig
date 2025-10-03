import React from 'react';
import { 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  XCircle, 
  CreditCard,
  Calendar,
  RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useFiliacaoStatus } from '@/hooks/useFiliacaoStatus';
import { Skeleton } from '@/components/ui/skeleton';

export function FiliacaoStatusCard() {
  const {
    subscription,
    payment,
    isLoading,
    error,
    refreshStatus,
    hasActiveSubscription,
    hasPaymentPending,
    getNextDueDate,
    isNearExpiration,
    isExpired
  } = useFiliacaoStatus();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Skeleton className="h-5 w-5 rounded-full" />
            <Skeleton className="h-6 w-32" />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-8 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <XCircle className="h-5 w-5" />
            Erro ao Carregar Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-red-600 mb-4">
            Não foi possível carregar o status da sua filiação.
          </p>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={refreshStatus}
            className="w-full"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Tentar Novamente
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Usuário sem filiação
  if (!subscription) {
    return (
      <Card className="border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-blue-500" />
            Filiação Pendente
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Você ainda não possui uma filiação ativa no COMADEMIG.
          </p>
          <Button 
            onClick={() => window.location.href = '/filiacao'}
            className="w-full"
          >
            Iniciar Filiação
          </Button>
        </CardContent>
      </Card>
    );
  }

  const getStatusInfo = () => {
    if (hasActiveSubscription()) {
      if (isExpired()) {
        return {
          icon: <XCircle className="h-5 w-5 text-red-500" />,
          label: 'Vencida',
          color: 'bg-red-100 text-red-800',
          description: 'Sua filiação está vencida. Renove para manter os benefícios.',
          action: 'Renovar Filiação'
        };
      } else if (isNearExpiration()) {
        return {
          icon: <AlertTriangle className="h-5 w-5 text-yellow-500" />,
          label: 'Próxima ao Vencimento',
          color: 'bg-yellow-100 text-yellow-800',
          description: 'Sua filiação vence em breve. Renove para evitar interrupções.',
          action: 'Renovar Filiação'
        };
      } else {
        return {
          icon: <CheckCircle className="h-5 w-5 text-green-500" />,
          label: 'Ativa',
          color: 'bg-green-100 text-green-800',
          description: 'Sua filiação está ativa e em dia.',
          action: null
        };
      }
    } else if (hasPaymentPending()) {
      return {
        icon: <Clock className="h-5 w-5 text-yellow-500" />,
        label: 'Aguardando Pagamento',
        color: 'bg-yellow-100 text-yellow-800',
        description: 'Sua filiação será ativada após a confirmação do pagamento.',
        action: 'Ver Detalhes do Pagamento'
      };
    } else {
      return {
        icon: <XCircle className="h-5 w-5 text-red-500" />,
        label: 'Inativa',
        color: 'bg-red-100 text-red-800',
        description: 'Sua filiação não está ativa.',
        action: 'Ativar Filiação'
      };
    }
  };

  const statusInfo = getStatusInfo();
  const nextDueDate = getNextDueDate();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const handleActionClick = () => {
    if (statusInfo.action === 'Ver Detalhes do Pagamento') {
      // Navegar para página de detalhes do pagamento
      window.location.href = `/pagamento/${payment?.id}`;
    } else if (statusInfo.action === 'Renovar Filiação' || statusInfo.action === 'Ativar Filiação') {
      // Navegar para página de filiação
      window.location.href = '/filiacao';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {statusInfo.icon}
            Status da Filiação
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={refreshStatus}
            className="h-8 w-8 p-0"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Badge */}
        <div className="flex items-center justify-between">
          <Badge className={statusInfo.color}>
            {statusInfo.label}
          </Badge>
          {subscription.member_types?.name && (
            <span className="text-sm font-medium">
              {subscription.member_types.name}
            </span>
          )}
        </div>

        {/* Descrição */}
        <p className="text-sm text-muted-foreground">
          {statusInfo.description}
        </p>

        <Separator />

        {/* Detalhes da Assinatura */}
        <div className="space-y-3">
          {subscription.subscription_plans && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Plano:</span>
              <span className="font-medium">{subscription.subscription_plans.name}</span>
            </div>
          )}

          {subscription.subscription_plans?.price && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Valor:</span>
              <span className="font-medium">
                {formatCurrency(subscription.subscription_plans.price)}
                {subscription.subscription_plans.recurrence && (
                  <span className="text-muted-foreground ml-1">
                    /{subscription.subscription_plans.recurrence.toLowerCase()}
                  </span>
                )}
              </span>
            </div>
          )}

          {nextDueDate && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {hasActiveSubscription() ? 'Próximo Vencimento:' : 'Vencimento:'}
              </span>
              <span className={`font-medium ${isExpired() ? 'text-red-600' : isNearExpiration() ? 'text-yellow-600' : ''}`}>
                {formatDate(nextDueDate)}
              </span>
            </div>
          )}

          {payment && hasPaymentPending() && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground flex items-center gap-1">
                <CreditCard className="h-4 w-4" />
                Pagamento:
              </span>
              <span className="font-medium">
                {formatCurrency(payment.value)}
              </span>
            </div>
          )}
        </div>

        {/* Ação */}
        {statusInfo.action && (
          <>
            <Separator />
            <Button 
              onClick={handleActionClick}
              className="w-full"
              variant={hasActiveSubscription() ? "outline" : "default"}
            >
              {statusInfo.action}
            </Button>
          </>
        )}

        {/* Informações Adicionais */}
        {subscription.activated_at && hasActiveSubscription() && (
          <div className="text-xs text-muted-foreground text-center pt-2 border-t">
            Ativada em {formatDate(new Date(subscription.activated_at))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}