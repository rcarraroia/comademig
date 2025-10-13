/**
 * Configuração e validação para deploy em produção
 * Verifica todas as dependências e configurações necessárias
 * 
 * ⚠️ OBSOLETO: Este arquivo verifica variáveis VITE_ASAAS_API_KEY que não existem mais.
 * A validação de produção deve ser feita nas Edge Functions.
 * Manter apenas para referência histórica.
 */

export interface ProductionConfig {
  environment: 'production'
  asaas: {
    apiKey: string
    baseUrl: string
    webhookToken: string
    environment: 'production'
  }
  supabase: {
    url: string
    anonKey: string
    serviceRoleKey: string
  }
  security: {
    encryptionKey: string
    jwtSecret: string
    corsOrigins: string[]
  }
  monitoring: {
    enableMetrics: boolean
    enableAlerts: boolean
    alertWebhookUrl?: string
    logLevel: 'error' | 'warn' | 'info' | 'debug'
  }
  features: {
    enableSandbox: boolean
    enableTesting: boolean
    enableDebugLogs: boolean
    maxPaymentValue: number
    maxDailyTransactions: number
  }
}

export interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  recommendations: string[]
}

export interface DeploymentChecklist {
  category: string
  items: ChecklistItem[]
}

export interface ChecklistItem {
  id: string
  description: string
  required: boolean
  completed: boolean
  details?: string
}

export class ProductionValidator {
  /**
   * Valida configuração completa para produção
   */
  static validateProductionConfig(): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []
    const recommendations: string[] = []

    // Validar variáveis de ambiente obrigatórias
    const requiredEnvVars = [
      'VITE_ASAAS_API_KEY',
      'VITE_ASAAS_BASE_URL',
      'VITE_ASAAS_WEBHOOK_TOKEN',
      'VITE_SUPABASE_URL',
      'VITE_SUPABASE_ANON_KEY',
      'SUPABASE_SERVICE_ROLE_KEY'
    ]

    requiredEnvVars.forEach(envVar => {
      const value = process.env[envVar]
      if (!value) {
        errors.push(`Variável de ambiente obrigatória não configurada: ${envVar}`)
      } else if (value.includes('sandbox') || value.includes('test')) {
        warnings.push(`Variável ${envVar} parece ser de teste/sandbox`)
      }
    })

    // Validar configuração do Asaas
    const asaasApiKey = process.env.VITE_ASAAS_API_KEY
    if (asaasApiKey) {
      if (asaasApiKey.startsWith('$aact_YTU5YTE0M2M2N2I4MTliNzk0YTI5N2U5MzdjNWZmODQ')) {
        errors.push('Chave de API do Asaas ainda está usando valor de sandbox')
      }
      if (asaasApiKey.length < 50) {
        warnings.push('Chave de API do Asaas parece ser muito curta')
      }
    }

    // Validar ambiente
    const environment = process.env.VITE_ASAAS_ENVIRONMENT
    if (environment !== 'production') {
      errors.push(`Ambiente deve ser 'production', atual: ${environment}`)
    }

