/**
 * Validações unificadas para formulário de filiação
 * 
 * Compatível com fluxo antigo e Payment First Flow
 * Requirements: 1.1, 8.3
 */

import { z } from 'zod';
import { validateCPF, validatePhone, validateCEP } from '@/utils/validators';

/**
 * Schema base para dados pessoais
 */
const dadosPessoaisSchema = {
  nome_completo: z
    .string({ required_error: 'Nome completo é obrigatório' })
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(100, 'Nome muito longo')
    .transform((val) => val.trim()),

  email: z
    .string({ required_error: 'Email é obrigatório' })
    .email('Email inválido')
    .max(100, 'Email muito longo')
    .transform((val) => val.trim().toLowerCase()),

  cpf: z
    .string({ required_error: 'CPF é obrigatório' })
    .transform((val) => val.replace(/\D/g, '')) // Limpar caracteres não numéricos
    .refine((val) => val.length === 11, 'CPF deve ter 11 dígitos')
    .refine((val) => validateCPF(val), 'CPF inválido - verifique os números digitados'),

  telefone: z
    .string({ required_error: 'Telefone é obrigatório' })
    .transform((val) => val.replace(/\D/g, '')) // Limpar caracteres não numéricos
    .refine((val) => val.length >= 10 && val.length <= 11, 'Telefone deve ter 10 ou 11 dígitos')
    .refine((val) => validatePhone(val), 'Telefone inválido - use formato (XX) XXXXX-XXXX'),
};

/**
 * Schema para endereço
 */
const enderecoSchema = {
  cep: z
    .string({ required_error: 'CEP é obrigatório' })
    .transform((val) => val.replace(/\D/g, '')) // Limpar caracteres não numéricos
    .refine((val) => val.length === 8, 'CEP deve ter 8 dígitos')
    .refine((val) => validateCEP(val), 'CEP inválido - use formato XXXXX-XXX'),

  endereco: z
    .string({ required_error: 'Endereço é obrigatório' })
    .min(5, 'Endereço deve ter pelo menos 5 caracteres')
    .max(200, 'Endereço muito longo')
    .transform((val) => val.trim()),

  numero: z
    .string({ required_error: 'Número é obrigatório' })
    .min(1, 'Número é obrigatório')
    .max(20, 'Número muito longo')
    .transform((val) => val.trim()),

  complemento: z
    .string()
    .max(100, 'Complemento muito longo')
    .optional()
    .transform((val) => val?.trim() || undefined),

  bairro: z
    .string({ required_error: 'Bairro é obrigatório' })
    .min(2, 'Bairro deve ter pelo menos 2 caracteres')
    .max(100, 'Bairro muito longo')
    .transform((val) => val.trim()),

  cidade: z
    .string({ required_error: 'Cidade é obrigatória' })
    .min(2, 'Cidade deve ter pelo menos 2 caracteres')
    .max(100, 'Cidade muito longa')
    .transform((val) => val.trim()),

  estado: z
    .string({ required_error: 'Estado é obrigatório' })
    .length(2, 'Estado deve ter 2 caracteres (UF)')
    .transform((val) => val.trim().toUpperCase()),
};

/**
 * Schema para dados do cartão de crédito (conforme API Asaas)
 */
const creditCardSchema = {
  holderName: z
    .string({ required_error: 'Nome do portador é obrigatório' })
    .min(2, 'Nome do portador deve ter pelo menos 2 caracteres')
    .max(100, 'Nome do portador muito longo')
    .transform((val) => val.trim()),

  number: z
    .string({ required_error: 'Número do cartão é obrigatório' })
    .transform((val) => val.replace(/\D/g, '')) // Limpar caracteres não numéricos
    .refine((val) => val.length >= 13 && val.length <= 19, 'Número do cartão inválido'),

  expiryMonth: z
    .string({ required_error: 'Mês de expiração é obrigatório' })
    .transform((val) => val.padStart(2, '0'))
    .refine((val) => {
      const month = parseInt(val);
      return month >= 1 && month <= 12;
    }, 'Mês de expiração inválido'),

  expiryYear: z
    .string({ required_error: 'Ano de expiração é obrigatório' })
    .refine((val) => {
      const year = parseInt(val);
      const currentYear = new Date().getFullYear();
      return year >= currentYear && year <= currentYear + 20;
    }, 'Ano de expiração inválido'),

  ccv: z
    .string({ required_error: 'CCV é obrigatório' })
    .transform((val) => val.replace(/\D/g, '')) // Limpar caracteres não numéricos
    .refine((val) => val.length >= 3 && val.length <= 4, 'CCV deve ter 3 ou 4 dígitos'),
};

