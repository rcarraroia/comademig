import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { logInfo, logError } from '../shared/logger.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface TestResult {
  test: string
  status: 'success' | 'error' | 'warning'
  message: string
  details?: any
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Log: Teste iniciado
    await logInfo({
      source: 'edge_function',
      functionName: 'test-asaas-connectivity',
      message: 'Teste de conectividade Asaas iniciado'
    })
    
    const results: TestResult[] = []

    // Configurações
    const ASAAS_API_KEY = Deno.env.get('ASAAS_API_KEY') || ''
    const ASAAS_BASE_URL = Deno.env.get('ASAAS_BASE_URL') || 'https://api-sandbox.asaas.com/v3'
    const ASAAS_ENVIRONMENT = Deno.env.get('ASAAS_ENVIRONMENT') || 'sandbox'

    // TESTE 1: Variáveis de Ambiente
    console.log('🔍 TESTE 1: Verificando variáveis de ambiente...')
    
    if (!ASAAS_API_KEY) {
      results.push({
        test: 'Variáveis de Ambiente',
        status: 'error',
        message: 'ASAAS_API_KEY não configurada',
        details: {
          ASAAS_API_KEY: '❌ NÃO CONFIGURADA',
          ASAAS_BASE_URL: ASAAS_BASE_URL || '❌ NÃO CONFIGURADA',
          ASAAS_ENVIRONMENT: ASAAS_ENVIRONMENT || '❌ NÃO CONFIGURADA'
        }
      })

      return new Response(
        JSON.stringify({ 
          success: false, 
          results,
          summary: {
            total: 1,
            success: 0,
            warning: 0,
            error: 1
          }
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500
        }
      )
    }

    const keyPreview = ASAAS_API_KEY.substring(0, 10) + '...' + ASAAS_API_KEY.substring(ASAAS_API_KEY.length - 4)

    results.push({
      test: 'Variáveis de Ambiente',
      status: 'success',
      message: 'Todas as variáveis configuradas',
      details: {
        ASAAS_API_KEY: `✅ ${keyPreview}`,
        ASAAS_BASE_URL: `✅ ${ASAAS_BASE_URL}`,
        ASAAS_ENVIRONMENT: `✅ ${ASAAS_ENVIRONMENT}`
      }
    })

    // TESTE 2: Conectividade API
    console.log('🌐 TESTE 2: Testando conectividade com API Asaas...')
    
    try {
      const response = await fetch(`${ASAAS_BASE_URL}/customers?limit=1`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'access_token': ASAAS_API_KEY,
          'User-Agent': 'COMADEMIG-Portal/1.0'
        }
      })

      const data = await response.json()

      if (!response.ok) {
        results.push({
          test: 'Conectividade API',
          status: 'error',
          message: `Erro HTTP ${response.status}`,
          details: {
            status: response.status,
            statusText: response.statusText,
            error: data.errors?.[0]?.description || 'Erro desconhecido'
          }
        })
      } else {
        results.push({
          test: 'Conectividade API',
          status: 'success',
          message: 'Conexão estabelecida com sucesso',
          details: {
            status: response.status,
            environment: ASAAS_ENVIRONMENT,
            totalCustomers: data.totalCount || 0,
            hasMore: data.hasMore || false
          }
        })
      }
    } catch (error) {
      results.push({
        test: 'Conectividade API',
        status: 'error',
        message: 'Falha na conexão',
        details: {
          error: error instanceof Error ? error.message : 'Erro desconhecido'
        }
      })
    }

    // TESTE 3: Autenticação
    console.log('🔐 TESTE 3: Verificando autenticação...')
    
    try {
      const response = await fetch(`${ASAAS_BASE_URL}/myAccount`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'access_token': ASAAS_API_KEY,
          'User-Agent': 'COMADEMIG-Portal/1.0'
        }
      })

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 401) {
          results.push({
            test: 'Autenticação',
            status: 'error',
            message: 'API Key inválida ou expirada',
            details: {
              status: 401,
              error: 'Unauthorized'
            }
          })
        } else {
          results.push({
            test: 'Autenticação',
            status: 'error',
            message: `Erro HTTP ${response.status}`,
            details: {
              status: response.status,
              error: data.errors?.[0]?.description || 'Erro desconhecido'
            }
          })
        }
      } else {
        results.push({
          test: 'Autenticação',
          status: 'success',
          message: 'Autenticação válida',
          details: {
            accountName: data.name || 'N/A',
            email: data.email || 'N/A',
            walletId: data.walletId || 'N/A'
          }
        })
      }
    } catch (error) {
      results.push({
        test: 'Autenticação',
        status: 'error',
        message: 'Falha na autenticação',
        details: {
          error: error instanceof Error ? error.message : 'Erro desconhecido'
        }
      })
    }

    // TESTE 4: Endpoints Críticos
    console.log('🎯 TESTE 4: Verificando endpoints críticos...')
    
    const endpoints = [
      { name: 'Customers', path: '/customers?limit=1' },
      { name: 'Payments', path: '/payments?limit=1' },
      { name: 'Subscriptions', path: '/subscriptions?limit=1' }
    ]

    const endpointResults: Record<string, string> = {}

    for (const endpoint of endpoints) {
      try {
        const response = await fetch(`${ASAAS_BASE_URL}${endpoint.path}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'access_token': ASAAS_API_KEY,
            'User-Agent': 'COMADEMIG-Portal/1.0'
          }
        })

        if (response.ok) {
          endpointResults[endpoint.name] = '✅ Acessível'
        } else {
          endpointResults[endpoint.name] = `❌ Erro ${response.status}`
        }
      } catch (error) {
        endpointResults[endpoint.name] = '❌ Falha na conexão'
      }
    }

    const allAccessible = Object.values(endpointResults).every(r => r.includes('✅'))

    results.push({
      test: 'Endpoints Críticos',
      status: allAccessible ? 'success' : 'warning',
      message: allAccessible ? 'Todos os endpoints acessíveis' : 'Alguns endpoints com problemas',
      details: endpointResults
    })

    // Calcular resumo
    const summary = {
      total: results.length,
      success: results.filter(r => r.status === 'success').length,
      warning: results.filter(r => r.status === 'warning').length,
      error: results.filter(r => r.status === 'error').length
    }

    const allSuccess = summary.error === 0 && summary.warning === 0

    // Log: Resultado do teste
    await logInfo({
      source: 'edge_function',
      functionName: 'test-asaas-connectivity',
      message: `Teste concluído: ${allSuccess ? 'SUCESSO' : 'FALHA'}`,
      details: {
        summary,
        all_success: allSuccess
      }
    })

    return new Response(
      JSON.stringify({
        success: allSuccess,
        message: allSuccess 
          ? '🎉 Todos os testes passaram! Integração Asaas funcionando perfeitamente.'
          : summary.error > 0
            ? '❌ Falhas detectadas! Revisar configuração do Asaas.'
            : '⚠️ Integração funcionando com avisos.',
        results,
        summary
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: allSuccess ? 200 : 500
      }
    )

  } catch (error) {
    // Log: Erro no teste
    await logError({
      source: 'edge_function',
      functionName: 'test-asaas-connectivity',
      message: 'Erro ao executar teste de conectividade',
      error: error as Error
    })
    
    console.error('Erro na Edge Function:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})