    // Validar URLs
    const asaasBaseUrl = process.env.VITE_ASAAS_BASE_URL
    if (asaasBaseUrl && asaasBaseUrl.includes('sandbox')) {
      errors.push('URL base do Asaas ainda aponta para sandbox')
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL
    if (supabaseUrl && !supabaseUrl.startsWith('https://')) {
      errors.push('URL do Supabase deve usar HTTPS')
    }

    // Validar configurações de segurança
    const webhookToken = process.env.VITE_ASAAS_WEBHOOK_TOKEN
    if (webhookToken) {
      if (webhookToken.length < 32) {
        warnings.push('Token de webhook deve ter pelo menos 32 caracteres')
      }
      if (webhookToken.includes('test') || webhookToken.includes('sandbox')) {
        warnings.push('Token de webhook parece ser de teste')
      }
    }

    // Recomendações de segurança
    recommendations.push('Configure HTTPS em produção')
    recommendations.push('Implemente rate limiting no servidor')
    recommendations.push('Configure backup automático do banco de dados')
    recommendations.push('Monitore logs de erro em tempo real')
    recommendations.push('Configure alertas para falhas críticas')

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      recommendations
    }
  }

  /**
   * Gera checklist de deploy
   */
  static getDeploymentChecklist(): DeploymentChecklist[] {
    return [
      {
        category: 'Configuração de Ambiente',
        items: [
          {
            id: 'env_production',
            description: 'VITE_ASAAS_ENVIRONMENT definido como "production"',
            required: true,
            completed: process.env.VITE_ASAAS_ENVIRONMENT === 'production'
          },
          {
            id: 'asaas_api_key',
            description: 'Chave de API do Asaas de produção configurada',
            required: true,
            completed: !!(process.env.VITE_ASAAS_API_KEY && !process.env.VITE_ASAAS_API_KEY.includes('sandbox'))
          },
          {
            id: 'asaas_webhook_token',
            description: 'Token de webhook seguro configurado',
            required: true,
            completed: !!(process.env.VITE_ASAAS_WEBHOOK_TOKEN && process.env.VITE_ASAAS_WEBHOOK_TOKEN.length >= 32)
          },
          {
            id: 'supabase_config',
            description: 'Configuração do Supabase de produção',
            required: true,
            completed: !!(process.env.VITE_SUPABASE_URL && process.env.VITE_SUPABASE_URL.startsWith('https://'))
          }
        ]
      },
      {
        category: 'Segurança',
        items: [
          {
            id: 'https_enabled',
            description: 'HTTPS configurado e funcionando',
            required: true,
            completed: false,
            details: 'Verificar se o site está acessível via HTTPS'
          },
          {
            id: 'cors_configured',
            description: 'CORS configurado corretamente',
            required: true,
            completed: false,
            details: 'Configurar origens permitidas no Supabase'
          },
          {
            id: 'rls_policies',
            description: 'Políticas RLS ativadas no Supabase',
            required: true,
            completed: false,
            details: 'Verificar se todas as tabelas têm RLS ativo'
          },
          {
            id: 'webhook_validation',
            description: 'Validação de webhook configurada no Asaas',
            required: true,
            completed: false,
            details: 'Configurar token de webhook no painel do Asaas'
          }
        ]
      },
      {
        category: 'Banco de Dados',
        items: [
          {
            id: 'migrations_applied',
            description: 'Todas as migrações aplicadas',
            required: true,
            completed: false,
            details: 'Executar migrações no banco de produção'
          },
          {
            id: 'backup_configured',
            description: 'Backup automático configurado',
            required: true,
            completed: false,
            details: 'Configurar backup diário no Supabase'
          },
          {
            id: 'indexes_created',
            description: 'Índices de performance criados',
            required: false,
            completed: false,
            details: 'Criar índices para consultas frequentes'
          }
        ]
      },
      {
        category: 'Monitoramento',
        items: [
          {
            id: 'error_tracking',
            description: 'Rastreamento de erros configurado',
            required: false,
            completed: false,
            details: 'Integrar com Sentry ou similar'
          },
          {
            id: 'performance_monitoring',
            description: 'Monitoramento de performance ativo',
            required: false,
            completed: false,
            details: 'Sistema de métricas funcionando'
          },
          {
            id: 'alerts_configured',
            description: 'Alertas críticos configurados',
            required: false,
            completed: false,
            details: 'Configurar alertas por email/Slack'
          },
          {
            id: 'uptime_monitoring',
            description: 'Monitoramento de uptime',
            required: false,
            completed: false,
            details: 'Configurar ping de saúde'
          }
        ]
      },
      {
        category: 'Testes',
        items: [
          {
            id: 'integration_tests',
            description: 'Testes de integração executados',
            required: true,
            completed: false,
            details: 'Executar suite completa de testes'
          },
          {
            id: 'payment_flow_tested',
            description: 'Fluxo de pagamento testado em produção',
            required: true,
            completed: false,
            details: 'Testar PIX, cartão e boleto'
          },
          {
            id: 'webhook_tested',
            description: 'Webhooks testados em produção',
            required: true,
            completed: false,
            details: 'Verificar processamento de webhooks'
          },
          {
            id: 'load_testing',
            description: 'Testes de carga realizados',
            required: false,
            completed: false,
            details: 'Testar com volume esperado'
          }
        ]
      },
      {
        category: 'Documentação',
        items: [
          {
            id: 'deployment_docs',
            description: 'Documentação de deploy atualizada',
            required: false,
            completed: false,
            details: 'Documentar processo de deploy'
          },
          {
            id: 'api_docs',
            description: 'Documentação da API atualizada',
            required: false,
            completed: false,
            details: 'Documentar endpoints e webhooks'
          },
          {
            id: 'troubleshooting_guide',
            description: 'Guia de solução de problemas',
            required: false,
            completed: false,
            details: 'Documentar problemas comuns'
          }
        ]
      }
    ]
  }

  /**
   * Verifica conectividade com serviços externos
   */
  static async checkExternalServices(): Promise<{
    asaas: boolean
    supabase: boolean
    errors: string[]
  }> {
    const errors: string[] = []
    let asaasOk = false
    let supabaseOk = false

    // Testar Asaas
    try {
      const response = await fetch(`${process.env.VITE_ASAAS_BASE_URL}/myAccount`, {
        headers: {
          'access_token': process.env.VITE_ASAAS_API_KEY || '',
          'Content-Type': 'application/json'
        }
      })
      asaasOk = response.ok
      if (!response.ok) {
        errors.push(`Asaas API retornou status ${response.status}`)
      }
    } catch (error) {
      errors.push(`Erro ao conectar com Asaas: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
    }

    // Testar Supabase
    try {
      const response = await fetch(`${process.env.VITE_SUPABASE_URL}/rest/v1/`, {
        headers: {
          'apikey': process.env.VITE_SUPABASE_ANON_KEY || '',
          'Content-Type': 'application/json'
        }
      })
      supabaseOk = response.status === 200 || response.status === 404 // 404 é ok para endpoint raiz
    } catch (error) {
      errors.push(`Erro ao conectar com Supabase: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
    }

    return {
      asaas: asaasOk,
      supabase: supabaseOk,
      errors
    }
  }

  /**
   * Gera relatório de prontidão para produção
   */
  static generateReadinessReport(): {
    ready: boolean
    score: number
    validation: ValidationResult
    checklist: DeploymentChecklist[]
    summary: {
      totalItems: number
      completedItems: number
      requiredItems: number
      completedRequiredItems: number
    }
  } {
    const validation = this.validateProductionConfig()
    const checklist = this.getDeploymentChecklist()

    const totalItems = checklist.reduce((sum, category) => sum + category.items.length, 0)
    const completedItems = checklist.reduce((sum, category) => 
      sum + category.items.filter(item => item.completed).length, 0)
    const requiredItems = checklist.reduce((sum, category) => 
      sum + category.items.filter(item => item.required).length, 0)
    const completedRequiredItems = checklist.reduce((sum, category) => 
      sum + category.items.filter(item => item.required && item.completed).length, 0)

    const score = Math.round((completedItems / totalItems) * 100)
    const ready = validation.isValid && completedRequiredItems === requiredItems

    return {
      ready,
      score,
      validation,
      checklist,
      summary: {
        totalItems,
        completedItems,
        requiredItems,
        completedRequiredItems
      }
    }
  }
}

