import crypto from 'crypto'

/**
 * Sistema de criptografia para dados sensíveis
 * Implementa AES-256-GCM para criptografia simétrica segura
 */

export interface EncryptionResult {
  encrypted: string
  iv: string
  tag: string
}

export interface DecryptionResult {
  success: boolean
  data?: string
  error?: string
}

export class DataEncryption {
  private readonly algorithm = 'aes-256-gcm'
  private readonly keyLength = 32 // 256 bits
  private readonly ivLength = 16 // 128 bits
  private readonly tagLength = 16 // 128 bits
  private readonly key: Buffer

  constructor(secretKey?: string) {
    const keySource = secretKey || 
                    process.env.VITE_ENCRYPTION_KEY || 
                    process.env.SUPABASE_SERVICE_ROLE_KEY || 
                    'default-development-key-not-secure'

    // Derivar chave usando PBKDF2
    this.key = crypto.pbkdf2Sync(keySource, 'asaas-integration-salt', 100000, this.keyLength, 'sha256')
  }

  /**
   * Criptografa dados sensíveis
   */
  encrypt(data: string): EncryptionResult {
    try {
      // Gerar IV aleatório
      const iv = crypto.randomBytes(this.ivLength)
      
      // Criar cipher
      const cipher = crypto.createCipherGCM(this.algorithm, this.key, iv)
      
      // Criptografar dados
      let encrypted = cipher.update(data, 'utf8', 'hex')
      encrypted += cipher.final('hex')
      
      // Obter tag de autenticação
      const tag = cipher.getAuthTag()

      return {
        encrypted,
        iv: iv.toString('hex'),
        tag: tag.toString('hex')
      }
    } catch (error) {
      throw new Error(`Erro na criptografia: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
    }
  }

  /**
   * Descriptografa dados
   */
  decrypt(encrypted: string, iv: string, tag: string): DecryptionResult {
    try {
      // Converter strings hex para buffers
      const ivBuffer = Buffer.from(iv, 'hex')
      const tagBuffer = Buffer.from(tag, 'hex')
      
      // Criar decipher
      const decipher = crypto.createDecipherGCM(this.algorithm, this.key, ivBuffer)
      decipher.setAuthTag(tagBuffer)
      
      // Descriptografar dados
      let decrypted = decipher.update(encrypted, 'hex', 'utf8')
      decrypted += decipher.final('utf8')

      return {
        success: true,
        data: decrypted
      }
    } catch (error) {
      return {
        success: false,
        error: `Erro na descriptografia: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      }
    }
  }

  /**
   * Criptografa objeto JSON
   */
  encryptObject(obj: any): EncryptionResult {
    const jsonString = JSON.stringify(obj)
    return this.encrypt(jsonString)
  }

  /**
   * Descriptografa para objeto JSON
   */
  decryptObject<T = any>(encrypted: string, iv: string, tag: string): DecryptionResult & { data?: T } {
    const result = this.decrypt(encrypted, iv, tag)
    
    if (result.success && result.data) {
      try {
        const parsedData = JSON.parse(result.data)
        return {
          success: true,
          data: parsedData
        }
      } catch (error) {
        return {
          success: false,
          error: 'Erro ao parsear JSON descriptografado'
        }
      }
    }

    return result
  }

  /**
   * Hash seguro para senhas (usando bcrypt seria melhor, mas crypto é nativo)
   */
  hashPassword(password: string, salt?: string): { hash: string; salt: string } {
    const saltBuffer = salt ? Buffer.from(salt, 'hex') : crypto.randomBytes(16)
    const hash = crypto.pbkdf2Sync(password, saltBuffer, 100000, 64, 'sha256')
    
    return {
      hash: hash.toString('hex'),
      salt: saltBuffer.toString('hex')
    }
  }

  /**
   * Verifica senha
   */
  verifyPassword(password: string, hash: string, salt: string): boolean {
    const { hash: computedHash } = this.hashPassword(password, salt)
    return this.secureCompare(computedHash, hash)
  }

  /**
   * Gera token seguro
   */
  generateSecureToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex')
  }

  /**
   * Hash de dados para integridade
   */
  hashData(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex')
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
}

/**
 * Utilitários para dados sensíveis específicos
 */
export class SensitiveDataManager {
  private encryption: DataEncryption

  constructor() {
    this.encryption = new DataEncryption()
  }

  /**
   * Criptografa dados de cartão de crédito
   */
  encryptCreditCardData(cardData: {
    number: string
    holderName: string
    expiryMonth: string
    expiryYear: string
    cvv?: string
  }): EncryptionResult {
    // Remover CVV antes de criptografar (nunca armazenar)
    const { cvv, ...safeCardData } = cardData
    
    // Mascarar número do cartão (manter apenas últimos 4 dígitos)
    const maskedNumber = cardData.number.replace(/\d(?=\d{4})/g, '*')
    
    const dataToEncrypt = {
      ...safeCardData,
      number: maskedNumber,
      originalLength: cardData.number.length
    }

    return this.encryption.encryptObject(dataToEncrypt)
  }

  /**
   * Criptografa dados pessoais (CPF, RG, etc.)
   */
  encryptPersonalData(personalData: {
    cpf?: string
    rg?: string
    phone?: string
    address?: string
  }): EncryptionResult {
    // Mascarar CPF parcialmente
    if (personalData.cpf) {
      personalData.cpf = personalData.cpf.replace(/(\d{3})\d{3}(\d{3})/, '$1***$2')
    }

    return this.encryption.encryptObject(personalData)
  }

  /**
   * Criptografa dados bancários
   */
  encryptBankData(bankData: {
    accountNumber?: string
    agency?: string
    pixKey?: string
  }): EncryptionResult {
    // Mascarar dados bancários
    if (bankData.accountNumber) {
      bankData.accountNumber = bankData.accountNumber.replace(/\d(?=\d{4})/g, '*')
    }

    return this.encryption.encryptObject(bankData)
  }

  /**
   * Descriptografa dados sensíveis
   */
  decryptSensitiveData<T = any>(encrypted: string, iv: string, tag: string): DecryptionResult & { data?: T } {
    return this.encryption.decryptObject<T>(encrypted, iv, tag)
  }
}

// Instâncias singleton
export const dataEncryption = new DataEncryption()
export const sensitiveDataManager = new SensitiveDataManager()

// Funções utilitárias
export function encryptSensitiveData(data: string): EncryptionResult {
  return dataEncryption.encrypt(data)
}

export function decryptSensitiveData(encrypted: string, iv: string, tag: string): DecryptionResult {
  return dataEncryption.decrypt(encrypted, iv, tag)
}

export function generateSecureToken(length?: number): string {
  return dataEncryption.generateSecureToken(length)
}