import { toast } from 'sonner';

// Tipos de erro
export enum ErrorType {
  NETWORK = 'NETWORK',
  VALIDATION = 'VALIDATION',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  SERVER = 'SERVER',
  CLIENT = 'CLIENT',
  UNKNOWN = 'UNKNOWN'
}

// Interface para erros estruturados
export interface AppError {
  type: ErrorType;
  message: string;
  originalError?: any;
  code?: string;
  details?: Record<string, any>;
  timestamp: Date;
  retryable: boolean;
}

// Códigos de erro específicos do Supabase
const SUPABASE_ERROR_CODES = {
  '23505': 'Dados duplicados',
  '23503': 'Referência inválida',
  '42501': 'Permissão negada',
  '42P01': 'Tabela não encontrada',
  'PGRST116': 'Linha não encontrada',
  'PGRST301': 'Dados inválidos'
};

// Função para classificar erros
export const classifyError = (error: any): AppError => {
  const timestamp = new Date();
  
  // Erro de rede
  if (!navigator.onLine) {
    return {
      type: ErrorType.NETWORK,
      message: 'Sem conexão com a internet. Verifique sua conexão e tente novamente.',
      originalError: error,
      timestamp,
      retryable: true
    };
  }
  
  // Erros do Supabase
  if (error?.code) {
    const supabaseMessage = SUPABASE_ERROR_CODES[error.code as keyof typeof SUPABASE_ERROR_CODES];
    
    if (supabaseMessage) {
      return {
        type: ErrorType.SERVER,
        message: supabaseMessage,
        originalError: error,
        code: error.code,
        timestamp,
        retryable: false
      };
    }
  }
  
  // Erros de autenticação
  if (error?.message?.includes('auth') || error?.status === 401) {
    return {
      type: ErrorType.AUTHENTICATION,
      message: 'Sessão expirada. Faça login novamente.',
      originalError: error,
      timestamp,
      retryable: false
    };
  }
  
  // Erros de autorização
  if (error?.status === 403) {
    return {
      type: ErrorType.AUTHORIZATION,
      message: 'Você não tem permissão para realizar esta ação.',
      originalError: error,
      timestamp,
      retryable: false
    };
  }
  
  // Erros de validação
  if (error?.message?.includes('validação') || error?.message?.includes('validation')) {
    return {
      type: ErrorType.VALIDATION,
      message: error.message,
      originalError: error,
      timestamp,
      retryable: false
    };
  }
  
  // Erros de rede/timeout
  if (error?.name === 'NetworkError' || error?.code === 'NETWORK_ERROR' || error?.message?.includes('fetch')) {
    return {
      type: ErrorType.NETWORK,
      message: 'Erro de conexão. Verifique sua internet e tente novamente.',
      originalError: error,
      timestamp,
      retryable: true
    };
  }
  
  // Erros do servidor (5xx)
  if (error?.status >= 500) {
    return {
      type: ErrorType.SERVER,
      message: 'Erro interno do servidor. Tente novamente em alguns minutos.',
      originalError: error,
      timestamp,
      retryable: true
    };
  }
  
  // Erros do cliente (4xx)
  if (error?.status >= 400 && error?.status < 500) {
    return {
      type: ErrorType.CLIENT,
      message: error?.message || 'Erro na solicitação. Verifique os dados e tente novamente.',
      originalError: error,
      timestamp,
      retryable: false
    };
  }
  
  // Erro desconhecido
  return {
    type: ErrorType.UNKNOWN,
    message: error?.message || 'Erro inesperado. Tente novamente.',
    originalError: error,
    timestamp,
    retryable: true
  };
};

// Função para exibir erros ao usuário
export const displayError = (error: AppError, options?: {
  showToast?: boolean;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}) => {
  const { showToast = true, duration = 5000, action } = options || {};
  
  if (showToast) {
    toast.error(error.message, {
      duration,
      action: action ? {
        label: action.label,
        onClick: action.onClick
      } : undefined
    });
  }
  
  // Log para debugging
  console.error('App Error:', {
    type: error.type,
    message: error.message,
    code: error.code,
    timestamp: error.timestamp,
    retryable: error.retryable,
    originalError: error.originalError
  });
};

// Hook para tratamento de erros
export const useErrorHandler = () => {
  const handleError = (error: any, options?: {
    showToast?: boolean;
    customMessage?: string;
    onRetry?: () => void;
  }) => {
    const appError = classifyError(error);
    
    if (options?.customMessage) {
      appError.message = options.customMessage;
    }
    
    const displayOptions = {
      showToast: options?.showToast,
      action: appError.retryable && options?.onRetry ? {
        label: 'Tentar Novamente',
        onClick: options.onRetry
      } : undefined
    };
    
    displayError(appError, displayOptions);
    
    return appError;
  };
  
  return { handleError };
};

