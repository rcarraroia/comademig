import { toast } from 'sonner'

// Tipos de erro
export enum AsaasErrorType {
  AUTHENTICATION = 'authentication',
  VALIDATION = 'validation',
  NETWORK = 'network',
  RATE_LIMIT = 'rate_limit',
  SERVER_ERROR = 'server_error',
  BUSINESS_RULE = 'business_rule',
  UNKNOWN = 'unknown'
}

// Severidade do erro
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

// Interface para erro estruturado
export interface AsaasError {
  type: AsaasErrorType
  severity: ErrorSeverity
  code: string
  message: string
  userMessage: string
  details?: any
  retryable: boolean
  timestamp: Date
  context?: {
    function?: string
    userId?: string
    paymentId?: string
    customerId?: string
  }
}

// Configuração de retry
interface RetryConfig {
  maxAttempts: number
  baseDelay: number
  maxDelay: number
  backoffMultiplier: number
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  baseDelay: 1000, // 1 segundo
  maxDelay: 30000, // 30 segundos
  backoffMultiplier: 2
}

// Mapeamento de códigos de erro do Asaas
const ASAAS_ERROR_MAPPING: Record<string, Partial<AsaasError>> = {
  // Autenticação
  'invalid_api_key': {
    type: AsaasErrorType.AUTHENTICATION,
    severity: ErrorSeverity.CRITICAL,
    userMessage: 'Erro de autenticação. Verifique as credenciais da API.',
    retryable: false
  },
  'unauthorized': {
    type: AsaasErrorType.AUTHENTICATION,
    severity: ErrorSeverity.HIGH,
    userMessage: 'Acesso não autorizado. Verifique suas permissões.',
    retryable: false
  },

  // Validação
  'invalid_cpf': {
    type: AsaasErrorType.VALIDATION,
    severity: ErrorSeverity.MEDIUM,
    userMessage: 'CPF inválido. Verifique o número informado.',
    retryable: false
  },
  'invalid_cnpj': {
    type: AsaasErrorType.VALIDATION,
    severity: ErrorSeverity.MEDIUM,
    userMessage: 'CNPJ inválido. Verifique o número informado.',
    retryable: false
  },
  'invalid_email': {
    type: AsaasErrorType.VALIDATION,
    severity: ErrorSeverity.MEDIUM,
    userMessage: 'E-mail inválido. Verifique o endereço informado.',
    retryable: false
  },
  'invalid_value': {
    type: AsaasErrorType.VALIDATION,
    severity: ErrorSeverity.MEDIUM,
    userMessage: 'Valor inválido. Verifique o montante informado.',
    retryable: false
  },
  'invalid_due_date': {
    type: AsaasErrorType.VALIDATION,
    severity: ErrorSeverity.MEDIUM,
    userMessage: 'Data de vencimento inválida.',
    retryable: false
  },

  // Regras de negócio
  'customer_not_found': {
    type: AsaasErrorType.BUSINESS_RULE,
    severity: ErrorSeverity.MEDIUM,
    userMessage: 'Cliente não encontrado.',
    retryable: false
  },
  'payment_not_found': {
    type: AsaasErrorType.BUSINESS_RULE,
    severity: ErrorSeverity.MEDIUM,
    userMessage: 'Pagamento não encontrado.',
    retryable: false
  },
  'insufficient_balance': {
    type: AsaasErrorType.BUSINESS_RULE,
    severity: ErrorSeverity.HIGH,
    userMessage: 'Saldo insuficiente para realizar a operação.',
    retryable: false
  },
  'payment_already_confirmed': {
    type: AsaasErrorType.BUSINESS_RULE,
    severity: ErrorSeverity.LOW,
    userMessage: 'Pagamento já foi confirmado anteriormente.',
    retryable: false
  },

  // Cartão de crédito
  'credit_card_declined': {
    type: AsaasErrorType.BUSINESS_RULE,
    severity: ErrorSeverity.MEDIUM,
    userMessage: 'Cartão de crédito recusado. Tente outro cartão ou método de pagamento.',
    retryable: false
  },
  'invalid_credit_card': {
    type: AsaasErrorType.VALIDATION,
    severity: ErrorSeverity.MEDIUM,
    userMessage: 'Dados do cartão inválidos. Verifique as informações.',
    retryable: false
  },
  'expired_credit_card': {
    type: AsaasErrorType.VALIDATION,
    severity: ErrorSeverity.MEDIUM,
    userMessage: 'Cartão de crédito vencido.',
    retryable: false
  },

  // Rate limiting
  'rate_limit_exceeded': {
    type: AsaasErrorType.RATE_LIMIT,
    severity: ErrorSeverity.MEDIUM,
    userMessage: 'Muitas tentativas. Aguarde alguns minutos e tente novamente.',
    retryable: true
  },

  // Erros de servidor
  'internal_server_error': {
    type: AsaasErrorType.SERVER_ERROR,
    severity: ErrorSeverity.HIGH,
    userMessage: 'Erro interno do servidor. Tente novamente em alguns minutos.',
    retryable: true
  },
  'service_unavailable': {
    type: AsaasErrorType.SERVER_ERROR,
    severity: ErrorSeverity.HIGH,
    userMessage: 'Serviço temporariamente indisponível. Tente novamente em alguns minutos.',
    retryable: true
  },
  'timeout': {
    type: AsaasErrorType.NETWORK,
    severity: ErrorSeverity.MEDIUM,
    userMessage: 'Tempo limite excedido. Verifique sua conexão e tente novamente.',
    retryable: true
  }
}

