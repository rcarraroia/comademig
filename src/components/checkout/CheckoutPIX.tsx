import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Copy, CheckCircle, Clock, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface CheckoutPIXProps {
  paymentData: {
    payment_id: string;
    amount: number;
    pix_qr_code?: string;
    pix_payload?: string;
    checkout_url?: string;
    due_date: string;
  };
  onPaymentConfirmed?: (paymentId: string) => void;
  onPaymentFailed?: (paymentId: string) => void;
}

export default function CheckoutPIX({ 
  paymentData, 
  onPaymentConfirmed, 
  onPaymentFailed 
}: CheckoutPIXProps) {
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'confirmed' | 'failed'>('pending');
  const [isPolling, setIsPolling] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState<string>('');

  // Polling para verificar status do pagamento
  useEffect(() => {
    if (!isPolling || paymentStatus !== 'pending') return;

    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/payments/${paymentData.payment_id}/status`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          
          if (data.status === 'confirmed' || data.status === 'received') {
            setPaymentStatus('confirmed');
            setIsPolling(false);
            onPaymentConfirmed?.(paymentData.payment_id);
            toast.success('Pagamento confirmado!');
          } else if (data.status === 'failed' || data.status === 'expired') {
            setPaymentStatus('failed');
            setIsPolling(false);
            onPaymentFailed?.(paymentData.payment_id);
            toast.error('Pagamento não foi confirmado');
          }
        }
      } catch (error) {
        console.error('Erro ao verificar status:', error);
      }
    }, 5000); // Verificar a cada 5 segundos

    return () => clearInterval(pollInterval);
  }, [isPolling, paymentStatus, paymentData.payment_id, onPaymentConfirmed, onPaymentFailed]);

  // Calcular tempo restante
  useEffect(() => {
    const updateTimeRemaining = () => {
      const now = new Date();
      const dueDate = new Date(paymentData.due_date);
      const diff = dueDate.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeRemaining('Expirado');
        setIsPolling(false);
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeRemaining(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    };

    updateTimeRemaining();
    const timer = setInterval(updateTimeRemaining, 1000);

    return () => clearInterval(timer);
  }, [paymentData.due_date]);

  // Copiar código PIX
  const copyPixCode = async () => {
    if (!paymentData.pix_payload) return;

    try {
      await navigator.clipboard.writeText(paymentData.pix_payload);
      toast.success('Código PIX copiado!');
    } catch (error) {
      // Fallback para navegadores mais antigos
      const textArea = document.createElement('textarea');
      textArea.value = paymentData.pix_payload;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      toast.success('Código PIX copiado!');
    }
  };

  // Abrir app do banco
  const openBankApp = () => {
    if (paymentData.checkout_url) {
      window.open(paymentData.checkout_url, '_blank');
    }
  };

  const getStatusBadge = () => {
    switch (paymentStatus) {
      case 'confirmed':
        return <Badge className="bg-green-500"><CheckCircle className="w-4 h-4 mr-1" />Confirmado</Badge>;
      case 'failed':
        return <Badge variant="destructive">Falhou</Badge>;
      default:
        return <Badge variant="secondary"><Clock className="w-4 h-4 mr-1" />Aguardando</Badge>;
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-6">
      {/* Status do Pagamento */}
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            Pagamento PIX
            {getStatusBadge()}
          </CardTitle>
          <div className="text-2xl font-bold text-blue-600">
            R$ {paymentData.amount.toFixed(2).replace('.', ',')}
          </div>
        </CardHeader>
      </Card>

      {paymentStatus === 'pending' && (
        <>
          {/* QR Code */}
          {paymentData.pix_qr_code && (
            <Card>
              <CardHeader>
                <CardTitle className="text-center text-lg">
                  Escaneie o QR Code
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center space-y-4">
                <div className="bg-white p-4 rounded-lg">
                  <QRCodeSVG 
                    value={paymentData.pix_qr_code} 
                    size={200}
                    level="M"
                  />
                </div>
                <p className="text-sm text-gray-600 text-center">
                  Abra o app do seu banco e escaneie o código
                </p>
              </CardContent>
            </Card>
          )}

          {/* Código PIX para Copiar */}
          {paymentData.pix_payload && (
            <Card>
              <CardHeader>
                <CardTitle className="text-center text-lg">
                  Ou copie o código PIX
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-gray-50 p-3 rounded border text-xs font-mono break-all">
                  {paymentData.pix_payload}
                </div>
                <Button 
                  onClick={copyPixCode}
                  className="w-full"
                  variant="outline"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copiar código PIX
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Instruções */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-3">
                <h3 className="font-semibold">Como pagar:</h3>
                <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
                  <li>Abra o app do seu banco</li>
                  <li>Escolha a opção PIX</li>
                  <li>Escaneie o QR Code ou cole o código</li>
                  <li>Confirme o pagamento</li>
                  <li>Aguarde a confirmação automática</li>
                </ol>
              </div>
            </CardContent>
          </Card>

          {/* Timer e Status */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {isPolling && <RefreshCw className="w-4 h-4 animate-spin" />}
                  <span className="text-sm">
                    {isPolling ? 'Verificando pagamento...' : 'Verificação pausada'}
                  </span>
                </div>
                <div className="text-sm font-mono">
                  {timeRemaining}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Botões de Ação */}
          <div className="space-y-3">
            {paymentData.checkout_url && (
              <Button onClick={openBankApp} className="w-full">
                Abrir no app do banco
              </Button>
            )}
            
            <Button 
              variant="outline" 
              onClick={() => setIsPolling(!isPolling)}
              className="w-full"
            >
              {isPolling ? 'Pausar verificação' : 'Retomar verificação'}
            </Button>
          </div>
        </>
      )}

      {/* Status de Sucesso */}
      {paymentStatus === 'confirmed' && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-green-800 mb-2">
              Pagamento Confirmado!
            </h3>
            <p className="text-green-600">
              Seu pagamento foi processado com sucesso.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Status de Falha */}
      {paymentStatus === 'failed' && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-lg font-semibold text-red-800 mb-2">
              Pagamento não confirmado
            </h3>
            <p className="text-red-600 mb-4">
              O pagamento não foi processado no prazo.
            </p>
            <Button variant="outline" onClick={() => window.location.reload()}>
              Tentar novamente
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}