// Função para retry automático
export const withRetry = async <T>(
  fn: () => Promise<T>,
  options: {
    maxAttempts?: number;
    delay?: number;
    backoff?: boolean;
    retryCondition?: (error: any) => boolean;
  } = {}
): Promise<T> => {
  const {
    maxAttempts = 3,
    delay = 1000,
    backoff = true,
    retryCondition = (error) => classifyError(error).retryable
  } = options;
  
  let lastError: any;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      // Se não deve tentar novamente ou é a última tentativa
      if (!retryCondition(error) || attempt === maxAttempts) {
        throw error;
      }
      
      // Calcular delay com backoff exponencial
      const currentDelay = backoff ? delay * Math.pow(2, attempt - 1) : delay;
      
      console.warn(`Tentativa ${attempt} falhou, tentando novamente em ${currentDelay}ms...`, error);
      
      await new Promise(resolve => setTimeout(resolve, currentDelay));
    }
  }
  
  throw lastError;
};

// Wrapper para operações com retry automático
export const withAutoRetry = <T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  retryOptions?: Parameters<typeof withRetry>[1]
) => {
  return (...args: T): Promise<R> => {
    return withRetry(() => fn(...args), retryOptions);
  };
};

// Função para detectar se está offline
export const isOffline = (): boolean => {
  return !navigator.onLine;
};

// Função para aguardar conexão
export const waitForConnection = (timeout = 30000): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (navigator.onLine) {
      resolve();
      return;
    }
    
    const timeoutId = setTimeout(() => {
      window.removeEventListener('online', onOnline);
      reject(new Error('Timeout aguardando conexão'));
    }, timeout);
    
    const onOnline = () => {
      clearTimeout(timeoutId);
      window.removeEventListener('online', onOnline);
      resolve();
    };
    
    window.addEventListener('online', onOnline);
  });
};

// Função para operações offline-first
export const withOfflineSupport = async <T>(
  onlineOperation: () => Promise<T>,
  offlineOperation?: () => Promise<T> | T,
  options?: {
    waitForConnection?: boolean;
    timeout?: number;
  }
): Promise<T> => {
  const { waitForConnection: shouldWait = false, timeout = 10000 } = options || {};
  
  if (isOffline()) {
    if (offlineOperation) {
      console.log('Executando operação offline...');
      return await Promise.resolve(offlineOperation());
    } else if (shouldWait) {
      console.log('Aguardando conexão...');
      await waitForConnection(timeout);
      return await onlineOperation();
    } else {
      throw new Error('Operação requer conexão com a internet');
    }
  }
  
  try {
    return await onlineOperation();
  } catch (error) {
    const appError = classifyError(error);
    
    if (appError.type === ErrorType.NETWORK && offlineOperation) {
      console.log('Fallback para operação offline devido a erro de rede...');
      return await Promise.resolve(offlineOperation());
    }
    
    throw error;
  }
};

// Logger de erros para debugging
export const logError = (error: AppError, context?: Record<string, any>) => {
  const logData = {
    ...error,
    context,
    userAgent: navigator.userAgent,
    url: window.location.href,
    timestamp: error.timestamp.toISOString()
  };
  
  // Em produção, enviar para serviço de logging
  if (process.env.NODE_ENV === 'production') {
    // Implementar envio para serviço de logging (ex: Sentry, LogRocket)
    console.error('Production Error:', logData);
  } else {
    console.error('Development Error:', logData);
  }
};

// Função para criar mensagens de erro contextuais
export const createContextualError = (
  baseError: any,
  context: {
    operation: string;
    resource?: string;
    userMessage?: string;
  }
): AppError => {
  const appError = classifyError(baseError);
  
  if (context.userMessage) {
    appError.message = context.userMessage;
  } else {
    // Criar mensagem contextual baseada na operação
    switch (context.operation) {
      case 'save':
        appError.message = `Erro ao salvar ${context.resource || 'dados'}. ${appError.message}`;
        break;
      case 'load':
        appError.message = `Erro ao carregar ${context.resource || 'dados'}. ${appError.message}`;
        break;
      case 'delete':
        appError.message = `Erro ao excluir ${context.resource || 'item'}. ${appError.message}`;
        break;
      case 'update':
        appError.message = `Erro ao atualizar ${context.resource || 'dados'}. ${appError.message}`;
        break;
      default:
        appError.message = `Erro na operação "${context.operation}". ${appError.message}`;
    }
  }
  
  appError.details = {
    ...appError.details,
    operation: context.operation,
    resource: context.resource
  };
  
  return appError;
};