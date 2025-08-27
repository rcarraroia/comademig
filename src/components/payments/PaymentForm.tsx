
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAsaasPayments, PaymentData } from '@/hooks/useAsaasPayments';
import { useMemberTypes } from '@/hooks/useMemberTypes';
import { useSubscriptionPlans } from '@/hooks/useSubscriptionPlans';
import { CreditCard, FileText, Smartphone, CheckCircle, Info, Users } from 'lucide-react';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

interface PaymentFormProps {
  defaultData?: Partial<PaymentData>;
  onSuccess?: (cobranca: any, selectedMemberType?: string, selectedPlan?: string) => void;
  onCancel?: () => void;
  showTitle?: boolean;
  showMemberTypeSelection?: boolean; // Nova prop para controlar se mostra seleção de cargo
}

export const PaymentForm = ({ 
  defaultData, 
  onSuccess, 
  onCancel, 
  showTitle = true, 
  showMemberTypeSelection = false 
}: PaymentFormProps) => {
  const { createPayment, loading } = useAsaasPayments();
  const { memberTypes, isLoading: loadingMemberTypes } = useMemberTypes();
  const { getPlansForMemberType, formatPrice } = useSubscriptionPlans();
  const [paymentResult, setPaymentResult] = useState<any>(null);
  const [selectedMemberType, setSelectedMemberType] = useState<string>('');
  const [selectedPlan, setSelectedPlan] = useState<string>('');
  const [availablePlans, setAvailablePlans] = useState<any[]>([]);
  
  const [formData, setFormData] = useState<PaymentData>({
    customer: {
      name: defaultData?.customer?.name || '',
      email: defaultData?.customer?.email || '',
      cpfCnpj: defaultData?.customer?.cpfCnpj || '',
      phone: defaultData?.customer?.phone || '',
      address: defaultData?.customer?.address || '',
      addressNumber: defaultData?.customer?.addressNumber || '',
      city: defaultData?.customer?.city || '',
      province: defaultData?.customer?.province || 'MG',
      postalCode: defaultData?.customer?.postalCode || ''
    },
    billingType: defaultData?.billingType || 'PIX',
    value: defaultData?.value || 0,
    dueDate: defaultData?.dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    description: defaultData?.description || '',
    tipoCobranca: defaultData?.tipoCobranca || 'filiacao',
    referenciaId: defaultData?.referenciaId,
    affiliateId: defaultData?.affiliateId
  });

  // Carregar planos quando o tipo de membro for selecionado
  useEffect(() => {
    if (selectedMemberType && showMemberTypeSelection) {
      loadPlansForMemberType(selectedMemberType);
    }
  }, [selectedMemberType, showMemberTypeSelection]);

  const loadPlansForMemberType = async (memberTypeId: string) => {
    try {
      const plans = await getPlansForMemberType(memberTypeId);
      setAvailablePlans(plans);
      
      // Reset selected plan when member type changes
      setSelectedPlan('');
      
      // Reset form value when member type changes
      if (showMemberTypeSelection) {
        setFormData(prev => ({ ...prev, value: 0 }));
      }
    } catch (error) {
      console.error('Erro ao carregar planos:', error);
      setAvailablePlans([]);
    }
  };

  // Atualizar valor quando plano for selecionado
  useEffect(() => {
    if (selectedPlan && availablePlans.length > 0) {
      const plan = availablePlans.find(p => p.id === selectedPlan);
      if (plan) {
        setFormData(prev => ({ 
          ...prev, 
          value: plan.price,
          description: `${plan.name} - ${formatPrice(plan.price, plan.recurrence)}`
        }));
      }
    }
  }, [selectedPlan, availablePlans, formatPrice]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validação adicional para seleção de cargo ministerial
    if (showMemberTypeSelection && !selectedMemberType) {
      alert('Por favor, selecione seu cargo ministerial.');
      return;
    }
    
    if (showMemberTypeSelection && !selectedPlan) {
      alert('Por favor, selecione um plano de assinatura.');
      return;
    }
    
    try {
      const cobranca = await createPayment(formData);
      setPaymentResult(cobranca);
      onSuccess?.(cobranca, selectedMemberType, selectedPlan);
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

  // Se já foi gerada a cobrança, mostrar resultado
  if (paymentResult) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-600">
            <CheckCircle className="h-5 w-5" />
            Cobrança Gerada com Sucesso!
          </CardTitle>
          <CardDescription>
            Sua cobrança foi criada. Escolha como deseja pagar:
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {formData.billingType === 'PIX' && paymentResult.qrCode && (
            <div className="text-center space-y-4">
              <div className="bg-white p-4 rounded-lg border inline-block">
                <img 
                  src={`data:image/png;base64,${paymentResult.qrCode}`} 
                  alt="QR Code PIX" 
                  className="w-48 h-48 mx-auto"
                />
              </div>
              <div>
                <Label>Código PIX (Copia e Cola)</Label>
                <div className="flex gap-2">
                  <Input 
                    value={paymentResult.payload || paymentResult.qrCodePayload} 
                    readOnly 
                    className="font-mono text-xs"
                  />
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => navigator.clipboard.writeText(paymentResult.payload || paymentResult.qrCodePayload)}
                  >
                    Copiar
                  </Button>
                </div>
              </div>
            </div>
          )}

          {formData.billingType === 'BOLETO' && paymentResult.bankSlipUrl && (
            <div className="text-center space-y-4">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Seu boleto foi gerado. Clique no botão abaixo para visualizar e imprimir.
                </AlertDescription>
              </Alert>
              <Button asChild className="w-full">
                <a href={paymentResult.bankSlipUrl} target="_blank" rel="noopener noreferrer">
                  Visualizar Boleto
                </a>
              </Button>
              {paymentResult.identificationField && (
                <div>
                  <Label>Linha Digitável</Label>
                  <Input 
                    value={paymentResult.identificationField} 
                    readOnly 
                    className="font-mono text-sm"
                  />
                </div>
              )}
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
            <h4 className="font-semibold text-blue-800 mb-2">Informações do Pagamento</h4>
            <div className="space-y-1 text-sm text-blue-700">
              <p><strong>Valor:</strong> R$ {formData.value.toFixed(2)}</p>
              <p><strong>Vencimento:</strong> {new Date(formData.dueDate).toLocaleDateString('pt-BR')}</p>
              <p><strong>Descrição:</strong> {formData.description}</p>
              <p><strong>ID da Cobrança:</strong> {paymentResult.id}</p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => {
                setPaymentResult(null);
                // Reset form se necessário
              }}
              className="flex-1"
            >
              Nova Cobrança
            </Button>
            {onCancel && (
              <Button variant="outline" onClick={onCancel} className="flex-1">
                Fechar
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      {showTitle && (
        <CardHeader>
          <CardTitle>Dados para Pagamento</CardTitle>
          <CardDescription>
            Preencha seus dados para gerar a cobrança
          </CardDescription>
        </CardHeader>
      )}
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Seleção de Cargo Ministerial */}
          {showMemberTypeSelection && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <Users className="h-5 w-5" />
                Cargo Ministerial e Plano de Assinatura
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="memberType">Cargo Ministerial *</Label>
                  <Select 
                    value={selectedMemberType} 
                    onValueChange={setSelectedMemberType}
                    disabled={loadingMemberTypes}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione seu cargo ministerial" />
                    </SelectTrigger>
                    <SelectContent>
                      {memberTypes.map((type) => (
                        <SelectItem key={type.id} value={type.id}>
                          <div>
                            <div className="font-medium">{type.name}</div>
                            {type.description && (
                              <div className="text-sm text-gray-500">{type.description}</div>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {loadingMemberTypes && (
                    <p className="text-sm text-gray-500 mt-1">Carregando cargos...</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="subscriptionPlan">Plano de Assinatura *</Label>
                  <Select 
                    value={selectedPlan} 
                    onValueChange={setSelectedPlan}
                    disabled={!selectedMemberType || availablePlans.length === 0}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um plano" />
                    </SelectTrigger>
                    <SelectContent>
                      {availablePlans.map((plan) => (
                        <SelectItem key={plan.id} value={plan.id}>
                          <div>
                            <div className="font-medium">{plan.name}</div>
                            <div className="text-sm text-gray-500">
                              {formatPrice(plan.price, plan.recurrence)}
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedMemberType && availablePlans.length === 0 && (
                    <p className="text-sm text-orange-600 mt-1">
                      Nenhum plano disponível para este cargo
                    </p>
                  )}
                </div>
              </div>

              {selectedPlan && availablePlans.length > 0 && (
                <Alert className="border-blue-200 bg-blue-50">
                  <Info className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800">
                    {(() => {
                      const plan = availablePlans.find(p => p.id === selectedPlan);
                      return plan ? (
                        <div>
                          <strong>Plano Selecionado:</strong> {plan.name}
                          <br />
                          <strong>Valor:</strong> {formatPrice(plan.price, plan.recurrence)}
                          {plan.description && (
                            <>
                              <br />
                              <strong>Descrição:</strong> {plan.description}
                            </>
                          )}
                        </div>
                      ) : null;
                    })()}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

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
              {loading ? (
                <>
                  <LoadingSpinner />
                  Gerando Cobrança...
                </>
              ) : (
                'Gerar Cobrança'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
