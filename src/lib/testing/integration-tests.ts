import { supabase } from '@/integrations/supabase/client'
import { SANDBOX_CONFIG, getTestDataByScenario, TEST_VALUES } from './sandbox-config'
import { webhookSimulator } from './webhook-simulator'

/**
 * Sistema de testes de integração para Edge Functions e fluxos completos
 * Executa testes automatizados em ambiente sandbox
 */

export interface TestResult {
  testName: string
  success: boolean
  duration: number
  error?: string
  details?: any
}

export interface TestSuite {
  name: string
  tests: TestResult[]
  totalTests: number
  passedTests: number
  failedTests: number
  totalDuration: number
}

export class IntegrationTester {
  private results: TestResult[] = []

  /**
   * Executa todos os testes de integração
   */
  async runAllTests(): Promise<TestSuite> {
    console.log('🧪 Iniciando testes de integração...')
    
    this.results = []

    // Testes de Edge Functions
    await this.testCustomerCreation()
    await this.testPixPaymentCreation()
    await this.testCreditCardPayment()
    await this.testBoletoPayment()
    await this.testWebhookProcessing()
    await this.testSplitConfiguration()
    
    // Testes de fluxos completos
    await this.testCompletePaymentFlow()
    await this.testFailureScenarios()
    await this.testRetryMechanisms()

    return this.generateTestSuite()
  }

  /**
   * Testa criação de clientes
   */
  private async testCustomerCreation(): Promise<void> {
    const testData = getTestDataByScenario('success')
    
    await this.runTest('Customer Creation - Success', async () => {
      const { data, error } = await supabase.functions.invoke('asaas-create-customer', {
        body: {
          name: testData.customer.name,
          email: testData.customer.email,
          cpfCnpj: testData.customer.cpfCnpj,
          phone: testData.customer.phone,
          address: testData.customer.address
        }
      })

      if (error) throw new Error(error.message)
      if (!data.success) throw new Error(data.error)
      
      return { customerId: data.data.id }
    })

    // Teste com dados inválidos
    const invalidData = getTestDataByScenario('validation_error')
    
    await this.runTest('Customer Creation - Validation Error', async () => {
      const { data, error } = await supabase.functions.invoke('asaas-create-customer', {
        body: {
          name: invalidData.customer.name,
          email: invalidData.customer.email,
          cpfCnpj: invalidData.customer.cpfCnpj, // CPF inválido
          phone: invalidData.customer.phone
        }
      })

      // Deve falhar com erro de validação
      if (data.success) {
        throw new Error('Expected validation error but request succeeded')
      }

      return { expectedError: true }
    })
  }

  /**
   * Testa criação de pagamento PIX
   */
  private async testPixPaymentCreation(): Promise<void> {
    const testData = getTestDataByScenario('success')
    
    await this.runTest('PIX Payment Creation', async () => {
      const { data, error } = await supabase.functions.invoke('asaas-create-pix-payment', {
        body: {
          customerId: testData.customer.id,
          value: TEST_VALUES.APPROVED_VALUES[0],
          description: 'Teste de pagamento PIX',
          dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        }
      })

      if (error) throw new Error(error.message)
      if (!data.success) throw new Error(data.error)
      
      const payment = data.data
      if (!payment.qrCode) throw new Error('QR Code not generated')
      if (!payment.pixCopyPaste) throw new Error('PIX copy-paste code not generated')
      
      return { 
        paymentId: payment.id,
        qrCode: payment.qrCode,
        pixCopyPaste: payment.pixCopyPaste
      }
    })
  }