// Função utilitária para verificar se está pronto para produção
export function isProductionReady(): boolean {
  const report = ProductionValidator.generateReadinessReport()
  return report.ready
}

// Função para obter configuração de produção
export function getProductionConfig(): Partial<ProductionConfig> {
  return {
    environment: 'production',
    asaas: {
      apiKey: process.env.VITE_ASAAS_API_KEY || '',
      baseUrl: process.env.VITE_ASAAS_BASE_URL || 'https://api.asaas.com/v3',
      webhookToken: process.env.VITE_ASAAS_WEBHOOK_TOKEN || '',
      environment: 'production'
    },
    supabase: {
      url: process.env.VITE_SUPABASE_URL || '',
      anonKey: process.env.VITE_SUPABASE_ANON_KEY || '',
      serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    },
    security: {
      encryptionKey: process.env.VITE_ENCRYPTION_KEY || '',
      jwtSecret: process.env.JWT_SECRET || '',
      corsOrigins: (process.env.CORS_ORIGINS || '').split(',').filter(Boolean)
    },
    monitoring: {
      enableMetrics: true,
      enableAlerts: true,
      alertWebhookUrl: process.env.ALERT_WEBHOOK_URL,
      logLevel: (process.env.LOG_LEVEL as any) || 'error'
    },
    features: {
      enableSandbox: false,
      enableTesting: false,
      enableDebugLogs: false,
      maxPaymentValue: parseInt(process.env.MAX_PAYMENT_VALUE || '10000'),
      maxDailyTransactions: parseInt(process.env.MAX_DAILY_TRANSACTIONS || '1000')
    }
  }
}