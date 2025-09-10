const express = require('express');
const { validate, schemas } = require('../middleware/validation');
const { authenticateToken } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const { generalLimiter } = require('../middleware/rateLimiter');
const logger = require('../utils/logger');
const supabaseService = require('../services/supabaseClient');
const asaasClient = require('../services/asaasClient');

const router = express.Router();

/**
 * PUT /api/affiliate/wallet
 * Cadastro obrigatório de wallet para afiliados
 * Valida wallet no Asaas antes de aceitar
 */
router.put('/wallet',
  authenticateToken,
  generalLimiter,
  validate(schemas.affiliateWallet),
  asyncHandler(async (req, res) => {
    const { wallet_id } = req.body;
    const userId = req.user.id;

    logger.audit('affiliate_wallet_registration_attempt', {
      user_id: userId,
      wallet_id,
      ip: req.ip
    });

    try {
      // 1. Verificar se usuário existe
      const { data: users } = await supabaseService.executeQuery('profiles', {
        type: 'select',
        filters: { id: userId }
      }, null, { useServiceRole: true });

      if (!users || users.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'USER_NOT_FOUND',
          message: 'Usuário não encontrado'
        });
      }

      const user = users[0];

      // 2. Validar wallet no Asaas
      let walletValidation;
      try {
        walletValidation = await asaasClient.validateWallet(wallet_id);
      } catch (error) {
        logger.error('Erro ao validar wallet no Asaas', {
          error: error.message,
          wallet_id,
          user_id: userId
        });

        return res.status(400).json({
          success: false,
          error: 'WALLET_VALIDATION_ERROR',
          message: 'Erro ao validar carteira no Asaas'
        });
      }

      if (!walletValidation.valid) {
        logger.warn('Wallet inválida rejeitada', {
          wallet_id,
          user_id: userId,
          validation_error: walletValidation.error
        });

        return res.status(400).json({
          success: false,
          error: 'INVALID_WALLET',
          message: 'Carteira inválida no Asaas',
          details: walletValidation.error
        });
      }

      // 3. Verificar se wallet já está em uso por outro afiliado
      const { data: existingAffiliates } = await supabaseService.executeQuery('profiles', {
        type: 'select',
        filters: { affiliate_wallet_id: wallet_id }
      }, null, { useServiceRole: true });

      if (existingAffiliates && existingAffiliates.length > 0) {
        const existingAffiliate = existingAffiliates[0];
        
        if (existingAffiliate.id !== userId) {
          return res.status(409).json({
            success: false,
            error: 'WALLET_ALREADY_IN_USE',
            message: 'Esta carteira já está sendo usada por outro afiliado'
          });
        }
      }

      // 4. Atualizar perfil do usuário com wallet validada
      await supabaseService.executeQuery('profiles', {
        type: 'update',
        filters: { id: userId },
        select: '*'
      }, {
        affiliate_wallet_id: wallet_id,
        updated_at: new Date().toISOString()
      }, { useServiceRole: true });

      // 5. Criar ou atualizar registro na tabela affiliates
      const { data: existingAffiliateRecord } = await supabaseService.executeQuery('affiliates', {
        type: 'select',
        filters: { user_id: userId }
      }, null, { useServiceRole: true });

      if (existingAffiliateRecord && existingAffiliateRecord.length > 0) {
        // Atualizar registro existente
        await supabaseService.executeQuery('affiliates', {
          type: 'update',
          filters: { user_id: userId },
          select: '*'
        }, {
          status: 'active',
          wallet_validated: true,
          wallet_validated_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, { useServiceRole: true });
      } else {
        // Criar novo registro de afiliado
        const referralCode = generateReferralCode(user.nome_completo, userId);
        
        await supabaseService.executeQuery('affiliates', {
          type: 'insert',
          select: '*'
        }, {
          user_id: userId,
          referral_code: referralCode,
          status: 'active',
          wallet_validated: true,
          wallet_validated_at: new Date().toISOString(),
          is_adimplent: true,
          created_at: new Date().toISOString()
        }, { useServiceRole: true });
      }

      logger.info('Wallet de afiliado cadastrada com sucesso', {
        user_id: userId,
        wallet_id,
        validation_details: walletValidation
      });

      // 6. Log de auditoria de sucesso
      logger.audit('affiliate_wallet_registered', {
        user_id: userId,
        wallet_id,
        wallet_owner: walletValidation.owner_name,
        wallet_document: walletValidation.document,
        ip: req.ip
      });

      res.json({
        success: true,
        message: 'Carteira cadastrada com sucesso',
        wallet_info: {
          wallet_id,
          owner_name: walletValidation.owner_name,
          document: walletValidation.document,
          validated_at: new Date().toISOString()
        },
        affiliate_status: 'active'
      });

    } catch (error) {
      logger.error('Erro no cadastro de wallet de afiliado', {
        error: error.message,
        stack: error.stack,
        user_id: userId,
        wallet_id,
        ip: req.ip
      });

      res.status(500).json({
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Erro interno do servidor',
        timestamp: new Date().toISOString()
      });
    }
  })
);