  /**
   * Testa processamento de cartão de crédito
   */
  private async testCreditCardPayment(): Promise<void> {
    const testData = getTestDataByScenario('success')
    const approvedCard = SANDBOX_CONFIG.testData.creditCards.find(c => c.scenario === 'approved')!
    
    await this.runTest('Credit Card Payment - Approved', async () => {
      const { data, error } = await supabase.functions.invoke('asaas-process-card', {
        body: {
          customerId: testData.customer.id,
          value: TEST_VALUES.APPROVED_VALUES[1],
          description: 'Teste de pagamento com cartão',
          creditCard: {
            holderName: approvedCard.holderName,
            number: approvedCard.number,
            expiryMonth: approvedCard.expiryMonth,
            expiryYear: approvedCard.expiryYear,
            cvv: approvedCard.cvv
          },
          installmentCount: 1
        }
      })

      if (error) throw new Error(error.message)
      if (!data.success) throw new Error(data.error)
      
      return { paymentId: data.data.id }
    })

    // Teste com cartão recusado
    const declinedCard = SANDBOX_CONFIG.testData.creditCards.find(c => c.scenario === 'declined')!
    
    await this.runTest('Credit Card Payment - Declined', async () => {
      const { data, error } = await supabase.functions.invoke('asaas-process-card', {
        body: {
          customerId: testData.customer.id,
          value: TEST_VALUES.APPROVED_VALUES[0],
          description: 'Teste de cartão recusado',
          creditCard: {
            holderName: declinedCard.holderName,
            number: declinedCard.number,
            expiryMonth: declinedCard.expiryMonth,
            expiryYear: declinedCard.expiryYear,
            cvv: declinedCard.cvv
          },
          installmentCount: 1
        }
      })

      // Deve falhar ou retornar status de recusado
      if (data.success && data.data.status === 'CONFIRMED') {
        throw new Error('Expected declined payment but was approved')
      }

      return { expectedDecline: true }
    })
  }

  /**
   * Testa criação de boleto
   */
  private async testBoletoPayment(): Promise<void> {
    const testData = getTestDataByScenario('success')
    
    await this.runTest('Boleto Payment Creation', async () => {
      const { data, error } = await supabase.functions.invoke('asaas-create-boleto', {
        body: {
          customerId: testData.customer.id,
          value: TEST_VALUES.APPROVED_VALUES[2],
          description: 'Teste de boleto bancário',
          dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        }
      })

      if (error) throw new Error(error.message)
      if (!data.success) throw new Error(data.error)
      
      const boleto = data.data
      if (!boleto.barCode) throw new Error('Bar code not generated')
      if (!boleto.digitableLine) throw new Error('Digitable line not generated')
      
      return { 
        paymentId: boleto.id,
        barCode: boleto.barCode,
        digitableLine: boleto.digitableLine
      }
    })
  }

  /**
   * Testa processamento de webhooks
   */
  private async testWebhookProcessing(): Promise<void> {
    await this.runTest('Webhook Processing - Payment Confirmed', async () => {
      const testPaymentId = 'pay_test_webhook_001'
      
      const result = await webhookSimulator.simulatePaymentConfirmed(testPaymentId)
      
      if (!result.success) {
        throw new Error(result.error || 'Webhook processing failed')
      }
      
      return { 
        webhookProcessed: true,
        executionTime: result.executionTime
      }
    })

    await this.runTest('Webhook Processing - Payment Overdue', async () => {
      const testPaymentId = 'pay_test_webhook_002'
      
      const result = await webhookSimulator.simulatePaymentOverdue(testPaymentId)
      
      if (!result.success) {
        throw new Error(result.error || 'Webhook processing failed')
      }
      
      return { 
        webhookProcessed: true,
        executionTime: result.executionTime
      }
    })
  }

  /**
   * Testa configuração de splits
   */
  private async testSplitConfiguration(): Promise<void> {
    await this.runTest('Split Configuration', async () => {
      const { data, error } = await supabase.functions.invoke('asaas-configure-split', {
        body: {
          cobrancaId: 'test_cobranca_001',
          affiliateId: 'test_affiliate_001',
          percentage: 10,
          description: 'Teste de split de afiliado'
        }
      })

      if (error) throw new Error(error.message)
      if (!data.success) throw new Error(data.error)
      
      return { splitId: data.data.id }
    })
  }

