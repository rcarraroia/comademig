/**
 * Configuração do ambiente de testes (sandbox) para integração Asaas
 * Fornece dados de teste, credenciais sandbox e simulação de cenários
 */

export interface SandboxConfig {
  environment: 'sandbox' | 'production'
  apiKey: string
  baseUrl: string
  webhookToken: string
  testData: {
    customers: TestCustomer[]
    creditCards: TestCreditCard[]
    pixKeys: string[]
    bankAccounts: TestBankAccount[]
  }
}

export interface TestCustomer {
  id: string
  name: string
  email: string
  cpfCnpj: string
  phone: string
  address: TestAddress
  scenario: 'success' | 'validation_error' | 'payment_failure' | 'timeout'
}

export interface TestCreditCard {
  number: string
  holderName: string
  expiryMonth: string
  expiryYear: string
  cvv: string
  brand: string
  scenario: 'approved' | 'declined' | 'insufficient_funds' | 'expired' | 'fraud'
}

export interface TestBankAccount {
  bank: string
  agency: string
  account: string
  accountType: 'checking' | 'savings'
  scenario: 'success' | 'invalid_account' | 'blocked'
}

export interface TestAddress {
  street: string
  number: string
  complement?: string
  district: string
  city: string
  state: string
  postalCode: string
}

// Configuração do sandbox Asaas
export const SANDBOX_CONFIG: SandboxConfig = {
  environment: 'sandbox',
  apiKey: '$aact_YTU5YTE0M2M2N2I4MTliNzk0YTI5N2U5MzdjNWZmODQ6OjAwMDAwMDAwMDAwMDAwODUxOTk6OiRhYWNoXzRlNTEzOGVhLTI0NWEtNGRjYi1iOGY4LWY4YzZhM2Q1NzI4Mw==',
  baseUrl: 'https://sandbox.asaas.com/api/v3',
  webhookToken: 'sandbox-webhook-token-123456789',
  testData: {
    customers: [
      {
        id: 'cus_success_001',
        name: 'João Silva Santos',
        email: 'joao.silva@teste.com',
        cpfCnpj: '11144477735', // CPF válido para testes
        phone: '11987654321',
        address: {
          street: 'Rua das Flores',
          number: '123',
          complement: 'Apto 45',
          district: 'Centro',
          city: 'São Paulo',
          state: 'SP',
          postalCode: '01234567'
        },
        scenario: 'success'
      },
      {
        id: 'cus_validation_002',
        name: 'Maria Oliveira',
        email: 'maria.oliveira@teste.com',
        cpfCnpj: '00000000000', // CPF inválido para teste de validação
        phone: '11987654322',
        address: {
          street: 'Avenida Paulista',
          number: '1000',
          district: 'Bela Vista',
          city: 'São Paulo',
          state: 'SP',
          postalCode: '01310100'
        },
        scenario: 'validation_error'
      },
      {
        id: 'cus_payment_fail_003',
        name: 'Carlos Ferreira',
        email: 'carlos.ferreira@teste.com',
        cpfCnpj: '22255588896',
        phone: '11987654323',
        address: {
          street: 'Rua Augusta',
          number: '500',
          district: 'Consolação',
          city: 'São Paulo',
          state: 'SP',
          postalCode: '01305000'
        },
        scenario: 'payment_failure'
      },
      {
        id: 'cus_timeout_004',
        name: 'Ana Costa',
        email: 'ana.costa@teste.com',
        cpfCnpj: '33366699907',
        phone: '11987654324',
        address: {
          street: 'Rua Oscar Freire',
          number: '200',
          district: 'Jardins',
          city: 'São Paulo',
          state: 'SP',
          postalCode: '01426000'
        },
        scenario: 'timeout'
      }
    ],

    creditCards: [
      {
        number: '4000000000000010', // Visa aprovado
        holderName: 'JOAO SILVA SANTOS',
        expiryMonth: '12',
        expiryYear: '2028',
        cvv: '123',
        brand: 'VISA',
        scenario: 'approved'
      },
      {
        number: '4000000000000002', // Visa recusado
        holderName: 'MARIA OLIVEIRA',
        expiryMonth: '06',
        expiryYear: '2027',
        cvv: '456',
        brand: 'VISA',
        scenario: 'declined'
      },
      {
        number: '4000000000000051', // Visa saldo insuficiente
        holderName: 'CARLOS FERREIRA',
        expiryMonth: '03',
        expiryYear: '2026',
        cvv: '789',
        brand: 'VISA',
        scenario: 'insufficient_funds'
      },
      {
        number: '4000000000000069', // Visa vencido
        holderName: 'ANA COSTA',
        expiryMonth: '01',
        expiryYear: '2020',
        cvv: '321',
        brand: 'VISA',
        scenario: 'expired'
      },
      {
        number: '4100000000000019', // Visa fraude
        holderName: 'PEDRO SANTOS',
        expiryMonth: '09',
        expiryYear: '2025',
        cvv: '654',
        brand: 'VISA',
        scenario: 'fraud'
      },
      {
        number: '5555555555554444', // Mastercard aprovado
        holderName: 'LUCIA MARTINS',
        expiryMonth: '11',
        expiryYear: '2027',
        cvv: '987',
        brand: 'MASTERCARD',
        scenario: 'approved'
      }
    ],

    pixKeys: [
      'joao.silva@teste.com',
      'maria.oliveira@teste.com',
      '11987654321',
      '11144477735',
      '22255588896',
      'chave-aleatoria-pix-123456789'
    ],

    bankAccounts: [
      {
        bank: '001', // Banco do Brasil
        agency: '1234',
        account: '567890',
        accountType: 'checking',
        scenario: 'success'
      },
      {
        bank: '341', // Itaú
        agency: '5678',
        account: '123456',
        accountType: 'savings',
        scenario: 'success'
      },
      {
        bank: '237', // Bradesco
        agency: '9999',
        account: '000000',
        accountType: 'checking',
        scenario: 'invalid_account'
      },
      {
        bank: '104', // Caixa
        agency: '0001',
        account: '999999',
        accountType: 'savings',
        scenario: 'blocked'
      }
    ]
  }
}

