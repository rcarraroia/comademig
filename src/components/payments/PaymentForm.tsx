
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { useAsaasPayments, PaymentData } from '@/hooks/useAsaasPayments';
import { CreditCard, FileText, Smartphone } from 'lucide-react';

interface PaymentFormProps {
  defaultData?: Partial<PaymentData>;
  onSuccess?: (cobranca: any) => void;
  onCancel?: () => void;
}

export const PaymentForm = ({ defaultData, onSuccess, onCancel }: PaymentFormProps) => {
  const { createPayment, loading } = useAsaasPayments();
  
  const [formData, setFormData] = useState<PaymentData>({
    customer: {
      name: defaultData?.customer?.name || '',
      email: defaultData?.customer?.email || '',
      cpfCnpj: defaultData?.customer?.cpfCnpj || '',
      phone: defaultData?.customer?.phone || '',
      address: defaultData?.customer?.address || '',
      addressNumber: defaultData?.customer?.addressNumber || '',
      city: defaultData?.customer?.city || '',
      province: defaultData?.customer?.province || '',
      postalCode: defaultData?.customer?.postalCode || ''
    },
    billingType: defaultData?.billingType || 'PIX',
    value: defaultData?.value || 0,
    dueDate: defaultData?.dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    description: defaultData?.description || '',
    tipoCobranca: defaultData?.tipoCobranca || 'taxa_anual',
    referenciaId: defaultData?.referenciaId
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const cobranca = await createPayment(formData);
      onSuccess?.(cobranca);
    } catch (error) {
      console.error('Erro ao criar pagamento:', error);
    }
  };

  const handleInputChange = (field: keyof PaymentData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCustomerChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      customer: {
        ...prev.customer,
        [field]: value
      }
    }));
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Gerar Cobrança</CardTitle>
        <CardDescription>
          Preencha os dados para gerar uma cobrança via Asaas
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Dados do Cliente */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Dados do Cliente</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Nome Completo</Label>
                <Input
                  id="name"
                  value={formData.customer.name}
                  onChange={(e) => handleCustomerChange('name', e.target.value)}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.customer.email}
                  onChange={(e) => handleCustomerChange('email', e.target.value)}
                  required
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="cpfCnpj">CPF/CNPJ</Label>
                <Input
                  id="cpfCnpj"
                  value={formData.customer.cpfCnpj}
                  onChange={(e) => handleCustomerChange('cpfCnpj', e.target.value)}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  value={formData.customer.phone}
                  onChange={(e) => handleCustomerChange('phone', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Dados da Cobrança */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Dados da Cobrança</h3>
            
            <div>
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Descreva o que está sendo cobrado..."
                required
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="value">Valor (R$)</Label>
                <Input
                  id="value"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.value}
                  onChange={(e) => handleInputChange('value', parseFloat(e.target.value))}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="dueDate">Data de Vencimento</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => handleInputChange('dueDate', e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          {/* Forma de Pagamento */}
          <div className="space-y-4">
            <Label>Forma de Pagamento</Label>
            <RadioGroup
              value={formData.billingType}
              onValueChange={(value: 'BOLETO' | 'CREDIT_CARD' | 'PIX') => handleInputChange('billingType', value)}
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

          {/* Botões de Ação */}
          <div className="flex gap-4 pt-4">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancelar
              </Button>
            )}
            <Button type="submit" disabled={loading} className="bg-comademig-blue hover:bg-comademig-blue/90">
              {loading ? 'Gerando...' : 'Gerar Cobrança'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
