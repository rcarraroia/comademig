import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  DollarSign, 
  Clock, 
  CheckCircle2, 
  AlertTriangle,
  CreditCard,
  TrendingUp,
  Calendar,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { useFinancialMetrics, formatCurrency } from '@/hooks/useFinancial';

interface PaymentStatusCardsProps {
  className?: string;
}

const PaymentStatusCards: React.FC<PaymentStatusCardsProps> = ({ 
  className = '' 
}) => {
  const { data: metrics, isLoading, error } = useFinancialMetrics();

  if (isLoading) {
    return (
      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 ${className}`}>
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className={className}>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Erro ao carregar métricas: {(error as Error).message}
        </AlertDescription>
      </Alert>
    );
  }

  if (!metrics) {
    return null;
  }

  const cards = [
    {
      title: 'Receita Total',
      value: formatCurrency(metrics.total_revenue),
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      description: 'Receita acumulada',
      trend: null,
    },
    {
      title: 'Pagamentos Pendentes',
      value: formatCurrency(metrics.pending_payments),
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
      description: 'Aguardando pagamento',
      trend: null,
    },
    {
      title: 'Pagamentos em Atraso',
      value: formatCurrency(metrics.overdue_payments),
      icon: AlertTriangle,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
      description: 'Vencidos e não pagos',
      trend: null,
    },
    {
      title: 'Pago Hoje',
      value: formatCurrency(metrics.paid_today),
      icon: CheckCircle2,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      description: 'Recebido hoje',
      trend: null,
    },
  ];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Cards principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card, index) => (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-600">
                    {card.title}
                  </p>
                  <p className="text-2xl font-bold">
                    {card.value}
                  </p>
                  <p className="text-xs text-gray-500">
                    {card.description}
                  </p>
                </div>
                
                <div className={`p-3 rounded-full ${card.bgColor}`}>
                  <card.icon className={`h-6 w-6 ${card.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Cards de distribuição por status */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Distribuição por Status
            </CardTitle>
            <CardDescription>
              Valor total por status de pagamento
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {metrics.status_distribution.map((status) => {
                const percentage = metrics.total_revenue > 0 
                  ? (status.amount / metrics.total_revenue) * 100 
                  : 0;
                
                const getStatusInfo = (statusName: string) => {
                  switch (statusName) {
                    case 'paid':
                      return { label: 'Pago', color: 'bg-green-500', textColor: 'text-green-700' };
                    case 'pending':
                      return { label: 'Pendente', color: 'bg-yellow-500', textColor: 'text-yellow-700' };
                    case 'processing':
                      return { label: 'Processando', color: 'bg-blue-500', textColor: 'text-blue-700' };
                    case 'failed':
                      return { label: 'Falhou', color: 'bg-red-500', textColor: 'text-red-700' };
                    case 'refunded':
                      return { label: 'Reembolsado', color: 'bg-purple-500', textColor: 'text-purple-700' };
                    case 'cancelled':
                      return { label: 'Cancelado', color: 'bg-gray-500', textColor: 'text-gray-700' };
                    default:
                      return { label: statusName, color: 'bg-gray-500', textColor: 'text-gray-700' };
                  }
                };

                const statusInfo = getStatusInfo(status.status);

                return (
                  <div key={status.status} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${statusInfo.color}`} />
                        <span className="font-medium">{statusInfo.label}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">{formatCurrency(status.amount)}</div>
                        <div className="text-sm text-gray-600">{status.count} transações</div>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${statusInfo.color}`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <div className="text-xs text-gray-500 text-right">
                      {percentage.toFixed(1)}% do total
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Métodos de Pagamento
            </CardTitle>
            <CardDescription>
              Receita por método de pagamento
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {metrics.payment_methods.length === 0 ? (
                <div className="text-center py-4 text-gray-500">
                  Nenhum método de pagamento registrado
                </div>
              ) : (
                metrics.payment_methods.map((method) => {
                  const percentage = metrics.total_revenue > 0 
                    ? (method.revenue / metrics.total_revenue) * 100 
                    : 0;
                  
                  const getMethodInfo = (methodName: string) => {
                    switch (methodName) {
                      case 'pix':
                        return { label: 'PIX', color: 'bg-green-500', icon: '💳' };
                      case 'credit_card':
                        return { label: 'Cartão de Crédito', color: 'bg-blue-500', icon: '💳' };
                      case 'boleto':
                        return { label: 'Boleto', color: 'bg-orange-500', icon: '📄' };
                      case 'debit_card':
                        return { label: 'Cartão de Débito', color: 'bg-purple-500', icon: '💳' };
                      default:
                        return { label: methodName, color: 'bg-gray-500', icon: '💰' };
                    }
                  };

                  const methodInfo = getMethodInfo(method.method);

                  return (
                    <div key={method.method} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{methodInfo.icon}</span>
                          <span className="font-medium">{methodInfo.label}</span>
                        </div>
                        <div className="text-right">
                          <div className="font-bold">{formatCurrency(method.revenue)}</div>
                          <div className="text-sm text-gray-600">{method.count} transações</div>
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${methodInfo.color}`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <div className="text-xs text-gray-500 text-right">
                        {percentage.toFixed(1)}% do total
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alertas */}
      {metrics.overdue_payments > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Atenção:</strong> Há {formatCurrency(metrics.overdue_payments)} em pagamentos em atraso. 
            Considere entrar em contato com os membros para regularização.
          </AlertDescription>
        </Alert>
      )}

      {metrics.pending_payments > metrics.monthly_revenue * 0.5 && (
        <Alert>
          <Clock className="h-4 w-4" />
          <AlertDescription>
            <strong>Aviso:</strong> O valor de pagamentos pendentes ({formatCurrency(metrics.pending_payments)}) 
            é significativo comparado à receita mensal. Monitore de perto.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default PaymentStatusCards;