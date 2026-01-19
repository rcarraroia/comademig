/**
 * Tipos TypeScript compartilhados para Edge Functions
 */

// ============================================================================
// TIPOS BASE
// ============================================================================

export interface AsaasResponse<T> {
  data?: T;
  errors?: AsaasError[];
  hasMore?: boolean;
  totalCount?: number;
  limit?: number;
  offset?: number;
}

export interface AsaasError {
  code: string;
  description: string;
}

// ============================================================================
// CUSTOMER (CLIENTE)
// ============================================================================

export interface AsaasCustomer {
  id: string;
  name: string;
  cpfCnpj: string;
  email: string;
  phone?: string;
  mobilePhone?: string;
  address?: string;
  addressNumber?: string;
  complement?: string;
  province?: string;
  postalCode?: string;
  city?: string;
  state?: string;
  country?: string;
  externalReference?: string;
  notificationDisabled?: boolean;
  additionalEmails?: string;
  municipalInscription?: string;
  stateInscription?: string;
  observations?: string;
  groupName?: string;
  company?: string;
}

export interface CreateCustomerData {
  name: string;
  cpfCnpj: string;
  email: string;
  phone?: string;
  mobilePhone?: string;
  address?: string;
  addressNumber?: string;
  complement?: string;
  province?: string;
  postalCode?: string;
  city?: string;
  state?: string;
  country?: string;
  externalReference?: string;
  notificationDisabled?: boolean;
  additionalEmails?: string;
  municipalInscription?: string;
  stateInscription?: string;
  observations?: string;
  groupName?: string;
  company?: string;
}

// ============================================================================
// PAYMENT (COBRANÇA)
// ============================================================================

export type PaymentStatus = 
  | 'PENDING'
  | 'RECEIVED'
  | 'CONFIRMED'
  | 'OVERDUE'
  | 'REFUNDED'
  | 'RECEIVED_IN_CASH'
  | 'REFUND_REQUESTED'
  | 'REFUND_IN_PROGRESS'
  | 'CHARGEBACK_REQUESTED'
  | 'CHARGEBACK_DISPUTE'
  | 'AWAITING_CHARGEBACK_REVERSAL'
  | 'DUNNING_REQUESTED'
  | 'DUNNING_RECEIVED'
  | 'AWAITING_RISK_ANALYSIS';

export type BillingType = 'PIX' | 'CREDIT_CARD' | 'BOLETO' | 'DEBIT_CARD' | 'TRANSFER' | 'DEPOSIT';

export interface AsaasPayment {
  id: string;
  customer: string;
  billingType: BillingType;
  value: number;
  netValue?: number;
  originalValue?: number;
  description?: string;
  status: PaymentStatus;
  dueDate: string;
  originalDueDate?: string;
  paymentDate?: string;
  clientPaymentDate?: string;
  installmentNumber?: number;
  invoiceUrl?: string;
  invoiceNumber?: string;
  externalReference?: string;
  deleted?: boolean;
  anticipated?: boolean;
  anticipable?: boolean;
  
  // PIX específico
  pixTransaction?: {
    qrCode: {
      encodedImage: string;
      payload: string;
    };
    expirationDate: string;
  };
  
  // Boleto específico
  bankSlipUrl?: string;
  identificationField?: string;
  nossoNumero?: string;
  
  // Cartão específico
  creditCard?: {
    creditCardNumber: string;
    creditCardBrand: string;
    creditCardToken: string;
  };
  
  // Dados de cobrança
  postalService?: boolean;
  split?: PaymentSplit[];
}

