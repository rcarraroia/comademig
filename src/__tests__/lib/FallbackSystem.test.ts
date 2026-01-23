/**
 * Testes para FallbackSystem
 * Valida implementação dos Requirements 4.1-4.5
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { FallbackSystem, PendingSubscriptionData, PendingCompletionData } from '@/lib/services/FallbackSystem';

// Mock do Supabase client
vi.mock('@/integrations/supabase/client', () => {
  const mockSupabase = {
    from: vi.fn(() => ({
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn()
        }))
      })),
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          lt: vi.fn(() => ({
            order: vi.fn()
          })),
          single: vi.fn(),
          in: vi.fn()
        })),
        union: vi.fn()
      })),
      update: vi.fn(() => ({
        eq: vi.fn()
      }))
    })),
    raw: vi.fn((sql) => sql)
  };

  return {
    supabase: mockSupabase
  };
});

describe('FallbackSystem', () => {
  let fallbackSystem: FallbackSystem;
  let mockSupabase: any;

  beforeEach(async () => {
    fallbackSystem = FallbackSystem.getInstance();
    
    // Importar o mock após o vi.mock
    const { supabase } = await import('@/integrations/supabase/client');
    mockSupabase = supabase;
    
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Requirement 4.1: Armazenar dados em pending_subscriptions', () => {
    it('deve armazenar pending subscription com sucesso', async () => {
      const mockData: PendingSubscriptionData = {
        payment_id: 'pay_123',
        asaas_customer_id: 'cus_123',
        user_data: {
          email: 'test@example.com',
          password: 'password123',
          nome: 'Test User',
          cpf: '12345678901',
          telefone: '11999999999',
          endereco: {},
          tipo_membro: 'pastor'
        },
        subscription_data: {
          plan_id: 'plan_123'
        },
        payment_data: {
          amount: 100,
          payment_method: 'CREDIT_CARD'
        },
        attempts: 0,
        status: 'pending'
      };

      // Mock successful insert
      const mockInsert = vi.fn().mockResolvedValue({
        data: { id: 'pending_123' },
        error: null
      });

      mockSupabase.from.mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: mockInsert
          })
        })
      });

      const result = await fallbackSystem.storePendingSubscription(mockData);

      expect(result).toBe('pending_123');
      expect(mockSupabase.from).toHaveBeenCalledWith('pending_subscriptions');
    });

    it('deve tratar erro ao armazenar pending subscription', async () => {
      const mockData: PendingSubscriptionData = {
        payment_id: 'pay_123',
        asaas_customer_id: 'cus_123',
        user_data: {
          email: 'test@example.com',
          password: 'password123',
          nome: 'Test User',
          cpf: '12345678901',
          telefone: '11999999999',
          endereco: {},
          tipo_membro: 'pastor'
        },
        subscription_data: {
          plan_id: 'plan_123'
        },
        payment_data: {
          amount: 100,
          payment_method: 'CREDIT_CARD'
        },
        attempts: 0,
        status: 'pending'
      };

      // Mock error
      const mockInsert = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Database error' }
      });

      mockSupabase.from.mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: mockInsert
          })
        })
      });

      await expect(fallbackSystem.storePendingSubscription(mockData))
        .rejects.toThrow('Erro ao armazenar pending subscription: Database error');
    });
  });

  describe('Requirement 4.2: Armazenar dados em pending_completions', () => {
    it('deve armazenar pending completion com sucesso', async () => {
      const mockData: PendingCompletionData = {
        payment_id: 'pay_123',
        asaas_customer_id: 'cus_123',
        asaas_subscription_id: 'sub_123',
        user_data: {
          email: 'test@example.com',
          password: 'password123',
          nome: 'Test User',
          cpf: '12345678901',
          telefone: '11999999999',
          endereco: {},
          tipo_membro: 'pastor'
        },
        attempts: 0,
        status: 'pending'
      };

      // Mock successful insert
      const mockInsert = vi.fn().mockResolvedValue({
        data: { id: 'completion_123' },
        error: null
      });

      mockSupabase.from.mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: mockInsert
          })
        })
      });

      const result = await fallbackSystem.storePendingCompletion(mockData);

      expect(result).toBe('completion_123');
      expect(mockSupabase.from).toHaveBeenCalledWith('pending_completions');
    });
  });

  describe('Requirement 4.3: Tentar completar processo automaticamente', () => {
    it('deve processar pending subscriptions automaticamente', async () => {
      // Mock data retrieval
      const mockPendingItems = [
        {
          id: 'pending_1',
          payment_id: 'pay_1',
          attempts: 0,
          status: 'pending'
        },
        {
          id: 'pending_2',
          payment_id: 'pay_2',
          attempts: 1,
          status: 'pending'
        }
      ];

      const mockSelect = vi.fn().mockResolvedValue({
        data: mockPendingItems,
        error: null
      });

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            lt: vi.fn().mockReturnValue({
              order: mockSelect
            })
          })
        }),
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null })
        })
      });

      const results = await fallbackSystem.retryPendingSubscriptions();

      expect(results).toHaveLength(2);
      expect(mockSupabase.from).toHaveBeenCalledWith('pending_subscriptions');
    });

    it('deve processar pending completions automaticamente', async () => {
      // Mock data retrieval
      const mockPendingItems = [
        {
          id: 'completion_1',
          payment_id: 'pay_1',
          attempts: 0,
          status: 'pending'
        }
      ];

      const mockSelect = vi.fn().mockResolvedValue({
        data: mockPendingItems,
        error: null
      });

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            lt: vi.fn().mockReturnValue({
              order: mockSelect
            })
          })
        }),
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null })
        })
      });

      const results = await fallbackSystem.retryPendingCompletions();

      expect(results).toHaveLength(1);
      expect(mockSupabase.from).toHaveBeenCalledWith('pending_completions');
    });

    it('deve retornar array vazio quando não há itens pendentes', async () => {
      const mockSelect = vi.fn().mockResolvedValue({
        data: [],
        error: null
      });

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            lt: vi.fn().mockReturnValue({
              order: mockSelect
            })
          })
        })
      });

      const results = await fallbackSystem.retryPendingSubscriptions();

      expect(results).toHaveLength(0);
    });
  });

  describe('Requirement 4.5: Permitir completar processo manualmente', () => {
    it('deve completar pending subscription manualmente', async () => {
      const mockItem = {
        id: 'pending_123',
        payment_id: 'pay_123',
        attempts: 2,
        status: 'pending'
      };

      // Mock item retrieval
      const mockSelect = vi.fn().mockResolvedValue({
        data: mockItem,
        error: null
      });

      // Mock status update
      const mockUpdate = vi.fn().mockResolvedValue({
        error: null
      });

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: mockSelect
          })
        }),
        update: vi.fn().mockReturnValue({
          eq: mockUpdate
        })
      });

      const result = await fallbackSystem.manuallyCompletePendingSubscription('pending_123');

      expect(result.success).toBe(true);
      expect(mockSupabase.from).toHaveBeenCalledWith('pending_subscriptions');
    });

    it('deve completar pending completion manualmente', async () => {
      const mockItem = {
        id: 'completion_123',
        payment_id: 'pay_123',
        attempts: 2,
        status: 'pending'
      };

      // Mock item retrieval
      const mockSelect = vi.fn().mockResolvedValue({
        data: mockItem,
        error: null
      });

      // Mock status update
      const mockUpdate = vi.fn().mockResolvedValue({
        error: null
      });

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: mockSelect
          })
        }),
        update: vi.fn().mockReturnValue({
          eq: mockUpdate
        })
      });

      const result = await fallbackSystem.manuallyCompletePendingCompletion('completion_123');

      expect(result.success).toBe(true);
      expect(mockSupabase.from).toHaveBeenCalledWith('pending_completions');
    });

    it('deve tratar erro quando item não é encontrado', async () => {
      // Mock item not found
      const mockSelect = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Not found' }
      });

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: mockSelect
          })
        })
      });

      const result = await fallbackSystem.manuallyCompletePendingSubscription('invalid_id');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Pending subscription não encontrada');
    });
  });

  describe('Estatísticas do sistema', () => {
    it('deve retornar estatísticas corretas', async () => {
      // Mock count queries
      const mockCount = vi.fn()
        .mockResolvedValueOnce({ count: 5 }) // pending subscriptions
        .mockResolvedValueOnce({ count: 3 }) // pending completions
        .mockResolvedValueOnce({ count: 10 }) // total completed subscriptions
        .mockResolvedValueOnce({ count: 7 }) // total completed completions
        .mockResolvedValueOnce({ count: 15 }) // total processed subscriptions
        .mockResolvedValueOnce({ count: 12 }); // total processed completions

      // Mock attempts data
      const mockAttemptsSelect = vi.fn().mockResolvedValue({
        data: [{ attempts: 1 }, { attempts: 2 }, { attempts: 0 }]
      });

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            union: mockAttemptsSelect
          }),
          in: vi.fn()
        })
      });

      // Mock count method
      Object.defineProperty(mockSupabase.from().select(), 'count', {
        value: mockCount,
        writable: true
      });

      const stats = await fallbackSystem.getStats();

      expect(stats.pendingSubscriptions).toBe(5);
      expect(stats.pendingCompletions).toBe(3);
      expect(stats.totalRetries).toBe(3); // 1 + 2 + 0
      expect(typeof stats.successRate).toBe('number');
      expect(stats.lastProcessed).toBeDefined();
    });

    it('deve retornar estatísticas padrão em caso de erro', async () => {
      // Mock error
      mockSupabase.from.mockImplementation(() => {
        throw new Error('Database error');
      });

      const stats = await fallbackSystem.getStats();

      expect(stats.pendingSubscriptions).toBe(0);
      expect(stats.pendingCompletions).toBe(0);
      expect(stats.totalRetries).toBe(0);
      expect(stats.successRate).toBe(0);
    });
  });

  describe('Singleton pattern', () => {
    it('deve retornar a mesma instância', () => {
      const instance1 = FallbackSystem.getInstance();
      const instance2 = FallbackSystem.getInstance();

      expect(instance1).toBe(instance2);
    });
  });
});