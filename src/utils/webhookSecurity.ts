import crypto from 'crypto';

/**
 * Utilitários para segurança de webhooks
 */

// Chave secreta para validação de webhooks (deve ser configurada no ambiente)
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || 'default-secret-key';

/**
 * Gera assinatura HMAC para validação de webhook
 */
export function generateWebhookSignature(payload: string, secret: string = WEBHOOK_SECRET): string {
  return crypto
    .createHmac('sha256', secret)
    .update(payload, 'utf8')
    .digest('hex');
}

/**
 * Verifica se a assinatura do webhook é válida
 */
export function verifyWebhookSignature(
  payload: string, 
  signature: string, 
  secret: string = WEBHOOK_SECRET
): boolean {
  try {
    const expectedSignature = generateWebhookSignature(payload, secret);
    
    // Usar comparação segura para evitar timing attacks
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  } catch (error) {
    console.error('Erro na verificação de assinatura do webhook:', error);
    return false;
  }
}

/**
 * Valida timestamp do webhook para evitar replay attacks
 */
export function validateWebhookTimestamp(timestamp: number, toleranceInSeconds: number = 300): boolean {
  const now = Math.floor(Date.now() / 1000);
  const diff = Math.abs(now - timestamp);
  
  return diff <= toleranceInSeconds;
}

/**
 * Extrai e valida headers de segurança do webhook
 */
export function validateWebhookHeaders(headers: Record<string, string>): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Verificar se tem assinatura
  if (!headers['x-signature'] && !headers['x-hub-signature-256']) {
    errors.push('Assinatura do webhook não encontrada');
  }

  // Verificar timestamp
  if (!headers['x-timestamp']) {
    errors.push('Timestamp do webhook não encontrado');
  } else {
    const timestamp = parseInt(headers['x-timestamp']);
    if (isNaN(timestamp)) {
      errors.push('Timestamp do webhook inválido');
    } else if (!validateWebhookTimestamp(timestamp)) {
      errors.push('Timestamp do webhook expirado');
    }
  }

  // Verificar user agent
  if (!headers['user-agent'] || !headers['user-agent'].includes('Asaas')) {
    errors.push('User-Agent suspeito');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Valida estrutura do payload do webhook
 */
export function validateWebhookPayload(payload: any): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Verificar campos obrigatórios
  if (!payload.event) {
    errors.push('Campo "event" é obrigatório');
  }

  if (!payload.payment) {
    errors.push('Campo "payment" é obrigatório');
  } else {
    // Validar campos do pagamento
    if (!payload.payment.id) {
      errors.push('ID do pagamento é obrigatório');
    }

    if (!payload.payment.status) {
      errors.push('Status do pagamento é obrigatório');
    }

    if (typeof payload.payment.value !== 'number') {
      errors.push('Valor do pagamento deve ser numérico');
    }
  }

  // Verificar se o evento é válido
  const validEvents = [
    'PAYMENT_CREATED',
    'PAYMENT_UPDATED', 
    'PAYMENT_CONFIRMED',
    'PAYMENT_RECEIVED',
    'PAYMENT_OVERDUE',
    'PAYMENT_DELETED'
  ];

  if (payload.event && !validEvents.includes(payload.event)) {
    errors.push(`Evento inválido: ${payload.event}`);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Rate limiting simples para webhooks
 */
class WebhookRateLimiter {
  private requests: Map<string, number[]> = new Map();
  private readonly maxRequests: number;
  private readonly windowMs: number;

  constructor(maxRequests: number = 100, windowMs: number = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  isAllowed(identifier: string): boolean {
    const now = Date.now();
    const requests = this.requests.get(identifier) || [];
    
    // Remover requests antigas
    const validRequests = requests.filter(time => now - time < this.windowMs);
    
    if (validRequests.length >= this.maxRequests) {
      return false;
    }

    // Adicionar request atual
    validRequests.push(now);
    this.requests.set(identifier, validRequests);
    
    return true;
  }

  getRemainingRequests(identifier: string): number {
    const now = Date.now();
    const requests = this.requests.get(identifier) || [];
    const validRequests = requests.filter(time => now - time < this.windowMs);
    
    return Math.max(0, this.maxRequests - validRequests.length);
  }
}

export const webhookRateLimiter = new WebhookRateLimiter();

/**
 * Validação completa de segurança do webhook
 */
export function validateWebhookSecurity(
  payload: string,
  headers: Record<string, string>,
  remoteAddress?: string
): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    // 1. Validar headers
    const headerValidation = validateWebhookHeaders(headers);
    if (!headerValidation.isValid) {
      errors.push(...headerValidation.errors);
    }

    // 2. Validar assinatura
    const signature = headers['x-signature'] || headers['x-hub-signature-256'];
    if (signature && !verifyWebhookSignature(payload, signature)) {
      errors.push('Assinatura do webhook inválida');
    }

    // 3. Validar payload
    let parsedPayload;
    try {
      parsedPayload = JSON.parse(payload);
    } catch (parseError) {
      errors.push('Payload do webhook não é um JSON válido');
      return { isValid: false, errors, warnings };
    }

    const payloadValidation = validateWebhookPayload(parsedPayload);
    if (!payloadValidation.isValid) {
      errors.push(...payloadValidation.errors);
    }

    // 4. Rate limiting
    const identifier = remoteAddress || 'unknown';
    if (!webhookRateLimiter.isAllowed(identifier)) {
      errors.push('Rate limit excedido para webhooks');
    }

    // 5. Verificações adicionais
    if (remoteAddress) {
      // Lista de IPs permitidos do Asaas (exemplo)
      const allowedIPs = [
        '177.67.82.0/24',
        '18.231.194.64/26',
        // Adicionar IPs reais do Asaas
      ];

      // Verificação básica de IP (implementação simplificada)
      const isAllowedIP = allowedIPs.some(range => {
        // Implementação real deveria usar biblioteca de CIDR
        return remoteAddress.startsWith(range.split('/')[0].split('.').slice(0, 3).join('.'));
      });

      if (!isAllowedIP) {
        warnings.push(`IP não reconhecido: ${remoteAddress}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };

  } catch (error) {
    console.error('Erro na validação de segurança do webhook:', error);
    return {
      isValid: false,
      errors: ['Erro interno na validação de segurança'],
      warnings
    };
  }
}

/**
 * Sanitiza dados do webhook para logging seguro
 */
export function sanitizeWebhookData(data: any): any {
  const sensitiveFields = ['cpf', 'cnpj', 'email', 'phone', 'address'];
  
  function sanitizeObject(obj: any): any {
    if (typeof obj !== 'object' || obj === null) {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(sanitizeObject);
    }

    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = sanitizeObject(value);
      }
    }

    return sanitized;
  }

  return sanitizeObject(data);
}