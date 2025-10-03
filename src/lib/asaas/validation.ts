/**
 * Utilitários para validação da integração Asaas
 * Testa conectividade, valida configurações e credenciais
 */

import { asaasClient } from './client';
import { asaasConfig, validateAsaasConfig } from './config';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  environment: string;
}

/**
 * Executa validação completa da integração Asaas
 */
export const validateAsaasIntegration = async (): Promise<ValidationResult> => {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
    environment: asaasConfig.environment
  };

  try {
    // 1. Validar configurações básicas
    const configValidation = validateAsaasConfig();
    if (!configValidation.isValid) {
      result.errors.push(...configValidation.errors);
      result.isValid = false;
    }

    // 2. Testar conectividade com API
    if (result.isValid) {
      const connectionTest = await asaasClient.testConnection();
      if (!connectionTest.success) {
        result.errors.push(connectionTest.message);
        result.isValid = false;
      }
    }

    // 3. Validações específicas por ambiente
    if (asaasConfig.environment === 'sandbox') {
      result.warnings.push('Executando em modo SANDBOX - pagamentos não são reais');
    } else if (asaasConfig.environment === 'production') {
      result.warnings.push('Executando em modo PRODUÇÃO - pagamentos são reais');
    }

    // 4. Validar formato da chave API
    if (asaasConfig.apiKey) {
      if (asaasConfig.environment === 'sandbox' && !asaasConfig.apiKey.startsWith('$aact_hmlg_')) {
        result.errors.push('Chave API de sandbox deve começar com $aact_hmlg_');
        result.isValid = false;
      }
      
      if (asaasConfig.environment === 'production' && !asaasConfig.apiKey.startsWith('$aact_prod_')) {
        result.errors.push('Chave API de produção deve começar com $aact_prod_');
        result.isValid = false;
      }
    }

  } catch (error) {
    result.errors.push(`Erro durante validação: ${error instanceof Error ? error.message : 'Desconhecido'}`);
    result.isValid = false;
  }

  return result;
};

/**
 * Valida se o sistema está pronto para processar pagamentos
 */
export const validatePaymentReadiness = async (): Promise<boolean> => {
  try {
    const validation = await validateAsaasIntegration();
    return validation.isValid;
  } catch {
    return false;
  }
};

/**
 * Executa validação rápida apenas das configurações (sem rede)
 */
export const validateConfigOnly = (): ValidationResult => {
  const configValidation = validateAsaasConfig();
  
  return {
    isValid: configValidation.isValid,
    errors: configValidation.errors,
    warnings: [],
    environment: asaasConfig.environment
  };
};

/**
 * Formata resultado de validação para exibição
 */
export const formatValidationResult = (result: ValidationResult): string => {
  const lines: string[] = [];
  
  lines.push(`🔧 Ambiente: ${result.environment.toUpperCase()}`);
  
  if (result.isValid) {
    lines.push('✅ Integração Asaas configurada corretamente');
  } else {
    lines.push('❌ Problemas na configuração Asaas:');
    result.errors.forEach(error => lines.push(`   • ${error}`));
  }
  
  if (result.warnings.length > 0) {
    lines.push('⚠️  Avisos:');
    result.warnings.forEach(warning => lines.push(`   • ${warning}`));
  }
  
  return lines.join('\n');
};