import React, { useEffect, useState } from 'react';
import { CheckCircle, Clock, AlertCircle, Download, Copy, QrCode, FileCheck, Gift } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { PaymentStatusMonitor } from './PaymentStatusMonitor';

interface RegularizacaoPaymentResultProps {
  paymentData: {
    payment: any;
    customer: any;
    paymentMethod: 'pix' | 'credit_card' | 'boleto';
    valorBruto: number;
    descontoCombo: number;
    descontoPix: number;
    valorFinal: number;
    servicosCount: number;
    isComboCompleto: boolean;
    serviceData: {
      servicos_selecionados: Array<{
        id: string;
        nome: string;
        valor: number;
      }>;
      observacoes?: string;
    };
  };
  onPaymentConfirmed?: () => void;
}

export function RegularizacaoPaymentResult({ 
  paymentData, 
  onPaymentConfirmed 
}: RegularizacaoPaymentResultProps) {
  const { 
    payment, 
    serviceData, 
    paymentMethod, 
    valorBruto, 
    descontoCombo, 
    descontoPix, 
    valorFinal,
    servicosCount,
    isComboCompleto
  } = paymentData;
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
          description: 'Sua solicitação de regularização foi registrada!'
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

  const totalDescontos = descontoCombo + descontoPix;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Status do Pagamento */}
      <Card>
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {statusInfo.icon}
          </div>
          <CardTitle className="text-xl">
            Solicitação de Regularização
          </CardTitle>
          <Badge className={statusInfo.color}>
            {statusInfo.label}
          </Badge>
          <p className="text-sm text-muted-foreground mt-2">
            {statusInfo.description}
          </p>
        </CardHeader>
      </Card>

      {/* Detalhes da Regularização */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileCheck className="h-5 w-5" />
            Detalhes da Regularização
            {isComboCompleto && (
              <Badge variant="secondary" className="ml-2">
                <Gift className="h-3 w-3 mr-1" />
                Combo Completo
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Serviços Selecionados */}
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-2">
              Serviços Selecionados ({servicosCount} {servicosCount === 1 ? 'serviço' : 'serviços'})
            </p>
            <div className="space-y-2">
              {serviceData.servicos_selecionados.map((servico, index) => (
                <div key={index} className="flex justify-between items-center p-2 bg-muted rounded">
                  <span className="text-sm font-medium">{servico.nome}</span>
                  <span className="text-sm text-muted-foreground">
                    {formatCurrency(servico.valor)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Observações */}
          {serviceData.observacoes && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">Observações</p>
              <p className="text-sm bg-muted p-3 rounded">{serviceData.observacoes}</p>
            </div>
          )}

          <Separator />

          {/* Resumo Financeiro */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Valor dos Serviços:</span>
              <span className="font-medium">{formatCurrency(valorBruto)}</span>
            </div>

            {descontoCombo > 0 && (
              <div className="flex justify-between items-center text-green-600">
                <span className="text-sm flex items-center gap-1">
                  <Gift className="h-4 w-4" />
                  Desconto Combo (15%):
                </span>
                <span className="font-medium">-{formatCurrency(descontoCombo)}</span>
              </div>
            )}

            {descontoPix > 0 && (
              <div className="flex justify-between items-center text-green-600">
                <span className="text-sm">Desconto PIX (5%):</span>
                <span className="font-medium">-{formatCurrency(descontoPix)}</span>
              </div>
            )}

            {totalDescontos > 0 && <Separator />}

            <div className="flex justify-between items-center text-lg font-semibold">
              <span>Valor Final:</span>
              <span className="text-green-600">{formatCurrency(valorFinal)}</span>
            </div>

            {totalDescontos > 0 && (
              <div className="text-center text-sm text-green-600">
                Você economizou {formatCurrency(totalDescontos)}!
              </div>
            )}
          </div>

          <Separator />

          {/* Detalhes do Pagamento */}
          <div className="grid grid-cols-2 gap-4">
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
                <strong>Descontos aplicados!</strong>
                {isComboCompleto && descontoPix > 0 && (
                  <> Combo completo (15%) + PIX (5%) = {formatCurrency(totalDescontos)} de economia!</>
                )}
                {isComboCompleto && descontoPix === 0 && (
                  <> Combo completo (15%) = {formatCurrency(descontoCombo)} de economia!</>
                )}
                {!isComboCompleto && descontoPix > 0 && (
                  <> PIX (5%) = {formatCurrency(descontoPix)} de economia!</>
                )}
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

            {isComboCompleto && (
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-green-800">
                  <strong>Combo Completo!</strong> Você economizou {formatCurrency(descontoCombo)} (15% de desconto) selecionando todos os serviços.
                </p>
              </div>
            )}

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
                  <p className="font-semibold">{payment.installmentCount}x de {formatCurrency(valorFinal / payment.installmentCount)}</p>
                </div>
              )}
            </div>

            {isComboCompleto && (
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-green-800">
                  <strong>Combo Completo!</strong> Você economizou {formatCurrency(descontoCombo)} (15% de desconto) selecionando todos os serviços.
                </p>
              </div>
            )}

            {paymentStatus === 'CONFIRMED' && (
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-green-800">
                  <strong>Pagamento aprovado!</strong> Sua solicitação foi registrada automaticamente.
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
              <p>3. Sua solicitação será registrada automaticamente após a confirmação</p>
              <p>4. Você receberá um protocolo de acompanhamento</p>
              <p>5. Nossa equipe iniciará o processamento dos serviços</p>
              <p>6. Você será notificado sobre o andamento de cada serviço</p>
            </div>
          </CardContent>
        </Card>
      )}

      {(paymentStatus === 'CONFIRMED' || paymentStatus === 'RECEIVED') && (
        <Card className="border-green-200">
          <CardHeader>
            <CardTitle className="text-lg text-green-800">Solicitação Registrada!</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <p>✅ Sua solicitação foi registrada com sucesso</p>
              <p>✅ Um protocolo de acompanhamento foi gerado</p>
              <p>✅ A equipe administrativa foi notificada</p>
              <p>✅ Você receberá atualizações sobre cada serviço</p>
              <p>✅ Os serviços serão processados em até 10 dias úteis</p>
              {isComboCompleto && (
                <p className="text-green-600 font-medium">
                  🎉 Parabéns! Você economizou {formatCurrency(totalDescontos)} com os descontos aplicados!
                </p>
              )}
            </div>
            
            <div className="mt-4 pt-4 border-t">
              <Button 
                onClick={() => window.location.href = '/dashboard/regularizacao'}
                className="w-full"
              >
                Acompanhar Solicitação
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}