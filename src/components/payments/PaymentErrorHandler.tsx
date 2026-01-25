/**
 * Componente PaymentErrorHandler
 * 
 * Trata erros específicos de pagamento com retry capability
 * Requirements: 5.1, 5.3, 5.4
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  AlertTriangle, 
  CreditCard, 
  RefreshCw, 
  Phone, 
  Mail,
  ExternalLink,
  Info,
  XCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export interface PaymentError {
  code: string;
  message: string;
  type: 'card_declined' | 'insufficient_funds' | 'invalid_card' | 'expired_card' | 
        'network_error' | 'system_error' | 'validation_error' | 'unknown';
  retryable: boolean;
  details?: string;
}

interface PaymentErrorHandlerProps {
  error: PaymentError;
  onRetry: () => void;
  onChangePaymentMethod: () => void;
  onContactSupport: () => void;
  isRetrying?: boolean;
  retryCount?: number;
  maxRetries?: number;
}

export default function PaymentErrorHandler({
  error,
  onRetry,
  onChangePaymentMethod,
  onContactSupport,
  isRetrying = false,
  retryCount = 0,
  maxRetries = 3
}: PaymentErrorHandlerProps) {
  const navigate = useNavigate();
  const [showDetails, setShowDetails] = useState(false);

  const getErrorConfig = (error: PaymentError) => {
    switch (error.type) {
      case 'card_declined':
        return {
          title: 'Cartão Recusado',
          icon: <XCircle className="h-6 w-6 text-red-600" />,
          description: 'Seu cartão foi recusado pela operadora.',
          suggestions: [
            'Verifique se os dados do cartão estão corretos',
            'Confirme se há limite disponível',
            'Entre em contato com seu banco',
            'Tente outro cartão de crédito'
          ],
          actions: ['retry', 'change_card', 'support']
        };

      case 'insufficient_funds':
        return {
          title: 'Limite Insuficiente',
          icon: <CreditCard className="h-6 w-6 text-orange-600" />,
          description: 'Não há limite suficiente no cartão para esta transação.',
          suggestions: [
            'Verifique seu limite disponível',
            'Tente parcelar em mais vezes',
            'Use outro cartão com limite maior',
            'Entre em contato com seu banco'
          ],
          actions: ['change_card', 'support']
        };

      case 'invalid_card':
        return {
          title: 'Dados do Cartão Inválidos',
          icon: <AlertTriangle className="h-6 w-6 text-red-600" />,
          description: 'Os dados informados do cartão são inválidos.',
          suggestions: [
            'Verifique o número do cartão',
            'Confirme a data de validade',
            'Verifique o código de segurança (CVV)',
            'Confirme o nome como está no cartão'
          ],
          actions: ['retry', 'change_card']
        };

      case 'expired_card':
        return {
          title: 'Cartão Vencido',
          icon: <AlertTriangle className="h-6 w-6 text-orange-600" />,
          description: 'O cartão informado está vencido.',
          suggestions: [
            'Verifique a data de validade do cartão',
            'Use um cartão válido',
            'Solicite um novo cartão ao seu banco'
          ],
          actions: ['change_card', 'support']
        };

      case 'network_error':
        return {
          title: 'Erro de Conexão',
          icon: <RefreshCw className="h-6 w-6 text-blue-600" />,
          description: 'Houve um problema de conexão durante o processamento.',
          suggestions: [
            'Verifique sua conexão com a internet',
            'Tente novamente em alguns instantes',
            'Se o problema persistir, entre em contato conosco'
          ],
          actions: ['retry', 'support']
        };

      case 'system_error':
        return {
          title: 'Erro do Sistema',
          icon: <AlertTriangle className="h-6 w-6 text-red-600" />,
          description: 'Ocorreu um erro interno em nosso sistema.',
          suggestions: [
            'Tente novamente em alguns minutos',
            'Se o problema persistir, entre em contato conosco',
            'Nosso suporte técnico será notificado automaticamente'
          ],
          actions: ['retry', 'support']
        };

      default:
        return {
          title: 'Erro no Pagamento',
          icon: <AlertTriangle className="h-6 w-6 text-red-600" />,
          description: error.message || 'Ocorreu um erro inesperado.',
          suggestions: [
            'Tente novamente',
            'Verifique os dados informados',
            'Entre em contato com o suporte se o problema persistir'
          ],
          actions: ['retry', 'support']
        };
    }
  };

  const config = getErrorConfig(error);
  const canRetry = error.retryable && retryCount < maxRetries;

  const handleRetry = () => {
    if (canRetry && !isRetrying) {
      onRetry();
    }
  };

  const handleContactSupport = () => {
    // Preparar dados para o suporte
    const supportData = {
      error_code: error.code,
      error_type: error.type,
      error_message: error.message,
      retry_count: retryCount,
      timestamp: new Date().toISOString()
    };

    // Salvar no localStorage para o suporte acessar
    localStorage.setItem('payment_error_context', JSON.stringify(supportData));
    
    onContactSupport();
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {config.icon}
          {config.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Descrição do erro */}
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            {config.description}
          </AlertDescription>
        </Alert>

        {/* Sugestões de solução */}
        <div>
          <h3 className="font-medium mb-3 flex items-center gap-2">
            <Info className="h-4 w-4 text-blue-600" />
            O que você pode fazer:
          </h3>
          <ul className="space-y-2">
            {config.suggestions.map((suggestion, index) => (
              <li key={index} className="flex items-start gap-2 text-sm">
                <span className="text-blue-600 mt-1">•</span>
                <span>{suggestion}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Detalhes técnicos (opcional) */}
        {error.details && (
          <div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDetails(!showDetails)}
              className="p-0 h-auto text-gray-600 hover:text-gray-800"
            >
              {showDetails ? 'Ocultar' : 'Mostrar'} detalhes técnicos
            </Button>
            
            {showDetails && (
              <div className="mt-2 p-3 bg-gray-50 rounded-md text-sm text-gray-700">
                <p><strong>Código:</strong> {error.code}</p>
                <p><strong>Tipo:</strong> {error.type}</p>
                {error.details && <p><strong>Detalhes:</strong> {error.details}</p>}
                <p><strong>Tentativas:</strong> {retryCount + 1} de {maxRetries + 1}</p>
              </div>
            )}
          </div>
        )}

        {/* Ações disponíveis */}
        <div className="space-y-3">
          {/* Tentar novamente */}
          {config.actions.includes('retry') && canRetry && (
            <Button
              onClick={handleRetry}
              disabled={isRetrying}
              className="w-full"
            >
              {isRetrying ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Tentando novamente...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Tentar Novamente ({maxRetries - retryCount} tentativas restantes)
                </>
              )}
            </Button>
          )}

          {/* Alterar método de pagamento */}
          {config.actions.includes('change_card') && (
            <Button
              variant="outline"
              onClick={onChangePaymentMethod}
              className="w-full"
            >
              <CreditCard className="h-4 w-4 mr-2" />
              Alterar Dados do Cartão
            </Button>
          )}

          {/* Contatar suporte */}
          {config.actions.includes('support') && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Button
                variant="outline"
                onClick={handleContactSupport}
                className="w-full"
              >
                <Mail className="h-4 w-4 mr-2" />
                Abrir Chamado
              </Button>
              
              <Button
                variant="outline"
                onClick={() => window.open('tel:+5531999999999', '_self')}
                className="w-full"
              >
                <Phone className="h-4 w-4 mr-2" />
                Ligar para Suporte
              </Button>
            </div>
          )}

          {/* Voltar para filiação */}
          <Button
            variant="ghost"
            onClick={() => navigate('/filiacao')}
            className="w-full"
          >
            Voltar para Filiação
          </Button>
        </div>

        {/* Informações de contato */}
        <div className="pt-4 border-t border-gray-200">
          <div className="text-center space-y-2">
            <p className="text-sm text-gray-600">
              Precisa de ajuda? Nossa equipe está pronta para ajudar:
            </p>
            <div className="flex justify-center gap-4 text-sm">
              <a 
                href="mailto:suporte@comademig.org.br"
                className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                <Mail className="h-3 w-3" />
                suporte@comademig.org.br
              </a>
              <a 
                href="tel:+5531999999999"
                className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                <Phone className="h-3 w-3" />
                (31) 99999-9999
              </a>
            </div>
          </div>
        </div>

        {/* Aviso sobre tentativas esgotadas */}
        {!canRetry && error.retryable && (
          <Alert className="border-orange-200 bg-orange-50">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              <strong>Tentativas esgotadas.</strong> Entre em contato com o suporte 
              ou tente alterar os dados do cartão.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}

// Função utilitária para mapear erros do Asaas para PaymentError
export const mapAsaasErrorToPaymentError = (asaasError: any): PaymentError => {
  const errorCode = asaasError?.code || 'unknown';
  const errorMessage = asaasError?.message || 'Erro desconhecido';

  // Mapear códigos específicos do Asaas
  switch (errorCode) {
    case 'card_declined':
    case 'CARD_DECLINED':
      return {
        code: errorCode,
        message: 'Cartão recusado pela operadora',
        type: 'card_declined',
        retryable: true,
        details: errorMessage
      };

    case 'insufficient_funds':
    case 'INSUFFICIENT_FUNDS':
      return {
        code: errorCode,
        message: 'Limite insuficiente no cartão',
        type: 'insufficient_funds',
        retryable: false,
        details: errorMessage
      };

    case 'invalid_card_number':
    case 'invalid_expiry_date':
    case 'invalid_cvv':
    case 'INVALID_CARD':
      return {
        code: errorCode,
        message: 'Dados do cartão inválidos',
        type: 'invalid_card',
        retryable: true,
        details: errorMessage
      };

    case 'expired_card':
    case 'EXPIRED_CARD':
      return {
        code: errorCode,
        message: 'Cartão vencido',
        type: 'expired_card',
        retryable: false,
        details: errorMessage
      };

    case 'network_error':
    case 'timeout':
      return {
        code: errorCode,
        message: 'Erro de conexão',
        type: 'network_error',
        retryable: true,
        details: errorMessage
      };

    case 'internal_error':
    case 'system_error':
      return {
        code: errorCode,
        message: 'Erro interno do sistema',
        type: 'system_error',
        retryable: true,
        details: errorMessage
      };

    default:
      return {
        code: errorCode,
        message: errorMessage,
        type: 'unknown',
        retryable: true,
        details: errorMessage
      };
  }
};