// Classe principal para tratamento de erros
export class AsaasErrorHandler {
  private static instance: AsaasErrorHandler
  private errorLog: AsaasError[] = []

  static getInstance(): AsaasErrorHandler {
    if (!AsaasErrorHandler.instance) {
      AsaasErrorHandler.instance = new AsaasErrorHandler()
    }
    return AsaasErrorHandler.instance
  }

  // Processar erro bruto e transformar em AsaasError estruturado
  processError(error: any, context?: AsaasError['context']): AsaasError {
    let processedError: AsaasError

    // Erro de resposta HTTP
    if (error.response) {
      const status = error.response.status
      const data = error.response.data

      // Extrair código de erro do Asaas
      const errorCode = data?.errors?.[0]?.code || 
                       data?.error?.code || 
                       data?.code || 
                       `http_${status}`

      const errorMessage = data?.errors?.[0]?.description || 
                          data?.error?.message || 
                          data?.message || 
                          error.message

      // Mapear erro conhecido
      const mappedError = ASAAS_ERROR_MAPPING[errorCode]

      if (mappedError) {
        processedError = {
          type: mappedError.type!,
          severity: mappedError.severity!,
          code: errorCode,
          message: errorMessage,
          userMessage: mappedError.userMessage!,
          retryable: mappedError.retryable!,
          timestamp: new Date(),
          context,
          details: data
        }
      } else {
        // Erro HTTP não mapeado
        processedError = this.createErrorFromHttpStatus(status, errorMessage, context, data)
      }
    }
    // Erro de rede
    else if (error.request) {
      processedError = {
        type: AsaasErrorType.NETWORK,
        severity: ErrorSeverity.MEDIUM,
        code: 'network_error',
        message: 'Erro de conexão com o servidor',
        userMessage: 'Erro de conexão. Verifique sua internet e tente novamente.',
        retryable: true,
        timestamp: new Date(),
        context,
        details: { request: error.request }
      }
    }
    // Erro de configuração ou outro
    else {
      processedError = {
        type: AsaasErrorType.UNKNOWN,
        severity: ErrorSeverity.MEDIUM,
        code: 'unknown_error',
        message: error.message || 'Erro desconhecido',
        userMessage: 'Ocorreu um erro inesperado. Tente novamente.',
        retryable: false,
        timestamp: new Date(),
        context,
        details: error
      }
    }

    // Registrar erro
    this.logError(processedError)

    return processedError
  }

  // Criar erro baseado no status HTTP
  private createErrorFromHttpStatus(
    status: number, 
    message: string, 
    context?: AsaasError['context'],
    details?: any
  ): AsaasError {
    let type: AsaasErrorType
    let severity: ErrorSeverity
    let userMessage: string
    let retryable: boolean

    switch (status) {
      case 400:
        type = AsaasErrorType.VALIDATION
        severity = ErrorSeverity.MEDIUM
        userMessage = 'Dados inválidos. Verifique as informações e tente novamente.'
        retryable = false
        break
      case 401:
        type = AsaasErrorType.AUTHENTICATION
        severity = ErrorSeverity.HIGH
        userMessage = 'Erro de autenticação. Entre em contato com o suporte.'
        retryable = false
        break
      case 403:
        type = AsaasErrorType.AUTHENTICATION
        severity = ErrorSeverity.HIGH
        userMessage = 'Acesso negado. Você não tem permissão para esta operação.'
        retryable = false
        break
      case 404:
        type = AsaasErrorType.BUSINESS_RULE
        severity = ErrorSeverity.MEDIUM
        userMessage = 'Recurso não encontrado.'
        retryable = false
        break
      case 429:
        type = AsaasErrorType.RATE_LIMIT
        severity = ErrorSeverity.MEDIUM
        userMessage = 'Muitas tentativas. Aguarde alguns minutos e tente novamente.'
        retryable = true
        break
      case 500:
      case 502:
      case 503:
      case 504:
        type = AsaasErrorType.SERVER_ERROR
        severity = ErrorSeverity.HIGH
        userMessage = 'Erro no servidor. Tente novamente em alguns minutos.'
        retryable = true
        break
      default:
        type = AsaasErrorType.UNKNOWN
        severity = ErrorSeverity.MEDIUM
        userMessage = 'Ocorreu um erro inesperado. Tente novamente.'
        retryable = false
    }

    return {
      type,
      severity,
      code: `http_${status}`,
      message,
      userMessage,
      retryable,
      timestamp: new Date(),
      context,
      details
    }
  }

