// Utilitários para integração com a API do Asaas

const ASAAS_BASE_URL = 'https://www.asaas.com/api/v3'

interface AsaasConfig {
  apiKey: string
  environment: 'sandbox' | 'production'
}

interface AsaasCustomer {
  id?: string
  name: string
  email: string
  phone?: string
  mobilePhone?: string
  cpfCnpj: string
  postalCode?: string
  address?: string
  addressNumber?: string
  complement?: string
  province?: string
  city?: string
  state?: string
  country?: string
  externalReference?: string
}

interface AsaasPayment {
  id?: string
  customer: string
  billingType: 'BOLETO' | 'CREDIT_CARD' | 'PIX' | 'UNDEFINED'
  value: number
  dueDate: string
  description?: string
  externalReference?: string
  installmentCount?: number
  installmentValue?: number
  discount?: {
    value: number
    dueDateLimitDays: number
  }
  interest?: {
    value: number
  }
  fine?: {
    value: number
  }
  postalService?: boolean
}

interface AsaasSubscription {
  id?: string
  customer: string
  billingType: 'BOLETO' | 'CREDIT_CARD' | 'PIX'
  value: number
  nextDueDate: string
  cycle: 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'BIMONTHLY' | 'QUARTERLY' | 'SEMIANNUALLY' | 'YEARLY'
  description?: string
  endDate?: string
  maxPayments?: number
  externalReference?: string
  split?: Array<{
    walletId: string
    fixedValue?: number
    percentualValue?: number
  }>
}

class AsaasAPI {
  private config: AsaasConfig
  private baseURL: string

  constructor(config: AsaasConfig) {
    this.config = config
    this.baseURL = config.environment === 'sandbox' 
      ? 'https://sandbox.asaas.com/api/v3'
      : ASAAS_BASE_URL
  }

  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'access_token': this.config.apiKey,
        ...options.headers,
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(`Asaas API Error: ${response.status} - ${errorData.message || response.statusText}`)
    }

    return response.json()
  }

  // Gerenciamento de Clientes
  async createCustomer(customer: AsaasCustomer): Promise<AsaasCustomer> {
    return this.request<AsaasCustomer>('/customers', {
      method: 'POST',
      body: JSON.stringify(customer),
    })
  }

  async updateCustomer(customerId: string, customer: Partial<AsaasCustomer>): Promise<AsaasCustomer> {
    return this.request<AsaasCustomer>(`/customers/${customerId}`, {
      method: 'PUT',
      body: JSON.stringify(customer),
    })
  }

  async getCustomer(customerId: string): Promise<AsaasCustomer> {
    return this.request<AsaasCustomer>(`/customers/${customerId}`)
  }

  async getCustomerByEmail(email: string): Promise<{ data: AsaasCustomer[] }> {
    return this.request<{ data: AsaasCustomer[] }>(`/customers?email=${encodeURIComponent(email)}`)
  }

  // Gerenciamento de Pagamentos
  async createPayment(payment: AsaasPayment): Promise<AsaasPayment> {
    return this.request<AsaasPayment>('/payments', {
      method: 'POST',
      body: JSON.stringify(payment),
    })
  }

  async getPayment(paymentId: string): Promise<AsaasPayment> {
    return this.request<AsaasPayment>(`/payments/${paymentId}`)
  }

  async updatePayment(paymentId: string, payment: Partial<AsaasPayment>): Promise<AsaasPayment> {
    return this.request<AsaasPayment>(`/payments/${paymentId}`, {
      method: 'PUT',
      body: JSON.stringify(payment),
    })
  }

  async deletePayment(paymentId: string): Promise<void> {
    await this.request(`/payments/${paymentId}`, {
      method: 'DELETE',
    })
  }

  // Gerenciamento de Assinaturas
  async createSubscription(subscription: AsaasSubscription): Promise<AsaasSubscription> {
    return this.request<AsaasSubscription>('/subscriptions', {
      method: 'POST',
      body: JSON.stringify(subscription),
    })
  }

  async getSubscription(subscriptionId: string): Promise<AsaasSubscription> {
    return this.request<AsaasSubscription>(`/subscriptions/${subscriptionId}`)
  }

  async updateSubscription(subscriptionId: string, subscription: Partial<AsaasSubscription>): Promise<AsaasSubscription> {
    return this.request<AsaasSubscription>(`/subscriptions/${subscriptionId}`, {
      method: 'PUT',
      body: JSON.stringify(subscription),
    })
  }

  async deleteSubscription(subscriptionId: string): Promise<void> {
    await this.request(`/subscriptions/${subscriptionId}`, {
      method: 'DELETE',
    })
  }

  // Utilitários
  async getPaymentStatus(paymentId: string): Promise<{ status: string }> {
    const payment = await this.getPayment(paymentId)
    return { status: payment.status || 'PENDING' }
  }

  async generatePixQrCode(paymentId: string): Promise<{ qrCode: string; payload: string }> {
    return this.request<{ qrCode: string; payload: string }>(`/payments/${paymentId}/pixQrCode`)
  }

  async getPaymentInvoiceUrl(paymentId: string): Promise<{ invoiceUrl: string }> {
    const payment = await this.getPayment(paymentId)
    return { invoiceUrl: payment.invoiceUrl || '' }
  }
}

