import { useState, useCallback, useRef, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { 
  pollingService, 
  PollingOptions, 
  PaymentStatus, 
  PollingResult 
} from '@/lib/services/PollingService';

export interface UsePollingServiceOptions {
  onSuccess?: (status: PaymentStatus) => void;
  onError?: (error: string) => void;
  onTimeout?: () => void;
  onStatusUpdate?: (status: PaymentStatus) => void;
  autoCleanup?: boolean; // Limpar polling ao desmontar componente
}

export interface UsePollingServiceReturn {
  isPolling: boolean;
  currentStatus: PaymentStatus | null;
  result: PollingResult | null;
  attempts: number;
  duration: number;
  startPolling: (paymentId: string, options?: Partial<PollingOptions>) => Promise<PollingResult>;
  cancelPolling: (paymentId?: string) => void;
  isPollingActive: (paymentId: string) => boolean;
}

/**
 * Hook para usar o PollingService de forma reativa
 * Implementa as especificações do Requirement 2
 */
export const usePollingService = (options: UsePollingServiceOptions = {}): UsePollingServiceReturn => {
  const {
    onSuccess,
    onError,
    onTimeout,
    onStatusUpdate,
    autoCleanup = true
  } = options;

  const { toast } = useToast();
  const [isPolling, setIsPolling] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<PaymentStatus | null>(null);
  const [result, setResult] = useState<PollingResult | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [duration, setDuration] = useState(0);
  
  const activePaymentIdRef = useRef<string | null>(null);

  /**
   * Inicia polling para um pagamento específico
   * Usa configurações padrão conforme Requirement 2
   */
  const startPolling = useCallback(async (
    paymentId: string, 
    customOptions: Partial<PollingOptions> = {}
  ): Promise<PollingResult> => {
    // Cancelar polling anterior se existir
    if (activePaymentIdRef.current) {
      pollingService.cancelPolling(activePaymentIdRef.current);
    }

    activePaymentIdRef.current = paymentId;
    setIsPolling(true);
    setCurrentStatus(null);
    setResult(null);
    setAttempts(0);
    setDuration(0);

    // Configurações padrão conforme Requirement 2
    const defaultOptions: PollingOptions = {
      paymentId,
      timeout: 15, // 15 segundos conforme Requirement 2.4
      interval: 1,  // 1 segundo conforme Requirement 2.5
      onStatusUpdate: (status: PaymentStatus) => {
        setCurrentStatus(status);
        setAttempts(prev => prev + 1);
        
        // Callback personalizado
        if (onStatusUpdate) {
          onStatusUpdate(status);
        }
      }
    };

    const finalOptions = { ...defaultOptions, ...customOptions };

    try {
      console.log(`Iniciando polling para pagamento ${paymentId}...`);
      
      const pollingResult = await pollingService.pollPaymentStatus(finalOptions);
      
      setResult(pollingResult);
      setAttempts(pollingResult.attempts);
      setDuration(pollingResult.duration);
      setIsPolling(false);
      activePaymentIdRef.current = null;

      // Processar resultado
      if (pollingResult.success && pollingResult.status) {
        console.log('Polling concluído com sucesso:', pollingResult.status);
        
        toast({
          title: "Pagamento Confirmado",
          description: "Seu pagamento foi processado com sucesso!",
          variant: "default"
        });

        if (onSuccess) {
          onSuccess(pollingResult.status);
        }
      } else if (pollingResult.timedOut) {
        console.warn('Polling expirou por timeout');
        
        toast({
          title: "Processamento em Andamento",
          description: "Seu pagamento está sendo processado. Você receberá uma confirmação em breve.",
          variant: "default"
        });

        if (onTimeout) {
          onTimeout();
        }
      } else {
        console.error('Polling falhou:', pollingResult.error);
        
        const errorMessage = pollingResult.error || 'Erro desconhecido no processamento';
        
        toast({
          title: "Erro no Pagamento",
          description: errorMessage,
          variant: "destructive"
        });

        if (onError) {
          onError(errorMessage);
        }
      }

      return pollingResult;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      
      console.error('Erro no polling:', error);
      
      setIsPolling(false);
      activePaymentIdRef.current = null;
      
      const failedResult: PollingResult = {
        success: false,
        error: errorMessage,
        attempts: attempts,
        duration: duration
      };
      
      setResult(failedResult);
      
      toast({
        title: "Erro no Sistema",
        description: errorMessage,
        variant: "destructive"
      });

      if (onError) {
        onError(errorMessage);
      }

      return failedResult;
    }
  }, [onSuccess, onError, onTimeout, onStatusUpdate, toast, attempts, duration]);

  /**
   * Cancela polling ativo
   */
  const cancelPolling = useCallback((paymentId?: string) => {
    if (paymentId) {
      pollingService.cancelPolling(paymentId);
      if (activePaymentIdRef.current === paymentId) {
        setIsPolling(false);
        activePaymentIdRef.current = null;
      }
    } else if (activePaymentIdRef.current) {
      pollingService.cancelPolling(activePaymentIdRef.current);
      setIsPolling(false);
      activePaymentIdRef.current = null;
    }
  }, []);

  /**
   * Verifica se há polling ativo para um pagamento
   */
  const isPollingActive = useCallback((paymentId: string): boolean => {
    return pollingService.isPollingActive(paymentId);
  }, []);

  // Cleanup automático ao desmontar componente
  useEffect(() => {
    return () => {
      if (autoCleanup && activePaymentIdRef.current) {
        pollingService.cancelPolling(activePaymentIdRef.current);
      }
    };
  }, [autoCleanup]);

  return {
    isPolling,
    currentStatus,
    result,
    attempts,
    duration,
    startPolling,
    cancelPolling,
    isPollingActive
  };
};

export default usePollingService;