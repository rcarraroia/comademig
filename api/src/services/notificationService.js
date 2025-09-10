const axios = require('axios');
const config = require('../config');
const logger = require('../utils/logger');
const supabaseService = require('./supabaseClient');

/**
 * Serviço para gerenciar notificações administrativas
 * Implementa payload padronizado conforme review técnico
 */
class NotificationService {
  constructor() {
    this.slackWebhookUrl = config.notifications.slackWebhookUrl;
    this.adminEmail = config.notifications.adminEmail;
  }

  /**
   * Notificar administradores com payload padronizado
   */
  async notifyAdmin(notificationData) {
    const {
      type,
      service_id,
      user_id,
      payment_id,
      service_type,
      amount
    } = notificationData;

    const payload = {
      type,
      service_id,
      user_id,
      payment_id,
      service_type,
      amount,
      timestamp: new Date().toISOString()
    };

    try {
      // Enviar para Slack se configurado
      if (this.slackWebhookUrl) {
        await this.sendSlackNotification(payload);
      }

      // Registrar no log de auditoria
      await supabaseService.createAuditLog({
        action: 'admin_notification',
        details: payload,
        user_id: user_id
      });

      logger.info('Notificação administrativa enviada', payload);
    } catch (error) {
      logger.error('Erro ao enviar notificação administrativa', {
        error: error.message,
        payload
      });
    }
  }

  /**
   * Enviar notificação para Slack
   */
  async sendSlackNotification(payload) {
    if (!this.slackWebhookUrl) {
      return;
    }

    const message = this.formatSlackMessage(payload);

    try {
      await axios.post(this.slackWebhookUrl, {
        text: message.text,
        blocks: message.blocks
      });

      logger.info('Notificação Slack enviada', {
        type: payload.type,
        service_id: payload.service_id
      });
    } catch (error) {
      logger.error('Erro ao enviar notificação Slack', {
        error: error.message,
        payload
      });
      throw error;
    }
  }

  /**
   * Formatar mensagem para Slack
   */
  formatSlackMessage(payload) {
    const { type, service_type, amount, payment_id, user_id } = payload;

    let text = '';
    let color = 'good';

    switch (type) {
      case 'service_paid':
        text = `💰 Serviço pago: ${service_type}`;
        color = 'good';
        break;
      case 'payment_failed':
        text = `❌ Falha no pagamento`;
        color = 'danger';
        break;
      case 'webhook_error':
        text = `⚠️ Erro no webhook`;
        color = 'warning';
        break;
      default:
        text = `📢 Notificação: ${type}`;
    }

    return {
      text,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*${text}*`
          }
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*Tipo:*\n${service_type || 'N/A'}`
            },
            {
              type: 'mrkdwn',
              text: `*Valor:*\nR$ ${(amount / 100).toFixed(2)}`
            },
            {
              type: 'mrkdwn',
              text: `*Pagamento ID:*\n${payment_id}`
            },
            {
              type: 'mrkdwn',
              text: `*Usuário ID:*\n${user_id}`
            }
          ]
        },
        {
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: `Timestamp: ${payload.timestamp}`
            }
          ]
        }
      ]
    };
  }

  /**
   * Notificar falha de pagamento
   */
  async notifyPaymentFailure(payment) {
    const notificationData = {
      type: 'payment_failed',
      payment_id: payment.id,
      user_id: payment.customer,
      amount: Math.round(payment.value * 100),
      service_type: 'payment_failure'
    };

    await this.notifyAdmin(notificationData);
  }

  /**
   * Notificar erro de webhook
   */
  async notifyWebhookError(webhookData, error) {
    const notificationData = {
      type: 'webhook_error',
      payment_id: webhookData.payment?.id || 'unknown',
      user_id: webhookData.payment?.customer || 'unknown',
      amount: webhookData.payment?.value ? Math.round(webhookData.payment.value * 100) : 0,
      service_type: 'webhook_error',
      error_message: error.message
    };

    await this.notifyAdmin(notificationData);
  }
}

// Singleton instance
const notificationService = new NotificationService();

module.exports = notificationService;