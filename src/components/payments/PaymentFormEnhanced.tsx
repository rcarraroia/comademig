import React, { useState } from 'react';
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
  Loader2,
  CheckCircle,
  Info,
  AlertTriangle,
  Eye,
  EyeOff
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useFiliacaoPayment, type FiliacaoPaymentData } from '@/hooks/useFiliacaoPayment';
import { formatCurrency } from '@/hooks/useFiliacaoFlow';
import { toast } from 'sonner';
import type { UnifiedMemberType } from '@/hooks/useMemberTypeWithPlan';
import { 
  fieldValidations,
  type FiliacaoFormData 
} from '@/lib/validations/filiacaoValidation';
import { supabase } from '@/integrations/supabase/client';

// Schema de validação compatível com API Asaas
const createPaymentFormSchema = (isLoggedIn: boolean) => {
  return z.object({
    // Dados pessoais básicos
    nome_completo: isLoggedIn ? z.string().optional() : z.string().min(2, 'Nome completo é obrigatório'),
    email: isLoggedIn ? z.string().optional() : z.string().email('Email inválido'),
    cpf: z.string().min(11, 'CPF é obrigatório').optional(),
    telefone: z.string().min(10, 'Telefone é obrigatório').optional(),
    
    // Endereço
    cep: z.string().min(8, 'CEP é obrigatório').optional(),
    endereco: z.string().min(5, 'Endereço é obrigatório').optional(),
    numero: z.string().min(1, 'Número é obrigatório').optional(),
    complemento: z.string().optional(),
    bairro: z.string().min(2, 'Bairro é obrigatório').optional(),
    cidade: z.string().min(2, 'Cidade é obrigatória').optional(),
    estado: z.string().length(2, 'Estado deve ter 2 caracteres').optional(),
    
    // Método de pagamento
    payment_method: z.literal('credit_card'),
    
    // Dados do cartão (conforme API Asaas)
    card_holder_name: z.string().min(2, 'Nome no cartão é obrigatório'),
    card_number: z.string().min(13, 'Número do cartão é obrigatório'),
    card_expiry_month: z.string().min(1, 'Mês de vencimento é obrigatório'),
    card_expiry_year: z.string().min(4, 'Ano de vencimento é obrigatório'),
    card_ccv: z.string().min(3, 'CVV é obrigatório'),
    card_installments: z.string().optional(),
    
    // Senha (apenas para usuários não logados)
    password: isLoggedIn ? z.string().optional() : z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
    password_confirmation: isLoggedIn ? z.string().optional() : z.string(),
    
    // Termos obrigatórios
    accept_terms: z.boolean().refine(val => val === true, {
      message: 'Você deve aceitar os termos e condições'
    }),
    accept_privacy: z.boolean().refine(val => val === true, {
      message: 'Você deve aceitar a política de privacidade'
    }),
  }).refine((data) => {
    // Validação de senhas para usuários não logados
    if (!isLoggedIn && data.password !== data.password_confirmation) {
      return false;
    }
    return true;
  }, {
    message: 'As senhas não conferem',
    path: ['password_confirmation']
  });
};

type PaymentFormData = z.infer<ReturnType<typeof createPaymentFormSchema>>;

interface PaymentFormEnhancedProps {
  selectedMemberType: UnifiedMemberType;
  affiliateInfo?: any;
  onSuccess: (result?: { paymentId?: string; userId?: string }) => void;
  onError: (error: any) => void;
  onCancel: () => void;
  usePaymentFirstFlow?: boolean;
}

