import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { AlertCircle, RefreshCw, Home, HelpCircle, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface PaymentError {
  payment_id?: string;
  error_code: string;
  error_message: string;
  retry_available: boolean;
  alternative_methods?: string[];
}

export default function PaymentError() {
  const { paymentId } = useParams<{ paymentId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [errorDetails, setErrorDetails] = useState<PaymentError | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);

  useEffect(() => {
    // Buscar detalhes do erro
    const errorCode = searchParams.get('error') || 'UNKNOWN_ERROR';
    const errorMessage = searchParams.get('message') || 'Erro desconhecido no pagamento';
    
    setErrorDetails({
      payment_id: paymentId,
      error_code: errorCode,
      error_message: errorMessage,
      retry_available: ['CARD_DECLINED', 'INSUFFICIENT_FUNDS', 'NETWORK_ERROR'].includes(errorCode),
      alternative_methods: getAlternativeMethods(errorCode)
    });
  }, [paymentId, searchParams]);

  const getAlternativeMethods = (errorCode: string): string[] => {
    switch (errorCode) {
      case 'CARD_DECLINED':
      case 'INSUFFICIENT_FUNDS':
        return ['PIX', 'Boleto'];
      case 'CARD_EXPIRED':
        return ['PIX', 'Boleto', 'Outro cartão'];
      case 'NETWORK_ERROR':
        return ['PIX'];
      default:
        return ['PIX', 'Boleto'];
    }
  };

  const getErrorTitle = (errorCode: string): string => {
    switch (errorCode) {
      case 'CARD_DECLINED':
        return 'Cartão Recusado';
      case 'INSUFFICIENT_FUNDS':
        return 'Saldo Insuficiente';
      case 'CARD_EXPIRED':
        return 'Cartão Expirado';
      case 'INVALID_CARD':
        return 'Dados do Cartão Inválidos';
      case 'NETWORK_ERROR':
        return 'Erro de Conexão';
      case 'PIX_EXPIRED':
        return 'PIX Expirado';
      case 'PAYMENT_TIMEOUT':
        return 'Tempo Esgotado';
      default:
        return 'Erro no Pagamento';
    }
  };

  const getErrorDescription = (errorCode: string): string => {
    switch (errorCode) {
      case 'CARD_DECLINED':
        return 'Seu cartão foi recusado pelo banco. Verifique os dados ou entre em contato com seu banco.';
      case 'INSUFFICIENT_FUNDS':
        return 'Não há saldo suficiente no cartão para completar a transação.';
      case 'CARD_EXPIRED':
        return 'O cartão informado está expirado. Use um cartão válido.';
      case 'INVALID_CARD':
        return 'Os dados do cartão estão incorretos. Verifique o número, validade e CVV.';
      case 'NETWORK_ERROR':
        return 'Houve um problema de conexão. Tente novamente em alguns minutos.';
      case 'PIX_EXPIRED':
        return 'O código PIX expirou. Gere um novo código para continuar.';
      case 'PAYMENT_TIMEOUT':
        return 'O pagamento não foi confirmado no tempo limite.';
      default:
        return 'Ocorreu um erro inesperado durante o processamento do pagamento.';
    }
  };

  const getSolutions = (errorCode: string): string[] => {
    switch (errorCode) {
      case 'CARD_DECLINED':
        return [
          'Verifique se os dados do cartão estão corretos',
          'Entre em contato com seu banco',
          'Tente usar outro cartão',
          'Use PIX ou boleto como alternativa'
        ];
      case 'INSUFFICIENT_FUNDS':
        return [
          'Verifique o saldo disponível no cartão',
          'Use outro cartão com saldo suficiente',
          'Pague via PIX ou boleto'
        ];
      case 'CARD_EXPIRED':
        return [
          'Use um cartão com validade atual',
          'Solicite um novo cartão ao seu banco',
          'Pague via PIX ou boleto'
        ];
      case 'INVALID_CARD':
        return [
          'Verifique o número do cartão',
          'Confirme a data de validade',
          'Verifique o código CVV',
          'Digite o nome exatamente como no cartão'
        ];
      case 'NETWORK_ERROR':
        return [
          'Verifique sua conexão com a internet',
          'Tente novamente em alguns minutos',
          'Use PIX como alternativa mais rápida'
        ];
      case 'PIX_EXPIRED':
        return [
          'Gere um novo código PIX',
          'Complete o pagamento em até 30 minutos',
          'Use cartão como alternativa'
        ];
      default:
        return [
          'Tente novamente em alguns minutos',
          'Use um método de pagamento diferente',
          'Entre em contato com o suporte'
        ];
    }
  };

  const retryPayment = async () => {
    if (!paymentId) return;
    
    setIsRetrying(true);
    
    try {
      // Redirecionar para nova tentativa de pagamento
      navigate(`/checkout/retry/${paymentId}`);
    } catch (error) {
      toast.error('Erro ao tentar novamente');
    } finally {
      setIsRetrying(false);
    }
  };

  const tryAlternativeMethod = (method: string) => {
    if (!paymentId) return;
    
    const params = new URLSearchParams({
      payment_id: paymentId,
      method: method.toLowerCase(),
      retry: 'true'
    });
    
    navigate(`/checkout?${params.toString()}`);
  };

  if (!errorDetails) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header de Erro */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-12 h-12 text-red-500" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {getErrorTitle(errorDetails.error_code)}
          </h1>
          <p className="text-gray-600">
            {getErrorDescription(errorDetails.error_code)}
          </p>
        </div>

        {/* Detalhes do Erro */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Detalhes do Erro
              <Badge variant="destructive">
                <AlertCircle className="w-4 h-4 mr-1" />
                Falhou
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-gray-600">Código do Erro</p>
              <p className="font-mono text-sm">{errorDetails.error_code}</p>
            </div>
            
            {errorDetails.payment_id && (
              <div>
                <p className="text-sm text-gray-600">ID do Pagamento</p>
                <p className="font-mono text-sm">{errorDetails.payment_id}</p>
              </div>
            )}
            
            <div>
              <p className="text-sm text-gray-600">Mensagem</p>
              <p className="text-sm">{errorDetails.error_message}</p>
            </div>
          </CardContent>
        </Card>

        {/* Soluções */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HelpCircle className="w-5 h-5" />
              Como Resolver
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {getSolutions(errorDetails.error_code).map((solution, index) => (
                <li key={index} className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-semibold text-blue-600">{index + 1}</span>
                  </div>
                  <p className="text-sm">{solution}</p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Métodos Alternativos */}
        {errorDetails.alternative_methods && errorDetails.alternative_methods.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Métodos Alternativos</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Tente usar um destes métodos de pagamento:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {errorDetails.alternative_methods.map((method) => (
                  <Button
                    key={method}
                    variant="outline"
                    onClick={() => tryAlternativeMethod(method)}
                    className="justify-start"
                  >
                    <CreditCard className="w-4 h-4 mr-2" />
                    {method}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Ações */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {errorDetails.retry_available && (
            <Button
              onClick={retryPayment}
              disabled={isRetrying}
              className="w-full"
            >
              {isRetrying ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Tentando...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Tentar Novamente
                </>
              )}
            </Button>
          )}
          
          <Button
            onClick={() => navigate('/')}
            variant="outline"
            className="w-full"
          >
            <Home className="w-4 h-4 mr-2" />
            Voltar ao Início
          </Button>
        </div>

        {/* Informações de Suporte */}
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <h3 className="font-semibold mb-2">Ainda com problemas?</h3>
              <p className="text-sm text-gray-600 mb-4">
                Nossa equipe de suporte está pronta para ajudar
              </p>
              <div className="flex flex-col sm:flex-row gap-2 justify-center">
                <Button variant="outline" size="sm">
                  📧 suporte@comademig.com.br
                </Button>
                <Button variant="outline" size="sm">
                  📱 (31) 3333-4444
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-3">
                Tenha em mãos o código do erro: {errorDetails.error_code}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}