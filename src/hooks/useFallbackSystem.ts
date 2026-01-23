import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { 
  fallbackSystem, 
  PendingSubscriptionData, 
  PendingCompletionData, 
  RetryResult, 
  FallbackStats 
} from '@/lib/services/FallbackSystem';

export interface UseFallbackSystemOptions {
  onRetrySuccess?: (results: RetryResult[]) => void;
  onRetryError?: (error: string) => void;
  onManualSuccess?: (itemId: string) => void;
  onManualError?: (itemId: string, error: string) => void;
}

export interface UseFallbackSystemReturn {
  isProcessing: boolean;
  stats: FallbackStats | null;
  storePendingSubscription: (data: PendingSubscriptionData) => Promise<string>;
  storePendingCompletion: (data: PendingCompletionData) => Promise<string>;
  retryPendingSubscriptions: () => Promise<RetryResult[]>;
  retryPendingCompletions: () => Promise<RetryResult[]>;
  manuallyCompletePendingSubscription: (itemId: string) => Promise<RetryResult>;
  manuallyCompletePendingCompletion: (itemId: string) => Promise<RetryResult>;
  refreshStats: () => Promise<void>;
}

/**
 * Hook para usar o FallbackSystem de forma reativa
 * Implementa as especificações do Requirement 4
 */
