/**
 * Componente PaymentProcessingStatus
 * 
 * Exibe progresso durante polling de confirmação de pagamento
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Loader2, 
  CheckCircle, 
  CreditCard, 
  UserPlus, 
  AlertTriangle,
  Clock,
  ArrowRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export interface PaymentStep {
  id: string;
  label: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  icon: React.ReactNode;
  description?: string;
}

interface PaymentProcessingStatusProps {
  paymentId: string;
  onComplete: (result: { success: boolean; userId?: string }) => void;
  onError: (error: string) => void;
  allowCancel?: boolean;
}

export default function PaymentProcessingStatus({
  paymentId,
  onComplete,
  onError,
  allowCancel = false
}: PaymentProcessingStatusProps) {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [isPolling, setIsPolling] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeElapsed, setTimeElapsed] = useState(0);

  // Definir etapas do processo
  const steps: PaymentStep[] = [
    {
      id: 'payment',
      label: 'Processando Pagamento',
      status: 'processing',
      icon: <CreditCard className="h-5 w-5" />,
      description: 'Validando dados do cartão e processando cobrança'
    },
    {
      id: 'account',
      label: 'Criando Conta',
      status: 'pending',
      icon: <UserPlus className="h-5 w-5" />,
      description: 'Criando sua conta e configurando perfil'
    },
    {
      id: 'complete',
      label: 'Concluído',
      status: 'pending',
      icon: <CheckCircle className="h-5 w-5" />,
      description: 'Filiação finalizada com sucesso'
    }
  ];

  const [processSteps, setProcessSteps] = useState(steps);

  // Contador de tempo
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeElapsed(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Polling do status do pagamento
  useEffect(() => {
    if (!isPolling || !paymentId) return;

    const pollPaymentStatus = async () => {
      try {
        const response = await fetch('/functions/v1/poll-payment-status-frontend', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ paymentId })
        });

        if (!response.ok) {
          throw new Error('Erro ao verificar status do pagamento');
        }

        const result = await response.json();

        // Atualizar etapas baseado no status
        updateStepsBasedOnStatus(result.status, result.step);

        // Verificar se processo foi concluído
        if (result.status === 'completed') {
          setIsPolling(false);
          
          // Aguardar um pouco para mostrar conclusão
          setTimeout(() => {
            onComplete({ 
              success: true, 
              userId: result.userId 
            });
          }, 2000);
        } else if (result.status === 'failed') {
          setIsPolling(false);
          setError(result.error || 'Erro no processamento do pagamento');
          onError(result.error || 'Erro no processamento do pagamento');
        }

      } catch (err) {
        console.error('Erro no polling:', err);
        
        // Se passou muito tempo (5 minutos), parar polling
        if (timeElapsed > 300) {
          setIsPolling(false);
          setError('Tempo limite excedido. Entre em contato com o suporte.');
          onError('Tempo limite excedido');
        }
      }
    };

    // Polling a cada 3 segundos
    const interval = setInterval(pollPaymentStatus, 3000);

    // Primeira verificação imediata
    pollPaymentStatus();

    return () => clearInterval(interval);
  }, [isPolling, paymentId, timeElapsed, onComplete, onError]);

  const updateStepsBasedOnStatus = (status: string, currentStepId?: string) => {
    setProcessSteps(prevSteps => {
      return prevSteps.map((step, index) => {
        if (currentStepId === step.id) {
          return { ...step, status: 'processing' as const };
        } else if (status === 'completed' || 
                   (currentStepId === 'account' && step.id === 'payment') ||
                   (currentStepId === 'complete' && (step.id === 'payment' || step.id === 'account'))) {
          return { ...step, status: 'completed' as const };
        } else if (status === 'failed' && step.id === currentStepId) {
          return { ...step, status: 'failed' as const };
        }
        return step;
      });
    });

    // Atualizar step atual
    const stepIndex = steps.findIndex(s => s.id === currentStepId);
    if (stepIndex >= 0) {
      setCurrentStep(stepIndex);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getStepStatusIcon = (step: PaymentStep) => {
    switch (step.status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'processing':
        return <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />;
      case 'failed':
        return <AlertTriangle className="h-5 w-5 text-red-600" />;
      default:
        return <div className="h-5 w-5 rounded-full border-2 border-gray-300" />;
    }
  };

  if (error) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-6 w-6" />
            Erro no Processamento
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              {error}
            </AlertDescription>
          </Alert>

          <div className="flex gap-4 justify-center">
            <Button
              variant="outline"
              onClick={() => navigate('/filiacao')}
            >
              Tentar Novamente
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/suporte')}
            >
              Contatar Suporte
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
          Processando sua Filiação
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Aviso importante */}
        <Alert className="border-blue-200 bg-blue-50">
          <Clock className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <strong>Não feche esta página!</strong> Seu pagamento está sendo processado.
            Este processo pode levar alguns minutos.
          </AlertDescription>
        </Alert>

        {/* Progresso das etapas */}
        <div className="space-y-4">
          {processSteps.map((step, index) => (
            <div key={step.id} className="flex items-start gap-4">
              {/* Ícone do status */}
              <div className="flex-shrink-0 mt-1">
                {getStepStatusIcon(step)}
              </div>

              {/* Conteúdo da etapa */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className={`font-medium ${
                    step.status === 'processing' ? 'text-blue-600' :
                    step.status === 'completed' ? 'text-green-600' :
                    step.status === 'failed' ? 'text-red-600' :
                    'text-gray-500'
                  }`}>
                    {step.label}
                  </h3>
                  
                  {step.status === 'processing' && (
                    <span className="text-sm text-blue-600 animate-pulse">
                      Em andamento...
                    </span>
                  )}
                  
                  {step.status === 'completed' && (
                    <span className="text-sm text-green-600">
                      Concluído
                    </span>
                  )}
                </div>

                {step.description && (
                  <p className="text-sm text-gray-600 mt-1">
                    {step.description}
                  </p>
                )}
              </div>

              {/* Seta para próxima etapa */}
              {index < processSteps.length - 1 && (
                <ArrowRight className="h-4 w-4 text-gray-400 mt-2" />
              )}
            </div>
          ))}
        </div>

        {/* Informações adicionais */}
        <div className="pt-4 border-t border-gray-200">
          <div className="flex justify-between items-center text-sm text-gray-600">
            <span>Tempo decorrido: {formatTime(timeElapsed)}</span>
            <span>ID do Pagamento: {paymentId.slice(-8)}</span>
          </div>
        </div>

        {/* Botão de cancelar (apenas se permitido e pagamento não processado) */}
        {allowCancel && currentStep === 0 && (
          <div className="pt-4 border-t border-gray-200">
            <Button
              variant="outline"
              onClick={() => navigate('/filiacao')}
              className="w-full"
            >
              Cancelar Processo
            </Button>
          </div>
        )}

        {/* Informação sobre não cancelamento após pagamento */}
        {!allowCancel && (
          <div className="pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              ⚠️ O pagamento já foi processado e não pode ser cancelado.
              Aguarde a conclusão do processo.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}