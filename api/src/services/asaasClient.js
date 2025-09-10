const axios = require('axios');
const config = require('../config');
const logger = require('../utils/logger');

/**
 * Cliente para integração com API Asaas v3
 * Implementa retry automático e circuit breaker
 */
class AsaasClient {
  constructor() {
    this.baseURL = config.asaas.apiUrl;
    this.apiKey = config.asaas.apiKey;
    
    // Configurar cliente axios
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 30000, // 30 segundos
      headers: {
        'Content-Type': 'application/json',
        'access_token': this.apiKey
      }
    });

    // Configurar interceptors
    this.setupInterceptors();
    
    // Circuit breaker state
    this.circuitBreaker = {
      failures: 0,
      lastFailureTime: null,
      state: 'CLOSED', // CLOSED, OPEN, HALF_OPEN
      threshold: 5,
      timeout: 60000 // 1 minuto
    };
  }

  /**
   * Configurar interceptors para logging e retry
   */
  setupInterceptors() {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        logger.info('Asaas API Request', {
          method: config.method?.toUpperCase(),
          url: config.url,
          baseURL: config.baseURL,
          timestamp: new Date().toISOString()
        });
        return config;
      },
      (error) => {
        logger.error('Asaas API Request Error', {
          error: error.message,
          config: error.config
        });
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => {
        // Reset circuit breaker on success
        this.resetCircuitBreaker();
        
        logger.info('Asaas API Response Success', {
          status: response.status,
          url: response.config.url,
          method: response.config.method?.toUpperCase(),
          timestamp: new Date().toISOString()
        });
        return response;
      },
      (error) => {
        // Handle circuit breaker
        this.handleFailure();
        
        logger.error('Asaas API Response Error', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          url: error.config?.url,
          method: error.config?.method?.toUpperCase(),
          data: error.response?.data,
          message: error.message,
          timestamp: new Date().toISOString()
        });
        
        return Promise.reject(this.normalizeError(error));
      }
    );
  }

  /**
   * Verificar estado do circuit breaker
   */
  checkCircuitBreaker() {
    if (this.circuitBreaker.state === 'OPEN') {
      const now = Date.now();
      if (now - this.circuitBreaker.lastFailureTime > this.circuitBreaker.timeout) {
        this.circuitBreaker.state = 'HALF_OPEN';
        logger.info('Circuit breaker mudou para HALF_OPEN');
      } else {
        throw new Error('Circuit breaker OPEN - Asaas API temporariamente indisponível');
      }
    }
  }

  /**
   * Tratar falha no circuit breaker
   */
  handleFailure() {
    this.circuitBreaker.failures++;
    this.circuitBreaker.lastFailureTime = Date.now();
    
    if (this.circuitBreaker.failures >= this.circuitBreaker.threshold) {
      this.circuitBreaker.state = 'OPEN';
      logger.error('Circuit breaker ABERTO', {
        failures: this.circuitBreaker.failures,
        threshold: this.circuitBreaker.threshold
      });
    }
  }

  /**
   * Resetar circuit breaker
   */
  resetCircuitBreaker() {
    if (this.circuitBreaker.failures > 0) {
      logger.info('Circuit breaker resetado');
    }
    this.circuitBreaker.failures = 0;
    this.circuitBreaker.state = 'CLOSED';
  }

  /**
   * Normalizar erros da API
   */
  normalizeError(error) {
    const normalized = {
      message: error.message,
      status: error.response?.status,
      code: error.code,
      asaasError: error.response?.data
    };

    // Mapear erros comuns
    if (error.response?.status === 400) {
      normalized.type = 'VALIDATION_ERROR';
    } else if (error.response?.status === 401) {
      normalized.type = 'AUTHENTICATION_ERROR';
    } else if (error.response?.status === 403) {
      normalized.type = 'AUTHORIZATION_ERROR';
    } else if (error.response?.status === 404) {
      normalized.type = 'NOT_FOUND_ERROR';
    } else if (error.response?.status >= 500) {
      normalized.type = 'SERVER_ERROR';
    } else if (error.code === 'ECONNABORTED') {
      normalized.type = 'TIMEOUT_ERROR';
    } else {
      normalized.type = 'NETWORK_ERROR';
    }

    return normalized;
  }

  /**
   * Fazer requisição com retry automático
   */
  async makeRequest(method, url, data = null, options = {}) {
    this.checkCircuitBreaker();

    const maxRetries = options.maxRetries || 3;
    const retryDelay = options.retryDelay || 1000;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const config = {
          method,
          url,
          ...options
        };

        if (data) {
          config.data = data;
        }

        const response = await this.client(config);
        return response.data;
      } catch (error) {
        const isLastAttempt = attempt === maxRetries;
        const shouldRetry = this.shouldRetry(error, attempt);

        if (isLastAttempt || !shouldRetry) {
          throw error;
        }

        const delay = retryDelay * Math.pow(2, attempt - 1); // Exponential backoff
        logger.warn(`Tentativa ${attempt} falhou, tentando novamente em ${delay}ms`, {
          error: error.message,
          attempt,
          maxRetries,
          url
        });

        await this.sleep(delay);
      }
    }
  }

  /**
   * Determinar se deve tentar novamente
   */
  shouldRetry(error, attempt) {
    // Não tentar novamente para erros de cliente (4xx)
    if (error.status >= 400 && error.status < 500) {
      return false;
    }

    // Tentar novamente para erros de servidor (5xx) e rede
    return error.status >= 500 || error.type === 'NETWORK_ERROR' || error.type === 'TIMEOUT_ERROR';
  }

  /**
   * Sleep helper
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // ============================================================================
  // MÉTODOS DA API ASAAS
  // ============================================================================

  /**
   * Criar customer no Asaas
   */
  async createCustomer(customerData) {
    logger.audit('asaas_create_customer', { customerData });
    
    return await this.makeRequest('POST', '/customers', customerData);
  }

  /**
   * Buscar customer por CPF/CNPJ
   */
  async findCustomerByCpfCnpj(cpfCnpj) {
    logger.audit('asaas_find_customer', { cpfCnpj });
    
    const response = await this.makeRequest('GET', '/customers', null, {
      params: { cpfCnpj }
    });
    
    return response.data && response.data.length > 0 ? response.data[0] : null;
  }

  /**
   * Criar assinatura recorrente
   */
  async createSubscription(subscriptionData) {
    logger.audit('asaas_create_subscription', { 
      customer: subscriptionData.customer,
      value: subscriptionData.value,
      cycle: subscriptionData.cycle
    });
    
    return await this.makeRequest('POST', '/subscriptions', subscriptionData);
  }

  /**
   * Criar pagamento único
   */
  async createPayment(paymentData) {
    logger.audit('asaas_create_payment', {
      customer: paymentData.customer,
      value: paymentData.value,
      billingType: paymentData.billingType
    });
    
    return await this.makeRequest('POST', '/payments', paymentData);
  }

  /**
   * Consultar status de pagamento
   */
  async getPayment(paymentId) {
    logger.audit('asaas_get_payment', { paymentId });
    
    return await this.makeRequest('GET', `/payments/${paymentId}`);
  }

  /**
   * Consultar assinatura
   */
  async getSubscription(subscriptionId) {
    logger.audit('asaas_get_subscription', { subscriptionId });
    
    return await this.makeRequest('GET', `/subscriptions/${subscriptionId}`);
  }

  /**
   * Criar pagamento único
   */
  async createPayment(paymentData) {
    logger.audit('asaas_create_payment', {
      customer: paymentData.customer,
      value: paymentData.value,
      billingType: paymentData.billingType
    });
    
    return await this.makeRequest('POST', '/payments', paymentData);
  }

  /**
   * Consultar pagamento
   */
  async getPayment(paymentId) {
    logger.audit('asaas_get_payment', { paymentId });
    
    return await this.makeRequest('GET', `/payments/${paymentId}`);
  }

  /**
   * Tokenizar cartão de crédito
   */
  async tokenizeCard(cardData) {
    logger.audit('asaas_tokenize_card', {
      holderName: cardData.holderName,
      lastFour: cardData.number.slice(-4)
    });
    
    return await this.makeRequest('POST', '/creditCard/tokenize', cardData);
  }

  /**
   * Validar wallet de afiliado
   */
  async validateWallet(walletId) {
    logger.audit('asaas_validate_wallet', { walletId });
    
    try {
      const response = await this.makeRequest('GET', `/wallets/${walletId}`);
      
      return {
        valid: true,
        wallet_id: walletId,
        owner_name: response.name || 'N/A',
        document: response.cpfCnpj || 'N/A',
        status: response.status || 'active'
      };
    } catch (error) {
      logger.warn('Wallet validation failed', {
        walletId,
        error: error.message
      });
      
      return {
        valid: false,
        error: error.message || 'Wallet não encontrada ou inválida'
      };
    }
  }

  /**
   * Tokenizar cartão de crédito
   */
  async tokenizeCard(cardData) {
    logger.audit('asaas_tokenize_card', {
      holderName: cardData.holderName,
      number: '****' + cardData.number.slice(-4) // Log apenas últimos 4 dígitos
    });
    
    return await this.makeRequest('POST', '/creditCard/tokenize', cardData);
  }

  /**
   * Validar wallet ID
   */
  async validateWallet(walletId) {
    logger.audit('asaas_validate_wallet', { walletId });
    
    try {
      // Tentar buscar informações da wallet
      const response = await this.makeRequest('GET', `/wallets/${walletId}`);
      return { valid: true, wallet: response };
    } catch (error) {
      if (error.status === 404) {
        return { valid: false, error: 'Wallet não encontrada' };
      }
      throw error;
    }
  }
}

// Singleton instance
const asaasClient = new AsaasClient();

module.exports = asaasClient;