/**
 * Schema para dados do portador do cartão (conforme API Asaas)
 */
const creditCardHolderInfoSchema = {
  name: z
    .string({ required_error: 'Nome do portador é obrigatório' })
    .min(2, 'Nome do portador deve ter pelo menos 2 caracteres')
    .max(100, 'Nome do portador muito longo')
    .transform((val) => val.trim()),

  email: z
    .string({ required_error: 'Email do portador é obrigatório' })
    .email('Email inválido')
    .max(100, 'Email muito longo')
    .transform((val) => val.trim().toLowerCase()),

  cpfCnpj: z
    .string({ required_error: 'CPF do portador é obrigatório' })
    .transform((val) => val.replace(/\D/g, '')) // Limpar caracteres não numéricos
    .refine((val) => val.length === 11, 'CPF deve ter 11 dígitos')
    .refine((val) => validateCPF(val), 'CPF inválido'),

  postalCode: z
    .string({ required_error: 'CEP é obrigatório' })
    .transform((val) => val.replace(/\D/g, '')) // Limpar caracteres não numéricos
    .refine((val) => val.length === 8, 'CEP deve ter 8 dígitos')
    .refine((val) => validateCEP(val), 'CEP inválido'),

  addressNumber: z
    .string({ required_error: 'Número é obrigatório' })
    .min(1, 'Número é obrigatório')
    .max(20, 'Número muito longo')
    .transform((val) => val.trim()),

  addressComplement: z
    .string()
    .max(100, 'Complemento muito longo')
    .optional()
    .transform((val) => val?.trim() || undefined),

  phone: z
    .string({ required_error: 'Telefone é obrigatório' })
    .transform((val) => val.replace(/\D/g, '')) // Limpar caracteres não numéricos
    .refine((val) => val.length >= 10 && val.length <= 11, 'Telefone deve ter 10 ou 11 dígitos')
    .refine((val) => validatePhone(val), 'Telefone inválido'),

  mobilePhone: z
    .string()
    .transform((val) => val?.replace(/\D/g, '') || '') // Limpar caracteres não numéricos
    .optional()
    .refine((val) => !val || (val.length >= 10 && val.length <= 11), 'Celular deve ter 10 ou 11 dígitos')
    .refine((val) => !val || validatePhone(val), 'Celular inválido'),
};

/**
 * Schema para senha (apenas quando usuário não está logado)
 */
const senhaSchema = z
  .string({ required_error: 'Senha é obrigatória para criar nova conta' })
  .min(6, 'Senha deve ter pelo menos 6 caracteres')
  .max(100, 'Senha muito longa')
  .refine(
    (val) => /[A-Z]/.test(val),
    'Senha deve conter pelo menos 1 letra maiúscula'
  )
  .refine(
    (val) => /[0-9]/.test(val),
    'Senha deve conter pelo menos 1 número'
  );

/**
 * Schema principal para filiação - usuário logado
 */
export const filiacaoLoggedUserSchema = z.object({
  ...dadosPessoaisSchema,
  ...enderecoSchema,
  
  // Método de pagamento
  payment_method: z.literal('credit_card', {
    required_error: 'Método de pagamento é obrigatório'
  }),

  // Dados do cartão (conforme API Asaas)
  creditCard: z.object(creditCardSchema),
  
  // Dados do portador do cartão (conforme API Asaas)
  creditCardHolderInfo: z.object(creditCardHolderInfoSchema),
});

/**
 * Schema principal para filiação - usuário não logado
 */
export const filiacaoNewUserSchema = z.object({
  ...dadosPessoaisSchema,
  ...enderecoSchema,
  
  // Senha obrigatória para novos usuários
  password: senhaSchema,
  
  // Método de pagamento
  payment_method: z.literal('credit_card', {
    required_error: 'Método de pagamento é obrigatório'
  }),

  // Dados do cartão (conforme API Asaas)
  creditCard: z.object(creditCardSchema),
  
  // Dados do portador do cartão (conforme API Asaas)
  creditCardHolderInfo: z.object(creditCardHolderInfoSchema),
});

/**
 * Schema condicional baseado no status de autenticação
 */
export const createFiliacaoSchema = (isUserLoggedIn: boolean) => {
  return isUserLoggedIn ? filiacaoLoggedUserSchema : filiacaoNewUserSchema;
};

/**
 * Tipos TypeScript derivados dos schemas
 */
export type FiliacaoLoggedUserData = z.infer<typeof filiacaoLoggedUserSchema>;
export type FiliacaoNewUserData = z.infer<typeof filiacaoNewUserSchema>;
export type FiliacaoFormData = FiliacaoLoggedUserData | FiliacaoNewUserData;

