import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  CreditCard, 
  DollarSign, 
  Calendar, 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Building, 
  Loader2,
  CheckCircle,
  Info,
  AlertTriangle
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useFiliacaoPayment, type FiliacaoPaymentData } from '@/hooks/useFiliacaoPayment';
import { formatCurrency } from '@/hooks/useFiliacaoFlow';
import { toast } from 'sonner';
import type { UnifiedMemberType } from '@/hooks/useMemberTypeWithPlan';

// Schema de validação para o formulário
const PaymentFormSchema = z.object({
  // Dados pessoais
  nome_completo: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  cpf: z.string().min(11, 'CPF deve ter 11 dígitos').regex(/^\d{11}$/, 'CPF deve conter apenas números'),
  telefone: z.string().min(10, 'Telefone deve ter pelo menos 10 dígitos'),
  email: z.string().email('Email inválido'),
  
  // Endereço
  cep: z.string().min(8, 'CEP deve ter 8 dígitos').regex(/^\d{8}$/, 'CEP deve conter apenas números'),
  endereco: z.string().min(5, 'Endereço deve ter pelo menos 5 caracteres'),
  numero: z.string().min(1, 'Número é obrigatório'),
  complemento: z.string().optional(),
  bairro: z.string().min(2, 'Bairro deve ter pelo menos 2 caracteres'),
  cidade: z.string().min(2, 'Cidade deve ter pelo menos 2 caracteres'),
  estado: z.string().length(2, 'Estado deve ter 2 caracteres'),
  
  // Igreja
  igreja: z.string().min(2, 'Nome da igreja deve ter pelo menos 2 caracteres'),
  cargo_igreja: z.string().optional(),
  tempo_ministerio: z.string().optional(),
  
  // Método de pagamento
  payment_method: z.enum(['pix', 'credit_card', 'boleto'], {
    errorMap: () => ({ message: 'Selecione um método de pagamento' })
  }),
  
  // Dados do cartão (condicionais)
  card_holder_name: z.string().optional(),
  card_number: z.string().optional(),
  card_expiry_month: z.string().optional(),
  card_expiry_year: z.string().optional(),
  card_ccv: z.string().optional(),
  card_installments: z.string().optional(),
  
  // Data de vencimento para boleto
  boleto_due_date: z.string().optional(),
  
  // Termos
  accept_terms: z.boolean().refine(val => val === true, {
    message: 'Você deve aceitar os termos e condições'
  }),
  accept_privacy: z.boolean().refine(val => val === true, {
    message: 'Você deve aceitar a política de privacidade'
  }),
}).refine((data) => {
  // Validação condicional para cartão de crédito
  if (data.payment_method === 'credit_card') {
    return data.card_holder_name && 
           data.card_number && 
           data.card_expiry_month && 
           data.card_expiry_year && 
           data.card_ccv;
  }
  return true;
}, {
  message: 'Todos os dados do cartão são obrigatórios',
  path: ['card_number']
});

type PaymentFormData = z.infer<typeof PaymentFormSchema>;

