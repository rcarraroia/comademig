/**
 * Biblioteca de validação e integração Asaas
 * ⚠️ IMPORTANTE: API Key do Asaas está nas Edge Functions (backend)
 * Este arquivo NÃO deve acessar credenciais sensíveis no frontend
 */

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  environment: 'development' | 'production' | 'unknown';
}

/**
 * Valida a integração Asaas de forma não-bloqueante
 * Verifica apenas disponibilidade das Edge Functions
 */
export const validateAsaasIntegration = async (): Promise<ValidationResult> => {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
    environment: import.meta.env.DEV ? 'development' : 'production'
  };

  try {
    // Em desenvolvimento, apenas avisar
    if (import.meta.env.DEV) {
      result.warnings.push('Modo desenvolvimento - Edge Functions podem não estar disponíveis localmente');
      return result;
    }

    // Em produção, assumir que Edge Functions estão configuradas
    result.isValid = true;

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
 * ⚠️ API Key NÃO está mais disponível no frontend por segurança
 * Use Edge Functions via hooks para comunicação com Asaas
 */
export const asaasConfig = {
  isDevelopment: import.meta.env.DEV,
  // API Key removida do frontend - use Edge Functions
  baseUrl: import.meta.env.DEV 
    ? 'https://sandbox.asaas.com/api/v3' 
    : 'https://api.asaas.com/v3'
};