/**
 * Schema para validação específica do Payment First Flow
 */
export const paymentFirstFlowSchema = z.object({
  ...dadosPessoaisSchema,
  ...enderecoSchema,
  
  // Senha condicional
  password: z.string().optional(),
  
  // Método de pagamento (apenas cartão no Payment First Flow)
  payment_method: z.literal('CREDIT_CARD'),
  
  // Dados do cartão obrigatórios (conforme API Asaas)
  creditCard: z.object(creditCardSchema),
  
  // Dados do portador do cartão obrigatórios (conforme API Asaas)
  creditCardHolderInfo: z.object(creditCardHolderInfoSchema),
  
  // Dados de afiliado (opcional)
  affiliate_id: z.string().uuid().optional(),
  
  // IP remoto (obrigatório para API Asaas)
  remoteIp: z.string().ip('IP inválido').optional(), // Será preenchido automaticamente
}).refine(
  (data) => {
    // Se não há password, assumimos que usuário está logado
    return true; // Validação de senha será feita no contexto
  },
  {
    message: 'Dados de autenticação inválidos',
    path: ['password']
  }
);

export type PaymentFirstFlowData = z.infer<typeof paymentFirstFlowSchema>;

/**
 * Validações específicas para campos individuais
 */
export const fieldValidations = {
  /**
   * Validação em tempo real para CPF
   */
  validateCPFField: (cpf: string): { isValid: boolean; message: string } => {
    if (!cpf) {
      return { isValid: false, message: '' };
    }

    const cleanCPF = cpf.replace(/\D/g, '');
    
    if (cleanCPF.length < 11) {
      return { 
        isValid: false, 
        message: `CPF deve ter 11 dígitos (${cleanCPF.length}/11)` 
      };
    }
    
    if (cleanCPF.length === 11) {
      if (validateCPF(cleanCPF)) {
        return { isValid: true, message: '✅ CPF válido' };
      } else {
        return { isValid: false, message: '❌ CPF inválido - verifique os números' };
      }
    }
    
    return { isValid: false, message: 'CPF inválido' };
  },

  /**
   * Validação em tempo real para CEP
   */
  validateCEPField: (cep: string): { isValid: boolean; message: string } => {
    if (!cep) {
      return { isValid: false, message: '' };
    }

    const cleanCEP = cep.replace(/\D/g, '');
    
    if (cleanCEP.length < 8) {
      return { 
        isValid: false, 
        message: `CEP deve ter 8 dígitos (${cleanCEP.length}/8)` 
      };
    }
    
    if (cleanCEP.length === 8) {
      if (validateCEP(cleanCEP)) {
        return { isValid: true, message: '✅ CEP válido' };
      } else {
        return { isValid: false, message: '❌ CEP inválido - use formato XXXXX-XXX' };
      }
    }
    
    return { isValid: false, message: 'CEP inválido' };
  },

  /**
   * Validação em tempo real para telefone
   */
  validatePhoneField: (phone: string): { isValid: boolean; message: string } => {
    if (!phone) {
      return { isValid: false, message: '' };
    }

    const cleanPhone = phone.replace(/\D/g, '');
    
    if (cleanPhone.length < 10) {
      return { 
        isValid: false, 
        message: `Telefone deve ter 10 ou 11 dígitos (${cleanPhone.length}/10-11)` 
      };
    }
    
    if (cleanPhone.length >= 10 && cleanPhone.length <= 11) {
      if (validatePhone(cleanPhone)) {
        return { isValid: true, message: '✅ Telefone válido' };
      } else {
        return { isValid: false, message: '❌ Telefone inválido - use formato (XX) XXXXX-XXXX' };
      }
    }
    
    return { isValid: false, message: 'Telefone inválido' };
  },

  /**
   * Validação para número do cartão
   */
  validateCardNumber: (number: string): { isValid: boolean; message: string; cardType?: string } => {
    if (!number) {
      return { isValid: false, message: '' };
    }

    const cleanNumber = number.replace(/\D/g, '');
    
    if (cleanNumber.length < 13) {
      return { 
        isValid: false, 
        message: `Número do cartão deve ter 13-19 dígitos (${cleanNumber.length}/13-19)` 
      };
    }

    // Detectar tipo do cartão
    let cardType = 'unknown';
    if (cleanNumber.startsWith('4')) {
      cardType = 'visa';
    } else if (cleanNumber.startsWith('5') || cleanNumber.startsWith('2')) {
      cardType = 'mastercard';
    } else if (cleanNumber.startsWith('3')) {
      cardType = 'amex';
    }

    if (cleanNumber.length >= 13 && cleanNumber.length <= 19) {
      return { 
        isValid: true, 
        message: `✅ Cartão ${cardType} válido`,
        cardType 
      };
    }
    
    return { isValid: false, message: 'Número do cartão inválido' };
  },

  /**
   * Validação para data de expiração
   */
  validateExpiryDate: (month: string, year: string): { isValid: boolean; message: string } => {
    if (!month || !year) {
      return { isValid: false, message: '' };
    }

    const monthNum = parseInt(month);
    const yearNum = parseInt(year);
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;

    if (monthNum < 1 || monthNum > 12) {
      return { isValid: false, message: 'Mês inválido' };
    }

    if (yearNum < currentYear || yearNum > currentYear + 20) {
      return { isValid: false, message: 'Ano inválido' };
    }

    // Verificar se não está expirado
    if (yearNum === currentYear && monthNum < currentMonth) {
      return { isValid: false, message: 'Cartão expirado' };
    }

    return { isValid: true, message: '✅ Data válida' };
  }
};

