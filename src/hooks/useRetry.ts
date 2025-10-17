import { useState, useCallback } from 'react';
import { isRetryableError } from '@/utils/errorMessages';

interface RetryOptions {
  maxAttempts?: number;
  delayMs?: number;
  backoffMultiplier?: number;
  onRetry?: (attempt: number, error: any) => void;
}

interface RetryState {
  isRetrying: boolean;
  attempt: number;
  lastError: any;
}

/**
 * Hook para implementar retry automático com backoff exponencial
 */
export function useRetry<T>(
  asyncFunction: () => Promise<T>,
  options: RetryOptions = {}
) {
  const {
    maxAttempts = 3,
    delayMs = 1000,
    backoffMultiplier = 2,
    onRetry
  } = options;

  const [retryState, setRetryState] = useState<RetryState>({
    isRetrying: false,
    attempt: 0,
    lastError: null
  });

  const executeWithRetry = useCallback(async (): Promise<T> => {
    let currentAttempt = 0;
    let currentDelay = delayMs;

    while (currentAttempt < maxAttempts) {
      try {
        setRetryState({
          isRetrying: currentAttempt > 0,
          attempt: currentAttempt + 1,
          lastError: null
        });

        const result = await asyncFunction();
        
        // Sucesso - resetar estado
        setRetryState({
          isRetrying: false,
          attempt: 0,
          lastError: null
        });

        return result;

      } catch (error) {
        currentAttempt++;
        
        console.log(`❌ Tentativa ${currentAttempt}/${maxAttempts} falhou:`, error);

        // Verificar se erro é retryable
        if (!isRetryableError(error)) {
          console.log('⚠️ Erro não é retryable, abortando tentativas');
          setRetryState({
            isRetrying: false,
            attempt: currentAttempt,
            lastError: error
          });
          throw error;
        }

        // Se foi a última tentativa, lançar erro
        if (currentAttempt >= maxAttempts) {
          console.log('⚠️ Máximo de tentativas atingido');
          setRetryState({
            isRetrying: false,
            attempt: currentAttempt,
            lastError: error
          });
          throw error;
        }

        // Notificar callback de retry
        if (onRetry) {
          onRetry(currentAttempt, error);
        }

        // Aguardar antes de tentar novamente (backoff exponencial)
        console.log(`⏳ Aguardando ${currentDelay}ms antes da próxima tentativa...`);
        await new Promise(resolve => setTimeout(resolve, currentDelay));
        
        currentDelay *= backoffMultiplier;
      }
    }

    // Nunca deve chegar aqui, mas TypeScript exige
    throw retryState.lastError || new Error('Máximo de tentativas atingido');
  }, [asyncFunction, maxAttempts, delayMs, backoffMultiplier, onRetry]);

  return {
    executeWithRetry,
    ...retryState
  };
}
