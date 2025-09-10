const express = require('express');
const { validate, schemas } = require('../middleware/validation');
const { asyncHandler } = require('../middleware/errorHandler');
const { paymentLimiter } = require('../middleware/rateLimiter');
const logger = require('../utils/logger');
const supabaseService = require('../services/supabaseClient');
const asaasClient = require('../services/asaasClient');
const splitService = require('../services/splitService');

const router = express.Router();

/**
 * POST /api/members/join
 * Endpoint para filiação de novos membros
 * Cria customer no Asaas e assinatura recorrente com split
 */
router.post('/join', 
  paymentLimiter,
  validate(schemas.memberJoin),
  asyncHandler(async (req, res) => {
    const {
      name,
      email,
      phone,
      cpfCnpj,
      cargo,
      plan_id,
      payment_method,
      affiliate_code
    } = req.body;

    logger.audit('member_join_attempt', {
      email,
      cargo,
      plan_id,
      payment_method,
      has_affiliate: !!affiliate_code,
      ip: req.ip
    });

    try {
      // 1. Validar plano de assinatura (simulado por enquanto)
      const plan = {
        id: plan_id,
        name: 'Plano Veterinário',
        price_cents: 15000, // R$ 150,00
        billing_cycle: 'MONTHLY'
      };

      logger.info('Plano de assinatura validado', {
        plan_id,
        plan_name: plan.name,
        price_cents: plan.price_cents,
        billing_cycle: plan.billing_cycle
      });

      // 2. Buscar ou criar usuário
      let user;
      try {
        user = await supabaseService.findOrCreateUser({
          name,
          email,
          phone,
          cpfCnpj,
          cargo
        });
      } catch (error) {
        logger.error('Erro ao criar/buscar usuário', {
          error: error.message,
          email,
          cpfCnpj
        });
        return res.status(400).json({
          success: false,
          error: 'USER_CREATION_ERROR',
          message: 'Erro ao processar dados do usuário'
        });
      }

      logger.info('Usuário processado', {
        user_id: user.id,
        existing_customer: !!user.asaas_customer_id
      });

      // 3. Criar ou buscar customer no Asaas
      let asaasCustomer;
      if (user.asaas_customer_id) {
        // Buscar customer existente
        try {
          asaasCustomer = await asaasClient.getCustomer(user.asaas_customer_id);
        } catch (error) {
          logger.warn('Customer Asaas não encontrado, criando novo', {
            user_id: user.id,
            old_customer_id: user.asaas_customer_id
          });
          asaasCustomer = null;
        }
      }

      if (!asaasCustomer) {
        // Criar novo customer
        const customerData = {
          name,
          email,
          phone,
          cpfCnpj,
          externalReference: `user_${user.id}`
        };

        asaasCustomer = await asaasClient.createCustomer(customerData);
        
        // Atualizar user com customer_id
        await supabaseService.updateUserAsaasCustomerId(user.id, asaasCustomer.id);
        
        logger.info('Customer Asaas criado', {
          user_id: user.id,
          asaas_customer_id: asaasCustomer.id
        });
      }

      // 4. Calcular split de pagamento
      const amount = plan.price_cents / 100; // Converter para reais
      const splitResult = await splitService.createPaymentSplit(amount, affiliate_code);
      
      if (splitResult.warnings.length > 0) {
        logger.warn('Avisos no split de pagamento', {
          warnings: splitResult.warnings,
          affiliate_code
        });
      }

      // 5. Criar assinatura no Asaas
      const nextDueDate = new Date();
      nextDueDate.setDate(nextDueDate.getDate() + 1); // Vencimento amanhã
      
      const subscriptionData = {
        customer: asaasCustomer.id,
        billingType: payment_method,
        nextDueDate: nextDueDate.toISOString().split('T')[0],
        value: amount,
        cycle: plan.billing_cycle,
        description: `${plan.name} - ${cargo}`,
        externalReference: `subscription_user_${user.id}`,
        split: splitResult.asaasSplit
      };

      const asaasSubscription = await asaasClient.createSubscription(subscriptionData);
      
      logger.info('Assinatura Asaas criada', {
        user_id: user.id,
        asaas_subscription_id: asaasSubscription.id,
        split_count: splitResult.asaasSplit.length
      });

      // 6. Salvar assinatura no banco local (simulado)
      const subscriptionRecord = {
        user_id: user.id,
        plan_id: plan.id,
        asaas_subscription_id: asaasSubscription.id,
        status: 'pending',
        next_due_date: nextDueDate.toISOString().split('T')[0]
      };

      // 7. Criar registro de pagamento inicial
      const paymentData = {
        user_id: user.id,
        asaas_payment_id: asaasSubscription.id, // Usar subscription ID temporariamente
        description: `${plan.name} - Filiação`,
        amount: amount,
        status: 'pending',
        payment_method: payment_method.toLowerCase(),
        due_date: nextDueDate.toISOString().split('T')[0],
        metadata: {
          subscription_id: asaasSubscription.id,
          plan_name: plan.name,
          billing_cycle: plan.billing_cycle,
          affiliate_info: splitResult.affiliateInfo
        }
      };

      const { data: payments } = await supabaseService.createPayment(paymentData);
      const payment = payments[0];

      // 8. Registrar transações de split
      await splitService.recordSplitTransactions(
        payment.id,
        splitResult.split,
        asaasSubscription
      );

      // 9. Preparar resposta baseada no método de pagamento
      const response = {
        success: true,
        customer_id: asaasCustomer.id,
        subscription_id: asaasSubscription.id,
        payment_id: payment.id,
        user_id: user.id,
        plan: {
          name: plan.name,
          amount: amount,
          billing_cycle: plan.billing_cycle
        },
        split_info: {
          total_recipients: splitResult.asaasSplit.length,
          has_affiliate: !!splitResult.affiliateInfo
        }
      };

      // Adicionar dados específicos do método de pagamento
      if (payment_method === 'PIX') {
        // Para PIX, o Asaas retorna dados do QR code na primeira cobrança
        if (asaasSubscription.invoiceUrl) {
          response.checkout_url = asaasSubscription.invoiceUrl;
        }
        if (asaasSubscription.pixQrCode) {
          response.pix_qr_code = asaasSubscription.pixQrCode;
        }
        if (asaasSubscription.pixPayload) {
          response.pix_payload = asaasSubscription.pixPayload;
        }
      } else if (payment_method === 'CREDIT_CARD') {
        // Para cartão, retornar URL de checkout
        if (asaasSubscription.invoiceUrl) {
          response.checkout_url = asaasSubscription.invoiceUrl;
        }
      }

      // 10. Log de auditoria de sucesso
      logger.audit('member_join_success', {
        user_id: user.id,
        asaas_customer_id: asaasCustomer.id,
        asaas_subscription_id: asaasSubscription.id,
        payment_id: payment.id,
        plan_id: plan.id,
        amount,
        payment_method,
        split_recipients: splitResult.asaasSplit.length,
        affiliate_code: affiliate_code || null,
        ip: req.ip
      });

      res.status(201).json(response);

    } catch (error) {
      logger.error('Erro na filiação de membro', {
        error: error.message,
        stack: error.stack,
        email,
        plan_id,
        payment_method,
        ip: req.ip
      });

      // Determinar tipo de erro para resposta apropriada
      let statusCode = 500;
      let errorCode = 'INTERNAL_ERROR';
      let message = 'Erro interno do servidor';

      if (error.type === 'VALIDATION_ERROR') {
        statusCode = 400;
        errorCode = 'ASAAS_VALIDATION_ERROR';
        message = 'Dados inválidos para criação da assinatura';
      } else if (error.type === 'AUTHENTICATION_ERROR') {
        statusCode = 502;
        errorCode = 'ASAAS_AUTH_ERROR';
        message = 'Erro de autenticação com Asaas';
      } else if (error.type === 'SERVER_ERROR') {
        statusCode = 502;
        errorCode = 'ASAAS_SERVER_ERROR';
        message = 'Serviço de pagamento temporariamente indisponível';
      }

      res.status(statusCode).json({
        success: false,
        error: errorCode,
        message,
        timestamp: new Date().toISOString()
      });
    }
  })
);

module.exports = router;