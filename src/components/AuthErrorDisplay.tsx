import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Componente para exibir erros de autenticação usando error states
 * ao invés de try-catch, seguindo as melhores práticas do React
 */
const AuthErrorDisplay: React.FC = () => {
  const { error, clearError } = useAuth();

  if (!error) return null;

  return (
    <Alert variant="destructive" className="mb-4">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Erro de Autenticação</AlertTitle>
      <AlertDescription className="flex items-center justify-between">
        <span>{error.message}</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={clearError}
          className="ml-2 h-auto p-1"
        >
          <X className="h-3 w-3" />
        </Button>
      </AlertDescription>
    </Alert>
  );
};

export default AuthErrorDisplay;