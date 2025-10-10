import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Cliente Asaas inline
function createAsaasClient() {
  const apiKey = Deno.env.get('ASAAS_API_KEY') || ''
  const baseUrl = Deno.env.get('ASAAS_BASE_URL') || 'https://api-sandbox.asaas.com/v3'

  if (!apiKey) {
    throw new Error('ASAAS_API_KEY não configurada')
  }

  return {
    async post(endpoint: string, body: any) {
      const url = `${baseUrl}${endpoint}`
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'access_token': apiKey,
        },
        body: JSON.stringify(body)
      })

      return {
        ok: response.ok,
        json: async () => await response.json()
      }
    }
  }
}

interface ConfigureSplitRequest {
  cobrancaId: string;
  serviceType: 'filiacao' | 'servicos' | 'publicidade' | 'eventos' | 'outros';
  totalValue: number;
  affiliateId?: string; // Opcional - apenas para filiação
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const asaasClient = createAsaasClient()

    const { 
      cobrancaId, 
      serviceType, 
      totalValue,
      affiliateId
    }: ConfigureSplitRequest = await req.json()

    console.log('Configurando divisão tripla de pagamento:', { 
      cobrancaId, 
      serviceType, 
      totalValue,
      affiliateId 
    })

    if (!cobrancaId || !serviceType || !totalValue) {
      throw new Error('Dados obrigatórios não fornecidos (cobrancaId, serviceType, totalValue)')
    }

    // Buscar Wallet ID da RENUM das variáveis de ambiente
    const RENUM_WALLET_ID = Deno.env.get('RENUM_WALLET_ID')
    if (!RENUM_WALLET_ID) {
      console.error('RENUM_WALLET_ID não configurado nas variáveis de ambiente')
      throw new Error('Configuração de split incompleta - RENUM_WALLET_ID não encontrado')
    }

    // 1. Definir configuração de split baseado no tipo de serviço
    const splitConfigs: Record<string, Array<{
      identifier: 'comademig' | 'renum' | 'affiliate';
      name: string;
      percentage: number;
    }>> = {
      filiacao: [
        { identifier: 'comademig', name: 'COMADEMIG', percentage: 40 },
        { identifier: 'renum', name: 'RENUM', percentage: 40 },
        { identifier: 'affiliate', name: 'Afiliado', percentage: 20 },
      ],
      servicos: [
        { identifier: 'comademig', name: 'COMADEMIG', percentage: 60 },
        { identifier: 'renum', name: 'RENUM', percentage: 40 },
      ],
      publicidade: [
        { identifier: 'comademig', name: 'COMADEMIG', percentage: 100 },
      ],
      eventos: [
        { identifier: 'comademig', name: 'COMADEMIG', percentage: 70 },
        { identifier: 'renum', name: 'RENUM', percentage: 30 },
      ],
      outros: [
        { identifier: 'comademig', name: 'COMADEMIG', percentage: 100 },
      ],
    }

    const config = splitConfigs[serviceType]
    if (!config) {
      throw new Error(`Tipo de serviço inválido: ${serviceType}`)
    }

    console.log(`Configuração de split para ${serviceType}:`, config)

    // 2. Buscar dados do afiliado (se houver)
    let affiliateWalletId: string | null = null
    let affiliateName = 'Afiliado'

    if (affiliateId) {
      const { data: affiliate, error: affiliateError } = await supabase
        .from('affiliates')
        .select('id, display_name, asaas_wallet_id, user_id')
        .eq('id', affiliateId)
        .eq('status', 'active')
        .single()

      if (affiliateError || !affiliate) {
        console.warn('Afiliado não encontrado ou inativo:', affiliateError)
        // Não falha - apenas não cria split para afiliado
      } else {
        affiliateWalletId = affiliate.asaas_wallet_id
        affiliateName = affiliate.display_name
        console.log('Afiliado encontrado:', { id: affiliate.id, name: affiliateName, walletId: affiliateWalletId })
      }
    }

    // 3. Criar splits para cada beneficiário
    const createdSplits = []

