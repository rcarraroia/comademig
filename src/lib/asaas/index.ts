/**
 * Ponto de entrada principal para integração Asaas
 * Exporta todas as funcionalidades necessárias
 */

// Configuração
export { asaasConfig, validateAsaasConfig, ASAAS_URLS, getAsaasHeaders } from './config';

// Cliente HTTP
export { AsaasApiClient, asaasClient, AsaasError } from './client';
export type { AsaasResponse, AsaasErrorData } from './client';

// Tipos adicionais (quando necessários)
export type {
  AsaasCustomer,
  CreateCustomerData,
  UpdateCustomerData,
  CustomerFilters,
  AsaasPayment,
  CreatePaymentData,
  PaymentFilters,
  PaymentStatus,
  BillingType,
  PaymentSplit,
  CreatePaymentSplitData,
  AsaasSubscription,
  CreateSubscriptionData,
  SubscriptionStatus,
  SubscriptionCycle,
  WebhookEvent,
  WebhookPayload,
  ServiceType,
  ServiceData,
  CreateCustomerRequest,
  CreatePaymentRequest,
  ProcessWebhookRequest
} from './types';

// Validação
export {
  validateAsaasIntegration,
  validatePaymentReadiness,
  validateConfigOnly,
  formatValidationResult
} from './validation';

export type { ValidationResult } from './validation';