// Valores de teste para diferentes cenários
export const TEST_VALUES = {
  // Valores que sempre são aprovados
  APPROVED_VALUES: [10.00, 25.50, 100.00, 250.00, 500.00],
  
  // Valores que são recusados
  DECLINED_VALUES: [0.01, 0.05, 9999.99],
  
  // Valores que causam timeout
  TIMEOUT_VALUES: [1.00, 2.00, 3.00],
  
  // Valores para teste de split
  SPLIT_VALUES: [150.00, 300.00, 750.00, 1000.00]
}

// Cenários de teste para webhooks
export const WEBHOOK_TEST_SCENARIOS = {
  PAYMENT_CONFIRMED: {
    event: 'PAYMENT_CONFIRMED',
    payment: {
      id: 'pay_test_confirmed_001',
      status: 'CONFIRMED',
      value: 100.00,
      netValue: 96.51,
      paymentDate: new Date().toISOString(),
      clientPaymentDate: new Date().toISOString()
    }
  },
  
  PAYMENT_RECEIVED: {
    event: 'PAYMENT_RECEIVED',
    payment: {
      id: 'pay_test_received_002',
      status: 'RECEIVED',
      value: 250.00,
      netValue: 241.28,
      paymentDate: new Date().toISOString(),
      clientPaymentDate: new Date().toISOString()
    }
  },
  
  PAYMENT_OVERDUE: {
    event: 'PAYMENT_OVERDUE',
    payment: {
      id: 'pay_test_overdue_003',
      status: 'OVERDUE',
      value: 150.00,
      dueDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() // Ontem
    }
  },
  
  PAYMENT_REFUNDED: {
    event: 'PAYMENT_REFUNDED',
    payment: {
      id: 'pay_test_refunded_004',
      status: 'REFUNDED',
      value: 75.00,
      refundedValue: 75.00,
      refundDate: new Date().toISOString()
    }
  }
}

// Configurações específicas por tipo de teste
export const TEST_CONFIGURATIONS = {
  // Configuração para testes de PIX
  PIX: {
    qrCodeExpirationMinutes: 5,
    allowDuplicatePayments: true,
    enableInstantPaymentNotification: true
  },
  
  // Configuração para testes de cartão
  CREDIT_CARD: {
    enableAntifraud: true,
    maxInstallments: 12,
    minInstallmentValue: 5.00,
    captureAutomatically: true
  },
  
  // Configuração para testes de boleto
  BOLETO: {
    daysToExpire: 3,
    enableSecondCopy: true,
    fine: 2.0, // 2%
    interest: 1.0 // 1% ao mês
  },
  
  // Configuração para testes de webhook
  WEBHOOK: {
    retryAttempts: 3,
    retryIntervalSeconds: 30,
    timeoutSeconds: 30,
    enableSignatureValidation: true
  }
}

// Função para obter dados de teste baseado no cenário
export function getTestDataByScenario(scenario: string) {
  const { customers, creditCards, bankAccounts } = SANDBOX_CONFIG.testData
  
  return {
    customer: customers.find(c => c.scenario === scenario) || customers[0],
    creditCard: creditCards.find(c => c.scenario === scenario) || creditCards[0],
    bankAccount: bankAccounts.find(b => b.scenario === scenario) || bankAccounts[0]
  }
}

// Função para validar se está em ambiente de teste
export function isSandboxEnvironment(): boolean {
  return process.env.VITE_ASAAS_ENVIRONMENT === 'sandbox' || 
         process.env.NODE_ENV === 'development'
}

// Função para obter configuração baseada no ambiente
export function getEnvironmentConfig(): Partial<SandboxConfig> {
  if (isSandboxEnvironment()) {
    return SANDBOX_CONFIG
  }
  
  return {
    environment: 'production',
    apiKey: process.env.VITE_ASAAS_API_KEY || '',
    baseUrl: process.env.VITE_ASAAS_BASE_URL || 'https://api.asaas.com/v3',
    webhookToken: process.env.VITE_ASAAS_WEBHOOK_TOKEN || ''
  }
}

// Função para gerar dados de teste aleatórios
export function generateRandomTestData() {
  const customers = SANDBOX_CONFIG.testData.customers
  const creditCards = SANDBOX_CONFIG.testData.creditCards
  const values = TEST_VALUES.APPROVED_VALUES
  
  return {
    customer: customers[Math.floor(Math.random() * customers.length)],
    creditCard: creditCards[Math.floor(Math.random() * creditCards.length)],
    value: values[Math.floor(Math.random() * values.length)],
    pixKey: SANDBOX_CONFIG.testData.pixKeys[Math.floor(Math.random() * SANDBOX_CONFIG.testData.pixKeys.length)]
  }
}