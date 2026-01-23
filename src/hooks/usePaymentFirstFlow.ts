import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { 
  paymentFirstFlowService, 
  RegistrationData, 
  ValidationResult, 
  PaymentFirstFlowResult, 
  ProcessingStep,
  FlowContext
} from '@/lib/services/PaymentFirstFlowService';

export interface UsePaymentFirstFlowOptions {
  onValidationError?: (errors: ValidationResult) => void;
  onStepUpdate?: (step: ProcessingStep) => void;
  onSuccess?: (result: PaymentFirstFlowResult) => void;
  onError?: (error: string) => void;
  onFallbackStored?: (result: PaymentFirstFlowResult) => void;
}

export interface UsePaymentFirstFlowReturn {
  isProcessing: boolean;
  currentStep: ProcessingStep | null;
  allSteps: ProcessingStep[];
  validationErrors: ValidationResult | null;
  result: PaymentFirstFlowResult | null;
  validateData: (data: RegistrationData) => ValidationResult;
  processRegistration: (data: RegistrationData) => Promise<PaymentFirstFlowResult>;
  getFlowStatus: (flowId: string) => FlowContext | null;
  getActiveFlows: () => string[];
  reset: () => void;
}

/**
 * Hook para usar o PaymentFirstFlowService de forma reativa
 * Implementa as especificações do Requirement 1
 */
export const usePaymentFirstFlow = (options: UsePaymentFirstFlowOptions = {}): UsePaymentFirstFlowReturn => {
  const {
    onValidationError,
    onStepUpdate,
    onSuccess,
    onError,
    onFallbackStored
  } = options;

  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState<ProcessingStep | null>(null);
  const [allSteps, setAllSteps] = useState<ProcessingStep[]>([]);
  const [validationErrors, setValidationErrors] = useState<ValidationResult | null>(null);
  const [result, setResult] = useState<PaymentFirstFlowResult | null>(null);

  /**
   * Validar dados de registro
   */
  const validateData = useCallback((data: RegistrationData): ValidationResult => {
    console.log('Validando dados de registro...');
    
    const validation = paymentFirstFlowService.validateRegistrationData(data);
    
    setValidationErrors(validation);
    
    if (!validation.isValid) {
      console.warn('Dados inválidos:', validation.errors);
      
      toast({
        title: "Dados Inválidos",
        description: `${validation.errors.length} erro(s) encontrado(s). Verifique os campos destacados.`,
        variant: "destructive"
      });

      if (onValidationError) {
        onValidationError(validation);
      }
    } else {
      console.log('Dados validados com sucesso');
      
      toast({
        title: "Dados Válidos",
        description: "Todos os dados foram validados com sucesso.",
        variant: "default"
      });
    }

    return validation;
  }, [toast, onValidationError]);

  /**
   * Processar registro completo
   */
  const processRegistration = useCallback(async (data: RegistrationData): Promise<PaymentFirstFlowResult> => {
    setIsProcessing(true);
    setCurrentStep(null);
    setAllSteps([]);
    setResult(null);
    setValidationErrors(null);

    try {
      console.log('Iniciando processamento de registro...');
      
      toast({
        title: "Processamento Iniciado",
        description: "Iniciando processo de filiação...",
        variant: "default"
      });

      // Processar registro
      const flowResult = await paymentFirstFlowService.processRegistration(data);
      
      // Atualizar steps
      setAllSteps(flowResult.steps);
      
      if (flowResult.steps.length > 0) {
        const lastStep = flowResult.steps[flowResult.steps.length - 1];
        setCurrentStep(lastStep);
        
        if (onStepUpdate) {
          onStepUpdate(lastStep);
        }
      }

      setResult(flowResult);

      if (flowResult.success) {
        console.log('Registro processado com sucesso:', flowResult);
        
        toast({
          title: "Filiação Concluída!",
          description: "Sua conta foi criada com sucesso. Bem-vindo ao COMADEMIG!",
          variant: "default"
        });

        if (onSuccess) {
          onSuccess(flowResult);
        }
      } else {
        console.error('Falha no processamento:', flowResult.error);
        
        if (flowResult.fallback_stored) {
          // Processo foi armazenado no fallback system
          toast({
            title: "Processamento em Andamento",
            description: flowResult.requires_manual_intervention 
              ? "Seu pagamento foi processado. A conta será criada em breve."
              : "Processo será retomado automaticamente em alguns minutos.",
            variant: "default"
          });

          if (onFallbackStored) {
            onFallbackStored(flowResult);
          }
        } else {
          // Erro definitivo
          toast({
            title: "Erro no Processamento",
            description: flowResult.error || "Erro desconhecido no processamento",
            variant: "destructive"
          });

          if (onError) {
            onError(flowResult.error || "Erro desconhecido");
          }
        }
      }

      return flowResult;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      
      console.error('Erro no processamento de registro:', error);
      
      const failedResult: PaymentFirstFlowResult = {
        success: false,
        steps: allSteps,
        error: errorMessage
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

    } finally {
      setIsProcessing(false);
    }
  }, [toast, onStepUpdate, onSuccess, onError, onFallbackStored, allSteps]);

  /**
   * Obter status de um fluxo específico
   */
  const getFlowStatus = useCallback((flowId: string): FlowContext | null => {
    return paymentFirstFlowService.getFlowStatus(flowId);
  }, []);

  /**
   * Obter lista de fluxos ativos
   */
  const getActiveFlows = useCallback((): string[] => {
    return paymentFirstFlowService.getActiveFlows();
  }, []);

  /**
   * Resetar estado do hook
   */
  const reset = useCallback((): void => {
    setIsProcessing(false);
    setCurrentStep(null);
    setAllSteps([]);
    setValidationErrors(null);
    setResult(null);
  }, []);

  return {
    isProcessing,
    currentStep,
    allSteps,
    validationErrors,
    result,
    validateData,
    processRegistration,
    getFlowStatus,
    getActiveFlows,
    reset
  };
};

export default usePaymentFirstFlow;