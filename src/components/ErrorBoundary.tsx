import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, RefreshCw, Home, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { errorHandlingService } from '@/services/ErrorHandlingService';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  componentName?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorId?: string;
  retryCount: number;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    retryCount: 0
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log detalhado usando o serviço de error handling
    const errorId = errorHandlingService.logError(
      error,
      {
        component: this.props.componentName || 'ErrorBoundary',
        action: 'component_render',
        additionalData: {
          componentStack: errorInfo.componentStack,
          retryCount: this.state.retryCount
        }
      },
      this.state.retryCount > 2 ? 'critical' : 'high'
    );

    this.setState({ errorId });
    
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  private handleRetry = () => {
    this.setState(prevState => ({ 
      hasError: false, 
      error: undefined, 
      errorId: undefined,
      retryCount: prevState.retryCount + 1
    }));
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  private handleGoBack = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      this.handleGoHome();
    }
  };

  public render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const recoveryStrategy = errorHandlingService.getRecoveryStrategy(this.state.error);
      const hasSystemicIssue = errorHandlingService.hasSystemicIssue();

      return (
        <div className="min-h-[200px] flex items-center justify-center p-4">
          <Alert className="max-w-md">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>
              {hasSystemicIssue ? 'Problema do Sistema Detectado' : 'Erro no Carregamento'}
            </AlertTitle>
            <AlertDescription className="mt-2">
              <p className="mb-4">
                {hasSystemicIssue 
                  ? 'Detectamos múltiplos erros recentes. O sistema pode estar instável.'
                  : 'Ocorreu um erro ao carregar esta seção. Isso pode ser temporário.'
                }
              </p>
              
              {this.state.retryCount > 2 && (
                <p className="mb-4 text-amber-600 text-sm">
                  ⚠️ Múltiplas tentativas falharam. Considere navegar para outra página.
                </p>
              )}

              <div className="flex flex-wrap gap-2">
                {this.state.retryCount < 3 && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={this.handleRetry}
                    className="flex items-center gap-2"
                  >
                    <RefreshCw className="h-3 w-3" />
                    Tentar Novamente
                  </Button>
                )}
                
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={this.handleGoBack}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="h-3 w-3" />
                  Voltar
                </Button>
                
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={this.handleGoHome}
                  className="flex items-center gap-2"
                >
                  <Home className="h-3 w-3" />
                  Início
                </Button>
              </div>

              {this.state.errorId && (
                <p className="mt-3 text-xs text-gray-500">
                  ID do erro: {this.state.errorId}
                </p>
              )}

              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mt-4 text-xs">
                  <summary className="cursor-pointer text-gray-600">
                    Detalhes do erro (desenvolvimento)
                  </summary>
                  <pre className="mt-2 p-2 bg-gray-100 rounded text-red-600 overflow-auto max-h-32">
                    {this.state.error.message}
                    {this.state.error.stack}
                  </pre>
                </details>
              )}
            </AlertDescription>
          </Alert>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

// Hook para usar com componentes funcionais
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode,
  componentName?: string
) => {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary fallback={fallback} componentName={componentName}>
      <Component {...props} />
    </ErrorBoundary>
  );
  
  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
};