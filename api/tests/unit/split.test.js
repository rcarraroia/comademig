const splitService = require('../../src/services/splitService');

// Mock do logger
jest.mock('../../src/utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  audit: jest.fn()
}));

// Mock do supabaseService
jest.mock('../../src/services/supabaseClient', () => ({
  executeQuery: jest.fn()
}));

// Mock do asaasClient
jest.mock('../../src/services/asaasClient', () => ({
  validateWallet: jest.fn()
}));

describe('SplitService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('calculateSplit', () => {
    test('should calculate split without affiliate correctly', () => {
      const amount = 100.00;
      const split = splitService.calculateSplit(amount);

      expect(split.comademig.percentage).toBe(50); // 40% + 10% do afiliado
      expect(split.comademig.amount).toBe(5000); // 50% de 10000 centavos
      expect(split.renum.percentage).toBe(50); // 40% + 10% do afiliado
      expect(split.renum.amount).toBe(5000); // 50% de 10000 centavos
      expect(split.affiliate).toBeUndefined();
    });

    test('should calculate split with affiliate correctly', () => {
      const amount = 100.00;
      const affiliateWalletId = 'wallet_affiliate_123';
      const split = splitService.calculateSplit(amount, affiliateWalletId);

      expect(split.comademig.percentage).toBe(40);
      expect(split.comademig.amount).toBe(4000); // 40% de 10000 centavos
      expect(split.renum.percentage).toBe(40);
      expect(split.renum.amount).toBe(4000); // 40% de 10000 centavos
      expect(split.affiliate.percentage).toBe(20);
      expect(split.affiliate.amount).toBe(2000); // 20% de 10000 centavos
      expect(split.affiliate.walletId).toBe(affiliateWalletId);
    });

    test('should handle rounding correctly', () => {
      const amount = 33.33; // Valor que gera arredondamento
      const split = splitService.calculateSplit(amount);

      const totalCalculated = split.comademig.amount + split.renum.amount;
      expect(totalCalculated).toBe(3333); // Total em centavos deve bater
    });

    test('should handle small amounts correctly', () => {
      const amount = 1.00;
      const split = splitService.calculateSplit(amount);

      expect(split.comademig.amount).toBe(50); // 50 centavos
      expect(split.renum.amount).toBe(50); // 50 centavos
      
      const total = split.comademig.amount + split.renum.amount;
      expect(total).toBe(100); // 1 real em centavos
    });
  });

  describe('formatSplitForAsaas', () => {
    test('should format split correctly for Asaas API', () => {
      const split = {
        comademig: {
          walletId: 'wallet_comademig',
          amount: 4000 // 40 reais em centavos
        },
        renum: {
          walletId: 'wallet_renum',
          amount: 4000 // 40 reais em centavos
        },
        affiliate: {
          walletId: 'wallet_affiliate',
          amount: 2000 // 20 reais em centavos
        }
      };

      const asaasSplit = splitService.formatSplitForAsaas(split);

      expect(asaasSplit).toHaveLength(3);
      expect(asaasSplit[0]).toEqual({
        walletId: 'wallet_comademig',
        fixedValue: 40.00
      });
      expect(asaasSplit[1]).toEqual({
        walletId: 'wallet_renum',
        fixedValue: 40.00
      });
      expect(asaasSplit[2]).toEqual({
        walletId: 'wallet_affiliate',
        fixedValue: 20.00
      });
    });

    test('should ignore entries without walletId', () => {
      const split = {
        comademig: {
          walletId: 'wallet_comademig',
          amount: 5000
        },
        renum: {
          walletId: null, // Sem wallet
          amount: 5000
        }
      };

      const asaasSplit = splitService.formatSplitForAsaas(split);

      expect(asaasSplit).toHaveLength(1);
      expect(asaasSplit[0].walletId).toBe('wallet_comademig');
    });

    test('should ignore entries with zero amount', () => {
      const split = {
        comademig: {
          walletId: 'wallet_comademig',
          amount: 10000
        },
        affiliate: {
          walletId: 'wallet_affiliate',
          amount: 0 // Valor zero
        }
      };

      const asaasSplit = splitService.formatSplitForAsaas(split);

      expect(asaasSplit).toHaveLength(1);
      expect(asaasSplit[0].walletId).toBe('wallet_comademig');
    });
  });

  describe('createPaymentSplit', () => {
    const mockAsaasClient = require('../../src/services/asaasClient');
    const mockSupabaseService = require('../../src/services/supabaseClient');

    beforeEach(() => {
      // Mock de wallet válida
      mockAsaasClient.validateWallet.mockResolvedValue({
        valid: true,
        owner_name: 'Test Owner',
        document: '12345678901'
      });

      // Mock de afiliado válido
      mockSupabaseService.executeQuery.mockImplementation((table, operation) => {
        if (table === 'affiliates') {
          return Promise.resolve({
            data: [{
              id: 'affiliate_123',
              user_id: 'user_123',
              status: 'active',
              is_adimplent: true
            }]
          });
        }
        if (table === 'profiles') {
          return Promise.resolve({
            data: [{
              id: 'user_123',
              affiliate_wallet_id: 'wallet_affiliate_123'
            }]
          });
        }
        return Promise.resolve({ data: [] });
      });
    });

    test('should create split without affiliate', async () => {
      const result = await splitService.createPaymentSplit(100.00);

      expect(result.split.comademig).toBeDefined();
      expect(result.split.renum).toBeDefined();
      expect(result.split.affiliate).toBeUndefined();
      expect(result.asaasSplit).toHaveLength(2);
      expect(result.affiliateInfo).toBeNull();
      expect(result.warnings).toHaveLength(0);
    });

    test('should create split with valid affiliate', async () => {
      const result = await splitService.createPaymentSplit(100.00, 'AFFILIATE123');

      expect(result.split.comademig).toBeDefined();
      expect(result.split.renum).toBeDefined();
      expect(result.split.affiliate).toBeDefined();
      expect(result.asaasSplit).toHaveLength(3);
      expect(result.affiliateInfo).toBeDefined();
      expect(result.affiliateInfo.walletId).toBe('wallet_affiliate_123');
    });

    test('should handle invalid affiliate gracefully', async () => {
      // Mock afiliado não encontrado
      mockSupabaseService.executeQuery.mockResolvedValue({ data: [] });

      const result = await splitService.createPaymentSplit(100.00, 'INVALID_CODE');

      expect(result.split.affiliate).toBeUndefined();
      expect(result.asaasSplit).toHaveLength(2);
      expect(result.affiliateInfo).toBeNull();
    });

    test('should handle invalid wallet gracefully', async () => {
      // Mock wallet inválida
      mockAsaasClient.validateWallet.mockResolvedValue({
        valid: false,
        error: 'Wallet not found'
      });

      const result = await splitService.createPaymentSplit(100.00, 'AFFILIATE123');

      expect(result.split.affiliate).toBeUndefined();
      expect(result.asaasSplit).toHaveLength(2);
      expect(result.warnings).toContain('Wallet de afiliado inválida - split redistribuído');
    });
  });

  describe('Edge Cases', () => {
    test('should handle very small amounts', () => {
      const amount = 0.01; // 1 centavo
      const split = splitService.calculateSplit(amount);

      expect(split.comademig.amount).toBeGreaterThanOrEqual(0);
      expect(split.renum.amount).toBeGreaterThanOrEqual(0);
      
      const total = split.comademig.amount + split.renum.amount;
      expect(total).toBe(1); // 1 centavo
    });

    test('should handle large amounts', () => {
      const amount = 999999.99; // Valor muito alto
      const split = splitService.calculateSplit(amount);

      const total = split.comademig.amount + split.renum.amount;
      expect(total).toBe(99999999); // Total em centavos
    });

    test('should maintain precision with decimal amounts', () => {
      const amount = 123.45;
      const split = splitService.calculateSplit(amount);

      const total = split.comademig.amount + split.renum.amount;
      expect(total).toBe(12345); // Total em centavos deve ser exato
    });
  });
});