import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  User, 
  Calendar, 
  DollarSign, 
  TrendingUp,
  Settings,
  Pause,
  X,
  CheckCircle,
  Clock,
  CreditCard
} from 'lucide-react';
import { useSubscriptionActions } from '@/hooks/useSubscriptionActions';
import { formatCurrency } from '@/lib/utils';
import { format, differenceInDays, differenceInMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function SubscriptionOverview() {
  const { getSubscriptionStatus, redirectToRenewal } = useSubscriptionActions();
  const status = getSubscriptionStatus();

  if (!status.hasSubscription || !status.subscription) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <User className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600 mb-4">Você ainda não possui uma assinatura ativa</p>
          <Button onClick={() => window.location.href = '/filiacao'}>
            Fazer Filiação
          </Button>
        </CardContent>
      </Card>
    );
  }

  const subscription = status.subscription;
  
  // Calcular métricas
  const startDate = subscription.started_at ? new Date(subscription.started_at) : new Date(subscription.created_at);
  const now = new Date();
  const daysAsMember = differenceInDays(now, startDate);
  const monthsAsMember = differenceInMonths(now, startDate);
  
  // Simular total pago (seria calculado do histórico real)
  const estimatedTotalPaid = subscription.value * Math.max(1, monthsAsMember);
  
  // Calcular progresso até próximo vencimento
  const expirationDate = status.nextDueDate;
  const progressPercentage = expirationDate ? 
    Math.max(0, Math.min(100, ((30 - (status.daysUntilExpiration || 0)) / 30) * 100)) : 0;

  const getStatusConfig = () => {
    switch (subscription.status) {
      case 'active':
        return {
          color: 'text-green-600',
          bgColor: 'bg-green-100',
          icon: CheckCircle,
          label: 'Ativa'
        };
      case 'pending':
        return {
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-100',
          icon: Clock,
          label: 'Pendente'
        };
      case 'overdue':
        return {
          color: 'text-red-600',
          bgColor: 'bg-red-100',
          icon: X,
          label: 'Vencida'
        };
      default:
        return {
          color: 'text-gray-600',
          bgColor: 'bg-gray-100',
          icon: User,
          label: 'Inativa'
        };
    }
  };

  const statusConfig = getStatusConfig();
  const StatusIcon = statusConfig.icon;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Visão Geral da Assinatura
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Status Principal */}
        <div className={`p-4 rounded-lg ${statusConfig.bgColor}`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <StatusIcon className={`h-5 w-5 ${statusConfig.color}`} />
              <span className={`font-medium ${statusConfig.color}`}>
                Status: {statusConfig.label}
              </span>
            </div>
            <Badge variant={subscription.status === 'active' ? 'default' : 'secondary'}>
              {subscription.cycle === 'MONTHLY' ? 'Mensal' : 
               subscription.cycle === 'QUARTERLY' ? 'Trimestral' :
               subscription.cycle === 'SEMIANNUALLY' ? 'Semestral' : 'Anual'}
            </Badge>
          </div>
          
          {expirationDate && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Próximo vencimento:</span>
                <span className="font-medium">
                  {format(expirationDate, 'dd/MM/yyyy', { locale: ptBR })}
                </span>
              </div>
              <Progress value={progressPercentage} className="h-2" />
              <p className="text-xs text-gray-600">
                {status.daysUntilExpiration !== null && status.daysUntilExpiration >= 0
                  ? `${status.daysUntilExpiration} dias restantes`
                  : 'Vencida'
                }
              </p>
            </div>
          )}
        </div>

        {/* Métricas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <Calendar className="h-6 w-6 mx-auto text-blue-600 mb-2" />
            <p className="text-sm text-blue-800 font-medium">Tempo como Membro</p>
            <p className="text-lg font-bold text-blue-900">
              {monthsAsMember > 0 ? `${monthsAsMember} meses` : `${daysAsMember} dias`}
            </p>
          </div>

          <div className="text-center p-3 bg-green-50 rounded-lg">
            <DollarSign className="h-6 w-6 mx-auto text-green-600 mb-2" />
            <p className="text-sm text-green-800 font-medium">Total Investido</p>
            <p className="text-lg font-bold text-green-900">
              {formatCurrency(estimatedTotalPaid)}
            </p>
          </div>

          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <TrendingUp className="h-6 w-6 mx-auto text-purple-600 mb-2" />
            <p className="text-sm text-purple-800 font-medium">Valor Mensal</p>
            <p className="text-lg font-bold text-purple-900">
              {formatCurrency(subscription.value)}
            </p>
          </div>
        </div>

        <Separator />

        {/* Informações da Assinatura */}
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900">Detalhes da Assinatura</h4>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-600">Plano:</p>
              <p className="font-medium">Plano {subscription.cycle === 'MONTHLY' ? 'Mensal' : 
                                                   subscription.cycle === 'QUARTERLY' ? 'Trimestral' :
                                                   subscription.cycle === 'SEMIANNUALLY' ? 'Semestral' : 'Anual'}</p>
            </div>
            <div>
              <p className="text-gray-600">Valor:</p>
              <p className="font-medium">{formatCurrency(subscription.value)}</p>
            </div>
            <div>
              <p className="text-gray-600">Início:</p>
              <p className="font-medium">
                {format(startDate, 'dd/MM/yyyy', { locale: ptBR })}
              </p>
            </div>
            <div>
              <p className="text-gray-600">Renovação:</p>
              <p className="font-medium">Automática</p>
            </div>
          </div>
        </div>

        <Separator />

        {/* Ações Rápidas */}
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900">Ações Rápidas</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {status.canRenew && (
              <Button onClick={redirectToRenewal} className="w-full">
                <CreditCard className="h-4 w-4 mr-2" />
                {status.actionText}
              </Button>
            )}
            
            <Button variant="outline" className="w-full">
              <Settings className="h-4 w-4 mr-2" />
              Alterar Plano
            </Button>
            
            {subscription.status === 'active' && (
              <Button variant="outline" className="w-full">
                <Pause className="h-4 w-4 mr-2" />
                Pausar Assinatura
              </Button>
            )}
            
            <Button variant="outline" className="w-full text-red-600 hover:text-red-700">
              <X className="h-4 w-4 mr-2" />
              Cancelar Assinatura
            </Button>
          </div>
        </div>

        {/* Timeline Simples */}
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900">Histórico Recente</h4>
          
          <div className="space-y-2">
            <div className="flex items-center gap-3 p-2 bg-gray-50 rounded">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">Assinatura criada</p>
                <p className="text-xs text-gray-600">
                  {format(startDate, 'dd/MM/yyyy', { locale: ptBR })}
                </p>
              </div>
            </div>
            
            {subscription.status === 'active' && (
              <div className="flex items-center gap-3 p-2 bg-gray-50 rounded">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Último pagamento</p>
                  <p className="text-xs text-gray-600">
                    {formatCurrency(subscription.value)} - PIX
                  </p>
                </div>
              </div>
            )}
            
            {expirationDate && (
              <div className="flex items-center gap-3 p-2 bg-gray-50 rounded">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Próximo vencimento</p>
                  <p className="text-xs text-gray-600">
                    {format(expirationDate, 'dd/MM/yyyy', { locale: ptBR })}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}