export const useFallbackSystem = (options: UseFallbackSystemOptions = {}): UseFallbackSystemReturn => {
  const {
    onRetrySuccess,
    onRetryError,
    onManualSuccess,
    onManualError
  } = options;

  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [stats, setStats] = useState<FallbackStats | null>(null);

  /**
   * Armazenar pending subscription
   */
  const storePendingSubscription = useCallback(async (data: PendingSubscriptionData): Promise<string> => {
    try {
      console.log('Armazenando pending subscription via hook...');
      
      const id = await fallbackSystem.storePendingSubscription(data);
      
      toast({
        title: "Dados Salvos",
        description: "Processo será retomado automaticamente em breve.",
        variant: "default"
      });

      // Atualizar estatísticas
      await refreshStats();

      return id;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      
      console.error('Erro ao armazenar pending subscription:', error);
      
      toast({
        title: "Erro ao Salvar",
        description: errorMessage,
        variant: "destructive"
      });

      throw error;
    }
  }, [toast]);

  /**
   * Armazenar pending completion
   */
  const storePendingCompletion = useCallback(async (data: PendingCompletionData): Promise<string> => {
    try {
      console.log('Armazenando pending completion via hook...');
      
      const id = await fallbackSystem.storePendingCompletion(data);
      
      toast({
        title: "Dados Salvos",
        description: "Conta será criada automaticamente em breve.",
        variant: "default"
      });

      // Atualizar estatísticas
      await refreshStats();

      return id;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      
      console.error('Erro ao armazenar pending completion:', error);
      
      toast({
        title: "Erro ao Salvar",
        description: errorMessage,
        variant: "destructive"
      });

      throw error;
    }
  }, [toast]);

  /**
   * Tentar processar pending subscriptions automaticamente
   */
  const retryPendingSubscriptions = useCallback(async (): Promise<RetryResult[]> => {
    setIsProcessing(true);
    
    try {
      console.log('Iniciando retry de pending subscriptions via hook...');
      
      const results = await fallbackSystem.retryPendingSubscriptions();
      
      const successCount = results.filter(r => r.success).length;
      const failureCount = results.filter(r => !r.success).length;
      
      if (successCount > 0) {
        toast({
          title: "Processamento Concluído",
          description: `${successCount} processo(s) completado(s) com sucesso.`,
          variant: "default"
        });
      }
      
      if (failureCount > 0) {
        toast({
          title: "Alguns Processos Falharam",
          description: `${failureCount} processo(s) precisam de intervenção manual.`,
          variant: "destructive"
        });
      }

      // Atualizar estatísticas
      await refreshStats();

      if (onRetrySuccess) {
        onRetrySuccess(results);
      }

      return results;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      
      console.error('Erro no retry de pending subscriptions:', error);
      
      toast({
        title: "Erro no Processamento",
        description: errorMessage,
        variant: "destructive"
      });

      if (onRetryError) {
        onRetryError(errorMessage);
      }

      return [];

    } finally {
      setIsProcessing(false);
    }
  }, [toast, onRetrySuccess, onRetryError]);

  /**
   * Tentar processar pending completions automaticamente
   */
  const retryPendingCompletions = useCallback(async (): Promise<RetryResult[]> => {
    setIsProcessing(true);
    
    try {
      console.log('Iniciando retry de pending completions via hook...');
      
      const results = await fallbackSystem.retryPendingCompletions();
      
      const successCount = results.filter(r => r.success).length;
      const failureCount = results.filter(r => !r.success).length;
      
      if (successCount > 0) {
        toast({
          title: "Contas Criadas",
          description: `${successCount} conta(s) criada(s) com sucesso.`,
          variant: "default"
        });
      }
      
      if (failureCount > 0) {
        toast({
          title: "Algumas Contas Falharam",
          description: `${failureCount} conta(s) precisam de intervenção manual.`,
          variant: "destructive"
        });
      }

      // Atualizar estatísticas
      await refreshStats();

      if (onRetrySuccess) {
        onRetrySuccess(results);
      }

      return results;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      
      console.error('Erro no retry de pending completions:', error);
      
      toast({
        title: "Erro no Processamento",
        description: errorMessage,
        variant: "destructive"
      });

      if (onRetryError) {
        onRetryError(errorMessage);
      }

      return [];

    } finally {
      setIsProcessing(false);
    }
  }, [toast, onRetrySuccess, onRetryError]);

  /**
   * Completar pending subscription manualmente
   */
  const manuallyCompletePendingSubscription = useCallback(async (itemId: string): Promise<RetryResult> => {
    setIsProcessing(true);
    
    try {
      console.log('Completando pending subscription manualmente via hook:', itemId);
      
      const result = await fallbackSystem.manuallyCompletePendingSubscription(itemId);
      
      if (result.success) {
        toast({
          title: "Processo Concluído",
          description: "Assinatura completada manualmente com sucesso.",
          variant: "default"
        });

        if (onManualSuccess) {
          onManualSuccess(itemId);
        }
      } else {
        toast({
          title: "Falha no Processo",
          description: result.error || "Erro desconhecido",
          variant: "destructive"
        });

        if (onManualError) {
          onManualError(itemId, result.error || "Erro desconhecido");
        }
      }

      // Atualizar estatísticas
      await refreshStats();

      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      
      console.error('Erro no completamento manual:', error);
      
      toast({
        title: "Erro no Processo Manual",
        description: errorMessage,
        variant: "destructive"
      });

      if (onManualError) {
        onManualError(itemId, errorMessage);
      }

      return {
        success: false,
        error: errorMessage
      };

    } finally {
      setIsProcessing(false);
    }
  }, [toast, onManualSuccess, onManualError]);

  /**
   * Completar pending completion manualmente
   */
  const manuallyCompletePendingCompletion = useCallback(async (itemId: string): Promise<RetryResult> => {
    setIsProcessing(true);
    
    try {
      console.log('Completando pending completion manualmente via hook:', itemId);
      
      const result = await fallbackSystem.manuallyCompletePendingCompletion(itemId);
      
      if (result.success) {
        toast({
          title: "Conta Criada",
          description: "Conta criada manualmente com sucesso.",
          variant: "default"
        });

        if (onManualSuccess) {
          onManualSuccess(itemId);
        }
      } else {
        toast({
          title: "Falha na Criação",
          description: result.error || "Erro desconhecido",
          variant: "destructive"
        });

        if (onManualError) {
          onManualError(itemId, result.error || "Erro desconhecido");
        }
      }

      // Atualizar estatísticas
      await refreshStats();

      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      
      console.error('Erro no completamento manual:', error);
      
      toast({
        title: "Erro no Processo Manual",
        description: errorMessage,
        variant: "destructive"
      });

      if (onManualError) {
        onManualError(itemId, errorMessage);
      }

      return {
        success: false,
        error: errorMessage
      };

    } finally {
      setIsProcessing(false);
    }
  }, [toast, onManualSuccess, onManualError]);

  /**
   * Atualizar estatísticas
   */
  const refreshStats = useCallback(async (): Promise<void> => {
    try {
      const newStats = await fallbackSystem.getStats();
      setStats(newStats);
    } catch (error) {
      console.error('Erro ao atualizar estatísticas:', error);
    }
  }, []);

  return {
    isProcessing,
    stats,
    storePendingSubscription,
    storePendingCompletion,
    retryPendingSubscriptions,
    retryPendingCompletions,
    manuallyCompletePendingSubscription,
    manuallyCompletePendingCompletion,
    refreshStats
  };
};

export default useFallbackSystem;