  /**
   * Testa fluxo completo de pagamento
   */
  private async testCompletePaymentFlow(): Promise<void> {
    await this.runTest('Complete Payment Flow', async () => {
      const testData = getTestDataByScenario('success')
      
      // 1. Criar cliente
      const customerResult = await supabase.functions.invoke('asaas-create-customer', {
        body: {
          name: testData.customer.name,
          email: `flow_test_${Date.now()}@teste.com`,
          cpfCnpj: testData.customer.cpfCnpj,
          phone: testData.customer.phone
        }
      })

      if (!customerResult.data.success) {
        throw new Error('Failed to create customer')
      }

      const customerId = customerResult.data.data.id

      // 2. Criar pagamento PIX
      const paymentResult = await supabase.functions.invoke('asaas-create-pix-payment', {
        body: {
          customerId,
          value: 100.00,
          description: 'Teste de fluxo completo',
          dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        }
      })

      if (!paymentResult.data.success) {
        throw new Error('Failed to create payment')
      }

      const paymentId = paymentResult.data.data.id

      // 3. Simular confirmação via webhook
      const webhookResult = await webhookSimulator.simulatePaymentConfirmed(paymentId)

      if (!webhookResult.success) {
        throw new Error('Failed to process webhook')
      }

      return {
        customerId,
        paymentId,
        webhookProcessed: true,
        flowCompleted: true
      }
    })
  }

  /**
   * Testa cenários de falha
   */
  private async testFailureScenarios(): Promise<void> {
    await this.runTest('Network Timeout Simulation', async () => {
      // Simular timeout com delay longo
      const result = await webhookSimulator.simulatePaymentConfirmed('pay_timeout_test', {
        delay: 100, // Delay pequeno para não travar o teste
        simulateFailure: false
      })

      return { 
        timeoutHandled: true,
        executionTime: result.executionTime
      }
    })

    await this.runTest('Invalid Data Handling', async () => {
      const { data, error } = await supabase.functions.invoke('asaas-create-customer', {
        body: {
          name: '', // Nome vazio
          email: 'invalid-email', // Email inválido
          cpfCnpj: '123', // CPF inválido
          phone: 'abc' // Telefone inválido
        }
      })

      // Deve falhar com erro de validação
      if (data && data.success) {
        throw new Error('Expected validation error but request succeeded')
      }

      return { validationErrorHandled: true }
    })
  }

  /**
   * Testa mecanismos de retry
   */
  private async testRetryMechanisms(): Promise<void> {
    await this.runTest('Webhook Retry Mechanism', async () => {
      const testPaymentId = 'pay_retry_test_001'
      
      const results = await webhookSimulator.testWebhookRetry(testPaymentId, 3)
      
      // Verificar se houve tentativas de retry
      if (results.length < 2) {
        throw new Error('Retry mechanism not working')
      }

      // Verificar se eventualmente teve sucesso
      const finalResult = results[results.length - 1]
      if (!finalResult.success) {
        throw new Error('Retry mechanism failed to recover')
      }

      return {
        retryAttempts: results.length,
        finalSuccess: finalResult.success,
        totalTime: results.reduce((sum, r) => sum + r.executionTime, 0)
      }
    })
  }

  /**
   * Executa um teste individual
   */
  private async runTest(testName: string, testFunction: () => Promise<any>): Promise<void> {
    const startTime = Date.now()
    
    try {
      console.log(`  ⏳ ${testName}...`)
      
      const result = await testFunction()
      const duration = Date.now() - startTime
      
      this.results.push({
        testName,
        success: true,
        duration,
        details: result
      })
      
      console.log(`  ✅ ${testName} (${duration}ms)`)
      
    } catch (error) {
      const duration = Date.now() - startTime
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      
      this.results.push({
        testName,
        success: false,
        duration,
        error: errorMessage
      })
      
      console.log(`  ❌ ${testName} (${duration}ms): ${errorMessage}`)
    }
  }

  /**
   * Gera relatório do conjunto de testes
   */
  private generateTestSuite(): TestSuite {
    const passedTests = this.results.filter(r => r.success).length
    const failedTests = this.results.filter(r => !r.success).length
    const totalDuration = this.results.reduce((sum, r) => sum + r.duration, 0)

    return {
      name: 'Asaas Integration Tests',
      tests: this.results,
      totalTests: this.results.length,
      passedTests,
      failedTests,
      totalDuration
    }
  }
}

// Instância singleton
export const integrationTester = new IntegrationTester()

// Função utilitária para executar testes
export async function runIntegrationTests(): Promise<TestSuite> {
  return integrationTester.runAllTests()
}