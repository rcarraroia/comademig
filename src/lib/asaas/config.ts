/**
 * Configuração centralizada da API Asaas
 * Gerencia credenciais, URLs e configurações de ambiente
 */

export interface AsaasConfig {
  apiKey: string;
  environment: 'sandbox' | 'production';
  baseUrl: string;
  webhookToken: string;
  userAgent: string;
}

/**
 * Configuração principal do Asaas baseada em variáveis de ambiente
 */
export const asaasConfig: AsaasConfig = {
  apiKey: import.meta.env.VITE_ASAAS_API_KEY || '',
  environment: (import.meta.env.VITE_ASAAS_ENVIRONMENT as 'sandbox' | 'production') || 'sandbox',
  baseUrl: import.meta.env.VITE_ASAAS_BASE_URL || 'https://api-sandbox.asaas.com/v3',
  webhookToken: import.meta.env.VITE_ASAAS_WEBHOOK_TOKEN || '',
  userAgent: 'COMADEMIG-Portal/1.0'
};

/**
 * Valida se todas as configurações necessárias estão presentes
 */
export const validateAsaasConfig = (): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!asaasConfig.apiKey) {
    errors.push('ASAAS_API_KEY não configurada');
  }

  if (!asaasConfig.webhookToken) {
    errors.push('ASAAS_WEBHOOK_TOKEN não configurado');
  }

  if (asaasConfig.environment === 'sandbox' && !asaasConfig.apiKey.startsWith('$aact_hmlg_')) {
    errors.push('Chave API deve começar com $aact_hmlg_ para ambiente sandbox');
  }

  if (asaasConfig.environment === 'production' && !asaasConfig.apiKey.startsWith('$aact_prod_')) {
    errors.push('Chave API deve começar com $aact_prod_ para ambiente production');
  }

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
 */
export const getAsaasHeaders = (apiKey: string = asaasConfig.apiKey) => ({
  'Content-Type': 'application/json',
  'access_token': apiKey,
  'User-Agent': asaasConfig.userAgent
});