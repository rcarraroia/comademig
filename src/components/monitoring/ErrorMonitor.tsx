import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, RefreshCw, Trash2, Eye } from 'lucide-react';
import { errorHandlingService, ErrorReport } from '@/services/ErrorHandlingService';

interface ErrorMonitorProps {
  className?: string;
}

export const ErrorMonitor: React.FC<ErrorMonitorProps> = ({ className }) => {
  const [errors, setErrors] = useState<ErrorReport[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasSystemicIssue, setHasSystemicIssue] = useState(false);

  useEffect(() => {
    const updateErrors = () => {
      const recentErrors = errorHandlingService.getRecentErrors(20);
      setErrors(recentErrors);
      setHasSystemicIssue(errorHandlingService.hasSystemicIssue());
    };

    // Atualizar imediatamente
    updateErrors();

    // Atualizar a cada 30 segundos
    const interval = setInterval(updateErrors, 30000);

    return () => clearInterval(interval);
  }, []);

  const handleClearErrors = () => {
    errorHandlingService.clearErrorQueue();
    setErrors([]);
    setHasSystemicIssue(false);
  };

  const getSeverityColor = (severity: ErrorReport['severity']) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  const getCategoryIcon = (category: ErrorReport['category']) => {
    switch (category) {
      case 'api': return '🌐';
      case 'auth': return '🔐';
      case 'payment': return '💳';
      case 'navigation': return '🧭';
      case 'ui': return '🎨';
      default: return '❓';
    }
  };

  if (errors.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            Monitor de Erros
          </CardTitle>
          <CardDescription>
            Sistema funcionando normalmente - nenhum erro recente detectado
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${hasSystemicIssue ? 'bg-red-500' : 'bg-yellow-500'}`}></div>
            Monitor de Erros
            <Badge variant="secondary">{errors.length}</Badge>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearErrors}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </CardTitle>
        <CardDescription>
          {hasSystemicIssue 
            ? '⚠️ Problema sistêmico detectado - múltiplos erros recentes'
            : `${errors.length} erro(s) recente(s) detectado(s)`
          }
        </CardDescription>
      </CardHeader>

      {hasSystemicIssue && (
        <CardContent className="pt-0">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Alerta:</strong> Detectamos múltiplos erros em um curto período. 
              Isso pode indicar um problema sistêmico que requer atenção imediata.
            </AlertDescription>
          </Alert>
        </CardContent>
      )}

      {isExpanded && (
        <CardContent className="pt-0">
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {errors.map((error) => (
              <div key={error.id} className="border rounded-lg p-3 text-sm">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span>{getCategoryIcon(error.category)}</span>
                    <Badge variant={getSeverityColor(error.severity)}>
                      {error.severity}
                    </Badge>
                    <Badge variant="outline">
                      {error.category}
                    </Badge>
                  </div>
                  <span className="text-xs text-gray-500">
                    {error.context.timestamp.toLocaleTimeString()}
                  </span>
                </div>
                
                <div className="mb-2">
                  <strong className="text-red-600">{error.error.name}:</strong>
                  <span className="ml-1">{error.error.message}</span>
                </div>
                
                {error.context.component && (
                  <div className="text-xs text-gray-600">
                    Componente: {error.context.component}
                  </div>
                )}
                
                {error.context.action && (
                  <div className="text-xs text-gray-600">
                    Ação: {error.context.action}
                  </div>
                )}
                
                <div className="text-xs text-gray-500 mt-1">
                  ID: {error.id}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  );
};

export default ErrorMonitor;