/**
 * Testes para PaymentFirstFlowService
 * Valida implementação dos Requirements 1.1-1.2
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PaymentFirstFlowService, RegistrationData } from '@/lib/services/PaymentFirstFlowService';

// Mock do Supabase client
const mockSupabaseClient = {
  functions: {
    invoke: vi.fn()
  },
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn()
      }))
    })),
    insert: vi.fn()
  })),
  auth: {
    admin: {
      createUser: vi.fn()
    }
  }
};

// Mock da função getSupabaseClient
vi.mock('@/lib/services/PaymentFirstFlowService', async () => {
  const actual = await vi.importActual('@/lib/services/PaymentFirstFlowService');
  return {
    ...actual,
    getSupabaseClient: () => mockSupabaseClient
  };
});

// Mock dos serviços dependentes
vi.mock('@/lib/services/PollingService', () => ({
  pollingService: {
    pollPaymentStatus: vi.fn()
  }
}));

vi.mock('@/lib/services/FallbackSystem', () => ({
  fallbackSystem: {
    storePendingSubscription: vi.fn(),
    storePendingCompletion: vi.fn()
  }
}));

describe('PaymentFirstFlowService', () => {
  let service: PaymentFirstFlowService;
  let validRegistrationData: RegistrationData;

  beforeEach(() => {
    service = PaymentFirstFlowService.getInstance();
    
    validRegistrationData = {
      nome: 'João Silva',
      email: 'joao@example.com',
      password: 'password123',
      cpf: '11144477735', // CPF válido
      telefone: '11999999999',
      endereco: {
        cep: '01234567',
        logradouro: 'Rua das Flores, 123',
        numero: '123',
        complemento: 'Apto 45',
        bairro: 'Centro',
        cidade: 'São Paulo',
        estado: 'SP'
      },
      tipo_membro: 'pastor',
      plan_id: 'plan_123',
      payment_method: 'CREDIT_CARD',
      card_data: {
        holderName: 'João Silva',
        number: '4111111111111111',
        expiryMonth: '12',
        expiryYear: '2026', // Ano futuro válido
        ccv: '123'
      },
      affiliate_id: 'affiliate_123'
    };

    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Requirement 1.1: Validar dados antes de qualquer processamento', () => {
    it('deve validar dados válidos com sucesso', () => {
      const result = service.validateRegistrationData(validRegistrationData);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('deve rejeitar nome inválido', () => {
      const invalidData = { ...validRegistrationData, nome: 'A' };
      const result = service.validateRegistrationData(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'nome',
        message: 'Nome deve ter pelo menos 2 caracteres',
        code: 'INVALID_NAME'
      });
    });

    it('deve rejeitar email inválido', () => {
      const invalidData = { ...validRegistrationData, email: 'email-invalido' };
      const result = service.validateRegistrationData(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'email',
        message: 'Email inválido',
        code: 'INVALID_EMAIL'
      });
    });

    it('deve rejeitar senha muito curta', () => {
      const invalidData = { ...validRegistrationData, password: '123' };
      const result = service.validateRegistrationData(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'password',
        message: 'Senha deve ter pelo menos 6 caracteres',
        code: 'INVALID_PASSWORD'
      });
    });

    it('deve rejeitar CPF inválido', () => {
      const invalidData = { ...validRegistrationData, cpf: '123' };
      const result = service.validateRegistrationData(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'cpf',
        message: 'CPF inválido',
        code: 'INVALID_CPF'
      });
    });

    it('deve rejeitar telefone inválido', () => {
      const invalidData = { ...validRegistrationData, telefone: '123' };
      const result = service.validateRegistrationData(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'telefone',
        message: 'Telefone inválido',
        code: 'INVALID_PHONE'
      });
    });

    it('deve rejeitar CEP inválido', () => {
      const invalidData = { 
        ...validRegistrationData, 
        endereco: { ...validRegistrationData.endereco, cep: '123' }
      };
      const result = service.validateRegistrationData(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'endereco.cep',
        message: 'CEP inválido',
        code: 'INVALID_CEP'
      });
    });

    it('deve rejeitar tipo de membro inválido', () => {
      const invalidData = { ...validRegistrationData, tipo_membro: 'invalid' as any };
      const result = service.validateRegistrationData(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'tipo_membro',
        message: 'Tipo de membro inválido',
        code: 'INVALID_MEMBER_TYPE'
      });
    });

    it('deve rejeitar método de pagamento inválido', () => {
      const invalidData = { ...validRegistrationData, payment_method: 'INVALID' as any };
      const result = service.validateRegistrationData(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'payment_method',
        message: 'Método de pagamento inválido',
        code: 'INVALID_PAYMENT_METHOD'
      });
    });

    it('deve rejeitar dados de cartão ausentes para pagamento com cartão', () => {
      const invalidData = { 
        ...validRegistrationData, 
        payment_method: 'CREDIT_CARD' as const,
        card_data: undefined 
      };
      const result = service.validateRegistrationData(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'card_data',
        message: 'Dados do cartão são obrigatórios',
        code: 'MISSING_CARD_DATA'
      });
    });

    it('deve validar dados de cartão corretamente', () => {
      const invalidCardData = {
        ...validRegistrationData,
        card_data: {
          holderName: 'A',
          number: '123',
          expiryMonth: '13',
          expiryYear: '2020',
          ccv: '12'
        }
      };
      const result = service.validateRegistrationData(invalidCardData);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      
      const errorCodes = result.errors.map(e => e.code);
      expect(errorCodes).toContain('INVALID_CARD_HOLDER');
      expect(errorCodes).toContain('INVALID_CARD_NUMBER');
      expect(errorCodes).toContain('INVALID_EXPIRY_MONTH');
      expect(errorCodes).toContain('INVALID_EXPIRY_YEAR');
      expect(errorCodes).toContain('INVALID_CCV');
    });

    it('deve aceitar pagamento PIX sem dados de cartão', () => {
      const pixData = {
        ...validRegistrationData,
        payment_method: 'PIX' as const,
        card_data: undefined
      };
      const result = service.validateRegistrationData(pixData);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('Requirement 1.2: Processar fluxo completo', () => {
    it('deve processar registro com dados válidos', async () => {
      // Mock do polling service para retornar sucesso
      const { pollingService } = await import('@/lib/services/PollingService');
      vi.mocked(pollingService.pollPaymentStatus).mockResolvedValue({
        success: true,
        status: {
          id: 'pay_123',
          status: 'CONFIRMED',
          updatedAt: new Date().toISOString()
        },
        attempts: 2,
        duration: 3000
      });

      const result = await service.processRegistration(validRegistrationData);

      expect(result.success).toBe(true);
      expect(result.user_id).toBeDefined();
      expect(result.payment_id).toBeDefined();
      expect(result.asaas_customer_id).toBeDefined();
      expect(result.steps.length).toBeGreaterThan(0);
      
      // Verificar que todas as etapas foram executadas
      const stepNames = result.steps.map(s => s.step);
      expect(stepNames).toContain('validation');
      expect(stepNames).toContain('asaas_customer');
      expect(stepNames).toContain('payment');
      expect(stepNames).toContain('payment_confirmation');
      expect(stepNames).toContain('account_creation');
      expect(stepNames).toContain('profile_subscription');
      expect(stepNames).toContain('completed');
    });

    it('deve falhar com dados inválidos', async () => {
      const invalidData = { ...validRegistrationData, email: 'invalid-email' };
      
      const result = await service.processRegistration(invalidData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Dados inválidos');
      expect(result.steps.length).toBeGreaterThan(0);
      
      // Verificar que a validação foi processada e falhou
      const validationSteps = result.steps.filter(s => s.step === 'validation');
      expect(validationSteps.length).toBeGreaterThan(0);
      
      // O último step de validação deve ter falhado
      const lastValidationStep = validationSteps[validationSteps.length - 1];
      expect(lastValidationStep.status).toBe('failed');
    });

    it('deve armazenar no fallback system quando polling timeout', async () => {
      // Mock do polling service para retornar timeout
      const { pollingService } = await import('@/lib/services/PollingService');
      vi.mocked(pollingService.pollPaymentStatus).mockResolvedValue({
        success: false,
        timedOut: true,
        error: 'Timeout: Pagamento não foi confirmado no tempo esperado',
        attempts: 15,
        duration: 15000
      });

      // Mock do fallback system
      const { fallbackSystem } = await import('@/lib/services/FallbackSystem');
      vi.mocked(fallbackSystem.storePendingSubscription).mockResolvedValue('pending_123');

      const result = await service.processRegistration(validRegistrationData);

      expect(result.success).toBe(false);
      expect(result.fallback_stored).toBe(true);
      expect(result.error).toContain('Timeout na confirmação');
      expect(fallbackSystem.storePendingSubscription).toHaveBeenCalled();
    });

    it('deve falhar quando pagamento é recusado', async () => {
      // Mock do polling service para retornar pagamento recusado
      const { pollingService } = await import('@/lib/services/PollingService');
      vi.mocked(pollingService.pollPaymentStatus).mockResolvedValue({
        success: false,
        status: {
          id: 'pay_123',
          status: 'REFUSED',
          updatedAt: new Date().toISOString()
        },
        error: 'Pagamento recusado',
        attempts: 1,
        duration: 1000
      });

      const result = await service.processRegistration(validRegistrationData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Pagamento recusado');
      expect(result.fallback_stored).toBeUndefined();
    });
  });

  describe('Gerenciamento de fluxos ativos', () => {
    it('deve gerenciar fluxos ativos corretamente', () => {
      const activeFlowsBefore = service.getActiveFlows();
      expect(activeFlowsBefore).toHaveLength(0);

      // Durante o processamento, deve haver fluxos ativos
      // (testado indiretamente através dos testes de processamento)
    });

    it('deve retornar null para fluxo inexistente', () => {
      const status = service.getFlowStatus('invalid_flow_id');
      expect(status).toBeNull();
    });
  });

  describe('Singleton pattern', () => {
    it('deve retornar a mesma instância', () => {
      const instance1 = PaymentFirstFlowService.getInstance();
      const instance2 = PaymentFirstFlowService.getInstance();

      expect(instance1).toBe(instance2);
    });
  });

  describe('Validações específicas', () => {
    it('deve validar CPF corretamente', () => {
      // CPF válido
      const validCPF = { ...validRegistrationData, cpf: '11144477735' };
      expect(service.validateRegistrationData(validCPF).isValid).toBe(true);

      // CPF com todos dígitos iguais
      const invalidCPF1 = { ...validRegistrationData, cpf: '11111111111' };
      expect(service.validateRegistrationData(invalidCPF1).isValid).toBe(false);

      // CPF com tamanho incorreto
      const invalidCPF2 = { ...validRegistrationData, cpf: '123456789' };
      expect(service.validateRegistrationData(invalidCPF2).isValid).toBe(false);
    });

    it('deve validar telefone corretamente', () => {
      // Telefone válido com 11 dígitos
      const validPhone1 = { ...validRegistrationData, telefone: '11999999999' };
      expect(service.validateRegistrationData(validPhone1).isValid).toBe(true);

      // Telefone válido com 10 dígitos
      const validPhone2 = { ...validRegistrationData, telefone: '1133334444' };
      expect(service.validateRegistrationData(validPhone2).isValid).toBe(true);

      // Telefone inválido muito curto
      const invalidPhone = { ...validRegistrationData, telefone: '123456789' };
      expect(service.validateRegistrationData(invalidPhone).isValid).toBe(false);
    });

    it('deve validar dados de endereço corretamente', () => {
      const invalidAddress = {
        ...validRegistrationData,
        endereco: {
          cep: '123', // CEP inválido
          logradouro: 'Rua', // Muito curto
          numero: '', // Vazio
          bairro: 'A', // Muito curto
          cidade: 'B', // Muito curto
          estado: 'SAO' // Não é UF válida
        }
      };

      const result = service.validateRegistrationData(invalidAddress);
      expect(result.isValid).toBe(false);
      
      const errorCodes = result.errors.map(e => e.code);
      expect(errorCodes).toContain('INVALID_CEP');
      expect(errorCodes).toContain('INVALID_ADDRESS');
      expect(errorCodes).toContain('INVALID_NUMBER');
      expect(errorCodes).toContain('INVALID_NEIGHBORHOOD');
      expect(errorCodes).toContain('INVALID_CITY');
      expect(errorCodes).toContain('INVALID_STATE');
    });
  });
});