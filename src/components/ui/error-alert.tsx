import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, XCircle, RefreshCw } from 'lucide-react';
import { mapErrorToMessage } from '@/utils/errorMessages';

interface ErrorAlertProps {
  error: any;
  onRetry?: () => void;
  onDismiss?: () => void;
}

export function ErrorAlert({ error, onRetry, onDismiss }: ErrorAlertProps) {
  if (!error) return null;

  const errorInfo = mapErrorToMessage(error);

  return (
    <Alert variant="destructive" className="mb-4">
      <div className="flex items-start gap-3">
        <XCircle className="h-5 w-5 mt-0.5" />
        <div className="flex-1">
          <AlertTitle className="mb-2">Erro ao processar</AlertTitle>
          <AlertDescription className="text-sm">
            {errorInfo.message}
          </AlertDescription>
          
          {errorInfo.retryable && (
            <p className="text-xs mt-2 opacity-80">
              Este erro é temporário. Você pode tentar novamente.
            </p>
          )}
        </div>
      </div>

      <div className="flex gap-2 mt-4">
        {errorInfo.retryable && onRetry && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Tentar Novamente
          </Button>
        )}
        
        {onDismiss && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onDismiss}
          >
            Fechar
          </Button>
        )}
      </div>
    </Alert>
  );
}