/**
 * GET /api/affiliate/status
 * Consultar status do afiliado
 */
router.get('/status',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const userId = req.user.id;

    try {
      // Buscar dados do afiliado
      const { data: affiliates } = await supabaseService.executeQuery('affiliates', {
        type: 'select',
        filters: { user_id: userId }
      });

      if (!affiliates || affiliates.length === 0) {
        return res.json({
          success: true,
          is_affiliate: false,
          status: 'not_registered',
          message: 'Usuário não é afiliado'
        });
      }

      const affiliate = affiliates[0];

      // Buscar dados do perfil para wallet
      const { data: users } = await supabaseService.executeQuery('profiles', {
        type: 'select',
        filters: { id: userId }
      });

      const user = users?.[0];

      res.json({
        success: true,
        is_affiliate: true,
        status: affiliate.status,
        referral_code: affiliate.referral_code,
        wallet_validated: affiliate.wallet_validated,
        wallet_id: user?.affiliate_wallet_id,
        is_adimplent: affiliate.is_adimplent,
        created_at: affiliate.created_at,
        validated_at: affiliate.wallet_validated_at
      });

    } catch (error) {
      logger.error('Erro ao consultar status de afiliado', {
        error: error.message,
        user_id: userId
      });

      res.status(500).json({
        success: false,
        error: 'STATUS_CHECK_ERROR',
        message: 'Erro ao consultar status'
      });
    }
  })
);

/**
 * DELETE /api/affiliate/wallet
 * Remover wallet de afiliado (desativar)
 */
router.delete('/wallet',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const userId = req.user.id;

    logger.audit('affiliate_wallet_removal_attempt', {
      user_id: userId,
      ip: req.ip
    });

    try {
      // Atualizar perfil removendo wallet
      await supabaseService.executeQuery('profiles', {
        type: 'update',
        filters: { id: userId }
      }, {
        affiliate_wallet_id: null,
        updated_at: new Date().toISOString()
      }, { useServiceRole: true });

      // Desativar afiliado
      await supabaseService.executeQuery('affiliates', {
        type: 'update',
        filters: { user_id: userId }
      }, {
        status: 'inactive',
        wallet_validated: false,
        updated_at: new Date().toISOString()
      }, { useServiceRole: true });

      logger.audit('affiliate_wallet_removed', {
        user_id: userId,
        ip: req.ip
      });

      res.json({
        success: true,
        message: 'Carteira removida e afiliado desativado',
        affiliate_status: 'inactive'
      });

    } catch (error) {
      logger.error('Erro ao remover wallet de afiliado', {
        error: error.message,
        user_id: userId
      });

      res.status(500).json({
        success: false,
        error: 'REMOVAL_ERROR',
        message: 'Erro ao remover carteira'
      });
    }
  })
);

/**
 * GET /api/affiliate/commissions
 * Listar comissões do afiliado
 */
router.get('/commissions',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { page = 1, limit = 20, status } = req.query;

    try {
      // Verificar se é afiliado
      const { data: affiliates } = await supabaseService.executeQuery('affiliates', {
        type: 'select',
        filters: { user_id: userId }
      });

      if (!affiliates || affiliates.length === 0) {
        return res.status(403).json({
          success: false,
          error: 'NOT_AFFILIATE',
          message: 'Usuário não é afiliado'
        });
      }

      // Buscar comissões
      const filters = { affiliate_id: userId };
      if (status) {
        filters.status = status;
      }

      const { data: commissions } = await supabaseService.executeQuery('affiliate_commissions', {
        type: 'select',
        filters,
        order: { column: 'created_at', ascending: false },
        limit: parseInt(limit)
      });

      // Calcular totais
      const totalCommissions = commissions?.length || 0;
      const totalAmount = commissions?.reduce((sum, commission) => sum + commission.commission_amount, 0) || 0;
      const paidAmount = commissions?.filter(c => c.status === 'paid')
        .reduce((sum, commission) => sum + commission.commission_amount, 0) || 0;

      res.json({
        success: true,
        commissions: commissions || [],
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalCommissions
        },
        summary: {
          total_commissions: totalCommissions,
          total_amount: totalAmount,
          paid_amount: paidAmount,
          pending_amount: totalAmount - paidAmount
        }
      });

    } catch (error) {
      logger.error('Erro ao listar comissões', {
        error: error.message,
        user_id: userId
      });

      res.status(500).json({
        success: false,
        error: 'COMMISSIONS_ERROR',
        message: 'Erro ao listar comissões'
      });
    }
  })
);

// Função auxiliar para gerar código de referência
function generateReferralCode(name, userId) {
  const nameCode = name.replace(/\s+/g, '').substring(0, 6).toUpperCase();
  const userCode = userId.substring(0, 6).toUpperCase();
  const randomCode = Math.random().toString(36).substring(2, 5).toUpperCase();
  
  return `${nameCode}${randomCode}`;
}

module.exports = router;