interface PaymentFormEnhancedProps {
  selectedMemberType: UnifiedMemberType;
  affiliateInfo?: any;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function PaymentFormEnhanced({
  selectedMemberType,
  affiliateInfo,
  onSuccess,
  onCancel
}: PaymentFormEnhancedProps) {
  const { user } = useAuth();
  const { 
    processarFiliacaoComPagamento, 
    isProcessing, 
    paymentStatus,
    error 
  } = useFiliacaoPayment({
    selectedMemberType,
    affiliateInfo
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors }
  } = useForm<PaymentFormData>({
    resolver: zodResolver(PaymentFormSchema),
    defaultValues: {
      nome_completo: user?.user_metadata?.nome_completo || '',
      email: user?.email || '',
      payment_method: 'pix',
      card_installments: '1',
      accept_terms: false,
      accept_privacy: false,
    }
  });

  const paymentMethod = watch('payment_method');
  const acceptTerms = watch('accept_terms');
  const acceptPrivacy = watch('accept_privacy');

  // Calcular desconto PIX
  const originalPrice = selectedMemberType.plan_value || 0;
  const calculatePixDiscount = (price: number) => {
    const discountPercentage = 0.05; // 5%
    const discount = price * discountPercentage;
    const finalPrice = price - discount;
    return { discount, finalPrice, discountPercentage };
  };
  
  const { discount: pixDiscount, finalPrice } = paymentMethod === 'pix' 
    ? calculatePixDiscount(originalPrice)
    : { discount: 0, finalPrice: originalPrice };

  const onSubmit = async (data: PaymentFormData) => {
    if (!selectedMemberType.plan_id) {
      toast.error('Tipo de membro selecionado não possui plano associado');
      return;
    }

    try {
      const filiacaoData: FiliacaoPaymentData = {
        nome_completo: data.nome_completo,
        cpf: data.cpf,
        telefone: data.telefone,
        email: data.email,
        cep: data.cep,
        endereco: data.endereco,
        numero: data.numero,
        complemento: data.complemento,
        bairro: data.bairro,
        cidade: data.cidade,
        estado: data.estado,
        igreja: data.igreja,
        cargo_igreja: data.cargo_igreja,
        tempo_ministerio: data.tempo_ministerio,
        payment_method: data.payment_method,
      };

      // Adicionar dados específicos do método de pagamento
      if (data.payment_method === 'credit_card' && data.card_holder_name) {
        filiacaoData.cardData = {
          holderName: data.card_holder_name,
          number: data.card_number!.replace(/\s/g, ''),
          expiryMonth: data.card_expiry_month!,
          expiryYear: data.card_expiry_year!,
          ccv: data.card_ccv!,
          installmentCount: parseInt(data.card_installments || '1')
        };
      }

      if (data.payment_method === 'boleto' && data.boleto_due_date) {
        filiacaoData.dueDate = data.boleto_due_date;
      }

      const result = await processarFiliacaoComPagamento(filiacaoData);
      
      if (result) {
        // Mostrar informações específicas do pagamento
        if (result.payment.pixQrCode) {
          toast.success('PIX gerado! Use o QR Code para pagamento.');
        } else if (result.payment.bankSlipUrl) {
          toast.success('Boleto gerado! Você pode baixá-lo para pagamento.');
        } else {
          toast.success('Pagamento processado com sucesso!');
        }
        onSuccess();
      }
    } catch (error: any) {
      // Erro já tratado no hook
      console.error('Erro no formulário de filiação:', error);
    }
  };



  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Resumo da Filiação */}
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-800">
            <CheckCircle className="h-5 w-5" />
            Resumo da Filiação
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-green-700">Tipo de Membro:</p>
              <p className="text-lg font-semibold text-green-800">{selectedMemberType.name}</p>
              {selectedMemberType.description && (
                <p className="text-sm text-green-600 mt-1">{selectedMemberType.description}</p>
              )}
            </div>
            
            {selectedMemberType.plan_title && (
              <div>
                <p className="text-sm font-medium text-green-700">Plano:</p>
                <p className="text-lg font-semibold text-green-800">{selectedMemberType.plan_title}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Calendar className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-green-600">{selectedMemberType.plan_recurrence}</span>
                </div>
              </div>
            )}
          </div>

