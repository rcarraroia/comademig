/**
 * Split Configuration Module
 * 
 * Responsável por calcular e retornar a configuração de split de pagamentos
 * entre COMADEMIG, RENUM e afiliados (quando aplicável)
 * 
 * Regras de Split:
 * - Filiação COM afiliado: 40% COMADEMIG + 40% RENUM + 20% Afiliado
 * - Filiação SEM afiliado: 50% COMADEMIG + 50% RENUM
 * - Serviços: 60% COMADEMIG + 40% RENUM
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import type { AsaasSplitData } from './types.ts'

/**
 * Interface para configuração de um split individual
 */
export interface SplitConfig {
  walletId: string
  percentualValue?: number
  fixedValue?: number
  recipientType: 'renum' | 'comademig' | 'affiliate'
  recipientName: string
}

/**
 * Interface para o resultado da configuração de split
 */
export interface SplitConfigurationResult {
  splits: SplitConfig[]
  hasAffiliate: boolean
  affiliateInfo?: {
    id: string
    name: string
    walletId: string
  }
}

/**
 * Parâmetros para getSplitConfiguration
 */
export interface GetSplitConfigParams {
  affiliateCode?: string
  serviceType: 'filiacao' | 'servico'
  totalValue: number
}

/**
 * Busca a configuração de split baseada no código de afiliado e tipo de serviço
 * 
 * @param params - Parâmetros de configuração
 * @returns Configuração de splits formatada
 * @throws Error se variáveis de ambiente não estiverem configuradas
 * @throws Error se código de afiliado for inválido
 */
export async function getSplitConfiguration(
  params: GetSplitConfigParams
): Promise<SplitConfigurationResult> {
  const { affiliateCode, serviceType, totalValue } = params

  // 1. Buscar wallet_id da RENUM (variável de ambiente)
  const RENUM_WALLET_ID = Deno.env.get('RENUM_WALLET_ID')

  if (!RENUM_WALLET_ID) {
    throw new Error('RENUM_WALLET_ID não configurada nas variáveis de ambiente')
  }

  const splits: SplitConfig[] = []
  let hasAffiliate = false
  let affiliateInfo: SplitConfigurationResult['affiliateInfo'] = undefined

  // 2. Verificar se há código de afiliado (apenas para filiação)
  if (affiliateCode && serviceType === 'filiacao') {
    // Buscar dados do afiliado no banco
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { data: affiliate, error } = await supabaseClient
      .from('affiliates')
      .select('id, display_name, asaas_wallet_id, status, user_id')
      .eq('referral_code', affiliateCode)
      .eq('status', 'active')
      .single()

    if (error || !affiliate) {
      console.warn(`Código de afiliado inválido ou inativo: ${affiliateCode}`)
      // Não falha - continua sem afiliado
    } else if (!affiliate.asaas_wallet_id) {
      console.warn(`Afiliado ${affiliateCode} não possui wallet_id configurado`)
      // Não falha - continua sem afiliado
    } else {
      hasAffiliate = true
      affiliateInfo = {
        id: affiliate.id,
        name: affiliate.display_name || 'Afiliado',
        walletId: affiliate.asaas_wallet_id
      }

      // 3. Calcular percentuais COM afiliado (40% COMADEMIG + 40% RENUM + 20% Afiliado)
      // COMADEMIG recebe direto (não precisa de split no Asaas)
      splits.push({
        walletId: '', // COMADEMIG não tem wallet (será removido no formatSplitsForAsaas)
        percentualValue: 40.00,
        recipientType: 'comademig',
        recipientName: 'COMADEMIG'
      })

      splits.push({
        walletId: RENUM_WALLET_ID,
        percentualValue: 40.00,
        recipientType: 'renum',
        recipientName: 'RENUM'
      })

      splits.push({
        walletId: affiliate.asaas_wallet_id,
        percentualValue: 20.00,
        recipientType: 'affiliate',
        recipientName: affiliate.display_name || 'Afiliado'
      })

      console.log('✅ Split configurado COM afiliado:', {
        affiliateCode,
        affiliateName: affiliate.display_name,
        splits: splits.map(s => `${s.recipientName}: ${s.percentualValue}%`)
      })
    }
  }

  // 4. Se não houver afiliado, calcular percentuais baseado no tipo de serviço
  if (!hasAffiliate) {
    if (serviceType === 'filiacao') {
      // Filiação SEM afiliado: 50% COMADEMIG + 50% RENUM
      splits.push({
        walletId: '',
        percentualValue: 50.00,
        recipientType: 'comademig',
        recipientName: 'COMADEMIG'
      })

      splits.push({
        walletId: RENUM_WALLET_ID,
        percentualValue: 50.00,
        recipientType: 'renum',
        recipientName: 'RENUM'
      })
    } else {
      // Serviços: 60% COMADEMIG + 40% RENUM
      splits.push({
        walletId: '',
        percentualValue: 60.00,
        recipientType: 'comademig',
        recipientName: 'COMADEMIG'
      })

      splits.push({
        walletId: RENUM_WALLET_ID,
        percentualValue: 40.00,
        recipientType: 'renum',
        recipientName: 'RENUM'
      })
    }

    console.log(`✅ Split configurado SEM afiliado (${serviceType}):`, {
      splits: splits.map(s => `${s.recipientName}: ${s.percentualValue}%`)
    })
  }

  // 5. Validar que a soma dos percentuais é 100%
  const totalPercentage = splits.reduce((sum, split) => sum + (split.percentualValue || 0), 0)
  if (Math.abs(totalPercentage - 100) > 0.01) {
    throw new Error(`Soma dos percentuais de split inválida: ${totalPercentage}%. Deve ser 100%.`)
  }

  return {
    splits,
    hasAffiliate,
    affiliateInfo
  }
}

