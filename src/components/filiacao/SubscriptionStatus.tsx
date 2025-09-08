import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, Clock, AlertCircle, RefreshCw, User, CreditCard } from 'lucide-react';
import { useSubscriptionRetry } from '@/hooks/useSubscriptionRetry';
import { useUserSubscriptions } from '@/hooks/useUserSubscriptions';

interface SubscriptionStatusProps {
  paymentId?: string;
  memberTypeId?: string;
  planId?: string;
  showRetryOption?: boolean;
}

export const SubscriptionStatus = ({ 
  paymentId, 
  memberTypeId, 
  planId, 
  showRetryOption = true 
}: SubscriptionStatusProps) => {
  const [subscriptionData, setSubscriptionData] = useState<any>(null);
  const [loadingStatus, setLoadingStatus] = useState(false);
  
  const { 
    retrySubscriptionCreation, 
    checkSubscriptionStatus, 
    getUserPendingSubscriptions,
    loading: retryLoading 
  } = useSubscriptionRetry();
  
  const { activeSubscription, userSubscriptions, refetch } = useUserSubscriptions();

  // Carregar status da assinatura
  useEffect(() => {
    if (paymentId) {
      loadSubscriptionStatus();
    }
  }, [paymentId]);

  const loadSubscriptionStatus = async () => {
    if (!paymentId) return;
    
    setLoadingStatus(true);
    try {
      const status = await checkSubscriptionStatus(paymentId);
      setSubscriptionData(status);
    } catch (error) {
      console.error('Erro ao carregar status:', error);
    } finally {
      setLoadingStatus(false);
    }
  };

  const handleRetry = async () => {
    if (!paymentId || !memberTypeId || !planId) {
      return;
    }

    const success = await retrySubscriptionCreation(paymentId, memberTypeId, planId);
    if (success) {
      await loadSubscriptionStatus();
      await refetch();
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'active': { label: 'Ativa', variant: 'default' as const, icon: CheckCircle, color: 'text-green-600' },
      'pending': { label: 'Pendente', variant: 'secondary' as const, icon: Clock, color: 'text-yellow-600' },
      'cancelled': { label: 'Cancelada', variant: 'destructive' as const, icon: AlertCircle, color: 'text-red-600' },
      'inactive': { label: 'Inativa', variant: 'outline' as const, icon: AlertCircle, color: 'text-gray-600' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className={`w-3 h-3 ${config.color}`} />
        {config.label}
      </Badge>
    );
  };

  if (loadingStatus) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Verificando status da assinatura...</p>
        </CardContent>
      </Card>
    );
  }

  // Se tem assinatura ativa, mostrar informações
  if (activeSubscription) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-800">
            <CheckCircle className="h-5 w-5" />
            Filiação Ativa
          </CardTitle>
          <CardDescription className="text-green-700">
            Sua filiação está ativa e todos os benefícios estão disponíveis
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-sm font-medium">Cargo Ministerial</p>
                <p className="text-sm text-muted-foreground">
                  {activeSubscription.member_types?.name || 'Não especificado'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-sm font-medium">Plano</p>
                <p className="text-sm text-muted-foreground">
                  {activeSubscription.subscription_plans?.name || 'Não especificado'}
                </p>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t">
            <p className="text-sm text-green-700">
              <strong>Data de Ativação:</strong> {' '}
              {activeSubscription.start_date 
                ? new Date(activeSubscription.start_date).toLocaleDateString('pt-BR')
                : 'Não informada'
              }
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Se tem dados de assinatura específica (por paymentId)
  if (subscriptionData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Status da Assinatura
            {getStatusBadge(subscriptionData.status)}
          </CardTitle>
          <CardDescription>
            Informações sobre sua assinatura para este pagamento
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium">Cargo Ministerial</p>
              <p className="text-sm text-muted-foreground">
                {subscriptionData.member_types?.name || 'Não especificado'}
              </p>
            </div>
            
            <div>
              <p className="text-sm font-medium">Plano</p>
              <p className="text-sm text-muted-foreground">
                {subscriptionData.subscription_plans?.name || 'Não especificado'}
              </p>
            </div>
          </div>

          {subscriptionData.status === 'pending' && (
            <Alert className="border-yellow-200 bg-yellow-50">
              <Clock className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800">
                Sua assinatura será ativada automaticamente após a confirmação do pagamento.
                Este processo pode levar alguns minutos.
              </AlertDescription>
            </Alert>
          )}

          {subscriptionData.status === 'active' && subscriptionData.start_date && (
            <div className="pt-4 border-t">
              <p className="text-sm text-green-700">
                <strong>Ativada em:</strong> {' '}
                {new Date(subscriptionData.start_date).toLocaleDateString('pt-BR')}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Se não tem assinatura e pode fazer retry
  if (showRetryOption && paymentId && memberTypeId && planId) {
    return (
      <Card className="border-orange-200 bg-orange-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-800">
            <AlertCircle className="h-5 w-5" />
            Assinatura Não Encontrada
          </CardTitle>
          <CardDescription className="text-orange-700">
            Não foi possível encontrar uma assinatura para este pagamento
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert className="border-orange-300 bg-orange-100">
            <AlertCircle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              Pode ter ocorrido um erro durante o processamento da sua filiação.
              Você pode tentar reprocessar sua assinatura clicando no botão abaixo.
            </AlertDescription>
          </Alert>

          <Button 
            onClick={handleRetry}
            disabled={retryLoading}
            className="w-full bg-orange-600 hover:bg-orange-700"
          >
            {retryLoading ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Reprocessando...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Reprocessar Assinatura
              </>
            )}
          </Button>

          <p className="text-xs text-orange-600 text-center">
            Se o problema persistir, entre em contato com o suporte
          </p>
        </CardContent>
      </Card>
    );
  }

  // Estado padrão - sem assinatura
  return (
    <Card>
      <CardContent className="p-6 text-center text-muted-foreground">
        <User className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>Nenhuma assinatura encontrada</p>
        <p className="text-sm mt-2">
          Complete o processo de filiação para ativar sua assinatura
        </p>
      </CardContent>
    </Card>
  );
};