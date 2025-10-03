/**
 * Cliente HTTP para comunicação com a API Asaas
 * Implementa retry automático, tratamento de erros robusto e validação
 */

import { asaasConfig, getAsaasHeaders, validateAsaasConfig } from './config';
import { asaasErrorHandler, withAsaasRetry, AsaasError as ProcessedAsaasError } from './error-handler';

// Tipos necessários para o cliente
export interface AsaasResponse<T> {
  data?: T;
  success: boolean;
  errors?: AsaasErrorData[];
  error?: ProcessedAsaasError;
  hasMore?: boolean;
  totalCount?: number;
  limit?: number;
  offset?: number;
}

export interface AsaasErrorData {
  code: string;
  description: string;
}

// Manter classe original para compatibilidade
export class AsaasError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = 'AsaasError';
  }
}

export class AsaasApiClient {
  private baseUrl: string;
  private headers: Record<string, string>;

  constructor() {
    const validation = validateAsaasConfig();
    if (!validation.isValid) {
      throw new Error(`Configuração Asaas inválida: ${validation.errors.join(', ')}`);
    }

    this.baseUrl = asaasConfig.baseUrl;
    this.headers = getAsaasHeaders();
  }

  /**
   * Executa requisição HTTP com tratamento robusto de erros
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<AsaasResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;

    try {
      // Criar AbortController para timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 segundos

      const response = await fetch(url, {
        ...options,
        headers: {
          ...this.headers,
          ...options.headers
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      const data = await response.json();

      if (!response.ok) {
        // Criar erro compatível com o sistema antigo
        const error = new AsaasError(
          data.errors?.[0]?.code || 'UNKNOWN_ERROR',
          data.errors?.[0]?.description || `HTTP ${response.status}`,
          response.status
        );

        // Processar com novo sistema de tratamento
        const processedError = asaasErrorHandler.processError(error, {
          function: `AsaasClient.${options.method || 'GET'}`,
          paymentId: this.extractIdFromEndpoint(endpoint)
        });

        return {
          success: false,
          error: processedError
        };
      }

      return {
        data,
        success: true
      };

    } catch (error) {
      // Processar erro com novo sistema
      const processedError = asaasErrorHandler.processError(error, {
        function: `AsaasClient.${options.method || 'GET'}`,
        paymentId: this.extractIdFromEndpoint(endpoint)
      });

      return {
        success: false,
        error: processedError
      };
    }
  }

  /**
   * Extrai ID do endpoint para contexto de erro
   */
  private extractIdFromEndpoint(endpoint: string): string | undefined {
    const matches = endpoint.match(/\/([a-zA-Z0-9_-]+)(?:\/|$)/);
    return matches?.[1];
  }

  /**
   * GET request com retry automático
   */
  async get<T>(endpoint: string, params?: Record<string, any>): Promise<AsaasResponse<T>> {
    return withAsaasRetry(async () => {
      const url = new URL(`${this.baseUrl}${endpoint}`);
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            url.searchParams.append(key, String(value));
          }
        });
      }

      const result = await this.request<T>(endpoint + url.search, {
        method: 'GET'
      });

      // Se há erro e não é retryable, lançar para parar retry
      if (!result.success && result.error && !result.error.retryable) {
        throw result.error;
      }

      return result;
    }, {
      function: 'AsaasClient.get',
      paymentId: this.extractIdFromEndpoint(endpoint)
    });
  }

  /**
   * POST request com retry automático
   */
  async post<T>(endpoint: string, body?: any): Promise<AsaasResponse<T>> {
    return withAsaasRetry(async () => {
      const result = await this.request<T>(endpoint, {
        method: 'POST',
        body: body ? JSON.stringify(body) : undefined
      });

      // Se há erro e não é retryable, lançar para parar retry
      if (!result.success && result.error && !result.error.retryable) {
        throw result.error;
      }

      return result;
    }, {
      function: 'AsaasClient.post',
      paymentId: this.extractIdFromEndpoint(endpoint)
    });
  }

  /**
   * PUT request com retry automático
   */
  async put<T>(endpoint: string, body?: any): Promise<AsaasResponse<T>> {
    return withAsaasRetry(async () => {
      const result = await this.request<T>(endpoint, {
        method: 'PUT',
        body: body ? JSON.stringify(body) : undefined
      });

      // Se há erro e não é retryable, lançar para parar retry
      if (!result.success && result.error && !result.error.retryable) {
        throw result.error;
      }

      return result;
    }, {
      function: 'AsaasClient.put',
      paymentId: this.extractIdFromEndpoint(endpoint)
    });
  }

  /**
   * DELETE request com retry automático
   */
  async delete<T>(endpoint: string): Promise<AsaasResponse<T>> {
    return withAsaasRetry(async () => {
      const result = await this.request<T>(endpoint, {
        method: 'DELETE'
      });

      // Se há erro e não é retryable, lançar para parar retry
      if (!result.success && result.error && !result.error.retryable) {
        throw result.error;
      }

      return result;
    }, {
      function: 'AsaasClient.delete',
      paymentId: this.extractIdFromEndpoint(endpoint)
    });
  }

  /**
   * Testa conectividade com a API Asaas
   */
  async testConnection(): Promise<{ success: boolean; message: string; error?: ProcessedAsaasError }> {
    try {
      // Tenta buscar informações da conta para validar conectividade
      const result = await this.get('/myAccount');
      
      if (result.success) {
        return {
          success: true,
          message: `Conectado com sucesso ao ambiente ${asaasConfig.environment}`
        };
      } else {
        return {
          success: false,
          message: result.error?.userMessage || 'Erro de conexão',
          error: result.error
        };
      }
    } catch (error) {
      const processedError = asaasErrorHandler.processError(error, {
        function: 'AsaasClient.testConnection'
      });

      return {
        success: false,
        message: processedError.userMessage,
        error: processedError
      };
    }
  }

  /**
   * Obter estatísticas de erros do cliente
   */
  getErrorStats() {
    return asaasErrorHandler.getErrorStats();
  }

  /**
   * Limpar log de erros
   */
  clearErrorLog() {
    asaasErrorHandler.clearErrorLog();
  }
}

// Instância singleton do cliente
export const asaasClient = new AsaasApiClient();