    for (const recipient of config) {
      // Pular afiliado se não houver wallet ID
      if (recipient.identifier === 'affiliate' && !affiliateWalletId) {
        console.log('Pulando split de afiliado - sem wallet ID')
        continue
      }

      const amount = Math.round((totalValue * recipient.percentage) / 100 * 100) / 100

      // COMADEMIG recebe direto (não cria split no Asaas)
      if (recipient.identifier === 'comademig') {
        console.log(`COMADEMIG receberá R$ ${amount.toFixed(2)} (${recipient.percentage}%) diretamente`)
        
        // Apenas registrar localmente
        const { data: localSplit, error: splitError } = await supabase
          .from('asaas_splits')
          .insert({
            cobranca_id: cobrancaId,
            recipient_type: 'comademig',
            recipient_name: 'COMADEMIG',
            service_type: serviceType,
            percentage: recipient.percentage,
            commission_amount: amount,
            total_value: totalValue,
            wallet_id: null, // COMADEMIG não tem wallet (recebe direto)
            asaas_split_id: null, // Não cria split no Asaas
            status: 'PENDING',
          })
          .select()
          .single()

        if (splitError) {
          console.error('Erro ao registrar split COMADEMIG:', splitError)
          throw new Error(`Erro ao registrar split COMADEMIG: ${splitError.message}`)
        }

        createdSplits.push({
          ...localSplit,
          needsAsaasSplit: false
        })
        continue
      }

      // RENUM e Afiliado: criar split no Asaas
      const walletId = recipient.identifier === 'renum' ? RENUM_WALLET_ID : affiliateWalletId
      const recipientName = recipient.identifier === 'renum' ? 'RENUM' : affiliateName

      console.log(`Criando split no Asaas para ${recipientName}: R$ ${amount.toFixed(2)} (${recipient.percentage}%)`)

      // Criar split no Asaas
      const splitData = {
        walletId: walletId,
        fixedValue: amount,
        status: 'PENDING',
        description: `${recipientName} - ${serviceType} - ${recipient.percentage}%`
      }

      const splitResponse = await asaasClient.post(`/payments/${cobrancaId}/splits`, splitData)
      
      if (!splitResponse.ok) {
        const errorData = await splitResponse.json()
        console.error(`Erro ao criar split no Asaas para ${recipientName}:`, errorData)
        throw new Error(`Erro ao criar split para ${recipientName}: ${errorData.errors?.[0]?.description || 'Erro desconhecido'}`)
      }

      const splitResult = await splitResponse.json()
      console.log(`Split criado no Asaas para ${recipientName}:`, splitResult.id)

      // Registrar split localmente
      const { data: localSplit, error: splitError } = await supabase
        .from('asaas_splits')
        .insert({
          cobranca_id: cobrancaId,
          recipient_type: recipient.identifier,
          recipient_name: recipientName,
          service_type: serviceType,
          percentage: recipient.percentage,
          commission_amount: amount,
          total_value: totalValue,
          wallet_id: walletId,
          asaas_split_id: splitResult.id,
          status: 'PENDING',
          affiliate_id: recipient.identifier === 'affiliate' ? affiliateId : null,
        })
        .select()
        .single()

      if (splitError) {
        console.error(`Erro ao registrar split ${recipientName}:`, splitError)
        throw new Error(`Erro ao registrar split ${recipientName}: ${splitError.message}`)
      }

      createdSplits.push({
        ...localSplit,
        needsAsaasSplit: true
      })
    }

    console.log(`${createdSplits.length} splits criados com sucesso`)

    // 4. Criar notificação para o afiliado (se houver)
    if (affiliateId && affiliateWalletId) {
      try {
        const affiliateSplit = createdSplits.find(s => s.recipient_type === 'affiliate')
        if (affiliateSplit) {
          const { data: affiliateProfile } = await supabase
            .from('affiliates')
            .select('user_id')
            .eq('id', affiliateId)
            .single()

          if (affiliateProfile) {
            const notificationData = {
              user_id: affiliateProfile.user_id,
              type: 'comissao_configurada',
              title: 'Comissão Configurada',
              message: `Uma comissão de ${affiliateSplit.percentage}% (${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(affiliateSplit.commission_amount)}) foi configurada para você.`,
              action_url: '/dashboard/afiliados',
            }

            await supabase
              .from('notifications')
              .insert([notificationData])

            console.log('Notificação criada para afiliado')
          }
        }
      } catch (error) {
        console.error('Erro ao criar notificação:', error)
        // Não falha o processo principal
      }
    }

    // 5. Registrar log de auditoria
    try {
      for (const split of createdSplits) {
        const auditData = {
          table_name: 'asaas_splits',
          record_id: split.id,
          action: 'INSERT',
          new_values: split,
        }

        await supabase
          .from('audit_logs')
          .insert([auditData])
      }

      console.log('Logs de auditoria registrados')
    } catch (error) {
      console.error('Erro ao registrar auditoria:', error)
      // Não falha o processo principal
    }

    // 6. Calcular totais
    const totalSplitAmount = createdSplits.reduce((sum, s) => sum + (s.commission_amount || 0), 0)
    const splitsWithAsaas = createdSplits.filter(s => s.needsAsaasSplit).length

    return new Response(
      JSON.stringify({
        success: true,
        message: `Divisão tripla configurada: ${createdSplits.length} beneficiários`,
        data: {
          cobrancaId,
          serviceType,
          totalValue,
          totalSplitAmount,
          splits: createdSplits.map(s => ({
            id: s.id,
            recipientType: s.recipient_type,
            recipientName: s.recipient_name,
            percentage: s.percentage,
            amount: s.commission_amount,
            asaasSplitId: s.asaas_split_id,
            needsAsaasSplit: s.needsAsaasSplit,
          })),
          summary: {
            totalSplits: createdSplits.length,
            splitsWithAsaas: splitsWithAsaas,
            splitsLocalOnly: createdSplits.length - splitsWithAsaas,
          }
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('Erro ao configurar split:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Erro interno do servidor'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})