// ⚠️ AVISO: Este arquivo está OBSOLETO
// A integração com Asaas deve ser feita via Edge Functions do Supabase
// NÃO use este cliente diretamente no frontend por questões de segurança
// Use os hooks: useAsaasCustomers, useAsaasSubscriptions, etc.

// Instância singleton para uso na aplicação (OBSOLETO - NÃO USAR)
let asaasInstance: AsaasAPI | null = null

export function getAsaasAPI(): AsaasAPI {
  throw new Error(
    'getAsaasAPI() está obsoleto. Use Edge Functions via hooks: ' +
    'useAsaasCustomers, useAsaasSubscriptions, etc. ' +
    'A API Key do Asaas NÃO deve ser exposta no frontend.'
  );
}

// Utilitários de formatação
export function formatAsaasBillingType(type: string): string {
  const types: Record<string, string> = {
    'BOLETO': 'Boleto Bancário',
    'CREDIT_CARD': 'Cartão de Crédito',
    'PIX': 'PIX',
    'UNDEFINED': 'Não Definido'
  }
  return types[type] || type
}

export function formatAsaasPaymentStatus(status: string): string {
  const statuses: Record<string, string> = {
    'PENDING': 'Pendente',
    'RECEIVED': 'Recebido',
    'CONFIRMED': 'Confirmado',
    'OVERDUE': 'Vencido',
    'REFUNDED': 'Estornado',
    'RECEIVED_IN_CASH': 'Recebido em Dinheiro',
    'REFUND_REQUESTED': 'Estorno Solicitado',
    'CHARGEBACK_REQUESTED': 'Chargeback Solicitado',
    'CHARGEBACK_DISPUTE': 'Disputa de Chargeback',
    'AWAITING_CHARGEBACK_REVERSAL': 'Aguardando Reversão de Chargeback',
    'DUNNING_REQUESTED': 'Cobrança Solicitada',
    'DUNNING_RECEIVED': 'Cobrança Recebida',
    'AWAITING_RISK_ANALYSIS': 'Aguardando Análise de Risco'
  }
  return statuses[status] || status
}

export function formatAsaasCycle(cycle: string): string {
  const cycles: Record<string, string> = {
    'WEEKLY': 'Semanal',
    'BIWEEKLY': 'Quinzenal',
    'MONTHLY': 'Mensal',
    'BIMONTHLY': 'Bimestral',
    'QUARTERLY': 'Trimestral',
    'SEMIANNUALLY': 'Semestral',
    'YEARLY': 'Anual'
  }
  return cycles[cycle] || cycle
}

export type {
  AsaasConfig,
  AsaasCustomer,
  AsaasPayment,
  AsaasSubscription
}