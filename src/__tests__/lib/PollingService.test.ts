/**
 * Testes para PollingService
 * Valida implementação dos Requirements 2.1-2.5
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PollingService, PaymentStatus } from '@/lib/services/PollingService';

// Mock do fetch global
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('PollingService', () => {
  let pollingService: PollingService;

  beforeEach(() => {
    pollingService = PollingService.getInstance();
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    pollingService.cancelAllPolling();
    vi.useRealTimers();
  });

  describe('Requirement 2.1: Consultar status a cada 1 segundo', () => {
    it('deve fazer polling com intervalo de 1 segundo', async () => {
      // Mock de resposta PENDING seguida de CONFIRMED
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            status: { id: 'pay_123', status: 'PENDING', updatedAt: new Date().toISOString() }
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            status: { id: 'pay_123', status: 'CONFIRMED', updatedAt: new Date().toISOString() }
          })
        });

      const pollingPromise = pollingService.pollPaymentStatus({
        paymentId: 'pay_123',
        timeout: 15,
        interval: 1
      });

      // Avançar 1 segundo para primeira consulta
      await vi.advanceTimersByTimeAsync(1000);
      
      // Avançar mais 1 segundo para segunda consulta
      await vi.advanceTimersByTimeAsync(1000);

      const result = await pollingPromise;

      expect(result.success).toBe(true);
      expect(result.attempts).toBe(2);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('Requirement 2.2: Retornar sucesso imediatamente se CONFIRMED', () => {
    it('deve retornar sucesso imediatamente quando status for CONFIRMED', async () => {
      const confirmedStatus: PaymentStatus = {
        id: 'pay_123',
        status: 'CONFIRMED',
        updatedAt: new Date().toISOString()
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          status: confirmedStatus
        })
      });

      const result = await pollingService.pollPaymentStatus({
        paymentId: 'pay_123',
        timeout: 15,
        interval: 1
      });

      expect(result.success).toBe(true);
      expect(result.status?.status).toBe('CONFIRMED');
      expect(result.attempts).toBe(1);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('Requirement 2.3: Retornar falha imediatamente se REFUSED', () => {
    it('deve retornar falha imediatamente quando status for REFUSED', async () => {
      const refusedStatus: PaymentStatus = {
        id: 'pay_123',
        status: 'REFUSED',
        updatedAt: new Date().toISOString()
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          status: refusedStatus
        })
      });

      const result = await pollingService.pollPaymentStatus({
        paymentId: 'pay_123',
        timeout: 15,
        interval: 1
      });

      expect(result.success).toBe(false);
      expect(result.status?.status).toBe('REFUSED');
      expect(result.error).toBe('Pagamento recusado');
      expect(result.attempts).toBe(1);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('Requirement 2.4: Timeout após 15 segundos', () => {
    it('deve retornar timeout após 15 segundos sem confirmação', async () => {
      // Mock sempre retorna PENDING
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          status: { id: 'pay_123', status: 'PENDING', updatedAt: new Date().toISOString() }
        })
      });

      const pollingPromise = pollingService.pollPaymentStatus({
        paymentId: 'pay_123',
        timeout: 15,
        interval: 1
      });

      // Avançar 15 segundos
      await vi.advanceTimersByTimeAsync(15000);

      const result = await pollingPromise;

      expect(result.success).toBe(false);
      expect(result.timedOut).toBe(true);
      expect(result.error).toContain('Timeout');
      expect(result.duration).toBeGreaterThanOrEqual(15000);
    });
  });

  describe('Requirement 2.5: Usar intervalo fixo de 1 segundo', () => {
    it('deve usar intervalo fixo independente de falhas', async () => {
      // Mock com falha seguida de sucesso
      mockFetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            status: { id: 'pay_123', status: 'CONFIRMED', updatedAt: new Date().toISOString() }
          })
        });

      const pollingPromise = pollingService.pollPaymentStatus({
        paymentId: 'pay_123',
        timeout: 15,
        interval: 1
      });

      // Avançar exatamente 1 segundo entre tentativas
      await vi.advanceTimersByTimeAsync(1000);
      await vi.advanceTimersByTimeAsync(1000);

      const result = await pollingPromise;

      expect(result.success).toBe(true);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('Gerenciamento de polling ativo', () => {
    it('deve cancelar polling anterior ao iniciar novo', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          status: { id: 'pay_123', status: 'PENDING', updatedAt: new Date().toISOString() }
        })
      });

      // Iniciar primeiro polling
      const firstPolling = pollingService.pollPaymentStatus({
        paymentId: 'pay_123',
        timeout: 15,
        interval: 1
      });

      expect(pollingService.isPollingActive('pay_123')).toBe(true);

      // Cancelar polling
      pollingService.cancelPolling('pay_123');

      expect(pollingService.isPollingActive('pay_123')).toBe(false);

      // Aguardar resolução
      await vi.advanceTimersByTimeAsync(1000);
      const result = await firstPolling;

      expect(result.success).toBe(false);
      expect(result.error).toContain('cancelado');
    });

    it('deve permitir múltiplos pollings simultâneos para pagamentos diferentes', () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          status: { id: 'pay_123', status: 'PENDING', updatedAt: new Date().toISOString() }
        })
      });

      pollingService.pollPaymentStatus({
        paymentId: 'pay_123',
        timeout: 15,
        interval: 1
      });

      pollingService.pollPaymentStatus({
        paymentId: 'pay_456',
        timeout: 15,
        interval: 1
      });

      expect(pollingService.isPollingActive('pay_123')).toBe(true);
      expect(pollingService.isPollingActive('pay_456')).toBe(true);
      expect(pollingService.getActivePolls()).toHaveLength(2);
    });
  });

  describe('Tratamento de erros', () => {
    it('deve tratar erro de rede adequadamente', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      const result = await pollingService.pollPaymentStatus({
        paymentId: 'pay_123',
        timeout: 15,
        interval: 1
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Network error');
    });

    it('deve tratar resposta HTTP de erro', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      });

      const result = await pollingService.pollPaymentStatus({
        paymentId: 'pay_123',
        timeout: 15,
        interval: 1
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('500');
    });

    it('deve tratar resposta de erro da API', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          success: false,
          error: 'Payment not found'
        })
      });

      const result = await pollingService.pollPaymentStatus({
        paymentId: 'pay_123',
        timeout: 15,
        interval: 1
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Payment not found');
    });
  });

  describe('Callback de status update', () => {
    it('deve chamar callback a cada atualização de status', async () => {
      const onStatusUpdate = vi.fn();

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            status: { id: 'pay_123', status: 'PENDING', updatedAt: new Date().toISOString() }
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            status: { id: 'pay_123', status: 'CONFIRMED', updatedAt: new Date().toISOString() }
          })
        });

      const pollingPromise = pollingService.pollPaymentStatus({
        paymentId: 'pay_123',
        timeout: 15,
        interval: 1,
        onStatusUpdate
      });

      await vi.advanceTimersByTimeAsync(1000);
      await vi.advanceTimersByTimeAsync(1000);

      await pollingPromise;

      expect(onStatusUpdate).toHaveBeenCalledTimes(2);
      expect(onStatusUpdate).toHaveBeenNthCalledWith(1, expect.objectContaining({ status: 'PENDING' }));
      expect(onStatusUpdate).toHaveBeenNthCalledWith(2, expect.objectContaining({ status: 'CONFIRMED' }));
    });
  });
});