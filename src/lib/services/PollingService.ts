/**
 * PollingService - Monitoramento de Status de Pagamentos
 * 
 * Implementa polling com intervalo fixo para verificar status de pagamentos
 * conforme Requirement 2: Confirmação de Pagamento com Polling
 */

export interface PollingOptions {
  paymentId: string;
  timeout: number; // em segundos (15s conforme spec)
  interval: number; // em segundos (1s conforme spec)
  onStatusUpdate?: (status: PaymentStatus) => void;
}

export interface PaymentStatus {
  id: string;
  status: 'PENDING' | 'CONFIRMED' | 'REFUSED' | 'OVERDUE' | 'CANCELLED';
  updatedAt: string;
  metadata?: Record<string, any>;
}

export interface PollingResult {
  success: boolean;
  status?: PaymentStatus;
  error?: string;
  timedOut?: boolean;
  attempts: number;
  duration: number; // em milissegundos
}

export class PollingService {
  private static instance: PollingService;
  private activePolls = new Map<string, AbortController>();

  static getInstance(): PollingService {
    if (!PollingService.instance) {
      PollingService.instance = new PollingService();
    }
    return PollingService.instance;
  }

  /**
   * Inicia polling de status de pagamento
   * Requirement 2.1: Consultar status a cada 1 segundo
   * Requirement 2.2: Retornar sucesso imediatamente se CONFIRMED
   * Requirement 2.3: Retornar falha imediatamente se REFUSED
   * Requirement 2.4: Timeout após 15 segundos
   * Requirement 2.5: Usar intervalo fixo de 1 segundo
   */
  async pollPaymentStatus(options: PollingOptions): Promise<PollingResult> {
    const { paymentId, timeout, interval, onStatusUpdate } = options;
    const startTime = Date.now();
    const timeoutMs = timeout * 1000;
    const intervalMs = interval * 1000;
    
    // Cancelar polling anterior se existir
    this.cancelPolling(paymentId);
    
    // Criar novo AbortController para este polling
    const abortController = new AbortController();
    this.activePolls.set(paymentId, abortController);
    
    let attempts = 0;
    
    try {
      while (Date.now() - startTime < timeoutMs) {
        // Verificar se foi cancelado
        if (abortController.signal.aborted) {
          throw new Error('Polling cancelado');
        }
        
        attempts++;
        
        try {
          // Consultar status via Edge Function
          const status = await this.checkPaymentStatus(paymentId, abortController.signal);
          
          // Callback de atualização se fornecido
          if (onStatusUpdate) {
            onStatusUpdate(status);
          }
          
          // Requirement 2.2: Retornar sucesso imediatamente se CONFIRMED
          if (status.status === 'CONFIRMED') {
            this.activePolls.delete(paymentId);
            return {
              success: true,
              status,
              attempts,
              duration: Date.now() - startTime
            };
          }
          
          // Requirement 2.3: Retornar falha imediatamente se REFUSED
          if (status.status === 'REFUSED') {
            this.activePolls.delete(paymentId);
            return {
              success: false,
              status,
              error: 'Pagamento recusado',
              attempts,
              duration: Date.now() - startTime
            };
          }
          
          // Status ainda pendente, aguardar próximo intervalo
          if (status.status === 'PENDING' || status.status === 'OVERDUE') {
            // Requirement 2.5: Intervalo fixo de 1 segundo
            await this.sleep(intervalMs);
            continue;
          }
          
          // Status inesperado (CANCELLED, etc)
          this.activePolls.delete(paymentId);
          return {
            success: false,
            status,
            error: `Status inesperado: ${status.status}`,
            attempts,
            duration: Date.now() - startTime
          };
          
        } catch (error) {
          console.warn(`Erro na tentativa ${attempts} de polling:`, error);
          
          // Se for erro de rede/temporário, continuar tentando
          if (Date.now() - startTime < timeoutMs - intervalMs) {
            await this.sleep(intervalMs);
            continue;
          }
          
          // Se estivermos próximos do timeout, falhar
          throw error;
        }
      }
      
      // Requirement 2.4: Timeout após 15 segundos
      this.activePolls.delete(paymentId);
      return {
        success: false,
        error: 'Timeout: Pagamento não foi confirmado no tempo esperado',
        timedOut: true,
        attempts,
        duration: Date.now() - startTime
      };
      
    } catch (error) {
      this.activePolls.delete(paymentId);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido no polling',
        attempts,
        duration: Date.now() - startTime
      };
    }
  }

  /**
   * Cancela polling ativo para um pagamento específico
   */
  cancelPolling(paymentId: string): void {
    const controller = this.activePolls.get(paymentId);
    if (controller) {
      controller.abort();
      this.activePolls.delete(paymentId);
    }
  }

  /**
   * Cancela todos os pollings ativos
   */
  cancelAllPolling(): void {
    for (const [paymentId, controller] of this.activePolls) {
      controller.abort();
    }
    this.activePolls.clear();
  }

  /**
   * Verifica status de um pagamento via Edge Function
   */
  private async checkPaymentStatus(paymentId: string, signal: AbortSignal): Promise<PaymentStatus> {
    const response = await fetch('/api/asaas/payment-status', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ paymentId }),
      signal
    });

    if (!response.ok) {
      throw new Error(`Erro ao consultar status: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Erro ao consultar status do pagamento');
    }

    return data.status;
  }

  /**
   * Utilitário para aguardar um tempo específico
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Retorna informações sobre pollings ativos
   */
  getActivePolls(): string[] {
    return Array.from(this.activePolls.keys());
  }

  /**
   * Verifica se há polling ativo para um pagamento
   */
  isPollingActive(paymentId: string): boolean {
    return this.activePolls.has(paymentId);
  }
}

// Exportar instância singleton
export const pollingService = PollingService.getInstance();

// Tipos auxiliares para uso em hooks
export type { PollingOptions, PaymentStatus, PollingResult };