/**
 * Componente para exibir resultado de pagamento com cartão
 * Mostra status, parcelas e informações do cartão
 */

import React, { useState, useEffect } from 'react';
import { CheckCircle, Clock, AlertCircle, CreditCard, RefreshCw, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAsaasCardPayments } from '@/hooks/useAsaasCardPayments';

interface CardPaymentResultProps {
  paymentResult: {
    success: boolean;
    payment_id: string;
    asaas_id: string;
    status: string;
    invoice_url?: string;
    credit_card_token?: string;
    installment_count?: number;
    installment_value?: number;
    message: string;
  };
  onStatusChange?: (status: string) => void;
}

export const CardPaymentResult: React.FC<CardPaymentResultProps> = ({
  paymentResult,
  onStatusChange
}) => {
  const [currentStatus, setCurrentStatus] = useState(paymentResult.status);
  const [isPolling, setIsPolling] = useState(paymentResult.status === 'PENDING');
  const { checkCardPaymentStatus } = useAsaasCardPayments();

  // Polling para verificar mudanças de status
  useEffect(() => {
    if (!isPolling || currentStatus === 'CONFIRMED' || currentStatus === 'RECEIVED') return;

    const pollInterval = setInterval(async () => {
      try {
        const status = await checkCardPaymentStatus(paymentResult.payment_id);
        
        if (status && status !== currentStatus) {
          setCurrentStatus(status);
          onStatusChange?.(status);
          
          if (status === 'CONFIRMED' || status === 'RECEIVED') {
            setIsPolling(false);
          }
        }
      } catch (error) {
        console.error('Erro ao verificar status do cartão:', error);
      }
    }, 10000); // Verificar a cada 10 segundos

    return () => clearInterval(pollInterval);
  }, [isPolling, currentStatus, paymentResult.payment_id, onStatusChange, checkCardPaymentStatus]);

  // Determinar cor e ícone baseado no status
  const getStatusInfo = () => {
    switch (currentStatus) {
      case 'CONFIRMED':
      case 'RECEIVED':
        return {
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          icon: <CheckCircle className="w-8 h-8 text-green-600" />,
          title: 'Pagamento Aprovado!',
          description: 'Seu pagamento foi processado com sucesso.'
        };
      
      case 'PENDING':
      case 'AWAITING_RISK_ANALYSIS':
        return {
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          icon: <Clock className="w-8 h-8 text-yellow-600" />,
          title: 'Processando Pagamento',
          description: 'Aguarde enquanto processamos seu pagamento.'
        };
      
      case 'OVERDUE':
      case 'REFUNDED':
        return {
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          icon: <AlertCircle className="w-8 h-8 text-red-600" />,
          title: 'Pagamento Recusado',
          description: 'Não foi possível processar o pagamento.'
        };
      
      default:
        return {
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          icon: <CreditCard className="w-8 h-8 text-blue-600" />,
          title: 'Pagamento Processado',
          description: paymentResult.message
        };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <div className="max-w-md mx-auto space-y-6">
      {/* Status Principal */}
      <Card className={`${statusInfo.borderColor} ${statusInfo.bgColor}`}>
        <CardContent className="pt-6 text-center">
          <div className="flex flex-col items-center space-y-4">
            {statusInfo.icon}
            
            <div>
              <h3 className={`text-lg font-semibold ${statusInfo.color}`}>
                {statusInfo.title}
              </h3>
              <p className={`text-sm ${statusInfo.color} mt-1`}>
                {statusInfo.description}
              </p>
            </div>

            {/* Badge de Status */}
            <Badge variant={currentStatus === 'CONFIRMED' ? 'default' : 'secondary'}>
              {currentStatus === 'CONFIRMED' && 'Aprovado'}
              {currentStatus === 'PENDING' && 'Processando'}
              {currentStatus === 'AWAITING_RISK_ANALYSIS' && 'Análise de Risco'}
              {currentStatus === 'OVERDUE' && 'Recusado'}
              {currentStatus === 'REFUNDED' && 'Estornado'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Detalhes do Pagamento */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Detalhes do Pagamento
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-600">ID do Pagamento:</span>
            <span className="font-mono text-sm">{paymentResult.asaas_id}</span>
          </div>
          
          {paymentResult.installment_count && paymentResult.installment_count > 1 && (
            <>
              <div className="flex justify-between">
                <span className="text-gray-600">Parcelas:</span>
                <span>{paymentResult.installment_count}x</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Valor da Parcela:</span>
                <span>R$ {paymentResult.installment_value?.toFixed(2).replace('.', ',')}</span>
              </div>
            </>
          )}
          
          <div className="flex justify-between">
            <span className="text-gray-600">Status:</span>
            <span className={statusInfo.color}>
              {currentStatus}
              {isPolling && <RefreshCw className="w-3 h-3 inline ml-1 animate-spin" />}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Ações */}
      <div className="space-y-3">
        {paymentResult.invoice_url && (
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => window.open(paymentResult.invoice_url, '_blank')}
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Ver Comprovante
          </Button>
        )}
        
        {currentStatus === 'PENDING' && (
          <Button 
            variant="outline" 
            onClick={() => setIsPolling(!isPolling)}
            className="w-full"
          >
            {isPolling ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Pausar Verificação
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Retomar Verificação
              </>
            )}
          </Button>
        )}
      </div>

      {/* Informações Adicionais */}
      {currentStatus === 'CONFIRMED' && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="text-center text-green-800">
              <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-600" />
              <h4 className="font-semibold mb-1">Pagamento Confirmado!</h4>
              <p className="text-sm">
                Seu pagamento foi aprovado e processado com sucesso.
                {paymentResult.installment_count && paymentResult.installment_count > 1 && (
                  <span className="block mt-1">
                    As próximas parcelas serão cobradas automaticamente.
                  </span>
                )}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {currentStatus === 'OVERDUE' && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="text-center text-red-800">
              <AlertCircle className="w-12 h-12 mx-auto mb-2 text-red-600" />
              <h4 className="font-semibold mb-1">Pagamento Recusado</h4>
              <p className="text-sm">
                O pagamento não foi aprovado. Verifique os dados do cartão ou tente outro método de pagamento.
              </p>
              <Button variant="outline" className="mt-3" onClick={() => window.location.reload()}>
                Tentar Novamente
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};