export default function PaymentFormEnhanced({
  selectedMemberType,
  affiliateInfo,
  onSuccess,
  onError,
  onCancel,
  usePaymentFirstFlow = false
}: PaymentFormEnhancedProps) {
  const { user, loading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false);
  const [cpfValidationMessage, setCpfValidationMessage] = useState<string>('');
  const [cepValidationMessage, setCepValidationMessage] = useState<string>('');
  const [phoneValidationMessage, setPhoneValidationMessage] = useState<string>('');
  const [cardValidationMessage, setCardValidationMessage] = useState<string>('');
  const [expiryValidationMessage, setExpiryValidationMessage] = useState<string>('');
  const [userProfile, setUserProfile] = useState<any>(null);
  

  
  const { 
    processarFiliacaoComPagamento, 
    isProcessing, 
    paymentStatus,
    error 
  } = useFiliacaoPayment({
    selectedMemberType,
    affiliateInfo,
    usePaymentFirstFlow
  });

  // Buscar dados do perfil se usuário estiver logado
  React.useEffect(() => {
    if (user) {
      // Buscar dados do perfil do usuário logado
      const fetchUserProfile = async () => {
        try {
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('nome_completo, cpf, telefone, cep, endereco, numero, complemento, bairro, cidade, estado')
            .eq('id', user.id)
            .single();

          if (error) {
            console.warn('Não foi possível buscar dados do perfil:', error);
          } else {
            setUserProfile(profile);
            
            // Verificar se dados obrigatórios estão presentes
            const missingFields = [];
            if (!profile?.nome_completo) missingFields.push('Nome completo');
            if (!profile?.cpf) missingFields.push('CPF');
            if (!profile?.telefone) missingFields.push('Telefone');
          }
        } catch (error) {
          console.warn('Erro ao buscar perfil:', error);
        }
      };

      fetchUserProfile();
    }
  }, [user]);

  // Não renderizar até que o estado de autenticação seja determinado
  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
              <p>Carregando...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors }
  } = useForm<PaymentFormData>({
    resolver: zodResolver(createPaymentFormSchema(!!user)),
    defaultValues: {
      nome_completo: user?.user_metadata?.nome_completo || userProfile?.nome_completo || '',
      email: user?.email || '',
      cpf: userProfile?.cpf || '',
      telefone: userProfile?.telefone || '',
      cep: userProfile?.cep || '',
      endereco: userProfile?.endereco || '',
      numero: userProfile?.numero || '',
      complemento: userProfile?.complemento || '',
      bairro: userProfile?.bairro || '',
      cidade: userProfile?.cidade || '',
      estado: userProfile?.estado || '',
      payment_method: 'credit_card',
      card_installments: '1',
      accept_terms: false,
      accept_privacy: false,
    }
  });

  const paymentMethod = watch('payment_method');
  const acceptTerms = watch('accept_terms');
  const acceptPrivacy = watch('accept_privacy');
  const cpfValue = watch('cpf');
  const cepValue = watch('cep');
  const phoneValue = watch('telefone');
  const cardNumberValue = watch('card_number');
  const cardExpiryMonth = watch('card_expiry_month');
  const cardExpiryYear = watch('card_expiry_year');

  // Validação em tempo real do CPF
  const validateCPFRealTime = (cpf: string) => {
    const validation = fieldValidations.validateCPFField(cpf);
    setCpfValidationMessage(validation.message);
  };

  // Validação em tempo real do CEP
  const validateCEPRealTime = (cep: string) => {
    const validation = fieldValidations.validateCEPField(cep);
    setCepValidationMessage(validation.message);
  };

  // Validação em tempo real do telefone
  const validatePhoneRealTime = (phone: string) => {
    const validation = fieldValidations.validatePhoneField(phone);
    setPhoneValidationMessage(validation.message);
  };

  // Validação em tempo real do cartão
  const validateCardRealTime = (cardNumber: string) => {
    const validation = fieldValidations.validateCardNumber(cardNumber);
    setCardValidationMessage(validation.message);
  };

  // Validação em tempo real da data de expiração
  const validateExpiryRealTime = (month: string, year: string) => {
    const validation = fieldValidations.validateExpiryDate(month, year);
    setExpiryValidationMessage(validation.message);
  };

  // Executar validações em tempo real
  React.useEffect(() => {
    validateCPFRealTime(cpfValue || '');
  }, [cpfValue]);

  React.useEffect(() => {
    validateCEPRealTime(cepValue || '');
  }, [cepValue]);

  React.useEffect(() => {
    validatePhoneRealTime(phoneValue || '');
  }, [phoneValue]);

  React.useEffect(() => {
    validateCardRealTime(cardNumberValue || '');
  }, [cardNumberValue]);

  React.useEffect(() => {
    validateExpiryRealTime(cardExpiryMonth || '', cardExpiryYear || '');
  }, [cardExpiryMonth, cardExpiryYear]);

  // Valor do plano (sem desconto PIX)
  const originalPrice = selectedMemberType.plan_value || 0;
  const finalPrice = originalPrice;

  const onSubmit = async (data: PaymentFormData) => {
    if (!selectedMemberType.plan_id) {
      toast.error('Tipo de membro selecionado não possui plano associado');
      return;
    }

    try {
      // Para usuários logados, usar dados do perfil se não fornecidos no formulário
      let filiacaoData: FiliacaoPaymentData;
      
      if (user) {
        // Usuário logado - combinar dados do perfil com dados do formulário
        filiacaoData = {
          nome_completo: userProfile?.nome_completo || user.user_metadata?.nome_completo || user.email || '',
          cpf: data.cpf || userProfile?.cpf || '',
          telefone: data.telefone || userProfile?.telefone || '',
          email: user.email || '',
          cep: data.cep || userProfile?.cep || '',
          endereco: data.endereco || userProfile?.endereco || '',
          numero: data.numero || userProfile?.numero || '',
          complemento: data.complemento || userProfile?.complemento || '',
          bairro: data.bairro || userProfile?.bairro || '',
          cidade: data.cidade || userProfile?.cidade || '',
          estado: data.estado || userProfile?.estado || '',
          payment_method: data.payment_method,
        };
        
        // Validar se dados obrigatórios estão presentes
        if (!filiacaoData.cpf) {
          toast.error('CPF é obrigatório. Complete seus dados no formulário.');
          return;
        }
        if (!filiacaoData.telefone) {
          toast.error('Telefone é obrigatório. Complete seus dados no formulário.');
          return;
        }
        if (!filiacaoData.cep) {
          toast.error('CEP é obrigatório. Complete seus dados no formulário.');
          return;
        }
        if (!filiacaoData.endereco) {
          toast.error('Endereço é obrigatório. Complete seus dados no formulário.');
          return;
        }
      } else {
        // Usuário não logado - usar dados do formulário
        filiacaoData = {
          nome_completo: data.nome_completo!,
          cpf: data.cpf!,
          telefone: data.telefone!,
          email: data.email!,
          cep: data.cep!,
          endereco: data.endereco!,
          numero: data.numero!,
          complemento: data.complemento,
          bairro: data.bairro!,
          cidade: data.cidade!,
          estado: data.estado!,
          payment_method: data.payment_method,
          password: data.password,
        };
      }

      // Adicionar dados do cartão conforme API Asaas
      if (data.payment_method === 'credit_card' && data.card_holder_name) {
        // Obter IP do cliente (necessário para API Asaas)
        let clientIp = '';
        try {
          const ipResponse = await fetch('https://api.ipify.org?format=json');
          const ipData = await ipResponse.json();
          clientIp = ipData.ip;
        } catch (error) {
          console.warn('Não foi possível obter IP do cliente:', error);
          clientIp = '127.0.0.1'; // Fallback
        }

        // Estrutura conforme API Asaas
        filiacaoData.creditCard = {
          holderName: data.card_holder_name,
          number: data.card_number!.replace(/\s/g, ''),
          expiryMonth: data.card_expiry_month!,
          expiryYear: data.card_expiry_year!,
          ccv: data.card_ccv!,
        };

        filiacaoData.creditCardHolderInfo = {
          name: data.nome_completo || filiacaoData.nome_completo,
          email: data.email || filiacaoData.email,
          cpfCnpj: (data.cpf || filiacaoData.cpf).replace(/\D/g, ''),
          postalCode: (data.cep || filiacaoData.cep).replace(/\D/g, ''),
          addressNumber: data.numero || filiacaoData.numero || 'S/N',
          addressComplement: data.complemento || filiacaoData.complemento || undefined,
          phone: (data.telefone || filiacaoData.telefone).replace(/\D/g, ''),
          mobilePhone: undefined, // Opcional
        };

        filiacaoData.remoteIp = clientIp;
      }

      console.log('🚀 Processando filiação com dados:', {
        nome: filiacaoData.nome_completo,
        email: filiacaoData.email,
        hasCard: !!filiacaoData.creditCard,
        hasCardHolder: !!filiacaoData.creditCardHolderInfo
      });

      const result = await processarFiliacaoComPagamento(filiacaoData);
      
      if (result) {
        // Mostrar informações específicas do pagamento
        if (result.asaasSubscription) {
          toast.success('Assinatura criada com sucesso! Você receberá as instruções de pagamento por email.');
        } else {
          toast.success('Filiação processada com sucesso!');
        }
        
        // Chamar callback de sucesso com dados do resultado
        onSuccess({
          paymentId: result.paymentId,
          userId: result.userId
        });
      }
    } catch (error: any) {
      // Erro já tratado no hook
      console.error('Erro no formulário de filiação:', error);
      
      // Chamar callback de erro
      onError(error);
      
      // Mostrar mensagem de erro específica ao usuário (apenas se não for novo fluxo)
      if (!usePaymentFirstFlow) {
        const errorMessage = error?.message || 'Erro ao processar filiação';
        
        if (errorMessage.includes('email_already_exists') || errorMessage.includes('já está cadastrado')) {
          toast.error('Este email já está cadastrado. Faça login ou use "Esqueci minha senha".');
        } else if (errorMessage.includes('CPF inválido')) {
          toast.error('CPF inválido. Verifique os números digitados e tente novamente.');
        } else if (errorMessage.includes('Telefone inválido')) {
          toast.error('Telefone inválido. Use o formato (XX) XXXXX-XXXX.');
        } else if (errorMessage.includes('CEP inválido')) {
          toast.error('CEP inválido. Use o formato XXXXX-XXX.');
        } else if (errorMessage.includes('cartão recusado') || errorMessage.includes('card_declined')) {
          toast.error('Cartão recusado. Verifique os dados ou tente outro cartão.');
        } else if (errorMessage.includes('dados inválidos')) {
          toast.error('Alguns dados informados são inválidos. Verifique os campos e tente novamente.');
        } else {
          // Mensagem genérica para outros erros
          toast.error('Erro ao processar filiação. Tente novamente ou entre em contato com o suporte.');
        }
      }
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
            
            {selectedMemberType.plan_name && (
              <div>
                <p className="text-sm font-medium text-green-700">Plano:</p>
                <p className="text-lg font-semibold text-green-800">{selectedMemberType.plan_name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Calendar className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-green-600">{selectedMemberType.plan_recurrence}</span>
                </div>
              </div>
            )}
          </div>


        </CardContent>
      </Card>

      <form 
        onSubmit={handleSubmit(onSubmit)} 
        className="space-y-6"
      >
        {/* Dados Pessoais - APENAS para usuários NÃO logados */}
        {!user && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Dados Pessoais
              </CardTitle>
              <CardDescription>
                Preencha seus dados pessoais para criar sua conta e processar a filiação
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
                    placeholder="000.000.000-00 ou 00000000000"
                    maxLength={14}
                  />
                  {errors.cpf && (
                    <p className="text-sm text-destructive">{errors.cpf.message}</p>
                  )}
                  {cpfValidationMessage && !errors.cpf && (
                    <p className={`text-sm ${cpfValidationMessage.includes('✅') ? 'text-green-600' : 'text-orange-500'}`}>
                      {cpfValidationMessage}
                    </p>
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
                      placeholder="(31) 99999-9999 ou 31999999999"
                      className="pl-10"
                      maxLength={15}
                    />
                  </div>
                  {errors.telefone && (
                    <p className="text-sm text-destructive">{errors.telefone.message}</p>
                  )}
                  {phoneValidationMessage && !errors.telefone && (
                    <p className={`text-sm ${phoneValidationMessage.includes('✅') ? 'text-green-600' : 'text-orange-500'}`}>
                      {phoneValidationMessage}
                    </p>
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
        )}

        {/* Informações do usuário logado */}
        {user && (
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-800">
                <User className="h-5 w-5" />
                Usuário Logado
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-blue-700">Nome:</p>
                  <p className="text-blue-800">{userProfile?.nome_completo || user.user_metadata?.nome_completo || user.email}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-blue-700">Email:</p>
                  <p className="text-blue-800">{user.email}</p>
                </div>
                {userProfile?.cpf && (
                  <div>
                    <p className="text-sm font-medium text-blue-700">CPF:</p>
                    <p className="text-blue-800">{userProfile.cpf}</p>
                  </div>
                )}
                {userProfile?.telefone && (
                  <div>
                    <p className="text-sm font-medium text-blue-700">Telefone:</p>
                    <p className="text-blue-800">{userProfile.telefone}</p>
                  </div>
                )}
              </div>
              
              {userProfile?.cep && userProfile?.endereco && (
                <div className="mt-4 pt-4 border-t border-blue-200">
                  <p className="text-sm font-medium text-blue-700 mb-2">Endereço:</p>
                  <p className="text-blue-800 text-sm">
                    {userProfile.endereco}, {userProfile.numero}
                    {userProfile.complemento && `, ${userProfile.complemento}`}
                    <br />
                    {userProfile.bairro} - {userProfile.cidade}/{userProfile.estado}
                    <br />
                    CEP: {userProfile.cep}
                  </p>
                </div>
              )}
              
              <div className="mt-4 pt-4 border-t border-blue-200">
                <p className="text-xs text-blue-600">
                  ✅ Filiação será vinculada a esta conta existente.
                </p>
                {(!userProfile?.cpf || !userProfile?.telefone) && (
                  <p className="text-xs text-orange-600 mt-1">
                    ⚠️ Complete os dados obrigatórios abaixo para prosseguir.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Dados Obrigatórios Faltantes - Para usuários logados sem dados completos */}
        {user && (!userProfile?.cpf || !userProfile?.telefone || !userProfile?.cep) && (
          <Card className="border-orange-200 bg-orange-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-800">
                <AlertTriangle className="h-5 w-5" />
                Complete Seus Dados
              </CardTitle>
              <CardDescription className="text-orange-700">
                Alguns dados obrigatórios estão faltando no seu perfil. Complete-os abaixo para prosseguir com a filiação.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!userProfile?.cpf && (
                <div>
                  <Label htmlFor="cpf">CPF *</Label>
                  <Input
                    id="cpf"
                    {...register('cpf')}
                    placeholder="000.000.000-00 ou 00000000000"
                    maxLength={14}
                  />
                  {errors.cpf && (
                    <p className="text-sm text-destructive">{errors.cpf.message}</p>
                  )}
                  {cpfValidationMessage && !errors.cpf && (
                    <p className={`text-sm ${cpfValidationMessage.includes('✅') ? 'text-green-600' : 'text-orange-500'}`}>
                      {cpfValidationMessage}
                    </p>
                  )}
                </div>
              )}

              {!userProfile?.telefone && (
                <div>
                  <Label htmlFor="telefone">Telefone *</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="telefone"
                      {...register('telefone')}
                      placeholder="(31) 99999-9999 ou 31999999999"
                      className="pl-10"
                      maxLength={15}
                    />
                  </div>
                  {errors.telefone && (
                    <p className="text-sm text-destructive">{errors.telefone.message}</p>
                  )}
                  {phoneValidationMessage && !errors.telefone && (
                    <p className={`text-sm ${phoneValidationMessage.includes('✅') ? 'text-green-600' : 'text-orange-500'}`}>
                      {phoneValidationMessage}
                    </p>
                  )}
                </div>
              )}

              {!userProfile?.cep && (
                <div>
                  <Label htmlFor="cep">CEP *</Label>
                  <Input
                    id="cep"
                    {...register('cep')}
                    placeholder="00000-000 ou 00000000"
                    maxLength={9}
                  />
                  {errors.cep && (
                    <p className="text-sm text-destructive">{errors.cep.message}</p>
                  )}
                  {cepValidationMessage && !errors.cep && (
                    <p className={`text-sm ${cepValidationMessage.includes('✅') ? 'text-green-600' : 'text-orange-500'}`}>
                      {cepValidationMessage}
                    </p>
                  )}
                </div>
              )}

              {!userProfile?.endereco && (
                <div className="grid md:grid-cols-2 gap-4">
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
              )}
            </CardContent>
          </Card>
        )}

        {/* Criar Senha - APENAS se usuário NÃO estiver logado */}
        {!user && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Criar Senha de Acesso
              </CardTitle>
              <CardDescription>
                Crie uma senha para acessar sua conta após a filiação
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="password">Senha *</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    {...register('password')}
                    placeholder="Mínimo 6 caracteres, 1 maiúscula e 1 número"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-sm text-destructive">{errors.password.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="password_confirmation">Confirmar Senha *</Label>
                <div className="relative">
                  <Input
                    id="password_confirmation"
                    type={showPasswordConfirmation ? "text" : "password"}
                    {...register('password_confirmation')}
                    placeholder="Digite a senha novamente"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswordConfirmation(!showPasswordConfirmation)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPasswordConfirmation ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {errors.password_confirmation && (
                  <p className="text-sm text-destructive">{errors.password_confirmation.message}</p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Endereço - APENAS para usuários NÃO logados */}
        {!user && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Endereço
              </CardTitle>
              <CardDescription>
                Informe seu endereço para completar o cadastro
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="cep">CEP *</Label>
                  <Input
                    id="cep"
                    {...register('cep')}
                    placeholder="00000-000 ou 00000000"
                    maxLength={9}
                  />
                  {errors.cep && (
                    <p className="text-sm text-destructive">{errors.cep.message}</p>
                  )}
                  {cepValidationMessage && !errors.cep && (
                    <p className={`text-sm ${cepValidationMessage.includes('✅') ? 'text-green-600' : 'text-orange-500'}`}>
                      {cepValidationMessage}
                    </p>
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
        )}

        {/* Método de Pagamento */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Método de Pagamento
            </CardTitle>
            <CardDescription>
              Pagamento seguro via Cartão de Crédito com renovação automática
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Informação sobre método de pagamento */}
            <Alert>
              <CreditCard className="h-4 w-4" />
              <AlertDescription>
                <strong>Pagamento via Cartão de Crédito</strong>
                <br />
                Parcelamento em até 12x sem juros. 
                {(selectedMemberType.plan_recurrence?.toLowerCase() === 'mensal' || 
                  selectedMemberType.plan_recurrence?.toLowerCase() === 'monthly' ||
                  selectedMemberType.plan_recurrence?.toLowerCase() === 'semestral') && (
                  <span> Renovação automática a cada {selectedMemberType.plan_recurrence?.toLowerCase() === 'mensal' || selectedMemberType.plan_recurrence?.toLowerCase() === 'monthly' ? 'mês' : 'semestre'}.</span>
                )}
              </AlertDescription>
            </Alert>

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
                  {cardValidationMessage && !errors.card_number && (
                    <p className={`text-sm ${cardValidationMessage.includes('✅') ? 'text-green-600' : 'text-orange-500'}`}>
                      {cardValidationMessage}
                    </p>
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

                {/* Mensagem de validação da data de expiração */}
                {expiryValidationMessage && !errors.card_expiry_month && !errors.card_expiry_year && (
                  <p className={`text-sm ${expiryValidationMessage.includes('✅') ? 'text-green-600' : 'text-orange-500'}`}>
                    {expiryValidationMessage}
                  </p>
                )}

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
                    {paymentStatus === 'creating_account' && 'Criando conta...'}
                    {paymentStatus === 'creating_customer' && 'Criando cliente...'}
                    {paymentStatus === 'creating_subscription' && 'Criando assinatura...'}
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
                {paymentStatus === 'creating_account' && 'Criando conta...'}
                {paymentStatus === 'creating_customer' && 'Criando cliente...'}
                {paymentStatus === 'creating_subscription' && 'Criando assinatura...'}
                {paymentStatus === 'updating_profile' && 'Atualizando perfil...'}
                {paymentStatus === 'completed' && 'Finalizando...'}
                {paymentStatus === 'idle' && 'Processando...'}
              </>
            ) : (
              <>
                {user ? 'Processar Pagamento' : 'Finalizar Filiação'}
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
            Cartão processado instantaneamente com parcelamento em até 12x sem juros.
          </AlertDescription>
        </Alert>
      </form>
    </div>
  );
}