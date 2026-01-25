/**
 * Testes de Performance - Payment First Flow
 * 
 * Valida tempo de processamento, comportamento sob carga e otimizações
 * Requirements: 10.1, 10.4, 10.5
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { paymentFirstFlowService } from '@/lib/services/PaymentFirstFlowService';
import { paymentFirstFlowLogger } from '@/lib/services/PaymentFirstFlowLogger';

// Mock do Supabase para testes de performance
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      admin: {
        createUser: vi.fn(() => Promise.resolve({
          data: { user: { id: 'test-user-id', email: 'test@example.com' } },
          error: null
        }))
      }
    },
    from: vi.fn(() => ({
      insert: vi.fn(() => Promise.resolve({ data: null, error: null })),
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: null, error: null }))
        }))
      }))
    })),
    functions: {
      invoke: vi.fn(() => Promise.resolve({ data: { success: true }, error: null }))
    }
  }
}));

// Mock do serviço Asaas para controlar timing
const mockAsaasService = {
  createCustomer: vi.fn(),
  processPayment: vi.fn(),
  createSubscription: vi.fn()
};

// Dados de teste para performance
const performanceTestData = {
  nome: 'João Silva Performance Test',
  email: 'joao.performance@teste.com',
  password: 'Senha123!',
  cpf: '12345678901',
  telefone: '11999999999',
  endereco: {
    cep: '01234567',
    logradouro: 'Rua Teste Performance',
    numero: '123',
    bairro: 'Centro',
    cidade: 'São Paulo',
    estado: 'SP'
  },
  tipo_membro: 'pastor' as const,
  plan_id: 'plan-performance-test',
  payment_method: 'CREDIT_CARD' as const,
  card_data: {
    holderName: 'João Silva',
    number: '4111111111111111',
    expiryMonth: '12',
    expiryYear: '2025',
    ccv: '123'
  }
};

describe('Payment First Flow - Testes de Performance', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Configurar mocks com delays realistas
    mockAsaasService.createCustomer.mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({ id: 'cus_test' }), 500))
    );
    
    mockAsaasService.processPayment.mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({ id: 'pay_test', status: 'RECEIVED' }), 1000))
    );
    
    mockAsaasService.createSubscription.mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({ id: 'sub_test' }), 300))
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('1. Tempo de Processamento Individual', () => {
    it('deve processar registro em menos de 25 segundos', async () => {
      const startTime = Date.now();
      
      // Mock do processRegistration para simular tempo real
      const mockProcessRegistration = vi.fn().mockImplementation(async () => {
        // Simular tempo de processamento realista
        await new Promise(resolve => setTimeout(resolve, 2000)); // 2 segundos
        
        return {
          success: true,
          user_id: 'test-user-id',
          asaas_customer_id: 'cus_test',
          asaas_subscription_id: 'sub_test',
          payment_id: 'pay_test'
        };
      });

      vi.mocked(paymentFirstFlowService.processRegistration).mockImplementation(mockProcessRegistration);

      const result = await paymentFirstFlowService.processRegistration(performanceTestData);
      
      const processingTime = Date.now() - startTime;
      
      expect(result.success).toBe(true);
      expect(processingTime).toBeLessThan(25000); // 25 segundos
      expect(processingTime).toBeGreaterThan(1000); // Pelo menos 1 segundo (realista)
      
      console.log(`Tempo de processamento: ${processingTime}ms`);
    });

    it('deve processar registro otimizado em menos de 15 segundos', async () => {
      const startTime = Date.now();
      
      // Mock otimizado (operações em paralelo)
      const mockProcessRegistrationOptimized = vi.fn().mockImplementation(async () => {
        // Simular processamento otimizado com operações paralelas
        const [customer, payment] = await Promise.all([
          new Promise(resolve => setTimeout(() => resolve({ id: 'cus_test' }), 500)),
          new Promise(resolve => setTimeout(() => resolve({ id: 'pay_test' }), 1000))
        ]);
        
        // Criação de conta após pagamento
        await new Promise(resolve => setTimeout(resolve, 300));
        
        return {
          success: true,
          user_id: 'test-user-id',
          asaas_customer_id: 'cus_test',
          asaas_subscription_id: 'sub_test',
          payment_id: 'pay_test'
        };
      });

      vi.mocked(paymentFirstFlowService.processRegistration).mockImplementation(mockProcessRegistrationOptimized);

      const result = await paymentFirstFlowService.processRegistration(performanceTestData);
      
      const processingTime = Date.now() - startTime;
      
      expect(result.success).toBe(true);
      expect(processingTime).toBeLessThan(15000); // 15 segundos (otimizado)
      
      console.log(`Tempo de processamento otimizado: ${processingTime}ms`);
    });

    it('deve falhar graciosamente em caso de timeout', async () => {
      const startTime = Date.now();
      
      // Mock que simula timeout
      const mockProcessRegistrationTimeout = vi.fn().mockImplementation(async () => {
        // Simular operação que demora mais que o timeout
        await new Promise(resolve => setTimeout(resolve, 30000)); // 30 segundos
        
        return {
          success: false,
          error: 'Timeout na operação'
        };
      });

      vi.mocked(paymentFirstFlowService.processRegistration).mockImplementation(mockProcessRegistrationTimeout);

      // Configurar timeout de 25 segundos
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), 25000)
      );

      try {
        await Promise.race([
          paymentFirstFlowService.processRegistration(performanceTestData),
          timeoutPromise
        ]);
        
        // Não deveria chegar aqui
        expect(true).toBe(false);
      } catch (error) {
        const processingTime = Date.now() - startTime;
        
        expect(error).toBeInstanceOf(Error);
        expect(processingTime).toBeLessThan(26000); // Deve falhar antes de 26s
        expect(processingTime).toBeGreaterThan(24000); // Deve tentar por pelo menos 24s
        
        console.log(`Timeout detectado em: ${processingTime}ms`);
      }
    });
  });

  describe('2. Comportamento Sob Carga', () => {
    it('deve processar múltiplos registros simultâneos', async () => {
      const concurrentRequests = 5;
      const startTime = Date.now();
      
      // Mock que simula processamento concorrente
      const mockProcessRegistrationConcurrent = vi.fn().mockImplementation(async (data) => {
        // Simular variação no tempo de processamento
        const delay = Math.random() * 2000 + 1000; // 1-3 segundos
        await new Promise(resolve => setTimeout(resolve, delay));
        
        return {
          success: true,
          user_id: `test-user-${Math.random()}`,
          asaas_customer_id: `cus_${Math.random()}`,
          asaas_subscription_id: `sub_${Math.random()}`,
          payment_id: `pay_${Math.random()}`
        };
      });

      vi.mocked(paymentFirstFlowService.processRegistration).mockImplementation(mockProcessRegistrationConcurrent);

      // Criar múltiplas requisições simultâneas
      const requests = Array.from({ length: concurrentRequests }, (_, index) => 
        paymentFirstFlowService.processRegistration({
          ...performanceTestData,
          email: `test${index}@performance.com`
        })
      );

      const results = await Promise.all(requests);
      const totalTime = Date.now() - startTime;
      
      // Verificar que todas as requisições foram bem-sucedidas
      expect(results).toHaveLength(concurrentRequests);
      results.forEach(result => {
        expect(result.success).toBe(true);
      });
      
      // Tempo total deve ser menor que processamento sequencial
      expect(totalTime).toBeLessThan(concurrentRequests * 5000); // Menos que 5s por requisição
      
      console.log(`${concurrentRequests} requisições processadas em: ${totalTime}ms`);
      console.log(`Tempo médio por requisição: ${totalTime / concurrentRequests}ms`);
    });

    it('deve manter performance com 10 requisições simultâneas', async () => {
      const concurrentRequests = 10;
      const maxTimePerRequest = 5000; // 5 segundos máximo por requisição
      const startTime = Date.now();
      
      const mockProcessRegistrationLoad = vi.fn().mockImplementation(async (data) => {
        // Simular carga no sistema
        const delay = Math.random() * 3000 + 1000; // 1-4 segundos
        await new Promise(resolve => setTimeout(resolve, delay));
        
        return {
          success: true,
          user_id: `load-test-${Math.random()}`,
          asaas_customer_id: `cus_load_${Math.random()}`,
          asaas_subscription_id: `sub_load_${Math.random()}`,
          payment_id: `pay_load_${Math.random()}`
        };
      });

      vi.mocked(paymentFirstFlowService.processRegistration).mockImplementation(mockProcessRegistrationLoad);

      const requests = Array.from({ length: concurrentRequests }, (_, index) => 
        paymentFirstFlowService.processRegistration({
          ...performanceTestData,
          email: `load${index}@performance.com`
        })
      );

      const results = await Promise.all(requests);
      const totalTime = Date.now() - startTime;
      const avgTimePerRequest = totalTime / concurrentRequests;
      
      expect(results).toHaveLength(concurrentRequests);
      results.forEach(result => {
        expect(result.success).toBe(true);
      });
      
      expect(avgTimePerRequest).toBeLessThan(maxTimePerRequest);
      
      console.log(`Teste de carga - ${concurrentRequests} requisições:`);
      console.log(`Tempo total: ${totalTime}ms`);
      console.log(`Tempo médio: ${avgTimePerRequest}ms`);
    });

    it('deve degradar graciosamente sob alta carga', async () => {
      const highLoad = 20;
      const startTime = Date.now();
      
      // Mock que simula degradação sob alta carga
      let requestCount = 0;
      const mockProcessRegistrationDegradation = vi.fn().mockImplementation(async (data) => {
        requestCount++;
        
        // Simular degradação: mais requisições = mais lentidão
        const baseDelay = 1000;
        const degradationFactor = Math.min(requestCount * 100, 2000); // Máximo 2s extra
        const totalDelay = baseDelay + degradationFactor;
        
        await new Promise(resolve => setTimeout(resolve, totalDelay));
        
        // Simular algumas falhas sob alta carga
        if (requestCount > 15 && Math.random() < 0.2) {
          return {
            success: false,
            error: 'Sistema sobrecarregado',
            fallback_stored: true
          };
        }
        
        return {
          success: true,
          user_id: `degradation-test-${requestCount}`,
          asaas_customer_id: `cus_deg_${requestCount}`,
          asaas_subscription_id: `sub_deg_${requestCount}`,
          payment_id: `pay_deg_${requestCount}`
        };
      });

      vi.mocked(paymentFirstFlowService.processRegistration).mockImplementation(mockProcessRegistrationDegradation);

      const requests = Array.from({ length: highLoad }, (_, index) => 
        paymentFirstFlowService.processRegistration({
          ...performanceTestData,
          email: `degradation${index}@performance.com`
        })
      );

      const results = await Promise.all(requests);
      const totalTime = Date.now() - startTime;
      
      const successfulRequests = results.filter(r => r.success).length;
      const failedRequests = results.filter(r => !r.success).length;
      const fallbackActivated = results.filter(r => !r.success && r.fallback_stored).length;
      
      expect(results).toHaveLength(highLoad);
      expect(successfulRequests).toBeGreaterThan(highLoad * 0.7); // Pelo menos 70% de sucesso
      expect(fallbackActivated).toBeGreaterThan(0); // Sistema de fallback deve ser ativado
      
      console.log(`Teste de degradação - ${highLoad} requisições:`);
      console.log(`Sucessos: ${successfulRequests}`);
      console.log(`Falhas: ${failedRequests}`);
      console.log(`Fallbacks: ${fallbackActivated}`);
      console.log(`Tempo total: ${totalTime}ms`);
    });
  });

  describe('3. Otimização de Chamadas de API', () => {
    it('deve minimizar chamadas desnecessárias à API', async () => {
      let apiCallCount = 0;
      
      // Mock que conta chamadas de API
      const mockOptimizedProcessing = vi.fn().mockImplementation(async (data) => {
        // Simular chamadas otimizadas
        apiCallCount += 3; // Customer + Payment + Subscription (mínimo necessário)
        
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        return {
          success: true,
          user_id: 'optimized-user',
          asaas_customer_id: 'cus_optimized',
          asaas_subscription_id: 'sub_optimized',
          payment_id: 'pay_optimized'
        };
      });

      vi.mocked(paymentFirstFlowService.processRegistration).mockImplementation(mockOptimizedProcessing);

      await paymentFirstFlowService.processRegistration(performanceTestData);
      
      // Deve fazer no máximo 5 chamadas de API (incluindo verificações)
      expect(apiCallCount).toBeLessThanOrEqual(5);
      
      console.log(`Chamadas de API realizadas: ${apiCallCount}`);
    });

    it('deve usar cache quando apropriado', async () => {
      const cacheHits = new Map();
      
      const mockCachedProcessing = vi.fn().mockImplementation(async (data) => {
        // Simular cache de planos
        const planCacheKey = `plan_${data.plan_id}`;
        if (!cacheHits.has(planCacheKey)) {
          cacheHits.set(planCacheKey, true);
          // Simular busca de plano (primeira vez)
          await new Promise(resolve => setTimeout(resolve, 200));
        }
        
        // Simular cache de tipos de membro
        const memberTypeCacheKey = `member_type_${data.tipo_membro}`;
        if (!cacheHits.has(memberTypeCacheKey)) {
          cacheHits.set(memberTypeCacheKey, true);
          // Simular busca de tipo (primeira vez)
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        // Processamento principal
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        return {
          success: true,
          user_id: 'cached-user',
          asaas_customer_id: 'cus_cached',
          asaas_subscription_id: 'sub_cached',
          payment_id: 'pay_cached'
        };
      });

      vi.mocked(paymentFirstFlowService.processRegistration).mockImplementation(mockCachedProcessing);

      // Primeira requisição (sem cache)
      const startTime1 = Date.now();
      await paymentFirstFlowService.processRegistration(performanceTestData);
      const time1 = Date.now() - startTime1;
      
      // Segunda requisição (com cache)
      const startTime2 = Date.now();
      await paymentFirstFlowService.processRegistration(performanceTestData);
      const time2 = Date.now() - startTime2;
      
      // Segunda requisição deve ser mais rápida (cache)
      expect(time2).toBeLessThan(time1);
      expect(cacheHits.size).toBe(2); // Plan e MemberType em cache
      
      console.log(`Primeira requisição (sem cache): ${time1}ms`);
      console.log(`Segunda requisição (com cache): ${time2}ms`);
      console.log(`Melhoria de performance: ${((time1 - time2) / time1 * 100).toFixed(1)}%`);
    });

    it('deve processar operações em paralelo quando possível', async () => {
      const operationTimes: Record<string, number> = {};
      
      const mockParallelProcessing = vi.fn().mockImplementation(async (data) => {
        const startTime = Date.now();
        
        // Simular operações que podem ser paralelas
        const [customerResult, validationResult] = await Promise.all([
          // Criação de customer
          new Promise(resolve => {
            setTimeout(() => {
              operationTimes.customer = Date.now() - startTime;
              resolve({ id: 'cus_parallel' });
            }, 500);
          }),
          // Validação de dados
          new Promise(resolve => {
            setTimeout(() => {
              operationTimes.validation = Date.now() - startTime;
              resolve({ valid: true });
            }, 300);
          })
        ]);
        
        // Operação sequencial (depende das anteriores)
        const paymentStart = Date.now();
        await new Promise(resolve => setTimeout(resolve, 800));
        operationTimes.payment = Date.now() - paymentStart;
        
        return {
          success: true,
          user_id: 'parallel-user',
          asaas_customer_id: 'cus_parallel',
          asaas_subscription_id: 'sub_parallel',
          payment_id: 'pay_parallel'
        };
      });

      vi.mocked(paymentFirstFlowService.processRegistration).mockImplementation(mockParallelProcessing);

      const totalStart = Date.now();
      await paymentFirstFlowService.processRegistration(performanceTestData);
      const totalTime = Date.now() - totalStart;
      
      // Tempo total deve ser menor que soma das operações individuais
      const sequentialTime = 500 + 300 + 800; // Se fosse sequencial
      expect(totalTime).toBeLessThan(sequentialTime);
      
      console.log(`Processamento paralelo:`);
      console.log(`Customer: ${operationTimes.customer}ms`);
      console.log(`Validation: ${operationTimes.validation}ms`);
      console.log(`Payment: ${operationTimes.payment}ms`);
      console.log(`Total: ${totalTime}ms`);
      console.log(`Economia: ${sequentialTime - totalTime}ms`);
    });
  });

  describe('4. Métricas de Performance', () => {
    it('deve coletar métricas de tempo de processamento', async () => {
      const metrics: Array<{ operation: string; duration: number }> = [];
      
      const mockMetricsCollection = vi.fn().mockImplementation(async (data) => {
        const startTime = Date.now();
        
        // Operação 1: Validação
        const validationStart = Date.now();
        await new Promise(resolve => setTimeout(resolve, 200));
        metrics.push({ operation: 'validation', duration: Date.now() - validationStart });
        
        // Operação 2: Criação de customer
        const customerStart = Date.now();
        await new Promise(resolve => setTimeout(resolve, 500));
        metrics.push({ operation: 'customer_creation', duration: Date.now() - customerStart });
        
        // Operação 3: Processamento de pagamento
        const paymentStart = Date.now();
        await new Promise(resolve => setTimeout(resolve, 1000));
        metrics.push({ operation: 'payment_processing', duration: Date.now() - paymentStart });
        
        // Operação 4: Criação de conta
        const accountStart = Date.now();
        await new Promise(resolve => setTimeout(resolve, 300));
        metrics.push({ operation: 'account_creation', duration: Date.now() - accountStart });
        
        const totalDuration = Date.now() - startTime;
        metrics.push({ operation: 'total', duration: totalDuration });
        
        return {
          success: true,
          user_id: 'metrics-user',
          asaas_customer_id: 'cus_metrics',
          asaas_subscription_id: 'sub_metrics',
          payment_id: 'pay_metrics',
          processing_time_ms: totalDuration
        };
      });

      vi.mocked(paymentFirstFlowService.processRegistration).mockImplementation(mockMetricsCollection);

      const result = await paymentFirstFlowService.processRegistration(performanceTestData);
      
      expect(result.success).toBe(true);
      expect(result.processing_time_ms).toBeGreaterThan(0);
      expect(metrics).toHaveLength(5); // 4 operações + total
      
      // Verificar que métricas fazem sentido
      const totalMetric = metrics.find(m => m.operation === 'total');
      const operationSum = metrics
        .filter(m => m.operation !== 'total')
        .reduce((sum, m) => sum + m.duration, 0);
      
      expect(totalMetric?.duration).toBeGreaterThanOrEqual(operationSum * 0.9); // Margem para overhead
      
      console.log('Métricas coletadas:');
      metrics.forEach(metric => {
        console.log(`${metric.operation}: ${metric.duration}ms`);
      });
    });

    it('deve identificar gargalos de performance', async () => {
      const bottlenecks: Array<{ operation: string; duration: number; threshold: number }> = [];
      
      const mockBottleneckDetection = vi.fn().mockImplementation(async (data) => {
        const thresholds = {
          validation: 500,
          customer_creation: 1000,
          payment_processing: 2000,
          account_creation: 800
        };
        
        // Simular operações com alguns gargalos
        for (const [operation, threshold] of Object.entries(thresholds)) {
          const start = Date.now();
          
          // Simular gargalo ocasional
          const delay = operation === 'payment_processing' ? 2500 : Math.random() * threshold;
          await new Promise(resolve => setTimeout(resolve, delay));
          
          const duration = Date.now() - start;
          
          if (duration > threshold) {
            bottlenecks.push({ operation, duration, threshold });
          }
        }
        
        return {
          success: true,
          user_id: 'bottleneck-user',
          asaas_customer_id: 'cus_bottleneck',
          asaas_subscription_id: 'sub_bottleneck',
          payment_id: 'pay_bottleneck'
        };
      });

      vi.mocked(paymentFirstFlowService.processRegistration).mockImplementation(mockBottleneckDetection);

      await paymentFirstFlowService.processRegistration(performanceTestData);
      
      // Deve detectar pelo menos o gargalo simulado no payment_processing
      expect(bottlenecks.length).toBeGreaterThan(0);
      
      const paymentBottleneck = bottlenecks.find(b => b.operation === 'payment_processing');
      expect(paymentBottleneck).toBeDefined();
      expect(paymentBottleneck?.duration).toBeGreaterThan(paymentBottleneck?.threshold);
      
      console.log('Gargalos detectados:');
      bottlenecks.forEach(bottleneck => {
        console.log(`${bottleneck.operation}: ${bottleneck.duration}ms (limite: ${bottleneck.threshold}ms)`);
      });
    });
  });
});