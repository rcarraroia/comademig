/**
 * Cliente Asaas compartilhado para Edge Functions
 * Centraliza configurações e utilitários para comunicação com API Asaas
 */

// Configurações do Asaas
export const ASAAS_CONFIG = {
  apiKey: Deno.env.get('ASAAS_API_KEY') || '',
  baseUrl: Deno.env.get('ASAAS_BASE_URL') || 'https://api-sandbox.asaas.com/v3',
  environment: Deno.env.get('ASAAS_ENVIRONMENT') || 'sandbox',
  userAgent: 'COMADEMIG-Portal/1.0'
};

// Tipos base
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

/**
 * Cliente HTTP para API Asaas
 */
export class AsaasClient {
  private baseUrl: string;
  private apiKey: string;
  private userAgent: string;

  constructor() {
    this.baseUrl = ASAAS_CONFIG.baseUrl;
    this.apiKey = ASAAS_CONFIG.apiKey;
    this.userAgent = ASAAS_CONFIG.userAgent;

    if (!this.apiKey) {
      throw new Error('ASAAS_API_KEY não configurada');
    }
  }

  /**
   * Headers padrão para requisições
   */
  private getHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'access_token': this.apiKey,
      'User-Agent': this.userAgent
    };
  }

  /**
   * Executa requisição HTTP com retry
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const maxRetries = 3;
    let lastError: Error;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch(url, {
          ...options,
          headers: {
            ...this.getHeaders(),
            ...options.headers
          }
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.errors?.[0]?.description || `HTTP ${response.status}: ${response.statusText}`
          );
        }

        return data;

      } catch (error) {
        lastError = error as Error;
        
        // Não retry para erros de validação (4xx)
        if (error instanceof Error && error.message.includes('HTTP 4')) {
          throw error;
        }

        // Retry apenas para erros temporários
        if (attempt < maxRetries) {
          const backoffMs = Math.pow(2, attempt) * 1000;
          await new Promise(resolve => setTimeout(resolve, backoffMs));
          continue;
        }
      }
    }

    throw lastError!;
  }

  /**
   * GET request
   */
  async get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    const url = new URL(`${this.baseUrl}${endpoint}`);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    return this.request<T>(endpoint + url.search, {
      method: 'GET'
    });
  }

  /**
   * POST request
   */
  async post<T>(endpoint: string, body?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined
    });
  }

  /**
   * PUT request
   */
  async put<T>(endpoint: string, body?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined
    });
  }

  /**
   * DELETE request
   */
  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'DELETE'
    });
  }
}

/**
 * Instância singleton do cliente
 */
export const asaasClient = new AsaasClient();