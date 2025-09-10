const express = require('express');
const { validate, schemas } = require('../middleware/validation');
const { authenticateToken } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const { paymentLimiter } = require('../middleware/rateLimiter');
const logger = require('../utils/logger');
const supabaseService = require('../services/supabaseClient');
const asaasClient = require('../services/asaasClient');
const splitService = require('../services/splitService');

const router = express.Router();

/**
 * POST /api/payments/service
 * Endpoint para criar cobrança de serviço pontual (certidão/regularização)
 * Requer autenticação do usuário
 */
router.post('/service',
  authenticateToken,
  paymentLimiter,
  validate(schemas.servicePayment),
  asyncHandler(async (req, res) => {
    const {
      service_type,
      service_data,
      payment_method
    } = req.body;

    const userId = req.user.id;

    logger.audit('service_payment_attempt', {
      user_id: userId,
      service_type,
      payment_method,
      ip: req.ip
    });

    try {
      // 1. Buscar dados do usuário
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

      // 2. Verificar se usuário tem customer no Asaas
      let asaasCustomer;
      if (user.asaas_customer_id) {
        try {
          asaasCustomer = await asaasClient.getCustomer(user.asaas_customer_id);
        } catch (error) {
          logger.warn('Customer Asaas não encontrado, criando novo', {
            user_id: userId,
            old_customer_id: user.asaas_customer_id
          });
          asaasCustomer = null;
        }
      }

      if (!asaasCustomer) {
        // Criar customer no Asaas
        const customerData = {
          name: user.nome_completo,
          email: user.email,
          phone: user.telefone,
          cpfCnpj: user.cpf,
          externalReference: `user_${userId}`
        };

        asaasCustomer = await asaasClient.createCustomer(customerData);
        
        // Atualizar user com customer_id
        await supabaseService.updateUserAsaasCustomerId(userId, asaasCustomer.id);
        
        logger.info('Customer Asaas criado para serviço', {
          user_id: userId,
          asaas_customer_id: asaasCustomer.id,
          service_type
        });
      }

      // 3. Determinar valor do serviço
      let serviceAmount;
      let serviceDescription;
      
      switch (service_type) {
        case 'certidao':
          serviceAmount = 49.90; // R$ 49,90
          serviceDescription = 'Solicitação de Certidão de Regularidade';
          break;
        case 'regularizacao':
          serviceAmount = 99.90; // R$ 99,90
          serviceDescription = 'Serviço de Regularização Eclesiástica';
          break;
        default:
          return res.status(400).json({
            success: false,
            error: 'INVALID_SERVICE_TYPE',
            message: 'Tipo de serviço não reconhecido'
          });
      }

      // 4. Criar solicitação de serviço no banco (simulado)
      const serviceRequestData = {
        user_id: userId,
        service_type,
        payload: service_data,
        status: 'pending'
      };

      const serviceRequestId = `service_${Date.now()}`;

      logger.info('Solicitação de serviço criada', {
        service_request_id: serviceRequestId,
        user_id: userId,
        service_type,
        amount: serviceAmount
      });

      // 5. Calcular split de pagamento (sem afiliado para serviços pontuais)
      const splitResult = await splitService.createPaymentSplit(serviceAmount, null);

      // 6. Criar cobrança no Asaas
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 7); // Vencimento em 7 dias
      
      const paymentData = {
        customer: asaasCustomer.id,
        billingType: payment_method,
        dueDate: dueDate.toISOString().split('T')[0],
        value: serviceAmount,
        description: `${serviceDescription} - ${user.nome_completo}`,
        externalReference: `service_${service_type}_${serviceRequestId}`,
        split: splitResult.asaasSplit
      };

      const asaasPayment = await asaasClient.createPayment(paymentData);
      
      logger.info('Cobrança Asaas criada para serviço', {
        user_id: userId,
        service_request_id: serviceRequestId,
        asaas_payment_id: asaasPayment.id,
        amount: serviceAmount,
        split_count: splitResult.asaasSplit.length
      });

      // 7. Salvar pagamento no banco local
      const paymentRecord = {
        user_id: userId,
        asaas_payment_id: asaasPayment.id,
        description: serviceDescription,
        amount: serviceAmount,
        status: 'pending',
        payment_method: payment_method.toLowerCase(),
        due_date: dueDate.toISOString().split('T')[0],
        metadata: {
          service_request_id: serviceRequestId,
          service_type,
          service_description: serviceDescription,
          due_date: dueDate.toISOString()
        }
      };

      const { data: payments } = await supabaseService.createPayment(paymentRecord);
      const payment = payments[0];

      // 8. Registrar transações de split
      await splitService.recordSplitTransactions(
        payment.id,
        splitResult.split,
        asaasPayment
      );

      // 9. Preparar resposta
      const response = {
        success: true,
        payment_id: asaasPayment.id,
        service_request_id: serviceRequestId,
        amount: serviceAmount,
        due_date: dueDate.toISOString().split('T')[0],
        service: {
          type: service_type,
          description: serviceDescription,
          status: 'pending'
        },
        split_info: {
          total_recipients: splitResult.asaasSplit.length
        }
      };

      // Adicionar dados específicos do método de pagamento
      if (payment_method === 'PIX') {
        if (asaasPayment.invoiceUrl) {
          response.checkout_url = asaasPayment.invoiceUrl;
        }
        if (asaasPayment.pixQrCode) {
          response.pix_qr_code = asaasPayment.pixQrCode;
        }
        if (asaasPayment.pixPayload) {
          response.pix_payload = asaasPayment.pixPayload;
        }
      } else if (payment_method === 'CREDIT_CARD') {
        if (asaasPayment.invoiceUrl) {
          response.checkout_url = asaasPayment.invoiceUrl;
        }
      }

      // 10. Log de auditoria de sucesso
      logger.audit('service_payment_created', {
        user_id: userId,
        service_request_id: serviceRequestId,
        asaas_payment_id: asaasPayment.id,
        payment_id: payment.id,
        service_type,
        amount: serviceAmount,
        payment_method,
        split_recipients: splitResult.asaasSplit.length,
        ip: req.ip
      });

      res.status(201).json(response);

    } catch (error) {
      logger.error('Erro na criação de cobrança de serviço', {
        error: error.message,
        stack: error.stack,
        user_id: userId,
        service_type,
        payment_method,
        ip: req.ip
      });

      // Determinar tipo de erro
      let statusCode = 500;
      let errorCode = 'INTERNAL_ERROR';
      let message = 'Erro interno do servidor';

      if (error.type === 'VALIDATION_ERROR') {
        statusCode = 400;
        errorCode = 'ASAAS_VALIDATION_ERROR';
        message = 'Dados inválidos para criação da cobrança';
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

/**
 * GET /api/payments/:id/status
 * Consultar status de pagamento
 */
router.get('/:id/status',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    try {
      // Buscar pagamento no banco local
      const { data: payments } = await supabaseService.executeQuery('payment_transactions', {
        type: 'select',
        filters: { asaas_payment_id: id, user_id: userId }
      });

      if (!payments || payments.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'PAYMENT_NOT_FOUND',
          message: 'Pagamento não encontrado'
        });
      }

      const payment = payments[0];

      // Buscar status atualizado no Asaas
      const asaasPayment = await asaasClient.getPayment(id);

      // Atualizar status local se necessário
      if (asaasPayment.status !== payment.status) {
        await supabaseService.updatePaymentStatus(id, asaasPayment.status, {
          last_check: new Date().toISOString(),
          asaas_data: asaasPayment
        });
      }

      res.json({
        success: true,
        payment_id: id,
        status: asaasPayment.status,
        amount: asaasPayment.value,
        due_date: asaasPayment.dueDate,
        payment_method: payment.payment_method,
        created_at: payment.created_at,
        updated_at: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Erro ao consultar status de pagamento', {
        error: error.message,
        payment_id: id,
        user_id: userId
      });

      res.status(500).json({
        success: false,
        error: 'STATUS_CHECK_ERROR',
        message: 'Erro ao consultar status do pagamento'
      });
    }
  })
);

module.exports = router;