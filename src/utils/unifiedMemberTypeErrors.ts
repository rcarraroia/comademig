/**
 * Sistema de tratamento de erros para unificação de tipos de membro
 */

export interface UnifiedMemberTypeError {
  code: string;
  message: string;
  field?: string;
  details?: any;
}

export const ERROR_CODES = {
  // Validation Errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  REQUIRED_FIELD: 'REQUIRED_FIELD',
  INVALID_FORMAT: 'INVALID_FORMAT',
  
  // Uniqueness Errors
  UNIQUENESS_ERROR: 'UNIQUENESS_ERROR',
  DUPLICATE_MEMBER_TYPE_NAME: 'DUPLICATE_MEMBER_TYPE_NAME',
  DUPLICATE_PLAN_TITLE: 'DUPLICATE_PLAN_TITLE',
  
  // Business Rules Errors
  BUSINESS_RULE_ERROR: 'BUSINESS_RULE_ERROR',
  MIN_PRICE_VIOLATION: 'MIN_PRICE_VIOLATION',
  INVALID_RECURRENCE: 'INVALID_RECURRENCE',
  
  // Gateway Errors
  GATEWAY_ERROR: 'GATEWAY_ERROR',
  GATEWAY_CONNECTION_FAILED: 'GATEWAY_CONNECTION_FAILED',
  GATEWAY_PLAN_CREATION_FAILED: 'GATEWAY_PLAN_CREATION_FAILED',
  
  // Database Errors
  DATABASE_ERROR: 'DATABASE_ERROR',
  TRANSACTION_FAILED: 'TRANSACTION_FAILED',
  CONSTRAINT_VIOLATION: 'CONSTRAINT_VIOLATION',
  
  // Authentication Errors
  AUTH_ERROR: 'AUTH_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  ADMIN_REQUIRED: 'ADMIN_REQUIRED',
  
  // System Errors
  SYSTEM_ERROR: 'SYSTEM_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const;

export const ERROR_MESSAGES = {
  [ERROR_CODES.REQUIRED_FIELD]: 'Este campo é obrigatório',
  [ERROR_CODES.DUPLICATE_MEMBER_TYPE_NAME]: 'Já existe um tipo de membro com este nome',
  [ERROR_CODES.DUPLICATE_PLAN_TITLE]: 'Já existe um plano com este título',
  [ERROR_CODES.MIN_PRICE_VIOLATION]: 'O valor mínimo é R$ 25,00',
  [ERROR_CODES.INVALID_RECURRENCE]: 'A frequência deve ser "Mensal" ou "Anual"',
  [ERROR_CODES.GATEWAY_CONNECTION_FAILED]: 'Erro de conexão com o gateway de pagamento',
  [ERROR_CODES.GATEWAY_PLAN_CREATION_FAILED]: 'Falha ao criar plano no gateway de pagamento',
  [ERROR_CODES.TRANSACTION_FAILED]: 'Erro na transação do banco de dados',
  [ERROR_CODES.UNAUTHORIZED]: 'Usuário não autenticado',
  [ERROR_CODES.ADMIN_REQUIRED]: 'Acesso restrito a administradores',
  [ERROR_CODES.UNKNOWN_ERROR]: 'Erro desconhecido',
} as const;

/**
 * Processa erros da Edge Function e retorna erro estruturado
 */
export function processEdgeFunctionError(error: any): UnifiedMemberTypeError {
  // Se já é um erro estruturado
  if (error.code && error.message) {
    return error;
  }

  // Processar erros do Supabase
  if (error.message) {
    const message = error.message.toLowerCase();
    
    // Erros de unicidade
    if (message.includes('duplicate') || message.includes('unique')) {
      if (message.includes('member_type') || message.includes('name')) {
        return {
          code: ERROR_CODES.DUPLICATE_MEMBER_TYPE_NAME,
          message: ERROR_MESSAGES[ERROR_CODES.DUPLICATE_MEMBER_TYPE_NAME],
          field: 'memberName',
        };
      }
      
      if (message.includes('plan_title') || message.includes('title')) {
        return {
          code: ERROR_CODES.DUPLICATE_PLAN_TITLE,
          message: ERROR_MESSAGES[ERROR_CODES.DUPLICATE_PLAN_TITLE],
          field: 'planTitle',
        };
      }
      
      return {
        code: ERROR_CODES.UNIQUENESS_ERROR,
        message: 'Valor duplicado encontrado',
      };
    }
    
    // Erros de constraint
    if (message.includes('check constraint') || message.includes('violates')) {
      if (message.includes('price') || message.includes('25')) {
        return {
          code: ERROR_CODES.MIN_PRICE_VIOLATION,
          message: ERROR_MESSAGES[ERROR_CODES.MIN_PRICE_VIOLATION],
          field: 'contributionValue',
        };
      }
      
      if (message.includes('recurrence')) {
        return {
          code: ERROR_CODES.INVALID_RECURRENCE,
          message: ERROR_MESSAGES[ERROR_CODES.INVALID_RECURRENCE],
          field: 'billingFrequency',
        };
      }
    }
    
    // Erros de autenticação
    if (message.includes('unauthorized') || message.includes('authentication')) {
      return {
        code: ERROR_CODES.UNAUTHORIZED,
        message: ERROR_MESSAGES[ERROR_CODES.UNAUTHORIZED],
      };
    }
    
    if (message.includes('admin') || message.includes('permission')) {
      return {
        code: ERROR_CODES.ADMIN_REQUIRED,
        message: ERROR_MESSAGES[ERROR_CODES.ADMIN_REQUIRED],
      };
    }
    
    // Erro genérico com mensagem original
    return {
      code: ERROR_CODES.SYSTEM_ERROR,
      message: error.message,
      details: error,
    };
  }

  // Erro completamente desconhecido
  return {
    code: ERROR_CODES.UNKNOWN_ERROR,
    message: ERROR_MESSAGES[ERROR_CODES.UNKNOWN_ERROR],
    details: error,
  };
}

/**
 * Processa erros de validação do formulário
 */
export function processValidationError(field: string, value: any): UnifiedMemberTypeError | null {
  switch (field) {
    case 'memberName':
      if (!value || value.trim().length === 0) {
        return {
          code: ERROR_CODES.REQUIRED_FIELD,
          message: 'Nome do tipo de membro é obrigatório',
          field,
        };
      }
      if (value.length > 100) {
        return {
          code: ERROR_CODES.INVALID_FORMAT,
          message: 'Nome deve ter no máximo 100 caracteres',
          field,
        };
      }
      break;
      
    case 'planTitle':
      if (!value || value.trim().length === 0) {
        return {
          code: ERROR_CODES.REQUIRED_FIELD,
          message: 'Título do plano é obrigatório',
          field,
        };
      }
      if (value.length > 255) {
        return {
          code: ERROR_CODES.INVALID_FORMAT,
          message: 'Título deve ter no máximo 255 caracteres',
          field,
        };
      }
      break;
      
    case 'contributionValue':
      if (value < 25) {
        return {
          code: ERROR_CODES.MIN_PRICE_VIOLATION,
          message: ERROR_MESSAGES[ERROR_CODES.MIN_PRICE_VIOLATION],
          field,
        };
      }
      if (value > 99999.99) {
        return {
          code: ERROR_CODES.INVALID_FORMAT,
          message: 'Valor máximo é R$ 99.999,99',
          field,
        };
      }
      break;
      
    case 'billingFrequency':
      if (!['Mensal', 'Anual'].includes(value)) {
        return {
          code: ERROR_CODES.INVALID_RECURRENCE,
          message: ERROR_MESSAGES[ERROR_CODES.INVALID_RECURRENCE],
          field,
        };
      }
      break;
  }
  
  return null;
}

/**
 * Gera mensagem de erro amigável para o usuário
 */
export function getUserFriendlyErrorMessage(error: UnifiedMemberTypeError): string {
  const baseMessage = ERROR_MESSAGES[error.code as keyof typeof ERROR_MESSAGES] || error.message;
  
  // Adicionar contexto específico se disponível
  if (error.field) {
    const fieldNames: Record<string, string> = {
      memberName: 'Nome do Tipo de Membro',
      planTitle: 'Título do Plano',
      contributionValue: 'Valor da Contribuição',
      billingFrequency: 'Frequência de Cobrança',
    };
    
    const fieldName = fieldNames[error.field] || error.field;
    return `${fieldName}: ${baseMessage}`;
  }
  
  return baseMessage;
}

/**
 * Determina se o erro é recuperável (usuário pode tentar novamente)
 */
export function isRecoverableError(error: UnifiedMemberTypeError): boolean {
  const recoverableErrors = [
    ERROR_CODES.VALIDATION_ERROR,
    ERROR_CODES.UNIQUENESS_ERROR,
    ERROR_CODES.BUSINESS_RULE_ERROR,
    ERROR_CODES.GATEWAY_CONNECTION_FAILED,
  ];
  
  return recoverableErrors.includes(error.code as any);
}

/**
 * Determina se o erro requer ação do administrador
 */
export function requiresAdminAction(error: UnifiedMemberTypeError): boolean {
  const adminErrors = [
    ERROR_CODES.GATEWAY_ERROR,
    ERROR_CODES.DATABASE_ERROR,
    ERROR_CODES.SYSTEM_ERROR,
  ];
  
  return adminErrors.includes(error.code as any);
}