  // Executar função com retry automático
  async executeWithRetry<T>(
    fn: () => Promise<T>,
    context?: AsaasError['context'],
    retryConfig: Partial<RetryConfig> = {}
  ): Promise<T> {
    const config = { ...DEFAULT_RETRY_CONFIG, ...retryConfig }
    let lastError: AsaasError | null = null

    for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
      try {
        return await fn()
      } catch (error) {
        const processedError = this.processError(error, {
          ...context,
          function: context?.function ? `${context.function} (attempt ${attempt})` : `attempt ${attempt}`
        })

        lastError = processedError

        // Se não é retryable ou é a última tentativa, lançar erro
        if (!processedError.retryable || attempt === config.maxAttempts) {
          throw processedError
        }

        // Calcular delay para próxima tentativa
        const delay = Math.min(
          config.baseDelay * Math.pow(config.backoffMultiplier, attempt - 1),
          config.maxDelay
        )

        console.warn(`Tentativa ${attempt} falhou, tentando novamente em ${delay}ms:`, processedError.message)

        // Aguardar antes da próxima tentativa
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }

    // Nunca deveria chegar aqui, mas por segurança
    throw lastError || new Error('Erro desconhecido no retry')
  }

  // Exibir erro para o usuário
  showError(error: AsaasError, showToast: boolean = true): void {
    if (showToast) {
      switch (error.severity) {
        case ErrorSeverity.LOW:
          toast.info(error.userMessage)
          break
        case ErrorSeverity.MEDIUM:
          toast.warning(error.userMessage)
          break
        case ErrorSeverity.HIGH:
        case ErrorSeverity.CRITICAL:
          toast.error(error.userMessage)
          break
      }
    }

    // Log detalhado no console para desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      console.group(`🚨 Asaas Error [${error.severity.toUpperCase()}]`)
      console.error('Type:', error.type)
      console.error('Code:', error.code)
      console.error('Message:', error.message)
      console.error('User Message:', error.userMessage)
      console.error('Retryable:', error.retryable)
      console.error('Context:', error.context)
      console.error('Details:', error.details)
      console.groupEnd()
    }
  }

  // Registrar erro no log interno
  private logError(error: AsaasError): void {
    this.errorLog.push(error)

    // Manter apenas os últimos 100 erros
    if (this.errorLog.length > 100) {
      this.errorLog = this.errorLog.slice(-100)
    }

    // Em produção, enviar para serviço de monitoramento
    if (process.env.NODE_ENV === 'production' && error.severity === ErrorSeverity.CRITICAL) {
      this.reportCriticalError(error)
    }
  }

  // Reportar erro crítico (implementar integração com serviço de monitoramento)
  private reportCriticalError(error: AsaasError): void {
    // Aqui você pode integrar com Sentry, LogRocket, etc.
    console.error('CRITICAL ERROR REPORTED:', error)
  }

  // Obter estatísticas de erros
  getErrorStats(): {
    total: number
    byType: Record<AsaasErrorType, number>
    bySeverity: Record<ErrorSeverity, number>
    recent: AsaasError[]
  } {
    const stats = {
      total: this.errorLog.length,
      byType: {} as Record<AsaasErrorType, number>,
      bySeverity: {} as Record<ErrorSeverity, number>,
      recent: this.errorLog.slice(-10)
    }

    // Inicializar contadores
    Object.values(AsaasErrorType).forEach(type => {
      stats.byType[type] = 0
    })
    Object.values(ErrorSeverity).forEach(severity => {
      stats.bySeverity[severity] = 0
    })

    // Contar erros
    this.errorLog.forEach(error => {
      stats.byType[error.type]++
      stats.bySeverity[error.severity]++
    })

    return stats
  }

  // Limpar log de erros
  clearErrorLog(): void {
    this.errorLog = []
  }
}

// Instância singleton
export const asaasErrorHandler = AsaasErrorHandler.getInstance()

// Função utilitária para uso direto
export function handleAsaasError(error: any, context?: AsaasError['context'], showToast: boolean = true): AsaasError {
  const processedError = asaasErrorHandler.processError(error, context)
  asaasErrorHandler.showError(processedError, showToast)
  return processedError
}

// Função utilitária para retry
export function withAsaasRetry<T>(
  fn: () => Promise<T>,
  context?: AsaasError['context'],
  retryConfig?: Partial<RetryConfig>
): Promise<T> {
  return asaasErrorHandler.executeWithRetry(fn, context, retryConfig)
}