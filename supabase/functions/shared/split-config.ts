/**
 * Split Configuration Module
 * 
 * Responsável por calcular e retornar a configuração de split de pagamentos
 * entre COMADEMIG, RENUM e afiliados (quando aplicável)
 * 
 * Regras de Split:
 * - COM afiliado: 40% RENUM + 40% COMADEMIG + 20% Afiliado
 * - SEM afiliado: 50% RENUM + 50% COMADEMIG
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

/**
 * Interface para configuração de um split individual
 */
export interface SplitConfig {
  walletId: string
  percentualValue: number
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
 * Busca a configuração de split baseada no código de afiliado (opcional)
 * 
 * @param affiliateCode - Código de referral do afiliado (opcional)
 * @returns Configuração de splits formatada para o Asaas
 * @throws Error se variáveis de ambiente não estiverem configuradas
 * @throws Error se código de afiliado for inválido
 */
export async function getSplitConfiguration(
  affiliateCode?: string
): Promise<SplitConfigurationResult> {
  
  // 1. Buscar wallet_id da RENUM (variável de ambiente)
  const RENUM_WALLET_ID = Deno.env.get('RENUM_WALLET_ID')
  const COMADEMIG_WALLET_ID = Deno.env.get('COMADEMIG_WALLET_ID')
  
  if (!RENUM_WALLET_ID) {
    throw new Error('RENUM_WALLET_ID não configurada nas variáveis de ambiente')
  }
  
  if (!COMADEMIG_WALLET_ID) {
    throw new Error('COMADEMIG_WALLET_ID não configurada nas variáveis de ambiente')
  }
  
  const splits: SplitConfig[] = []
  let hasAffiliate = false
  let affiliateInfo: SplitConfigurationResult['affiliateInfo'] = undefined
  
  // 2. Verificar se há código de afiliado
  if (affiliateCode) {
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
      throw new Error(`Código de afiliado inválido ou inativo: ${affiliateCode}`)
    }
    
    if (!affiliate.asaas_wallet_id) {
      throw new Error(`Afiliado ${affiliateCode} não possui wallet_id configurado`)
    }
    
    hasAffiliate = true
    affiliateInfo = {
      id: affiliate.id,
      name: affiliate.display_name || 'Afiliado',
      walletId: affiliate.asaas_wallet_id
    }
    
    // 3. Calcular percentuais COM afiliado (40% + 40% + 20%)
    splits.push({
      walletId: RENUM_WALLET_ID,
      percentualValue: 40.00,
      recipientType: 'renum',
      recipientName: 'RENUM'
    })
    
    splits.push({
      walletId: COMADEMIG_WALLET_ID,
      percentualValue: 40.00,
      recipientType: 'comademig',
      recipientName: 'COMADEMIG'
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
    
  } else {
    // 4. Calcular percentuais SEM afiliado (50% + 50%)
    splits.push({
      walletId: RENUM_WALLET_ID,
      percentualValue: 50.00,
      recipientType: 'renum',
      recipientName: 'RENUM'
    })
    
    splits.push({
      walletId: COMADEMIG_WALLET_ID,
      percentualValue: 50.00,
      recipientType: 'comademig',
      recipientName: 'COMADEMIG'
    })
    
    console.log('✅ Split configurado SEM afiliado:', {
      splits: splits.map(s => `${s.recipientName}: ${s.percentualValue}%`)
    })
  }
  
  // 5. Validar que a soma dos percentuais é 100%
  const totalPercentage = splits.reduce((sum, split) => sum + split.percentualValue, 0)
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
 * 
 * @param splitConfig - Configuração de splits retornada por getSplitConfiguration
 * @returns Array de splits no formato do Asaas
 */
export function formatSplitsForAsaas(splitConfig: SplitConfigurationResult) {
  return splitConfig.splits.map(split => ({
    walletId: split.walletId,
    percentualValue: split.percentualValue
  }))
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
