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
import { validateCPF, validatePhone, validateCEP } from '@/utils/validators';
import { supabase } from '@/integrations/supabase/client';

// Schema de validação para o formulário
const createPaymentFormSchema = (isLoggedIn: boolean) => z.object({
  // Dados pessoais - CONDICIONAIS para usuários logados
  nome_completo: isLoggedIn 
    ? z.string().optional() 
    : z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  cpf: isLoggedIn
    ? z.string().optional()
    : z.string()
        .transform((val) => val.replace(/\D/g, '')) // Limpar ANTES da validação
        .refine((val) => val.length === 11, 'CPF deve ter 11 dígitos')
        .refine((val) => validateCPF(val), 'CPF inválido - verifique os números digitados'),
  telefone: isLoggedIn
    ? z.string().optional()
    : z.string()
        .transform((val) => val.replace(/\D/g, '')) // Limpar ANTES da validação
        .refine((val) => val.length >= 10 && val.length <= 11, 'Telefone deve ter 10 ou 11 dígitos')
        .refine((val) => validatePhone(val), 'Telefone inválido - use formato (XX) XXXXX-XXXX'),
  email: isLoggedIn 
    ? z.string().optional()
    : z.string().email('Email inválido'),
  
  // Endereço - CONDICIONAIS para usuários logados
  cep: isLoggedIn
    ? z.string().optional()
    : z.string()
        .transform((val) => val.replace(/\D/g, '')) // Limpar ANTES da validação
        .refine((val) => val.length === 8, 'CEP deve ter 8 dígitos')
        .refine((val) => validateCEP(val), 'CEP inválido - use formato XXXXX-XXX'),
  endereco: isLoggedIn ? z.string().optional() : z.string().min(5, 'Endereço deve ter pelo menos 5 caracteres'),
  numero: isLoggedIn ? z.string().optional() : z.string().min(1, 'Número é obrigatório'),
  complemento: z.string().optional(),
  bairro: isLoggedIn ? z.string().optional() : z.string().min(2, 'Bairro deve ter pelo menos 2 caracteres'),
  cidade: isLoggedIn ? z.string().optional() : z.string().min(2, 'Cidade deve ter pelo menos 2 caracteres'),
  estado: isLoggedIn ? z.string().optional() : z.string().length(2, 'Estado deve ter 2 caracteres'),
  
  // Método de pagamento (sempre obrigatório)
  payment_method: z.literal('credit_card'),
  
  // Dados do cartão (sempre obrigatórios)
  card_holder_name: z.string().optional(),
  card_number: z.string().optional(),
  card_expiry_month: z.string().optional(),
  card_expiry_year: z.string().optional(),
  card_ccv: z.string().optional(),
  card_installments: z.string().optional(),
  
  // Senha (apenas para usuários não logados)
  password: isLoggedIn 
    ? z.string().optional()
    : z.string()
        .min(6, 'Senha deve ter pelo menos 6 caracteres')
        .regex(/[A-Z]/, 'Senha deve conter pelo menos uma letra maiúscula')
        .regex(/[0-9]/, 'Senha deve conter pelo menos um número'),
  password_confirmation: isLoggedIn ? z.string().optional() : z.string(),
  
  // Termos (sempre obrigatórios)
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
}).refine((data) => {
  // Validação condicional para senhas (apenas se não estiver logado)
  if (!isLoggedIn) {
    return data.password === data.password_confirmation;
  }
  return true;
}, {
  message: 'As senhas não conferem',
  path: ['password_confirmation']
});

