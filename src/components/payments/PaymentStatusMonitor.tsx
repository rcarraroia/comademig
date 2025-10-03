/**
 * Componente para monitorar status de pagamentos em tempo real
 * Usa webhooks e polling para detectar mudanças de status
 */

import React, { useEffect, useState } from 'react';
import { Bell, CheckCircle, Clock, AlertTriangle, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAsaasWebhooks, type PaymentStatusUpdate } from '@/hooks/useAsaasWebhooks';

interface PaymentStatusMonitorProps {
  paymentIds?: string[];
  autoStart?: boolean;
  showHistory?: boolean;
  onStatusChange?: (update: PaymentStatusUpdate) => void;
}

export const PaymentStatusMonitor: React.FC<PaymentStatusMonitorProps> = ({
  paymentIds = [],
  autoStart = true,
  showHistory = false,
  onStatusChange
}) => {
  const [pendingPayments, setPendingPayments] = useState<any[]>([]);
  const [webhookHistory, setWebhookHistory] = useState<any[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const {
    isListening,
    lastUpdate,
    startStatusMonitoring,
    stopStatusMonitoring,
    getPendingPayments,
    getWebhookHistory,
    checkUnprocessedWebhooks,
    refreshPaymentStatus
  } = useAsaasWebhooks();

  // Iniciar monitoramento automaticamente
  useEffect(() => {
    if (autoStart && paymentIds.length > 0) {
      const cleanup = startStatusMonitoring(paymentIds);
      return cleanup;
    }
  }, [autoStart, paymentIds, startStatusMonitoring]);

  // Carregar pagamentos pendentes
  useEffect(() => {
    const loadPendingPayments = async () => {
      const payments = await getPendingPayments();
      setPendingPayments(payments);
    };

    loadPendingPayments();
  }, [getPendingPayments]);

  // Reagir a mudanças de status
  useEffect(() => {
    if (lastUpdate) {
      onStatusChange?.(lastUpdate);
      
      // Atualizar lista de pagamentos pendentes
      setPendingPayments(prev => 
        prev.map(payment => 
          payment.id === lastUpdate.payment_id 
            ? { ...payment, status: lastUpdate.new_status }
            : payment
        )
      );
    }
  }, [lastUpdate, onStatusChange]);

  // Carregar histórico de webhooks se solicitado
  useEffect(() => {
    if (showHistory && paymentIds.length > 0) {
      const loadHistory = async () => {
        const history = await Promise.all(
          paymentIds.map(async (id) => {
            // Buscar asaas_id do pagamento
            const payments = await getPendingPayments();
            const payment = payments.find((p: any) => p.id === id);
            if (payment) {
              return await getWebhookHistory((payment as any).asaas_id);
            }
            return [];
          })
        );
        
        setWebhookHistory(history.flat());
      };

      loadHistory();
    }
  }, [showHistory, paymentIds, getPendingPayments, getWebhookHistory]);

  // Atualizar status manualmente
  const handleRefresh = async () => {
    setIsRefreshing(true);
    
    try {
      // Atualizar todos os pagamentos pendentes
      for (const payment of pendingPayments) {
        await refreshPaymentStatus(payment.id);
      }
      
      // Recarregar lista
      const updatedPayments = await getPendingPayments();
      setPendingPayments(updatedPayments);
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Determinar cor do status
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
      case 'RECEIVED':
        return 'bg-green-100 text-green-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'OVERDUE':
        return 'bg-red-100 text-red-800';
      case 'AWAITING_RISK_ANALYSIS':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Determinar ícone do status
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
      case 'RECEIVED':
        return <CheckCircle className="w-4 h-4" />;
      case 'PENDING':
        return <Clock className="w-4 h-4" />;
      case 'OVERDUE':
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <Bell className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Status do Monitor */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Monitor de Pagamentos
          </CardTitle>
          <div className="flex items-center gap-2">
            {isListening && (
              <Badge variant="secondary" className="bg-green-100 text-green-700">
                <Bell className="w-3 h-3 mr-1" />
                Ativo
              </Badge>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-xs text-gray-600">
            {isListening 
              ? 'Monitorando mudanças de status em tempo real'
              : 'Monitor pausado - clique em atualizar para verificar status'
            }
          </div>
        </CardContent>
      </Card>

      {/* Última Atualização */}
      {lastUpdate && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div>
                <div className="font-semibold text-green-800">
                  Status Atualizado!
                </div>
                <div className="text-sm text-green-700">
                  Pagamento {lastUpdate.asaas_id} mudou de {lastUpdate.old_status} para {lastUpdate.new_status}
                </div>
                <div className="text-xs text-green-600">
                  {new Date(lastUpdate.updated_at).toLocaleString('pt-BR')}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista de Pagamentos Pendentes */}
      {pendingPayments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Pagamentos Pendentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingPayments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="font-medium">{payment.descricao}</div>
                    <div className="text-sm text-gray-600">
                      R$ {payment.valor.toFixed(2).replace('.', ',')} • 
                      Vence: {new Date(payment.data_vencimento).toLocaleDateString('pt-BR')}
                    </div>
                    <div className="text-xs text-gray-500">
                      ID: {payment.asaas_id}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(payment.status)}>
                      {getStatusIcon(payment.status)}
                      <span className="ml-1">{payment.status}</span>
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Histórico de Webhooks */}
      {showHistory && webhookHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Histórico de Webhooks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {webhookHistory.slice(0, 10).map((webhook) => (
                <div
                  key={webhook.id}
                  className="flex items-center justify-between p-2 text-sm border-l-2 border-gray-200 pl-3"
                >
                  <div>
                    <div className="font-medium">{webhook.event_type}</div>
                    <div className="text-xs text-gray-600">
                      Pagamento: {webhook.asaas_payment_id}
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant={webhook.processed ? "default" : "secondary"}>
                      {webhook.processed ? 'Processado' : 'Pendente'}
                    </Badge>
                    <div className="text-xs text-gray-500">
                      {new Date(webhook.created_at).toLocaleString('pt-BR')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Estado Vazio */}
      {pendingPayments.length === 0 && (
        <Card>
          <CardContent className="pt-6 text-center">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Nenhum Pagamento Pendente
            </h3>
            <p className="text-gray-600">
              Todos os seus pagamentos estão em dia!
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};