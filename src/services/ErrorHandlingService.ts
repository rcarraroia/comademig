/**
 * Serviço centralizado para tratamento de erros
 * Implementa logging detalhado, categorização de erros e recuperação
 */

export interface ErrorContext {
  component?: string;
  action?: string;
  userId?: string;
  timestamp: Date;
  userAgent: string;
  url: string;
  additionalData?: Record<string, any>;
}

export interface ErrorReport {
  id: string;
  error: Error;
  context: ErrorContext;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'ui' | 'api' | 'auth' | 'payment' | 'navigation' | 'unknown';
}

class ErrorHandlingService {
  private errorQueue: ErrorReport[] = [];
  private maxQueueSize = 50;

  /**
   * Registra um erro com contexto detalhado
   */
  public logError(
    error: Error, 
    context: Partial<ErrorContext> = {},
    severity: ErrorReport['severity'] = 'medium'
  ): string {
    const errorId = this.generateErrorId();
    
    const fullContext: ErrorContext = {
      timestamp: new Date(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      ...context
    };

    const errorReport: ErrorReport = {
      id: errorId,
      error,
      context: fullContext,
      severity,
      category: this.categorizeError(error)
    };

    // Adicionar à fila de erros
    this.addToQueue(errorReport);

    // Log no console para desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      console.group(`🚨 Error [${severity.toUpperCase()}] - ${errorId}`);
      console.error('Error:', error);
      console.log('Context:', fullContext);
      console.log('Category:', errorReport.category);
      console.groupEnd();
    }

    // Log para produção (pode ser enviado para serviço externo)
    if (process.env.NODE_ENV === 'production' && severity === 'critical') {
      this.sendToExternalService(errorReport);
    }

    return errorId;
  }

  /**
   * Categoriza o erro baseado na mensagem e stack trace
   */
  private categorizeError(error: Error): ErrorReport['category'] {
    const message = error.message.toLowerCase();
    const stack = error.stack?.toLowerCase() || '';

    if (message.includes('network') || message.includes('fetch') || message.includes('api')) {
      return 'api';
    }
    
    if (message.includes('auth') || message.includes('token') || message.includes('permission')) {
      return 'auth';
    }
    
    if (message.includes('payment') || message.includes('checkout') || message.includes('asaas')) {
      return 'payment';
    }
    
    if (message.includes('navigate') || message.includes('route') || stack.includes('router')) {
      return 'navigation';
    }
    
    if (stack.includes('component') || message.includes('render')) {
      return 'ui';
    }

    return 'unknown';
  }

  /**
   * Adiciona erro à fila, mantendo tamanho máximo
   */
  private addToQueue(errorReport: ErrorReport): void {
    this.errorQueue.unshift(errorReport);
    
    if (this.errorQueue.length > this.maxQueueSize) {
      this.errorQueue = this.errorQueue.slice(0, this.maxQueueSize);
    }
  }

  /**
   * Gera ID único para o erro
   */
  private generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Envia erro crítico para serviço externo (implementar conforme necessário)
   */
  private sendToExternalService(errorReport: ErrorReport): void {
    // Implementar integração com serviço de monitoramento
    // Ex: Sentry, LogRocket, etc.
    console.warn('Critical error detected - should be sent to external service:', errorReport.id);
  }

  /**
   * Retorna erros recentes para debugging
   */
  public getRecentErrors(limit: number = 10): ErrorReport[] {
    return this.errorQueue.slice(0, limit);
  }

  /**
   * Limpa a fila de erros
   */
  public clearErrorQueue(): void {
    this.errorQueue = [];
  }

  /**
   * Verifica se há muitos erros recentes (possível problema sistêmico)
   */
  public hasSystemicIssue(): boolean {
    const recentErrors = this.errorQueue.filter(
      error => Date.now() - error.context.timestamp.getTime() < 5 * 60 * 1000 // 5 minutos
    );
    
    return recentErrors.length > 5;
  }

  /**
   * Estratégias de recuperação baseadas no tipo de erro
   */
  public getRecoveryStrategy(error: Error): {
    canRecover: boolean;
    strategy: string;
    action?: () => void;
  } {
    const category = this.categorizeError(error);
    
    switch (category) {
      case 'api':
        return {
          canRecover: true,
          strategy: 'retry_request',
          action: () => window.location.reload()
        };
      
      case 'auth':
        return {
          canRecover: true,
          strategy: 'redirect_to_login',
          action: () => {
            localStorage.clear();
            window.location.href = '/auth';
          }
        };
      
      case 'payment':
        return {
          canRecover: true,
          strategy: 'redirect_to_dashboard',
          action: () => window.location.href = '/dashboard'
        };
      
      case 'navigation':
        return {
          canRecover: true,
          strategy: 'go_back',
          action: () => window.history.back()
        };
      
      default:
        return {
          canRecover: true,
          strategy: 'reload_page',
          action: () => window.location.reload()
        };
    }
  }
}

// Instância singleton
export const errorHandlingService = new ErrorHandlingService();

// Hook para usar em componentes React
export const useErrorHandler = () => {
  const logError = (
    error: Error, 
    context?: Partial<ErrorContext>,
    severity?: ErrorReport['severity']
  ) => {
    return errorHandlingService.logError(error, context, severity);
  };

  const getRecoveryStrategy = (error: Error) => {
    return errorHandlingService.getRecoveryStrategy(error);
  };

  return {
    logError,
    getRecoveryStrategy,
    hasSystemicIssue: errorHandlingService.hasSystemicIssue(),
    recentErrors: errorHandlingService.getRecentErrors()
  };
};