import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, CreditCard, FileText, Smartphone, CheckCircle, Info } from 'lucide-react';
import { useCertidoesWithPayment } from '@/hooks/useCertidoesWithPayment';
import { useRegularizacaoWithPayment } from '@/hooks/useRegularizacaoWithPayment';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

interface PaymentCheckoutProps {
  serviceType: 'certidao' | 'regularizacao' | 'filiacao';
  serviceData: any;
  calculatedValue: number;
  onSuccess: (paymentResult: any) => void;
  onCancel: () => void;
  title?: string;
  description?: string;
}

interface CustomerData {
  name: string;
  email: string;
  cpfCnpj: string;
  phone: string;
  city: string;
  province: string;
}

export const PaymentCheckout = ({
  serviceType,
  serviceData,
  calculatedValue,
  onSuccess,
  onCancel,
  title,
  description
}: PaymentCheckoutProps) => {
  const { user } = useAuth();
  const { processarPagamentoCertidao, isProcessingPayment: isProcessingCertidao } = useCertidoesWithPayment();
  const { processarPagamentoRegularizacao, isProcessingPayment: isProcessingRegularizacao } = useRegularizacaoWithPayment();
  
  const [billingType, setBillingType] = useState<'PIX' | 'BOLETO' | 'CREDIT_CARD'>('PIX');
  const [customerData, setCustomerData] = useState<CustomerData>({
    name: '',
    email: user?.email || '',
    cpfCnpj: '',
    phone: '',
    city: 'Belo Horizonte',
    province: 'MG'
  });

  const handleCustomerChange = (field: keyof CustomerData, value: string) => {
    setCustomerData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = (): boolean => {
    const required = ['name', 'email', 'cpfCnpj'];
    return required.every(field => customerData[field as keyof CustomerData].trim() !== '');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    try {
      let paymentResult;
      
      if (serviceType === 'certidao') {
        paymentResult = await processarPagamentoCertidao(serviceData, customerData);
      } else if (serviceType === 'regularizacao') {
        paymentResult = await processarPagamentoRegularizacao(serviceData, customerData);
      } else {
        throw new Error(`Tipo de serviço ${serviceType} ainda não implementado`);
      }
      
      onSuccess(paymentResult);
      
    } catch (error) {
      console.error('Erro no checkout:', error);
    }
  };

  const getServiceDisplayInfo = () => {
    switch (serviceType) {
      case 'certidao':
        return {
          title: title || `Certidão de ${getCertidaoDisplayName(serviceData.tipo_certidao)}`,
          description: description || serviceData.justificativa,
          icon: <FileText className="h-5 w-5" />
        };
      case 'regularizacao':
        return {
          title: title || 'Regularização de Igreja',
          description: description || 'Serviços de regularização selecionados',
          icon: <FileText className="h-5 w-5" />
        };
      case 'filiacao':
        return {
          title: title || 'Filiação COMADEMIG',
          description: description || 'Plano de assinatura selecionado',
          icon: <FileText className="h-5 w-5" />
        };
      default:
        return {
          title: 'Serviço',
          description: 'Pagamento de serviço',
          icon: <FileText className="h-5 w-5" />
        };
    }
  };

  const serviceInfo = getServiceDisplayInfo();
  const discountValue = billingType === 'PIX' ? calculatedValue * 0.05 : 0;
  const finalValue = calculatedValue - discountValue;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={onCancel}
          className="text-comademig-blue"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-comademig-blue">Checkout</h1>
          <p className="text-gray-600">Finalize o pagamento do seu serviço</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulário de Pagamento */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Dados para Pagamento</CardTitle>
              <CardDescription>
                Preencha seus dados para gerar a cobrança
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Dados do Cliente */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Dados do Cliente</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Nome Completo *</Label>
                      <Input
                        id="name"
                        value={customerData.name}
                        onChange={(e) => handleCustomerChange('name', e.target.value)}
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="email">E-mail *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={customerData.email}
                        onChange={(e) => handleCustomerChange('email', e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="cpfCnpj">CPF/CNPJ *</Label>
                      <Input
                        id="cpfCnpj"
                        value={customerData.cpfCnpj}
                        onChange={(e) => handleCustomerChange('cpfCnpj', e.target.value)}
                        placeholder="000.000.000-00"
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="phone">Telefone</Label>
                      <Input
                        id="phone"
                        value={customerData.phone}
                        onChange={(e) => handleCustomerChange('phone', e.target.value)}
                        placeholder="(31) 99999-9999"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="city">Cidade</Label>
                      <Input
                        id="city"
                        value={customerData.city}
                        onChange={(e) => handleCustomerChange('city', e.target.value)}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="province">Estado</Label>
                      <Input
                        id="province"
                        value={customerData.province}
                        onChange={(e) => handleCustomerChange('province', e.target.value)}
                        maxLength={2}
                      />
                    </div>
                  </div>
                </div>

                {/* Forma de Pagamento */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Forma de Pagamento</h3>
                  <RadioGroup
                    value={billingType}
                    onValueChange={(value: 'BOLETO' | 'CREDIT_CARD' | 'PIX') => setBillingType(value)}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="PIX" id="pix" />
                      <Label htmlFor="pix" className="flex items-center space-x-2 cursor-pointer">
                        <Smartphone className="h-4 w-4" />
                        <span>PIX (Instantâneo - 5% desconto)</span>
                      </Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="BOLETO" id="boleto" />
                      <Label htmlFor="boleto" className="flex items-center space-x-2 cursor-pointer">
                        <FileText className="h-4 w-4" />
                        <span>Boleto Bancário</span>
                      </Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="CREDIT_CARD" id="card" />
                      <Label htmlFor="card" className="flex items-center space-x-2 cursor-pointer">
                        <CreditCard className="h-4 w-4" />
                        <span>Cartão de Crédito</span>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                {/* Botão de Finalizar */}
                <div className="pt-4">
                  <Button 
                    type="submit" 
                    disabled={!validateForm() || isProcessingCertidao || isProcessingRegularizacao}
                    className="w-full bg-comademig-blue hover:bg-comademig-blue/90"
                  >
                    {(isProcessingCertidao || isProcessingRegularizacao) ? (
                      <>
                        <LoadingSpinner />
                        Processando Pagamento...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Finalizar Pagamento - R$ {finalValue.toFixed(2)}
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Resumo do Pedido */}
        <div className="space-y-4">
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                {serviceInfo.icon}
                <span>Resumo do Pedido</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold text-comademig-blue">{serviceInfo.title}</h4>
                <p className="text-sm text-gray-600 mt-1">{serviceInfo.description}</p>
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Valor do serviço</span>
                  <span>R$ {calculatedValue.toFixed(2)}</span>
                </div>
                
                {discountValue > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Desconto PIX (5%)</span>
                    <span>- R$ {discountValue.toFixed(2)}</span>
                  </div>
                )}
              </div>

              <Separator />

              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span className="text-comademig-blue">R$ {finalValue.toFixed(2)}</span>
              </div>

              {billingType === 'PIX' && (
                <Alert className="border-green-200 bg-green-50">
                  <Info className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    <strong>Desconto PIX:</strong> Economize R$ {discountValue.toFixed(2)} pagando via PIX!
                  </AlertDescription>
                </Alert>
              )}

              <div className="text-xs text-gray-500 space-y-1">
                <p>• Pagamento seguro via Asaas</p>
                <p>• Processamento em até 5 dias úteis</p>
                <p>• Você receberá confirmação por email</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

// Função auxiliar para nomes de certidão
function getCertidaoDisplayName(tipo: string): string {
  const nomes: Record<string, string> = {
    'ministerio': 'Ministério',
    'vinculo': 'Vínculo',
    'atuacao': 'Atuação',
    'historico': 'Histórico Ministerial',
    'ordenacao': 'Ordenação'
  };
  
  return nomes[tipo] || tipo;
}