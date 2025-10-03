import crypto from 'crypto'

/**
 * Validador de segurança para webhooks do Asaas
 * Implementa validação de assinatura e token para garantir autenticidade
 */

export interface WebhookValidationResult {
  isValid: boolean
  error?: string
  timestamp?: number
  source?: string
}

export class WebhookValidator {
  private readonly webhookToken: string
  private readonly maxTimestampDiff: number = 300000 // 5 minutos em ms

  constructor(webhookToken?: string) {
    this.webhookToken = webhookToken || process.env.VITE_ASAAS_WEBHOOK_TOKEN || ''
    
    if (!this.webhookToken) {
      console.warn('Webhook token não configurado - validação de segurança desabilitada')
    }
  }

  /**
   * Valida token de autenticação do webhook
   */
  validateToken(receivedToken: string): WebhookValidationResult {
    if (!this.webhookToken) {
      return {
        isValid: true, // Permitir em desenvolvimento se token não configurado
        error: 'Token de webhook não configurado'
      }
    }

    if (!receivedToken) {
      return {
        isValid: false,
        error: 'Token de autenticação não fornecido'
      }
    }

    // Comparação segura para evitar timing attacks
    const isValid = this.secureCompare(receivedToken, this.webhookToken)

    return {
      isValid,
      error: isValid ? undefined : 'Token de autenticação inválido'
    }
  }

  /**
   * Valida assinatura HMAC do webhook (se implementada pelo Asaas)
   */
  validateSignature(
    payload: string, 
    signature: string, 
    secret?: string
  ): WebhookValidationResult {
    if (!secret) {
      secret = this.webhookToken
    }

    if (!secret) {
      return {
        isValid: false,
        error: 'Chave secreta não configurada para validação de assinatura'
      }
    }

    if (!signature) {
      return {
        isValid: false,
        error: 'Assinatura não fornecida'
      }
    }

    try {
      // Calcular HMAC SHA-256 do payload
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(payload, 'utf8')
        .digest('hex')

      // Normalizar assinaturas (remover prefixos como "sha256=")
      const normalizedReceived = signature.replace(/^sha256=/, '')
      const normalizedExpected = expectedSignature

      const isValid = this.secureCompare(normalizedReceived, normalizedExpected)

      return {
        isValid,
        error: isValid ? undefined : 'Assinatura inválida'
      }
    } catch (error) {
      return {
        isValid: false,
        error: `Erro ao validar assinatura: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      }
    }
  }

  /**
   * Valida timestamp para prevenir replay attacks
   */
  validateTimestamp(timestamp: number | string): WebhookValidationResult {
    let timestampNum: number

    if (typeof timestamp === 'string') {
      timestampNum = parseInt(timestamp, 10)
      if (isNaN(timestampNum)) {
        return {
          isValid: false,
          error: 'Timestamp inválido'
        }
      }
    } else {
      timestampNum = timestamp
    }

    const now = Date.now()
    const diff = Math.abs(now - timestampNum)

    if (diff > this.maxTimestampDiff) {
      return {
        isValid: false,
        error: `Timestamp muito antigo ou futuro. Diferença: ${diff}ms`
      }
    }

    return {
      isValid: true,
      timestamp: timestampNum
    }
  }

  /**
   * Validação completa do webhook
   */
  validateWebhook(
    payload: string,
    headers: Record<string, string | string[] | undefined>
  ): WebhookValidationResult {
    // Extrair headers relevantes
    const token = this.extractToken(headers)
    const signature = this.extractSignature(headers)
    const timestamp = this.extractTimestamp(headers)

    // Validar token (obrigatório)
    if (token) {
      const tokenValidation = this.validateToken(token)
      if (!tokenValidation.isValid) {
        return tokenValidation
      }
    }

    // Validar assinatura (se presente)
    if (signature) {
      const signatureValidation = this.validateSignature(payload, signature)
      if (!signatureValidation.isValid) {
        return signatureValidation
      }
    }

    // Validar timestamp (se presente)
    if (timestamp) {
      const timestampValidation = this.validateTimestamp(timestamp)
      if (!timestampValidation.isValid) {
        return timestampValidation
      }
    }

    return {
      isValid: true,
      timestamp: timestamp ? parseInt(timestamp.toString(), 10) : Date.now(),
      source: 'asaas'
    }
  }

  /**
   * Extrai token dos headers
   */
  private extractToken(headers: Record<string, string | string[] | undefined>): string | null {
    // Tentar diferentes formatos de header
    const tokenHeaders = [
      'asaas-access-token',
      'x-asaas-token',
      'authorization'
    ]

    for (const headerName of tokenHeaders) {
      const headerValue = headers[headerName] || headers[headerName.toLowerCase()]
      
      if (headerValue) {
        const token = Array.isArray(headerValue) ? headerValue[0] : headerValue
        
        // Remover prefixo "Bearer " se presente
        return token.replace(/^Bearer\s+/, '')
      }
    }

    return null
  }

  /**
   * Extrai assinatura dos headers
   */
  private extractSignature(headers: Record<string, string | string[] | undefined>): string | null {
    const signatureHeaders = [
      'x-asaas-signature',
      'x-signature',
      'signature'
    ]

    for (const headerName of signatureHeaders) {
      const headerValue = headers[headerName] || headers[headerName.toLowerCase()]
      
      if (headerValue) {
        return Array.isArray(headerValue) ? headerValue[0] : headerValue
      }
    }

    return null
  }

  /**
   * Extrai timestamp dos headers
   */
  private extractTimestamp(headers: Record<string, string | string[] | undefined>): string | null {
    const timestampHeaders = [
      'x-asaas-timestamp',
      'x-timestamp',
      'timestamp'
    ]

    for (const headerName of timestampHeaders) {
      const headerValue = headers[headerName] || headers[headerName.toLowerCase()]
      
      if (headerValue) {
        return Array.isArray(headerValue) ? headerValue[0] : headerValue
      }
    }

    return null
  }

  /**
   * Comparação segura para evitar timing attacks
   */
  private secureCompare(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false
    }

    let result = 0
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i)
    }

    return result === 0
  }

  /**
   * Gera token seguro para webhooks
   */
  static generateSecureToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex')
  }

  /**
   * Valida formato de token
   */
  static isValidTokenFormat(token: string): boolean {
    // Token deve ter pelo menos 16 caracteres e ser hexadecimal
    return /^[a-f0-9]{16,}$/i.test(token)
  }
}

// Instância singleton
export const webhookValidator = new WebhookValidator()

// Função utilitária para uso direto
export function validateWebhookSecurity(
  payload: string,
  headers: Record<string, string | string[] | undefined>
): WebhookValidationResult {
  return webhookValidator.validateWebhook(payload, headers)
}