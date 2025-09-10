const { schemas } = require('../../src/middleware/validation');

describe('Validation Schemas', () => {
  describe('memberJoin schema', () => {
    const validMemberData = {
      name: 'João Silva',
      email: 'joao@email.com',
      phone: '31999999999',
      cpfCnpj: '12345678901',
      cargo: 'veterinario',
      plan_id: 'plan_veterinario',
      payment_method: 'PIX'
    };

    test('should validate correct member data', () => {
      const { error } = schemas.memberJoin.validate(validMemberData);
      expect(error).toBeUndefined();
    });

    test('should reject invalid email', () => {
      const invalidData = { ...validMemberData, email: 'invalid-email' };
      const { error } = schemas.memberJoin.validate(invalidData);
      expect(error).toBeDefined();
      expect(error.details[0].path).toContain('email');
    });

    test('should reject invalid phone', () => {
      const invalidData = { ...validMemberData, phone: '123' };
      const { error } = schemas.memberJoin.validate(invalidData);
      expect(error).toBeDefined();
      expect(error.details[0].path).toContain('phone');
    });

    test('should reject invalid cargo', () => {
      const invalidData = { ...validMemberData, cargo: 'invalid' };
      const { error } = schemas.memberJoin.validate(invalidData);
      expect(error).toBeDefined();
      expect(error.details[0].path).toContain('cargo');
    });

    test('should reject invalid payment method', () => {
      const invalidData = { ...validMemberData, payment_method: 'INVALID' };
      const { error } = schemas.memberJoin.validate(invalidData);
      expect(error).toBeDefined();
      expect(error.details[0].path).toContain('payment_method');
    });

    test('should accept optional affiliate code', () => {
      const dataWithAffiliate = { ...validMemberData, affiliate_code: 'AFILIADO123' };
      const { error } = schemas.memberJoin.validate(dataWithAffiliate);
      expect(error).toBeUndefined();
    });
  });

  describe('servicePayment schema', () => {
    const validServiceData = {
      service_type: 'certidao',
      service_data: { tipo: 'regularidade' },
      payment_method: 'PIX'
    };

    test('should validate correct service payment data', () => {
      const { error } = schemas.servicePayment.validate(validServiceData);
      expect(error).toBeUndefined();
    });

    test('should reject invalid service type', () => {
      const invalidData = { ...validServiceData, service_type: 'invalid' };
      const { error } = schemas.servicePayment.validate(invalidData);
      expect(error).toBeDefined();
      expect(error.details[0].path).toContain('service_type');
    });

    test('should require service_data', () => {
      const invalidData = { ...validServiceData };
      delete invalidData.service_data;
      const { error } = schemas.servicePayment.validate(invalidData);
      expect(error).toBeDefined();
      expect(error.details[0].path).toContain('service_data');
    });
  });

  describe('cardTokenize schema', () => {
    const validCardData = {
      card_number: '4111111111111111',
      card_holder: 'JOAO SILVA',
      expiry_month: '12',
      expiry_year: '2028',
      cvv: '123'
    };

    test('should validate correct card data', () => {
      const { error } = schemas.cardTokenize.validate(validCardData);
      expect(error).toBeUndefined();
    });

    test('should reject invalid card number', () => {
      const invalidData = { ...validCardData, card_number: '123' };
      const { error } = schemas.cardTokenize.validate(invalidData);
      expect(error).toBeDefined();
    });

    test('should reject invalid expiry month', () => {
      const invalidData = { ...validCardData, expiry_month: '13' };
      const { error } = schemas.cardTokenize.validate(invalidData);
      expect(error).toBeDefined();
      expect(error.details[0].path).toContain('expiry_month');
    });

    test('should reject invalid expiry year', () => {
      const invalidData = { ...validCardData, expiry_year: '20' };
      const { error } = schemas.cardTokenize.validate(invalidData);
      expect(error).toBeDefined();
      expect(error.details[0].path).toContain('expiry_year');
    });

    test('should reject invalid CVV', () => {
      const invalidData = { ...validCardData, cvv: '12' };
      const { error } = schemas.cardTokenize.validate(invalidData);
      expect(error).toBeDefined();
      expect(error.details[0].path).toContain('cvv');
    });
  });

  describe('affiliateWallet schema', () => {
    test('should validate correct wallet ID', () => {
      const { error } = schemas.affiliateWallet.validate({ wallet_id: 'wallet_123456' });
      expect(error).toBeUndefined();
    });

    test('should reject empty wallet ID', () => {
      const { error } = schemas.affiliateWallet.validate({ wallet_id: '' });
      expect(error).toBeDefined();
      expect(error.details[0].path).toContain('wallet_id');
    });

    test('should reject missing wallet ID', () => {
      const { error } = schemas.affiliateWallet.validate({});
      expect(error).toBeDefined();
      expect(error.details[0].path).toContain('wallet_id');
    });
  });
});