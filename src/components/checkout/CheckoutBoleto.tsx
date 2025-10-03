/**
 * Componente para exibir boleto bancário
 * Mostra linha digitável, botões de ação e status do pagamento
 */

import React, { useState, useEffect } from 'react';
import { FileText, Copy, Download, Calendar, RefreshCw, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useAsaasBoletoPayments } from '@/hooks/useAsaasBoletoPayments';

interface CheckoutBoletoProps {
  boletoData: {
    payment_id: string;
    asaas_id: string;
    boleto_url: string;
    linha_digitavel: string;
    nosso_numero: string;
    due_date: string;
    value: number;
  };
  onPaymentConfirmed?: (paymentId: string) => void;
  onPaymentOverdue?: (paymentId: string) => void;
}

export const CheckoutBoleto: React.FC<CheckoutBoletoProps> = ({
  boletoData,
  onPaymentConfirmed,
  onPaymentOverdue
}) => {
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'confirmed' | 'overdue'>('pending');
  const [isPolling, setIsPolling] = useState(true);
  const [daysUntilDue, setDaysUntilDue] = useState<number>(0);
  
  const { 
    checkBoletoPaymentStatus, 
    formatLinhaDigitavel, 
    generateSecondCopy 
  } = useAsaasBoletoPayments();

  // Calcular dias até o vencimento
  useEffect(() => {
    const updateDaysUntilDue = () => {
      const dueDate = new Date(boletoData.due_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      dueDate.setHours(0, 0, 0, 0);
      
      const diffTime = dueDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      setDaysUntilDue(diffDays);
      
      if (diffDays < 0 && paymentStatus === 'pending') {
        setPaymentStatus('overdue');
        setIsPolling(false);
        onPaymentOverdue?.(boletoData.payment_id);
      }
    };

    updateDaysUntilDue();
    const timer = setInterval(updateDaysUntilDue, 1000 * 60 * 60); // Atualizar a cada hora

    return () => clearInterval(timer);
  }, [boletoData.due_date, paymentStatus, boletoData.payment_id, onPaymentOverdue]);

  // Polling para verificar status do pagamento
  useEffect(() => {
    if (!isPolling || paymentStatus !== 'pending') return;

    const pollInterval = setInterval(async () => {
      try {
        const status = await checkBoletoPaymentStatus(boletoData.payment_id);
        
        if (status === 'RECEIVED' || status === 'CONFIRMED') {
          setPaymentStatus('confirmed');
          setIsPolling(false);
          onPaymentConfirmed?.(boletoData.payment_id);
          toast.success('Pagamento do boleto confirmado!');
        }
      } catch (error) {
        console.error('Erro ao verificar status do boleto:', error);
      }
    }, 30000); // Verificar a cada 30 segundos

    return () => clearInterval(pollInterval);
  }, [isPolling, paymentStatus, boletoData.payment_id, onPaymentConfirmed, checkBoletoPaymentStatus]);

  // Copiar linha digitável
  const copyLinhaDigitavel = async () => {
    try {
      await navigator.clipboard.writeText(boletoData.linha_digitavel);
      toast.success('Linha digitável copiada!');
    } catch (error) {
      // Fallback para navegadores mais antigos
      const textArea = document.createElement('textarea');
      textArea.value = boletoData.linha_digitavel;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      toast.success('Linha digitável copiada!');
    }
  };

  // Baixar PDF do boleto
  const downloadBoleto = () => {
    window.open(boletoData.boleto_url, '_blank');
  };

  // Gerar segunda via
  const handleSecondCopy = async () => {
    const secondCopy = await generateSecondCopy(boletoData.payment_id);
    if (secondCopy) {
      toast.success('Segunda via gerada com sucesso!');
      // Atualizar dados se necessário
    }
  };

  // Determinar cor e ícone baseado no status e dias
  const getStatusInfo = () => {
    if (paymentStatus === 'confirmed') {
      return {
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
        icon: <CheckCircle className="w-6 h-6 text-green-600" />,
        title: 'Pagamento Confirmado',
        badge: <Badge className="bg-green-600">Pago</Badge>
      };
    }
    
    if (paymentStatus === 'overdue') {
      return {
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        icon: <AlertTriangle className="w-6 h-6 text-red-600" />,
        title: 'Boleto Vencido',
        badge: <Badge variant="destructive">Vencido</Badge>
      };
    }
    
    if (daysUntilDue <= 1) {
      return {
        color: 'text-orange-600',
        bgColor: 'bg-orange-50',
        borderColor: 'border-orange-200',
        icon: <Clock className="w-6 h-6 text-orange-600" />,
        title: 'Vence Hoje/Amanhã',
        badge: <Badge variant="secondary" className="bg-orange-100 text-orange-700">Urgente</Badge>
      };
    }
    
    return {
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      icon: <FileText className="w-6 h-6 text-blue-600" />,
      title: 'Aguardando Pagamento',
      badge: <Badge variant="secondary">Pendente</Badge>
    };
  };

  const statusInfo = getStatusInfo();
  const formattedDueDate = new Date(boletoData.due_date).toLocaleDateString('pt-BR');
  const formattedValue = boletoData.value.toFixed(2).replace('.', ',');

  return (
    <div className="max-w-md mx-auto space-y-6">
      {/* Status do Boleto */}
      <Card className={`${statusInfo.borderColor} ${statusInfo.bgColor}`}>
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            {statusInfo.icon}
            Boleto Bancário
            {statusInfo.badge}
          </CardTitle>
          <div className="text-2xl font-bold text-gray-800">
            R$ {formattedValue}
          </div>
          <div className="text-sm text-gray-600">
            Vencimento: {formattedDueDate}
            {daysUntilDue > 0 && paymentStatus === 'pending' && (
              <span className="block text-xs mt-1">
                ({daysUntilDue} {daysUntilDue === 1 ? 'dia' : 'dias'} restante{daysUntilDue !== 1 ? 's' : ''})
              </span>
            )}
          </div>
        </CardHeader>
      </Card>

      {paymentStatus === 'pending' && (
        <>
          {/* Linha Digitável */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Linha Digitável</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-gray-50 p-3 rounded border font-mono text-sm break-all">
                {formatLinhaDigitavel(boletoData.linha_digitavel)}
              </div>
              <Button 
                onClick={copyLinhaDigitavel}
                className="w-full"
                variant="outline"
              >
                <Copy className="w-4 h-4 mr-2" />
                Copiar Linha Digitável
              </Button>
            </CardContent>
          </Card>

          {/* Informações do Boleto */}
          <Card>
            <CardContent className="pt-6 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Nosso Número:</span>
                <span className="font-mono">{boletoData.nosso_numero}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Código Asaas:</span>
                <span className="font-mono">{boletoData.asaas_id}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Status:</span>
                <span className={`${statusInfo.color} flex items-center gap-1`}>
                  {statusInfo.title}
                  {isPolling && <RefreshCw className="w-3 h-3 animate-spin" />}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Ações */}
          <div className="space-y-3">
            <Button onClick={downloadBoleto} className="w-full">
              <Download className="w-4 h-4 mr-2" />
              Baixar PDF do Boleto
            </Button>
            
            <Button 
              variant="outline" 
              onClick={handleSecondCopy}
              className="w-full"
            >
              <FileText className="w-4 h-4 mr-2" />
              Gerar Segunda Via
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => setIsPolling(!isPolling)}
              className="w-full"
            >
              {isPolling ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Pausar Verificação
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Retomar Verificação
                </>
              )}
            </Button>
          </div>

          {/* Instruções */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-3">
                <h3 className="font-semibold">Como pagar:</h3>
                <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
                  <li>Baixe o PDF do boleto ou copie a linha digitável</li>
                  <li>Acesse o internet banking ou app do seu banco</li>
                  <li>Escolha a opção "Pagar Boleto"</li>
                  <li>Digite a linha digitável ou escaneie o código de barras</li>
                  <li>Confirme o pagamento</li>
                  <li>A confirmação pode levar até 2 dias úteis</li>
                </ol>
              </div>
            </CardContent>
          </Card>
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
              Seu boleto foi pago e processado com sucesso.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Status de Vencido */}
      {paymentStatus === 'overdue' && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6 text-center">
            <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-red-800 mb-2">
              Boleto Vencido
            </h3>
            <p className="text-red-600 mb-4">
              Este boleto venceu em {formattedDueDate}. 
              Gere um novo boleto para efetuar o pagamento.
            </p>
            <Button variant="outline" onClick={() => window.location.reload()}>
              Gerar Novo Boleto
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Aviso sobre prazo */}
      {daysUntilDue <= 1 && paymentStatus === 'pending' && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-orange-800">
              <Calendar className="w-5 h-5" />
              <div>
                <div className="font-semibold">Atenção: Vencimento Próximo!</div>
                <div className="text-sm">
                  {daysUntilDue === 0 ? 'Boleto vence hoje' : 'Boleto vence amanhã'}. 
                  Efetue o pagamento para evitar multa e juros.
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};