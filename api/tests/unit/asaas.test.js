const AsaasClient = require('../../src/services/asaasClient');
const axios = require('axios');

// Mock do axios
jest.mock('axios');
const mockedAxios = axios;

// Mock do logger
jest.mock('../../src/utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  audit: jest.fn()
}));

// Mock do config
jest.mock('../../src/config', () => ({
  asaas: {
    apiKey: 'test_api_key',
    environment: 'sandbox',
    baseUrl: 'https://sandbox.asaas.com/api/v3',
    timeout: 30000
  }
}));

describe('AsaasClient', () => {
  let asaasClient;

  beforeEach(() => {
    jest.clearAllMocks();
    asaasClient = new AsaasClient();
  });

  describe('makeRequest', () => {
    test('should make successful GET request', async () => {
      const mockResponse = {
        data: { id: 'test_id', name: 'Test Customer' },
        status: 200
      };
      mockedAxios.mockResolvedValue(mockResponse);

      const result = await asaasClient.makeRequest('GET', '/customers/test_id');

      expect(result).toEqual(mockResponse.data);
      expect(mockedAxios).toHaveBeenCalledWith({
        method: 'GET',
        url: 'https://sandbox.asaas.com/api/v3/customers/test_id',
        headers: {
          'access_token': 'test_api_key',
          'Content-Type': 'application/json'
        },
        timeout: 30000
      });
    });

    test('should make successful POST request with data', async () => {
      const mockResponse = {
        data: { id: 'new_customer_id', name: 'New Customer' },
        status: 201
      };
      const requestData = { name: 'New Customer', email: 'test@email.com' };
      
      mockedAxios.mockResolvedValue(mockResponse);

      const result = await asaasClient.makeRequest('POST', '/customers', requestData);

      expect(result).toEqual(mockResponse.data);
      expect(mockedAxios).toHaveBeenCalledWith({
        method: 'POST',
        url: 'https://sandbox.asaas.com/api/v3/customers',
        headers: {
          'access_token': 'test_api_key',
          'Content-Type': 'application/json'
        },
        data: requestData,
        timeout: 30000
      });
    });

    test('should handle 400 validation error', async () => {
      const mockError = {
        response: {
          status: 400,
          data: {
            errors: [
              { code: 'invalid_email', description: 'Email inválido' }
            ]
          }
        }
      };
      mockedAxios.mockRejectedValue(mockError);

      await expect(asaasClient.makeRequest('POST', '/customers', {}))
        .rejects
        .toThrow('Email inválido');
    });

    test('should handle 401 authentication error', async () => {
      const mockError = {
        response: {
          status: 401,
          data: { message: 'Invalid API key' }
        }
      };
      mockedAxios.mockRejectedValue(mockError);

      await expect(asaasClient.makeRequest('GET', '/customers'))
        .rejects
        .toThrow('Invalid API key');
    });

    test('should handle 500 server error', async () => {
      const mockError = {
        response: {
          status: 500,
          data: { message: 'Internal server error' }
        }
      };
      mockedAxios.mockRejectedValue(mockError);

      await expect(asaasClient.makeRequest('GET', '/customers'))
        .rejects
        .toThrow('Internal server error');
    });

    test('should handle network error', async () => {
      const mockError = {
        code: 'ECONNREFUSED',
        message: 'Connection refused'
      };
      mockedAxios.mockRejectedValue(mockError);

      await expect(asaasClient.makeRequest('GET', '/customers'))
        .rejects
        .toThrow('Connection refused');
    });
  });

  describe('createCustomer', () => {
    test('should create customer successfully', async () => {
      const customerData = {
        name: 'João Silva',
        email: 'joao@email.com',
        phone: '31999999999',
        cpfCnpj: '12345678901'
      };

      const mockResponse = {
        data: {
          id: 'cus_123456',
          ...customerData,
          object: 'customer'
        }
      };

      mockedAxios.mockResolvedValue(mockResponse);

      const result = await asaasClient.createCustomer(customerData);

      expect(result.id).toBe('cus_123456');
      expect(result.name).toBe(customerData.name);
      expect(mockedAxios).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'POST',
          url: expect.stringContaining('/customers'),
          data: customerData
        })
      );
    });
  });

  describe('createSubscription', () => {
    test('should create subscription successfully', async () => {
      const subscriptionData = {
        customer: 'cus_123456',
        billingType: 'PIX',
        nextDueDate: '2025-01-15',
        value: 150.00,
        cycle: 'MONTHLY'
      };

      const mockResponse = {
        data: {
          id: 'sub_123456',
          ...subscriptionData,
          object: 'subscription'
        }
      };

      mockedAxios.mockResolvedValue(mockResponse);

      const result = await asaasClient.createSubscription(subscriptionData);

      expect(result.id).toBe('sub_123456');
      expect(result.customer).toBe(subscriptionData.customer);
      expect(mockedAxios).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'POST',
          url: expect.stringContaining('/subscriptions'),
          data: subscriptionData
        })
      );
    });
  });

  describe('createPayment', () => {
    test('should create payment successfully', async () => {
      const paymentData = {
        customer: 'cus_123456',
        billingType: 'PIX',
        dueDate: '2025-01-15',
        value: 49.90,
        description: 'Certidão de Regularidade'
      };

      const mockResponse = {
        data: {
          id: 'pay_123456',
          ...paymentData,
          status: 'PENDING',
          object: 'payment'
        }
      };

      mockedAxios.mockResolvedValue(mockResponse);

      const result = await asaasClient.createPayment(paymentData);

      expect(result.id).toBe('pay_123456');
      expect(result.status).toBe('PENDING');
      expect(mockedAxios).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'POST',
          url: expect.stringContaining('/payments'),
          data: paymentData
        })
      );
    });
  });

  describe('tokenizeCard', () => {
    test('should tokenize card successfully', async () => {
      const cardData = {
        holderName: 'JOAO SILVA',
        number: '4111111111111111',
        expiryMonth: '12',
        expiryYear: '2028',
        ccv: '123'
      };

      const mockResponse = {
        data: {
          creditCardToken: 'token_123456',
          creditCardBrand: 'VISA',
          expiresAt: '2025-01-15'
        }
      };

      mockedAxios.mockResolvedValue(mockResponse);

      const result = await asaasClient.tokenizeCard(cardData);

      expect(result.creditCardToken).toBe('token_123456');
      expect(result.creditCardBrand).toBe('VISA');
      expect(mockedAxios).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'POST',
          url: expect.stringContaining('/creditCard/tokenize'),
          data: cardData
        })
      );
    });
  });

  describe('validateWallet', () => {
    test('should validate wallet successfully', async () => {
      const walletId = 'wallet_123456';
      const mockResponse = {
        data: {
          id: walletId,
          name: 'Test Wallet',
          cpfCnpj: '12345678901',
          status: 'ACTIVE'
        }
      };

      mockedAxios.mockResolvedValue(mockResponse);

      const result = await asaasClient.validateWallet(walletId);

      expect(result.valid).toBe(true);
      expect(result.wallet_id).toBe(walletId);
      expect(result.owner_name).toBe('Test Wallet');
      expect(mockedAxios).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'GET',
          url: expect.stringContaining(`/wallets/${walletId}`)
        })
      );
    });

    test('should handle invalid wallet', async () => {
      const walletId = 'invalid_wallet';
      const mockError = {
        response: {
          status: 404,
          data: { message: 'Wallet not found' }
        }
      };

      mockedAxios.mockRejectedValue(mockError);

      const result = await asaasClient.validateWallet(walletId);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Wallet not found');
    });
  });

  describe('Circuit Breaker', () => {
    test('should handle multiple failures and open circuit', async () => {
      const mockError = {
        response: {
          status: 500,
          data: { message: 'Server error' }
        }
      };

      // Simular múltiplas falhas
      mockedAxios.mockRejectedValue(mockError);

      // Primeira falha
      await expect(asaasClient.makeRequest('GET', '/customers'))
        .rejects.toThrow('Server error');

      // Segunda falha
      await expect(asaasClient.makeRequest('GET', '/customers'))
        .rejects.toThrow('Server error');

      // Terceira falha
      await expect(asaasClient.makeRequest('GET', '/customers'))
        .rejects.toThrow('Server error');

      // Quarta tentativa deve ser rejeitada pelo circuit breaker
      await expect(asaasClient.makeRequest('GET', '/customers'))
        .rejects.toThrow();
    });
  });

  describe('Retry Logic', () => {
    test('should retry on temporary failures', async () => {
      const mockError = {
        response: {
          status: 503,
          data: { message: 'Service temporarily unavailable' }
        }
      };

      const mockSuccess = {
        data: { id: 'success' },
        status: 200
      };

      // Primeira tentativa falha, segunda sucede
      mockedAxios
        .mockRejectedValueOnce(mockError)
        .mockResolvedValueOnce(mockSuccess);

      const result = await asaasClient.makeRequest('GET', '/customers');

      expect(result).toEqual(mockSuccess.data);
      expect(mockedAxios).toHaveBeenCalledTimes(2);
    });
  });
});