          {/* Indicação de Afiliado */}
          {affiliateInfo && (
            <div className="mt-4 p-3 bg-white rounded border border-green-200">
              <p className="text-sm font-medium text-green-700">Indicado por:</p>
              <Badge variant="secondary">{affiliateInfo.referralCode}</Badge>
            </div>
          )}
        </CardContent>
      </Card>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Dados Pessoais */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Dados Pessoais
            </CardTitle>
            <CardDescription>
              Preencha seus dados pessoais para a filiação
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="nome_completo">Nome Completo *</Label>
                <Input
                  id="nome_completo"
                  {...register('nome_completo')}
                  placeholder="Seu nome completo"
                />
                {errors.nome_completo && (
                  <p className="text-sm text-destructive">{errors.nome_completo.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="cpf">CPF *</Label>
                <Input
                  id="cpf"
                  {...register('cpf')}
                  placeholder="00000000000"
                  maxLength={11}
                />
                {errors.cpf && (
                  <p className="text-sm text-destructive">{errors.cpf.message}</p>
                )}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="telefone">Telefone *</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="telefone"
                    {...register('telefone')}
                    placeholder="(31) 99999-9999"
                    className="pl-10"
                  />
                </div>
                {errors.telefone && (
                  <p className="text-sm text-destructive">{errors.telefone.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="email">Email *</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    {...register('email')}
                    placeholder="seu@email.com"
                    className="pl-10"
                  />
                </div>
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email.message}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Endereço */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Endereço
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="cep">CEP *</Label>
                <Input
                  id="cep"
                  {...register('cep')}
                  placeholder="00000000"
                  maxLength={8}
                />
                {errors.cep && (
                  <p className="text-sm text-destructive">{errors.cep.message}</p>
                )}
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="endereco">Endereço *</Label>
                <Input
                  id="endereco"
                  {...register('endereco')}
                  placeholder="Rua, Avenida, etc."
                />
                {errors.endereco && (
                  <p className="text-sm text-destructive">{errors.endereco.message}</p>
                )}
              </div>
            </div>

            <div className="grid md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="numero">Número *</Label>
                <Input
                  id="numero"
                  {...register('numero')}
                  placeholder="123"
                />
                {errors.numero && (
                  <p className="text-sm text-destructive">{errors.numero.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="complemento">Complemento</Label>
                <Input
                  id="complemento"
                  {...register('complemento')}
                  placeholder="Apto, Sala, etc."
                />
              </div>

              <div>
                <Label htmlFor="bairro">Bairro *</Label>
                <Input
                  id="bairro"
                  {...register('bairro')}
                  placeholder="Nome do bairro"
                />
                {errors.bairro && (
                  <p className="text-sm text-destructive">{errors.bairro.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="estado">Estado *</Label>
                <Input
                  id="estado"
                  {...register('estado')}
                  placeholder="MG"
                  maxLength={2}
                />
                {errors.estado && (
                  <p className="text-sm text-destructive">{errors.estado.message}</p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="cidade">Cidade *</Label>
              <Input
                id="cidade"
                {...register('cidade')}
                placeholder="Nome da cidade"
              />
              {errors.cidade && (
                <p className="text-sm text-destructive">{errors.cidade.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Dados Ministeriais */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Dados Ministeriais
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="igreja">Igreja *</Label>
              <Input
                id="igreja"
                {...register('igreja')}
                placeholder="Nome da sua igreja"
              />
              {errors.igreja && (
                <p className="text-sm text-destructive">{errors.igreja.message}</p>
              )}
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="cargo_igreja">Cargo na Igreja</Label>
                <Input
                  id="cargo_igreja"
                  {...register('cargo_igreja')}
                  placeholder="Ex: Pastor, Diácono, Membro"
                />
              </div>

              <div>
                <Label htmlFor="tempo_ministerio">Tempo de Ministério</Label>
                <Input
                  id="tempo_ministerio"
                  {...register('tempo_ministerio')}
                  placeholder="Ex: 5 anos, 10 anos"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Método de Pagamento */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Método de Pagamento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Escolha o método de pagamento</Label>
              <Select value={paymentMethod} onValueChange={(value) => setValue('payment_method', value as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pix">
                    <div className="flex items-center gap-2">
                      <span>PIX</span>
                      <Badge variant="secondary" className="text-xs">5% desconto</Badge>
                    </div>
                  </SelectItem>
                  <SelectItem value="credit_card">Cartão de Crédito</SelectItem>
                  <SelectItem value="boleto">Boleto Bancário</SelectItem>
                </SelectContent>
              </Select>
              {errors.payment_method && (
                <p className="text-sm text-destructive">{errors.payment_method.message}</p>
              )}
            </div>

            {/* Resumo de Valores */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Resumo de Valores
              </h4>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Valor do plano:</span>
                  <span>{formatCurrency(originalPrice)}</span>
                </div>
                
                {pixDiscount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Desconto PIX (5%):</span>
                    <span>-{formatCurrency(pixDiscount)}</span>
                  </div>
                )}
                
                <Separator />
                
                <div className="flex justify-between font-semibold text-lg">
                  <span>Total a pagar:</span>
                  <span className="text-green-600">{formatCurrency(finalPrice)}</span>
                </div>
                
                <p className="text-xs text-muted-foreground">
                  Cobrança {selectedMemberType.plan_recurrence?.toLowerCase()}
                </p>
              </div>
            </div>

            {/* Campos específicos por método de pagamento */}
            {paymentMethod === 'credit_card' && (
              <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
                <h4 className="font-medium">Dados do Cartão de Crédito</h4>
                
                <div>
                  <Label htmlFor="card_holder_name">Nome no Cartão *</Label>
                  <Input
                    id="card_holder_name"
                    {...register('card_holder_name')}
                    placeholder="Nome como está no cartão"
                  />
                  {errors.card_holder_name && (
                    <p className="text-sm text-destructive">{errors.card_holder_name.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="card_number">Número do Cartão *</Label>
                  <Input
                    id="card_number"
                    {...register('card_number')}
                    placeholder="0000 0000 0000 0000"
                    maxLength={19}
                  />
                  {errors.card_number && (
                    <p className="text-sm text-destructive">{errors.card_number.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="card_expiry_month">Mês *</Label>
                    <Select onValueChange={(value) => setValue('card_expiry_month', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Mês" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 12 }, (_, i) => (
                          <SelectItem key={i + 1} value={String(i + 1).padStart(2, '0')}>
                            {String(i + 1).padStart(2, '0')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.card_expiry_month && (
                      <p className="text-sm text-destructive">{errors.card_expiry_month.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="card_expiry_year">Ano *</Label>
                    <Select onValueChange={(value) => setValue('card_expiry_year', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Ano" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 10 }, (_, i) => {
                          const year = new Date().getFullYear() + i;
                          return (
                            <SelectItem key={year} value={String(year)}>
                              {year}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                    {errors.card_expiry_year && (
                      <p className="text-sm text-destructive">{errors.card_expiry_year.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="card_ccv">CVV *</Label>
                    <Input
                      id="card_ccv"
                      {...register('card_ccv')}
                      placeholder="123"
                      maxLength={4}
                    />
                    {errors.card_ccv && (
                      <p className="text-sm text-destructive">{errors.card_ccv.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="card_installments">Parcelas</Label>
                  <Select 
                    value={watch('card_installments')} 
                    onValueChange={(value) => setValue('card_installments', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 12 }, (_, i) => {
                        const installments = i + 1;
                        const installmentValue = finalPrice / installments;
                        return (
                          <SelectItem key={installments} value={String(installments)}>
                            {installments}x de {formatCurrency(installmentValue)}
                            {installments === 1 ? ' à vista' : ''}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {paymentMethod === 'boleto' && (
              <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
                <h4 className="font-medium">Configurações do Boleto</h4>
                
                <div>
                  <Label htmlFor="boleto_due_date">Data de Vencimento</Label>
                  <Input
                    id="boleto_due_date"
                    type="date"
                    {...register('boleto_due_date')}
                    min={new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Se não informado, será gerado com vencimento em 7 dias
                  </p>
                </div>

                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Após a confirmação, você receberá o boleto por email e poderá baixá-lo.
                    Multa de 2% e juros de 1% ao mês após o vencimento.
                  </AlertDescription>
                </Alert>
              </div>
            )}

            {paymentMethod === 'pix' && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Após confirmar, você receberá o código PIX para pagamento. 
                  O desconto de 5% já está aplicado no valor final.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Termos e Condições */}
        <Card>
          <CardHeader>
            <CardTitle>Termos e Condições</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start space-x-3">
              <Checkbox
                id="accept_terms"
                checked={acceptTerms}
                onCheckedChange={(checked) => setValue('accept_terms', checked as boolean)}
              />
              <div className="grid gap-1.5 leading-none">
                <Label htmlFor="accept_terms" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Aceito os termos e condições da COMADEMIG
                </Label>
                <p className="text-xs text-muted-foreground">
                  Li e concordo com os <a href="/termos" target="_blank" className="underline">termos de uso</a> da plataforma.
                </p>
              </div>
            </div>
            {errors.accept_terms && (
              <p className="text-sm text-destructive">{errors.accept_terms.message}</p>
            )}

            <div className="flex items-start space-x-3">
              <Checkbox
                id="accept_privacy"
                checked={acceptPrivacy}
                onCheckedChange={(checked) => setValue('accept_privacy', checked as boolean)}
              />
              <div className="grid gap-1.5 leading-none">
                <Label htmlFor="accept_privacy" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Aceito a política de privacidade
                </Label>
                <p className="text-xs text-muted-foreground">
                  Concordo com o tratamento dos meus dados conforme a <a href="/privacidade" target="_blank" className="underline">política de privacidade</a>.
                </p>
              </div>
            </div>
            {errors.accept_privacy && (
              <p className="text-sm text-destructive">{errors.accept_privacy.message}</p>
            )}
          </CardContent>
        </Card>

        {/* Status do Processamento */}
        {isProcessing && (
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                <div>
                  <p className="font-medium text-blue-800">
                    {paymentStatus === 'creating_customer' && 'Criando cliente...'}
                    {paymentStatus === 'processing_payment' && 'Processando pagamento...'}
                    {paymentStatus === 'updating_profile' && 'Atualizando perfil...'}
                    {paymentStatus === 'completed' && 'Finalizando...'}
                    {paymentStatus === 'idle' && 'Processando...'}
                  </p>
                  <p className="text-sm text-blue-600">
                    Por favor, aguarde. Não feche esta página.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Botões de Ação */}
        <div className="flex flex-col sm:flex-row gap-4 justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isProcessing}
          >
            Cancelar
          </Button>
          
          <Button
            type="submit"
            disabled={isProcessing || !acceptTerms || !acceptPrivacy}
            className="bg-comademig-blue hover:bg-comademig-blue/90"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {paymentStatus === 'creating_customer' && 'Criando cliente...'}
                {paymentStatus === 'processing_payment' && 'Processando pagamento...'}
                {paymentStatus === 'updating_profile' && 'Atualizando perfil...'}
                {paymentStatus === 'completed' && 'Finalizando...'}
                {paymentStatus === 'idle' && 'Processando...'}
              </>
            ) : (
              <>
                Finalizar Filiação
                <CheckCircle className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
        </div>

        {/* Informações sobre Pagamento */}
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Sistema de Pagamentos Integrado:</strong> Processamento automático via gateway Asaas.
            Seus dados estão protegidos e o pagamento é processado de forma segura.
            {paymentMethod === 'pix' && ' PIX disponível 24h com desconto de 5%.'}
            {paymentMethod === 'credit_card' && ' Cartão processado instantaneamente.'}
            {paymentMethod === 'boleto' && ' Boleto com confirmação automática em até 3 dias úteis.'}
          </AlertDescription>
        </Alert>
      </form>
    </div>
  );
}