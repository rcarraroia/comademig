/**
 * Utilitário para mapear erros do Asaas e outros serviços
 * para mensagens amigáveis ao usuário
 */

export interface ErrorMapping {
  pattern: RegExp | string;
  message: string;
  retryable: boolean;
}

// Mapeamento de erros do Asaas
const asaasErrorMappings: ErrorMapping[] = [
  // Erros de cartão
  {
    pattern: /card.*declined|cartão.*recusado/i,
    message: 'Cartão recusado. Verifique os dados ou tente outro cartão.',
    retryable: true
  },
  {
    pattern: /insufficient.*funds|saldo.*insuficiente/i,
    message: 'Saldo insuficiente. Tente outro cartão ou método de pagamento.',
    retryable: true
  },
  {
    pattern: /invalid.*card|cartão.*inválido/i,
    message: 'Dados do cartão inválidos. Verifique número, validade e CVV.',
    retryable: true
  },
  {
    pattern: /expired.*card|cartão.*expirado/i,
    message: 'Cartão expirado. Use um cartão válido.',
    retryable: true
  },
  {
    pattern: /invalid.*cvv|cvv.*inválido/i,
    message: 'Código de segurança (CVV) inválido.',
    retryable: true
  },
  
  // Erros de CPF/CNPJ
  {
    pattern: /cpf.*already.*exists|cpf.*já.*cadastrado/i,
    message: 'Este CPF já está cadastrado. Faça login ou use "Esqueci minha senha".',
    retryable: false
  },
  {
    pattern: /invalid.*cpf|cpf.*inválido/i,
    message: 'CPF inválido. Verifique os números digitados.',
    retryable: true
  },
  
  // Erros de email
  {
    pattern: /email.*already.*exists|email.*já.*cadastrado/i,
    message: 'Este email já está cadastrado. Faça login ou use "Esqueci minha senha".',
    retryable: false
  },
  {
    pattern: /invalid.*email|email.*inválido/i,
    message: 'Email inválido. Verifique o endereço digitado.',
    retryable: true
  },
  
  // Erros de API/Rede
  {
    pattern: /network.*error|erro.*rede/i,
    message: 'Erro de conexão. Verifique sua internet e tente novamente.',
    retryable: true
  },
  {
    pattern: /timeout|tempo.*esgotado/i,
    message: 'Tempo esgotado. Tente novamente em alguns instantes.',
    retryable: true
  },
  {
    pattern: /rate.*limit|limite.*requisições/i,
    message: 'Muitas tentativas. Aguarde alguns minutos e tente novamente.',
    retryable: true
  },
  
  // Erros de validação
  {
    pattern: /invalid.*api.*key|chave.*api.*inválida/i,
    message: 'Erro de configuração. Entre em contato com o suporte.',
    retryable: false
  },
  {
    pattern: /unauthorized|não.*autorizado/i,
    message: 'Acesso não autorizado. Faça login novamente.',
    retryable: false
  },
  
  // Erros de split/afiliado
  {
    pattern: /invalid.*affiliate|afiliado.*inválido/i,
    message: 'Código de afiliado inválido. Verifique o código digitado.',
    retryable: true
  },
  {
    pattern: /split.*configuration.*failed/i,
    message: 'Erro ao configurar divisão de pagamento. Tente novamente.',
    retryable: true
  }
];

// Mapeamento de erros do Supabase
const supabaseErrorMappings: ErrorMapping[] = [
  {
    pattern: /duplicate.*key.*value/i,
    message: 'Este registro já existe no sistema.',
    retryable: false
  },
  {
    pattern: /foreign.*key.*constraint/i,
    message: 'Erro de referência de dados. Entre em contato com o suporte.',
    retryable: false
  },
  {
    pattern: /permission.*denied|acesso.*negado/i,
    message: 'Você não tem permissão para esta operação.',
    retryable: false
  }
];

/**
 * Mapeia um erro para uma mensagem amigável
 */
export function mapErrorToMessage(error: any): {
  message: string;
  retryable: boolean;
  originalError?: string;
} {
  const errorString = typeof error === 'string' 
    ? error 
    : error?.message || error?.error || JSON.stringify(error);

  // Tentar mapear erro do Asaas
  for (const mapping of asaasErrorMappings) {
    if (typeof mapping.pattern === 'string') {
      if (errorString.toLowerCase().includes(mapping.pattern.toLowerCase())) {
        return {
          message: mapping.message,
          retryable: mapping.retryable,
          originalError: errorString
        };
      }
    } else if (mapping.pattern.test(errorString)) {
      return {
        message: mapping.message,
        retryable: mapping.retryable,
        originalError: errorString
      };
    }
  }

  // Tentar mapear erro do Supabase
  for (const mapping of supabaseErrorMappings) {
    if (typeof mapping.pattern === 'string') {
      if (errorString.toLowerCase().includes(mapping.pattern.toLowerCase())) {
        return {
          message: mapping.message,
          retryable: mapping.retryable,
          originalError: errorString
        };
      }
    } else if (mapping.pattern.test(errorString)) {
      return {
        message: mapping.message,
        retryable: mapping.retryable,
        originalError: errorString
      };
    }
  }

  // Mensagem genérica se não encontrar mapeamento
  return {
    message: 'Ocorreu um erro inesperado. Tente novamente ou entre em contato com o suporte.',
    retryable: true,
    originalError: errorString
  };
}

/**
 * Determina se um erro é temporário e pode ser retentado
 */
export function isRetryableError(error: any): boolean {
  const mapped = mapErrorToMessage(error);
  return mapped.retryable;
}

/**
 * Formata mensagem de erro para exibição
 */
export function formatErrorMessage(error: any, includeDetails: boolean = false): string {
  const mapped = mapErrorToMessage(error);
  
  if (includeDetails && mapped.originalError) {
    return `${mapped.message}\n\nDetalhes técnicos: ${mapped.originalError}`;
  }
  
  return mapped.message;
}