type PaymentFormData = z.infer<ReturnType<typeof createPaymentFormSchema>>;

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
  const { user, loading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false);
  const [cpfValidationMessage, setCpfValidationMessage] = useState<string>('');
  const [cepValidationMessage, setCepValidationMessage] = useState<string>('');
  const [phoneValidationMessage, setPhoneValidationMessage] = useState<string>('');
  const [userProfile, setUserProfile] = useState<any>(null);
  
  // DEBUG: Log do estado do usuário
  React.useEffect(() => {
    console.log('🔍 DEBUG PaymentFormEnhanced:');
    console.log('  user:', user);
    console.log('  user?.id:', user?.id);
    console.log('  user?.email:', user?.email);
    console.log('  !!user:', !!user);
    console.log('  loading:', loading);
  }, [user, loading]);
  
  const { 
    processarFiliacaoComPagamento, 
    isProcessing, 
    paymentStatus,
    error 
  } = useFiliacaoPayment({
    selectedMemberType,
    affiliateInfo
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
            console.log('📋 Dados do perfil carregados:', profile);
            
            // Verificar se dados obrigatórios estão presentes
            const missingFields = [];
            if (!profile?.nome_completo) missingFields.push('Nome completo');
            if (!profile?.cpf) missingFields.push('CPF');
            if (!profile?.telefone) missingFields.push('Telefone');
            
            if (missingFields.length > 0) {
              console.warn('⚠️ Dados obrigatórios faltando no perfil:', missingFields);
              toast.warning(
                `Alguns dados obrigatórios estão faltando no seu perfil: ${missingFields.join(', ')}. ` +
                'Complete seu perfil antes de fazer a filiação.',
                { duration: 8000 }
              );
            }
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

  // Validação em tempo real do CPF
  const validateCPFRealTime = (cpf: string) => {
    if (!cpf) {
      setCpfValidationMessage('');
      return;
    }
    
    const cleanCPF = cpf.replace(/\D/g, '');
    
    if (cleanCPF.length < 11) {
      setCpfValidationMessage(`CPF deve ter 11 dígitos (${cleanCPF.length}/11)`);
      return;
    }
    
    if (cleanCPF.length === 11) {
      if (validateCPF(cleanCPF)) {
        setCpfValidationMessage('✅ CPF válido');
      } else {
        setCpfValidationMessage('❌ CPF inválido - verifique os números');
      }
    }
  };

  // Validação em tempo real do CEP
  const validateCEPRealTime = (cep: string) => {
    if (!cep) {
      setCepValidationMessage('');
      return;
    }
    
    const cleanCEP = cep.replace(/\D/g, '');
    
    if (cleanCEP.length < 8) {
      setCepValidationMessage(`CEP deve ter 8 dígitos (${cleanCEP.length}/8)`);
      return;
    }
    
    if (cleanCEP.length === 8) {
      if (validateCEP(cleanCEP)) {
        setCepValidationMessage('✅ CEP válido');
      } else {
        setCepValidationMessage('❌ CEP inválido');
      }
    }
  };

  // Validação em tempo real do telefone
  const validatePhoneRealTime = (phone: string) => {
    if (!phone) {
      setPhoneValidationMessage('');
      return;
    }
    
    const cleanPhone = phone.replace(/\D/g, '');
    
    if (cleanPhone.length < 10) {
      setPhoneValidationMessage(`Telefone deve ter pelo menos 10 dígitos (${cleanPhone.length}/10)`);
      return;
    }
    
    if (cleanPhone.length >= 10 && cleanPhone.length <= 11) {
      if (validatePhone(cleanPhone)) {
        setPhoneValidationMessage('✅ Telefone válido');
      } else {
        setPhoneValidationMessage('❌ Telefone inválido');
      }
    } else {
      setPhoneValidationMessage('❌ Telefone deve ter 10 ou 11 dígitos');
    }
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

  // Debug: Log do estado dos termos
  React.useEffect(() => {
    console.log('🔍 Estado dos termos:', {
      acceptTerms,
      acceptPrivacy,
      isProcessing,
      buttonDisabled: isProcessing || !acceptTerms || !acceptPrivacy
    });
  }, [acceptTerms, acceptPrivacy, isProcessing]);

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
      
      if (user && userProfile) {
        // Usuário logado - usar dados do perfil
        filiacaoData = {
          nome_completo: userProfile.nome_completo || user.user_metadata?.nome_completo || user.email,
          cpf: userProfile.cpf,
          telefone: userProfile.telefone,
          email: user.email,
          cep: userProfile.cep,
          endereco: userProfile.endereco,
          numero: userProfile.numero,
          complemento: userProfile.complemento,
          bairro: userProfile.bairro,
          cidade: userProfile.cidade,
          estado: userProfile.estado,
          payment_method: data.payment_method,
        };
        
        console.log('👤 USUÁRIO LOGADO - Usando dados do perfil:');
        console.log('   Nome:', filiacaoData.nome_completo);
        console.log('   CPF:', filiacaoData.cpf);
        console.log('   Email:', filiacaoData.email);
      } else {
        // Usuário não logado - usar dados do formulário
        filiacaoData = {
          nome_completo: data.nome_completo!,
          cpf: data.cpf!, // Já limpo pelo Zod transform
          telefone: data.telefone!, // Já limpo pelo Zod transform
          email: data.email!,
          cep: data.cep!, // Já limpo pelo Zod transform
          endereco: data.endereco!,
          numero: data.numero!,
          complemento: data.complemento,
          bairro: data.bairro!,
          cidade: data.cidade!,
          estado: data.estado!,
          payment_method: data.payment_method,
          // Incluir senha para criar conta
          password: data.password,
        };
        
        console.log('🆕 USUÁRIO NOVO - Usando dados do formulário:');
        console.log('   Nome:', filiacaoData.nome_completo);
        console.log('   CPF:', filiacaoData.cpf);
        console.log('   Email:', filiacaoData.email);
      }

      // LOG: Dados já limpos pelo Zod (se aplicável)
      if (!user) {
        console.log('🧹 DADOS PROCESSADOS PELO ZOD:');
        console.log('  CPF:', data.cpf, '(length:', data.cpf?.length, ')');
        console.log('  Telefone:', data.telefone, '(length:', data.telefone?.length, ')');
        console.log('  CEP:', data.cep, '(length:', data.cep?.length, ')');
      }

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

      const result = await processarFiliacaoComPagamento(filiacaoData);
      
      if (result) {
        // Mostrar informações específicas do pagamento
        if (result.asaasSubscription) {
          toast.success('Assinatura criada com sucesso! Você receberá as instruções de pagamento por email.');
        } else {
          toast.success('Filiação processada com sucesso!');
        }
        onSuccess();
      }
    } catch (error: any) {
      // Erro já tratado no hook
      console.error('Erro no formulário de filiação:', error);
      
      // Mostrar mensagem de erro específica ao usuário
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
  };



  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* DEBUG: Status do usuário */}
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <p className="text-sm text-red-800">
            🔍 DEBUG: user = {user ? `LOGADO (${user.email})` : 'NÃO LOGADO'}
          </p>
          <p className="text-sm text-red-800">
            🔍 DEBUG: !!user = {!!user ? 'true' : 'false'}
          </p>
        </CardContent>
      </Card>

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

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
                  ✅ Seus dados pessoais já estão salvos. Prossiga direto para o pagamento.
                </p>
                <p className="text-xs text-blue-500 mt-1">
                  💡 Para alterar seus dados, acesse seu perfil após a filiação.
                </p>
              </div>
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