import React, { useEffect, useState } from 'react';
import { CheckCircle, Clock, AlertCircle, Download, Copy, QrCode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { PaymentStatusMonitor } from './PaymentStatusMonitor';

interface FiliacaoPaymentResultProps {
  paymentData: {
    profile: any;
    subscription: any;
    payment: any;
    customer: any;
    memberType: any;
    paymentMethod: 'pix' | 'credit_card' | 'boleto';
  };
  onPaymentConfirmed?: () => void;
}

export function FiliacaoPaymentResult({ 
  paymentData, 
  onPaymentConfirmed 
}: FiliacaoPaymentResultProps) {
  const { payment, subscription, memberType, paymentMethod } = paymentData;
  const [paymentStatus, setPaymentStatus] = useState(payment.status);

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'PENDING':
        return {
          icon: <Clock className="h-5 w-5 text-yellow-500" />,
          label: 'Aguardando Pagamento',
          color: 'bg-yellow-100 text-yellow-800',
          description: 'Seu pagamento está sendo processado'
        };
      case 'CONFIRMED':
      case 'RECEIVED':
        return {
          icon: <CheckCircle className="h-5 w-5 text-green-500" />,
          label: 'Pagamento Confirmado',
          color: 'bg-green-100 text-green-800',
          description: 'Sua filiação foi ativada com sucesso!'
        };
      case 'OVERDUE':
        return {
          icon: <AlertCircle className="h-5 w-5 text-red-500" />,
          label: 'Pagamento Vencido',
          color: 'bg-red-100 text-red-800',
          description: 'O prazo para pagamento expirou'
        };
      default:
        return {
          icon: <Clock className="h-5 w-5 text-gray-500" />,
          label: 'Processando',
          color: 'bg-gray-100 text-gray-800',
          description: 'Aguarde enquanto processamos seu pagamento'
        };
    }
  };

  const statusInfo = getStatusInfo(paymentStatus);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado para a área de transferência`);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const handlePaymentStatusChange = (newStatus: string) => {
    setPaymentStatus(newStatus);
    if ((newStatus === 'CONFIRMED' || newStatus === 'RECEIVED') && onPaymentConfirmed) {
      onPaymentConfirmed();
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Status do Pagamento */}
      <Card>
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {statusInfo.icon}
          </div>
          <CardTitle className="text-xl">
            Filiação COMADEMIG
          </CardTitle>
          <Badge className={statusInfo.color}>
            {statusInfo.label}
          </Badge>
          <p className="text-sm text-muted-foreground mt-2">
            {statusInfo.description}
          </p>
        </CardHeader>
      </Card>

      {/* Detalhes da Filiação */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Detalhes da Filiação</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Tipo de Membro</p>
              <p className="font-semibold">{memberType.name}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Valor</p>
              <p className="font-semibold">{formatCurrency(payment.value)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Método de Pagamento</p>
              <p className="font-semibold capitalize">
                {paymentMethod === 'pix' ? 'PIX' : 
                 paymentMethod === 'credit_card' ? 'Cartão de Crédito' : 'Boleto'}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Data de Vencimento</p>
              <p className="font-semibold">{formatDate(payment.dueDate)}</p>
            </div>
          </div>

          {payment.description && (
            <>
              <Separator />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Descrição</p>
                <p className="text-sm">{payment.description}</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Informações de Pagamento Específicas */}
      {paymentMethod === 'pix' && payment.pixTransaction && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              Pagamento PIX
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {payment.pixTransaction.qrCode && (
              <div className="text-center">
                <img 
                  src={`data:image/png;base64,${payment.pixTransaction.qrCode.encodedImage}`}
                  alt="QR Code PIX"
                  className="mx-auto mb-4 border rounded"
                />
                <p className="text-sm text-muted-foreground mb-2">
                  Escaneie o QR Code com seu app bancário
                </p>
              </div>
            )}

            {payment.pixTransaction.payload && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">
                  Código Copia e Cola
                </p>
                <div className="flex gap-2">
                  <code className="flex-1 p-2 bg-muted rounded text-xs break-all">
                    {payment.pixTransaction.payload}
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(payment.pixTransaction.payload, 'Código PIX')}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-green-800">
                <strong>Desconto de 5% aplicado!</strong> Você economizou {formatCurrency(payment.originalValue - payment.value)} pagando com PIX.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {paymentMethod === 'boleto' && payment.bankSlipUrl && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Boleto Bancário</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">
                Linha Digitável
              </p>
              <div className="flex gap-2">
                <code className="flex-1 p-2 bg-muted rounded text-sm">
                  {payment.identificationField}
                </code>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(payment.identificationField, 'Linha digitável')}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <Button
              onClick={() => window.open(payment.bankSlipUrl, '_blank')}
              className="w-full"
            >
              <Download className="h-4 w-4 mr-2" />
              Baixar Boleto PDF
            </Button>

            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Importante:</strong> O boleto vence em {formatDate(payment.dueDate)}. 
                Após o vencimento, será aplicada multa de 2% e juros de 1% ao mês.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {paymentMethod === 'credit_card' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Cartão de Crédito</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {payment.creditCard?.creditCardBrand && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Bandeira</p>
                  <p className="font-semibold capitalize">{payment.creditCard.creditCardBrand}</p>
                </div>
              )}
              {payment.creditCard?.creditCardNumber && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Final do Cartão</p>
                  <p className="font-semibold">**** {payment.creditCard.creditCardNumber}</p>
                </div>
              )}
              {payment.installmentCount && payment.installmentCount > 1 && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Parcelas</p>
                  <p className="font-semibold">{payment.installmentCount}x de {formatCurrency(payment.value / payment.installmentCount)}</p>
                </div>
              )}
            </div>

            {paymentStatus === 'CONFIRMED' && (
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-green-800">
                  <strong>Pagamento aprovado!</strong> Sua filiação foi ativada automaticamente.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Monitor de Status em Tempo Real */}
      <PaymentStatusMonitor
        paymentId={payment.id}
        currentStatus={paymentStatus}
        onStatusChange={handlePaymentStatusChange}
      />

      {/* Próximos Passos */}
      {paymentStatus === 'PENDING' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Próximos Passos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <p>1. Complete o pagamento usando as informações acima</p>
              <p>2. Aguarde a confirmação automática (pode levar alguns minutos)</p>
              <p>3. Sua filiação será ativada automaticamente após a confirmação</p>
              <p>4. Você receberá um email de confirmação</p>
            </div>
          </CardContent>
        </Card>
      )}

      {(paymentStatus === 'CONFIRMED' || paymentStatus === 'RECEIVED') && (
        <Card className="border-green-200">
          <CardHeader>
            <CardTitle className="text-lg text-green-800">Filiação Ativada!</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <p>✅ Sua filiação foi ativada com sucesso</p>
              <p>✅ Você já pode acessar todos os benefícios do COMADEMIG</p>
              <p>✅ Sua carteira digital estará disponível em breve</p>
              <p>✅ Um email de confirmação foi enviado</p>
            </div>
            
            <div className="mt-4 pt-4 border-t">
              <Button 
                onClick={() => window.location.href = '/dashboard'}
                className="w-full"
              >
                Acessar Minha Área
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}