const config = require('../config');
const logger = require('../utils/logger');
const supabaseService = require('./supabaseClient');
const asaasClient = require('./asaasClient');

/**
 * Serviço para gerenciar split de pagamentos
 * Implementa lógica de divisão 40%/40%/20% entre Comademig, Renum e Afiliados
 */
class SplitService {
  constructor() {
    // Configurações de split padrão
    this.defaultSplit = {
      comademig: 40, // 40%
      renum: 40,     // 40%
      affiliate: 20  // 20%
    };
  }

  /**
   * Calcular split de pagamento
   * COMADEMIG (40%) fica na conta principal (não precisa de wallet separada)
   * RENUM (40%) vai para wallet específica
   * Afiliado (20%) vai para wallet do afiliado (se houver)
   */
  calculateSplit(amount, affiliateWalletId = null) {
    const amountCents = Math.round(amount * 100); // Converter para centavos
    
    const split = {
      // COMADEMIG não precisa de split - fica automaticamente na conta principal
      renum: {
        walletId: config.wallets.renum,
        percentage: this.defaultSplit.renum,
        amount: Math.round(amountCents * this.defaultSplit.renum / 100)
      }
    };

    // Se há afiliado com wallet válida, incluir no split
    if (affiliateWalletId) {
      split.affiliate = {
        walletId: affiliateWalletId,
        percentage: this.defaultSplit.affiliate,
        amount: Math.round(amountCents * this.defaultSplit.affiliate / 100)
      };
    } else {
      // Se não há afiliado, os 20% ficam na conta principal (COMADEMIG)
      // Apenas o RENUM recebe split de 40%
      // Os outros 60% ficam automaticamente na conta principal
    }

    logger.info('Split calculado', {
      originalAmount: amount,
      amountCents,
      split,
      hasAffiliate: !!affiliateWalletId,
      note: 'COMADEMIG (40% + eventual 20% sem afiliado) fica na conta principal'
    });

    return split;
  }

  /**
   * Converter split para formato Asaas API
   */
  formatSplitForAsaas(split) {
    const asaasSplit = [];

    Object.entries(split).forEach(([key, value]) => {
      if (value.walletId && value.amount > 0) {
        asaasSplit.push({
          walletId: value.walletId,
          fixedValue: value.amount / 100 // Converter de centavos para reais
        });
      }
    });

    logger.info('Split formatado para Asaas', {
      originalSplit: split,
      asaasSplit
    });

    return asaasSplit;
  }

  /**
   * Validar wallets antes de aplicar split
   */
  async validateWallets(split) {
    const validationResults = {};
    
    for (const [key, value] of Object.entries(split)) {
      if (value.walletId) {
        try {
          const validation = await asaasClient.validateWallet(value.walletId);
          validationResults[key] = validation;
          
          if (!validation.valid) {
            logger.warn(`Wallet inválida detectada: ${key}`, {
              walletId: value.walletId,
              error: validation.error
            });
          }
        } catch (error) {
          logger.error(`Erro ao validar wallet ${key}`, {
            walletId: value.walletId,
            error: error.message
          });
          validationResults[key] = { valid: false, error: error.message };
        }
      }
    }

    return validationResults;
  }

  /**
   * Buscar wallet de afiliado por código de referência
   */
  async getAffiliateWallet(affiliateCode) {
    if (!affiliateCode) {
      return null;
    }

    try {
      // Buscar afiliado na tabela affiliates
      const { data: affiliates } = await supabaseService.executeQuery('affiliates', {
        type: 'select',
        columns: 'id, user_id, status, is_adimplent',
        filters: { referral_code: affiliateCode }
      });

      if (!affiliates || affiliates.length === 0) {
        logger.warn('Código de afiliado não encontrado', { affiliateCode });
        return null;
      }

      const affiliate = affiliates[0];

      // Verificar se afiliado está ativo e adimplente
      if (affiliate.status !== 'active' || !affiliate.is_adimplent) {
        logger.warn('Afiliado inativo ou inadimplente', {
          affiliateCode,
          status: affiliate.status,
          isAdimplent: affiliate.is_adimplent
        });
        return null;
      }

      // Buscar wallet do afiliado no perfil
      const { data: profiles } = await supabaseService.executeQuery('profiles', {
        type: 'select',
        columns: 'affiliate_wallet_id',
        filters: { id: affiliate.user_id }
      });

      if (!profiles || profiles.length === 0 || !profiles[0].affiliate_wallet_id) {
        logger.warn('Afiliado sem wallet cadastrada', {
          affiliateCode,
          userId: affiliate.user_id
        });
        return null;
      }

      const walletId = profiles[0].affiliate_wallet_id;

      // Validar wallet no Asaas
      const validation = await asaasClient.validateWallet(walletId);
      if (!validation.valid) {
        logger.warn('Wallet de afiliado inválida no Asaas', {
          affiliateCode,
          walletId,
          error: validation.error
        });
        return null;
      }

      logger.info('Wallet de afiliado encontrada e validada', {
        affiliateCode,
        walletId,
        affiliateId: affiliate.id
      });

      return {
        walletId,
        affiliateId: affiliate.id,
        userId: affiliate.user_id
      };
    } catch (error) {
      logger.error('Erro ao buscar wallet de afiliado', {
        affiliateCode,
        error: error.message
      });
      return null;
    }
  }

