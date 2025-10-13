/**
 * Configuração centralizada da API Asaas
 * ⚠️ IMPORTANTE: Credenciais sensíveis estão nas Edge Functions (backend)
 * Este arquivo mantém apenas configurações públicas
 */

export interface AsaasConfig {
  environment: 'sandbox' | 'production';
  baseUrl: string;
  userAgent: string;
}

/**
 * Configuração principal do Asaas baseada em variáveis de ambiente
 * API Key e Webhook Token foram movidos para Edge Functions por segurança
 */
export const asaasConfig: AsaasConfig = {
  environment: (import.meta.env.VITE_ASAAS_ENVIRONMENT as 'sandbox' | 'production') || 'sandbox',
  baseUrl: import.meta.env.VITE_ASAAS_BASE_URL || 'https://api-sandbox.asaas.com/v3',
  userAgent: 'COMADEMIG-Portal/1.0'
};

/**
 * Valida se todas as configurações necessárias estão presentes
 * Credenciais sensíveis são validadas nas Edge Functions
 */
export const validateAsaasConfig = (): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!asaasConfig.baseUrl) {
    errors.push('ASAAS_BASE_URL não configurada');
  }

  if (!asaasConfig.environment) {
    errors.push('ASAAS_ENVIRONMENT não configurado');
  }

  // API Key e Webhook Token são validados nas Edge Functions
  // Não validar aqui por questões de segurança

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * URLs base por ambiente
 */
export const ASAAS_URLS = {
  sandbox: 'https://api-sandbox.asaas.com/v3',
  production: 'https://api.asaas.com/v3'
} as const;

/**
 * Headers padrão para requisições à API Asaas
 * ⚠️ OBSOLETO: Use Edge Functions ao invés de chamar API diretamente
 */
export const getAsaasHeaders = () => {
  throw new Error(
    'getAsaasHeaders() está obsoleto. ' +
    'Use Edge Functions do Supabase para comunicação com Asaas. ' +
    'Credenciais sensíveis NÃO devem ser expostas no frontend.'
  );
};