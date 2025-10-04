/**
 * Biblioteca de validação e integração Asaas
 * Versão simplificada para evitar erros de inicialização
 */

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  environment: 'development' | 'production' | 'unknown';
}

/**
 * Valida a integração Asaas de forma não-bloqueante
 */
export const validateAsaasIntegration = async (): Promise<ValidationResult> => {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
    environment: 'development'
  };

  try {
    // Em desenvolvimento, não validar chaves de produção
    if (import.meta.env.DEV) {
      result.warnings.push('Modo desenvolvimento - validação Asaas desabilitada');
      return result;
    }

    // Verificar se as variáveis de ambiente estão configuradas
    const asaasApiKey = import.meta.env.VITE_ASAAS_API_KEY;
    
    if (!asaasApiKey) {
      result.warnings.push('VITE_ASAAS_API_KEY não configurada - funcionalidades de pagamento limitadas');
    }

    // Determinar ambiente baseado na chave
    if (asaasApiKey?.startsWith('$aact_prod_')) {
      result.environment = 'production';
    } else if (asaasApiKey?.startsWith('$aact_')) {
      result.environment = 'development';
    }

  } catch (error) {
    result.errors.push(`Erro na validação: ${error instanceof Error ? error.message : 'Desconhecido'}`);
    result.isValid = false;
  }

  return result;
};

/**
 * Formata o resultado da validação para exibição
 */
export const formatValidationResult = (result: ValidationResult): string => {
  const lines = [
    '🔧 VALIDAÇÃO ASAAS',
    '==================',
    `Status: ${result.isValid ? '✅ Válido' : '❌ Inválido'}`,
    `Ambiente: ${result.environment}`,
  ];

  if (result.errors.length > 0) {
    lines.push('', 'Erros:');
    result.errors.forEach(error => lines.push(`  ❌ ${error}`));
  }

  if (result.warnings.length > 0) {
    lines.push('', 'Avisos:');
    result.warnings.forEach(warning => lines.push(`  ⚠️ ${warning}`));
  }

  return lines.join('\n');
};

/**
 * Configuração Asaas para desenvolvimento
 */
export const asaasConfig = {
  isDevelopment: import.meta.env.DEV,
  apiKey: import.meta.env.VITE_ASAAS_API_KEY || '',
  baseUrl: import.meta.env.DEV 
    ? 'https://sandbox.asaas.com/api/v3' 
    : 'https://api.asaas.com/v3'
};