/**
 * Formata os splits para o formato esperado pela API do Asaas
 * Suporta parcelamentos usando totalFixedValue
 * 
 * @param splitConfig - Configuração de splits retornada por getSplitConfiguration
 * @param installmentCount - Número de parcelas (opcional, default = 1)
 * @returns Array de splits no formato do Asaas
 */
export function formatSplitsForAsaas(
  splitConfig: SplitConfigurationResult,
  installmentCount: number = 1
): AsaasSplitData[] {
  const asaasSplits: AsaasSplitData[] = []

  for (const split of splitConfig.splits) {
    // COMADEMIG não precisa de split (recebe direto)
    if (split.recipientType === 'comademig') {
      continue
    }

    const asaasSplit: AsaasSplitData = {
      walletId: split.walletId,
      description: `${split.recipientName} - ${split.percentualValue}%`,
      externalReference: split.recipientType
    }

    // Decidir entre fixedValue, percentualValue ou totalFixedValue
    if (split.fixedValue) {
      // Se há valor fixo definido
      if (installmentCount > 1) {
        // Parcelamento: usar totalFixedValue
        asaasSplit.totalFixedValue = split.fixedValue
      } else {
        // À vista: usar fixedValue
        asaasSplit.fixedValue = split.fixedValue
      }
    } else if (split.percentualValue) {
      // Usar percentual (funciona para ambos os casos)
      asaasSplit.percentualValue = split.percentualValue
    }

    asaasSplits.push(asaasSplit)
  }

  return asaasSplits
}

/**
 * Valida se um código de afiliado existe e está ativo
 * 
 * @param affiliateCode - Código de referral do afiliado
 * @returns Dados do afiliado se válido
 * @throws Error se código for inválido ou afiliado inativo
 */
export async function validateAffiliateCode(affiliateCode: string) {
  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  const { data: affiliate, error } = await supabaseClient
    .from('affiliates')
    .select('id, display_name, asaas_wallet_id, status, user_id')
    .eq('referral_code', affiliateCode)
    .single()

  if (error || !affiliate) {
    throw new Error(`Código de afiliado não encontrado: ${affiliateCode}`)
  }

  if (affiliate.status !== 'active') {
    throw new Error(`Afiliado ${affiliateCode} está inativo`)
  }

  if (!affiliate.asaas_wallet_id) {
    throw new Error(`Afiliado ${affiliateCode} não possui wallet_id configurado`)
  }

  return {
    id: affiliate.id,
    name: affiliate.display_name || 'Afiliado',
    walletId: affiliate.asaas_wallet_id,
    status: affiliate.status
  }
}

/**
 * Calcula os valores de comissão para cada split
 * 
 * @param totalValue - Valor total do pagamento
 * @param splitConfig - Configuração de splits
 * @returns Objeto com valores calculados por recipiente
 */
export function calculateSplitAmounts(
  totalValue: number,
  splitConfig: SplitConfigurationResult
): Record<string, number> {
  const amounts: Record<string, number> = {}

  for (const split of splitConfig.splits) {
    if (split.fixedValue) {
      amounts[split.recipientType] = split.fixedValue
    } else if (split.percentualValue) {
      amounts[split.recipientType] = Math.round((totalValue * split.percentualValue) / 100 * 100) / 100
    }
  }

  return amounts
}

/**
 * Valida se os wallet IDs são válidos
 * 
 * @param walletIds - Array de wallet IDs para validar
 * @returns Resultado da validação
 */
export async function validateWalletIds(walletIds: string[]): Promise<{
  allValid: boolean
  results: Array<{
    walletId: string
    valid: boolean
    error?: string
  }>
}> {
  const results = []
  
  // Por enquanto, apenas valida se não estão vazios
  // Validação completa com API do Asaas pode ser adicionada depois
  for (const walletId of walletIds) {
    if (!walletId || walletId.trim() === '') {
      results.push({
        walletId,
        valid: false,
        error: 'Wallet ID vazio'
      })
    } else {
      results.push({
        walletId,
        valid: true
      })
    }
  }
  
  return {
    allValid: results.every(r => r.valid),
    results
  }
}