export interface CreatePaymentData {
  customer: string;
  billingType: BillingType;
  value: number;
  dueDate: string;
  description?: string;
  externalReference?: string;
  installmentCount?: number;
  installmentValue?: number;
  discount?: {
    value?: number;
    dueDateLimitDays?: number;
    type?: 'FIXED' | 'PERCENTAGE';
  };
  interest?: {
    value?: number;
    type?: 'PERCENTAGE';
  };
  fine?: {
    value?: number;
    type?: 'FIXED' | 'PERCENTAGE';
  };
  postalService?: boolean;
  split?: AsaasSplitData[];
  callback?: {
    successUrl?: string;
    autoRedirect?: boolean;
  };
  creditCard?: {
    holderName: string;
    number: string;
    expiryMonth: string;
    expiryYear: string;
    ccv: string;
  };
  creditCardHolderInfo?: {
    name: string;
    email: string;
    cpfCnpj: string;
    postalCode: string;
    addressNumber: string;
    addressComplement?: string;
    phone: string;
    mobilePhone?: string;
  };
  creditCardToken?: string;
  remoteIp?: string;
}

// ============================================================================
// SPLIT DE PAGAMENTO
// ============================================================================

export interface PaymentSplit {
  id: string;
  walletId: string;
  fixedValue?: number;
  percentualValue?: number;
  totalFixedValue?: number;
  totalValue: number;
  status: 'PENDING' | 'AWAITING_CREDIT' | 'CREDITED' | 'CANCELLED';
  refusalReason?: string;
}

export interface CreatePaymentSplitData {
  walletId: string;
  fixedValue?: number;
  percentualValue?: number;
}

export interface AsaasSplitData {
  walletId: string;
  fixedValue?: number;
  percentualValue?: number;
  totalFixedValue?: number;
  description?: string;
  externalReference?: string;
}

// ============================================================================
// TIPOS DE SERVIÇO DO SISTEMA
// ============================================================================

export type ServiceType = 'filiacao' | 'certidao' | 'regularizacao' | 'evento' | 'taxa_anual';

export interface ServiceData {
  type: ServiceType;
  details: Record<string, any>;
  affiliate_id?: string;
  affiliate_percentage?: number;
}

// ============================================================================
// INTERFACES PARA EDGE FUNCTIONS
// ============================================================================

export interface CreateCustomerRequest {
  user_id: string;
  customer_data: CreateCustomerData;
}

export interface CreatePaymentRequest {
  customer_id: string;
  service_type: ServiceType;
  service_data: ServiceData;
  payment_data: CreatePaymentData;
  split_config?: CreatePaymentSplitData[];
}

// ============================================================================
// WEBHOOK
// ============================================================================

export type WebhookEvent = 
  // Eventos de Pagamento
  | 'PAYMENT_CREATED'
  | 'PAYMENT_UPDATED'
  | 'PAYMENT_CONFIRMED'
  | 'PAYMENT_RECEIVED'
  | 'PAYMENT_OVERDUE'
  | 'PAYMENT_DELETED'
  | 'PAYMENT_RESTORED'
  | 'PAYMENT_REFUNDED'
  | 'PAYMENT_RECEIVED_IN_CASH_UNDONE'
  | 'PAYMENT_CHARGEBACK_REQUESTED'
  | 'PAYMENT_CHARGEBACK_DISPUTE'
  | 'PAYMENT_AWAITING_CHARGEBACK_REVERSAL'
  | 'PAYMENT_DUNNING_RECEIVED'
  | 'PAYMENT_DUNNING_REQUESTED'
  | 'PAYMENT_BANK_SLIP_VIEWED'
  | 'PAYMENT_CHECKOUT_VIEWED'
  // Eventos de Assinatura
  | 'SUBSCRIPTION_CREATED'
  | 'SUBSCRIPTION_UPDATED'
  | 'SUBSCRIPTION_DELETED'
  | 'SUBSCRIPTION_SUSPENDED'
  | 'SUBSCRIPTION_REACTIVATED';

export interface WebhookPayload {
  event: WebhookEvent;
  payment: AsaasPayment;
  dateCreated: string;
}

export interface ProcessWebhookRequest {
  event: WebhookEvent;
  payment: AsaasPayment;
  dateCreated: string;
}