import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle, Download, Home, Receipt, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface PaymentDetails {
  payment_id: string;
  amount: number;
  status: string;
  payment_method: string;
  created_at: string;
  service?: {
    type: string;
    description: string;
  };
  subscription?: {
    id: string;
    plan_name: string;
    next_due_date: string;
  };
}

export default function PaymentSuccess() {
  const { paymentId } = useParams<{ paymentId: string }>();
  const navigate = useNavigate();
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (paymentId) {
      fetchPaymentDetails(paymentId);
    }
  }, [paymentId]);

  const fetchPaymentDetails = async (id: string) => {
    try {
      const response = await fetch(`/api/payments/${id}/status`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPaymentDetails(data);
      } else {
        toast.error('Erro ao carregar detalhes do pagamento');
      }
    } catch (error) {
      console.error('Erro ao buscar detalhes:', error);
      toast.error('Erro ao carregar informações');
    } finally {
      setIsLoading(false);
    }
  };

  const downloadReceipt = async () => {
    try {
      const response = await fetch(`/api/payments/${paymentId}/receipt`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `comprovante-${paymentId}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success('Comprovante baixado!');
      } else {
        toast.error('Erro ao baixar comprovante');
      }
    } catch (error) {
      console.error('Erro ao baixar:', error);
      toast.error('Erro ao baixar comprovante');
    }
  };

  const sharePayment = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Pagamento Confirmado - COMADEMIG',
          text: `Pagamento de R$ ${paymentDetails?.amount.toFixed(2)} confirmado!`,
          url: window.location.href
        });
      } catch (error) {
        // Usuário cancelou o compartilhamento
      }
    } else {
      // Fallback: copiar URL
      try {
        await navigator.clipboard.writeText(window.location.href);
        toast.success('Link copiado para a área de transferência!');
      } catch (error) {
        toast.error('Erro ao copiar link');
      }
    }
  };

  const getPaymentMethodLabel = (method: string) => {
    switch (method.toLowerCase()) {
      case 'pix': return 'PIX';
      case 'credit_card': return 'Cartão de Crédito';
      case 'debit_card': return 'Cartão de Débito';
      case 'boleto': return 'Boleto';
      default: return method;
    }
  };

  const getServiceTypeLabel = (type: string) => {
    switch (type) {
      case 'certidao': return 'Certidão de Regularidade';
      case 'regularizacao': return 'Regularização Eclesiástica';
      case 'filiacao': return 'Filiação COMADEMIG';
      default: return type;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!paymentDetails) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="pt-6 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Receipt className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Pagamento não encontrado</h2>
            <p className="text-gray-600 mb-4">
              Não foi possível encontrar os detalhes deste pagamento.
            </p>
            <Button onClick={() => navigate('/')} variant="outline">
              <Home className="w-4 h-4 mr-2" />
              Voltar ao início
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header de Sucesso */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-12 h-12 text-green-500" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Pagamento Confirmado!
          </h1>
          <p className="text-gray-600">
            Seu pagamento foi processado com sucesso
          </p>
        </div>

        {/* Detalhes do Pagamento */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Detalhes do Pagamento
              <Badge className="bg-green-500">
                <CheckCircle className="w-4 h-4 mr-1" />
                Confirmado
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Valor</p>
                <p className="text-2xl font-bold text-green-600">
                  R$ {paymentDetails.amount.toFixed(2).replace('.', ',')}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Método</p>
                <p className="font-semibold">
                  {getPaymentMethodLabel(paymentDetails.payment_method)}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">ID do Pagamento</p>
                <p className="font-mono text-sm">{paymentDetails.payment_id}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Data</p>
                <p className="font-semibold">
                  {new Date(paymentDetails.created_at).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Detalhes do Serviço */}
        {paymentDetails.service && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Serviço Contratado</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">
                    {getServiceTypeLabel(paymentDetails.service.type)}
                  </h3>
                  <p className="text-gray-600">
                    {paymentDetails.service.description}
                  </p>
                </div>
                <Badge variant="outline">
                  Em processamento
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Detalhes da Assinatura */}
        {paymentDetails.subscription && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Assinatura Ativada</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Plano</p>
                  <p className="font-semibold">{paymentDetails.subscription.plan_name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Próximo vencimento</p>
                  <p className="font-semibold">
                    {new Date(paymentDetails.subscription.next_due_date).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Próximos Passos */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Próximos Passos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {paymentDetails.service && (
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-semibold text-blue-600">1</span>
                  </div>
                  <div>
                    <p className="font-medium">Processamento do serviço</p>
                    <p className="text-sm text-gray-600">
                      Sua solicitação será processada em até 2 dias úteis
                    </p>
                  </div>
                </div>
              )}
              
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-semibold text-blue-600">
                    {paymentDetails.service ? '2' : '1'}
                  </span>
                </div>
                <div>
                  <p className="font-medium">Confirmação por email</p>
                  <p className="text-sm text-gray-600">
                    Você receberá um email com todos os detalhes
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-semibold text-blue-600">
                    {paymentDetails.service ? '3' : '2'}
                  </span>
                </div>
                <div>
                  <p className="font-medium">Acesso ao dashboard</p>
                  <p className="text-sm text-gray-600">
                    Acompanhe o status no seu painel de controle
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Ações */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Button onClick={downloadReceipt} variant="outline" className="w-full">
            <Download className="w-4 h-4 mr-2" />
            Baixar Comprovante
          </Button>
          
          <Button onClick={sharePayment} variant="outline" className="w-full">
            <Share2 className="w-4 h-4 mr-2" />
            Compartilhar
          </Button>
          
          <Button onClick={() => navigate('/dashboard')} className="w-full">
            <Home className="w-4 h-4 mr-2" />
            Ir para Dashboard
          </Button>
        </div>

        {/* Informações de Suporte */}
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <h3 className="font-semibold mb-2">Precisa de ajuda?</h3>
              <p className="text-sm text-gray-600 mb-4">
                Nossa equipe está pronta para ajudar você
              </p>
              <div className="flex flex-col sm:flex-row gap-2 justify-center">
                <Button variant="outline" size="sm">
                  📧 suporte@comademig.com.br
                </Button>
                <Button variant="outline" size="sm">
                  📱 (31) 3333-4444
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}