/**
 * Utilitário para sincronizar validações entre fluxos
 */
export const syncValidations = {
  /**
   * Converte dados do formulário atual para Payment First Flow
   */
  adaptToPaymentFirstFlow: (data: FiliacaoFormData): PaymentFirstFlowData => {
    return {
      ...data,
      payment_method: 'CREDIT_CARD' as const,
      // Outros campos já são compatíveis
    };
  },

  /**
   * Valida dados para ambos os fluxos
   */
  validateForBothFlows: (formData: any, isUserLoggedIn: boolean) => {
    const traditionalSchema = createFiliacaoSchema(isUserLoggedIn);
    const paymentFirstSchema = paymentFirstFlowSchema;

    const traditionalResult = traditionalSchema.safeParse(formData);
    const paymentFirstResult = paymentFirstSchema.safeParse({
      ...formData,
      payment_method: 'CREDIT_CARD'
    });

    return {
      traditional: traditionalResult,
      paymentFirst: paymentFirstResult,
      isValidForBoth: traditionalResult.success && paymentFirstResult.success
    };
  },

  /**
   * Converte dados do formulário para formato da API Asaas
   */
  adaptToAsaasAPI: (formData: FiliacaoFormData) => {
    // Extrair dados do cartão e portador
    const { creditCard, creditCardHolderInfo, ...otherData } = formData as any;
    
    return {
      // Dados básicos do pagamento
      billingType: 'CREDIT_CARD',
      value: 0, // Será preenchido com o valor do plano
      dueDate: new Date().toISOString().split('T')[0], // Data atual
      description: 'Filiação COMADEMIG',
      
      // Dados do cartão
      creditCard: {
        holderName: creditCard.holderName,
        number: creditCard.number,
        expiryMonth: creditCard.expiryMonth,
        expiryYear: creditCard.expiryYear,
        ccv: creditCard.ccv,
      },
      
      // Dados do portador
      creditCardHolderInfo: {
        name: creditCardHolderInfo.name,
        email: creditCardHolderInfo.email,
        cpfCnpj: creditCardHolderInfo.cpfCnpj,
        postalCode: creditCardHolderInfo.postalCode,
        addressNumber: creditCardHolderInfo.addressNumber,
        addressComplement: creditCardHolderInfo.addressComplement,
        phone: creditCardHolderInfo.phone,
        mobilePhone: creditCardHolderInfo.mobilePhone,
      },
      
      // IP remoto (será preenchido automaticamente)
      remoteIp: '', // Será obtido no frontend
      
      // Dados adicionais
      externalReference: `filiacao_${Date.now()}`,
    };
  }
};

/*
EXEMPLO DE USO:

// Em um componente de formulário
import { createFiliacaoSchema, fieldValidations, syncValidations } from '@/lib/validations/filiacaoValidation';

const { user } = useAuth();
const schema = createFiliacaoSchema(!!user);

const form = useForm({
  resolver: zodResolver(schema),
  defaultValues: {
    nome_completo: '',
    email: '',
    creditCard: {
      holderName: '',
      number: '',
      expiryMonth: '',
      expiryYear: '',
      ccv: '',
    },
    creditCardHolderInfo: {
      name: '',
      email: '',
      cpfCnpj: '',
      postalCode: '',
      addressNumber: '',
      phone: '',
    },
    // ... outros campos
  }
});

// Validação em tempo real
const handleCPFChange = (cpf: string) => {
  const validation = fieldValidations.validateCPFField(cpf);
  setCpfMessage(validation.message);
  // ... atualizar estado
};

// Para Payment First Flow
const paymentFirstData = syncValidations.adaptToPaymentFirstFlow(formData);

// Para API Asaas
const asaasData = syncValidations.adaptToAsaasAPI(formData);
*/