  /**
   * Criar split completo para pagamento
   */
  async createPaymentSplit(amount, affiliateCode = null) {
    let affiliateWallet = null;

    // Buscar wallet do afiliado se código fornecido
    if (affiliateCode) {
      affiliateWallet = await this.getAffiliateWallet(affiliateCode);
    }

    // Calcular split
    const split = this.calculateSplit(amount, affiliateWallet?.walletId);

    // Validar wallets
    const validation = await this.validateWallets(split);

    // Verificar se todas as wallets são válidas
    const invalidWallets = Object.entries(validation)
      .filter(([_, result]) => !result.valid)
      .map(([key, result]) => ({ key, error: result.error }));

    if (invalidWallets.length > 0) {
      logger.error('Wallets inválidas detectadas', { invalidWallets });
      
      // Se wallet de afiliado é inválida, recalcular sem afiliado
      if (invalidWallets.some(w => w.key === 'affiliate')) {
        logger.warn('Recalculando split sem afiliado devido a wallet inválida');
        const splitWithoutAffiliate = this.calculateSplit(amount, null);
        return {
          split: splitWithoutAffiliate,
          asaasSplit: this.formatSplitForAsaas(splitWithoutAffiliate),
          affiliateInfo: null,
          warnings: ['Wallet de afiliado inválida - split redistribuído']
        };
      }

      // Se wallets principais são inválidas, erro crítico
      const criticalErrors = invalidWallets.filter(w => w.key !== 'affiliate');
      if (criticalErrors.length > 0) {
        throw new Error(`Wallets críticas inválidas: ${criticalErrors.map(w => w.key).join(', ')}`);
      }
    }

    return {
      split,
      asaasSplit: this.formatSplitForAsaas(split),
      affiliateInfo: affiliateWallet,
      warnings: []
    };
  }

  /**
   * Registrar transações de split no banco
   */
  async recordSplitTransactions(paymentId, split, asaasPaymentData = null) {
    const transactions = [];

    Object.entries(split).forEach(([key, value]) => {
      if (value.walletId && value.amount > 0) {
        transactions.push({
          payment_id: paymentId,
          wallet_id: value.walletId,
          fixed_value: value.amount / 100, // Converter centavos para reais
          total_value: value.amount / 100,
          status: 'pending',
          recipient_name: key === 'comademig' ? 'COMADEMIG' : key === 'renum' ? 'RENUM' : 'Afiliado',
          recipient_document: '00000000000', // Placeholder - deve ser configurado
          recipient_email: null,
          created_at: new Date().toISOString()
        });
      }
    });

    if (transactions.length > 0) {
      const result = await supabaseService.createSplitTransactions(transactions);
      
      logger.info('Transações de split registradas', {
        paymentId,
        transactionCount: transactions.length,
        totalAmount: transactions.reduce((sum, t) => sum + (t.total_value * 100), 0)
      });

      return result;
    }

    return null;
  }

  /**
   * Conciliar split com dados reais do Asaas
   */
  async reconcileSplit(paymentId, asaasPaymentId) {
    try {
      // Buscar dados do pagamento no Asaas
      const asaasPayment = await asaasClient.getPayment(asaasPaymentId);
      
      // Buscar transações locais
      const { data: localTransactions } = await supabaseService.executeQuery('transactions', {
        type: 'select',
        filters: { payment_id: paymentId }
      }, null, { useServiceRole: true });

      if (!localTransactions || localTransactions.length === 0) {
        logger.warn('Nenhuma transação local encontrada para conciliação', {
          paymentId,
          asaasPaymentId
        });
        return { reconciled: false, reason: 'No local transactions found' };
      }

      // Comparar valores
      const localTotal = localTransactions.reduce((sum, t) => sum + t.share_amount_cents, 0);
      const asaasTotal = Math.round((asaasPayment.value || 0) * 100);

      const discrepancy = Math.abs(localTotal - asaasTotal);
      const isReconciled = discrepancy <= 1; // Tolerância de 1 centavo para arredondamento

      // Atualizar status de conciliação
      for (const transaction of localTransactions) {
        await supabaseService.executeQuery('transactions', {
          type: 'update',
          filters: { id: transaction.id },
        }, {
          reconciled: isReconciled,
          reconciled_at: new Date().toISOString(),
          asaas_split_data: {
            ...transaction.asaas_split_data,
            reconciliation: {
              asaas_total: asaasTotal,
              local_total: localTotal,
              discrepancy,
              reconciled_at: new Date().toISOString()
            }
          }
        }, { useServiceRole: true });
      }

      logger.info('Conciliação de split concluída', {
        paymentId,
        asaasPaymentId,
        localTotal,
        asaasTotal,
        discrepancy,
        isReconciled
      });

      return {
        reconciled: isReconciled,
        localTotal,
        asaasTotal,
        discrepancy,
        transactionCount: localTransactions.length
      };
    } catch (error) {
      logger.error('Erro na conciliação de split', {
        paymentId,
        asaasPaymentId,
        error: error.message
      });
      throw error;
    }
  }
}

// Singleton instance
const splitService = new SplitService();

module.exports = splitService;