import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Imports compartilhados
import { createAsaasClient } from '../shared/asaas-client.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ConfigureSplitRequest {
  paymentId: string;
  affiliateId: string;
  commissionPercentage: number;
  serviceType: 'filiacao' | 'certidao' | 'regularizacao';
  totalValue: number;
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
      paymentId, 
      affiliateId, 
      commissionPercentage, 
      serviceType, 
      totalValue 
    }: ConfigureSplitRequest = await req.json()

    console.log('Configurando split de pagamento:', { 
      paymentId, 
      affiliateId, 
      commissionPercentage, 
      serviceType, 
      totalValue 
    })

    if (!paymentId || !affiliateId || !commissionPercentage || !serviceType || !totalValue) {
      throw new Error('Dados obrigatórios não fornecidos')
    }

    if (commissionPercentage <= 0 || commissionPercentage > 50) {
      throw new Error('Percentual de comissão deve estar entre 0.1% e 50%')
    }

    // 1. Buscar dados do afiliado
    const { data: affiliate, error: affiliateError } = await supabase
      .from('profiles')
      .select(`
        id,
        nome_completo,
        cpf,
        email,
        telefone,
        asaas_customer_id,
        affiliate_data
      `)
      .eq('id', affiliateId)
      .single()

    if (affiliateError || !affiliate) {
      console.error('Afiliado não encontrado:', affiliateError)
      throw new Error('Afiliado não encontrado')
    }

    // 2. Verificar se afiliado tem conta no Asaas
    let affiliateCustomerId = affiliate.asaas_customer_id

    if (!affiliateCustomerId) {
      console.log('Criando cliente Asaas para afiliado...')
      
      // Criar cliente no Asaas para o afiliado
      const customerData = {
        name: affiliate.nome_completo,
        email: affiliate.email,
        phone: affiliate.telefone,
        cpfCnpj: affiliate.cpf,
        notificationDisabled: false,
        additionalEmails: affiliate.email,
        municipalInscription: '',
        stateInscription: '',
        observations: `Afiliado COMADEMIG - ID: ${affiliate.id}`
      }

      const customerResponse = await asaasClient.post('/customers', customerData)
      
      if (!customerResponse.ok) {
        const errorData = await customerResponse.json()
        console.error('Erro ao criar cliente afiliado:', errorData)
        throw new Error(`Erro ao criar cliente afiliado: ${errorData.errors?.[0]?.description || 'Erro desconhecido'}`)
      }

      const customerResult = await customerResponse.json()
      affiliateCustomerId = customerResult.id

      // Salvar customer_id do afiliado
      await supabase
        .from('profiles')
        .update({ asaas_customer_id: affiliateCustomerId })
        .eq('id', affiliateId)

      console.log('Cliente Asaas criado para afiliado:', affiliateCustomerId)
    }

    // 3. Calcular valor da comissão
    const commissionValue = (totalValue * commissionPercentage) / 100

    // 4. Configurar split no Asaas
    const splitData = {
      walletId: affiliateCustomerId,
      fixedValue: commissionValue, // Usar valor fixo em vez de percentual para maior controle
      status: 'PENDING', // Será ativado quando pagamento for confirmado
      description: `Comissão ${serviceType} - ${commissionPercentage}%`
    }

    console.log('Configurando split no Asaas:', splitData)

    const splitResponse = await asaasClient.post(`/payments/${paymentId}/splits`, splitData)
    
    if (!splitResponse.ok) {
      const errorData = await splitResponse.json()
      console.error('Erro ao configurar split:', errorData)
      throw new Error(`Erro ao configurar split: ${errorData.errors?.[0]?.description || 'Erro desconhecido'}`)
    }

    const splitResult = await splitResponse.json()

    console.log('Split configurado no Asaas:', splitResult)

    // 5. Registrar split localmente
    const { data: localSplit, error: splitError } = await supabase
      .from('asaas_splits')
      .insert({
        payment_id: paymentId,
        affiliate_id: affiliateId,
        asaas_split_id: splitResult.id,
        commission_percentage: commissionPercentage,
        commission_value: commissionValue,
        total_value: totalValue,
        service_type: serviceType,
        status: 'PENDING',
        wallet_id: affiliateCustomerId,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (splitError) {
      console.error('Erro ao registrar split localmente:', splitError)
      throw new Error(`Erro ao registrar split: ${splitError.message}`)
    }

    // 6. Criar notificação para o afiliado
    try {
      const notificationData = {
        user_id: affiliateId,
        type: 'comissao_configurada',
        title: 'Comissão Configurada',
        message: `Uma comissão de ${commissionPercentage}% (${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(commissionValue)}) foi configurada para você.`,
        data: {
          split_id: localSplit.id,
          payment_id: paymentId,
          commission_percentage: commissionPercentage,
          commission_value: commissionValue,
          service_type: serviceType,
          status: 'PENDING'
        },
        created_at: new Date().toISOString()
      }

      await supabase
        .from('notifications')
        .insert([notificationData])

      console.log('Notificação criada para afiliado:', affiliateId)
    } catch (error) {
      console.error('Erro ao criar notificação:', error)
      // Não falha o processo principal
    }

    // 7. Registrar log de auditoria
    try {
      const auditData = {
        table_name: 'asaas_splits',
        record_id: localSplit.id,
        action: 'INSERT',
        old_values: null,
        new_values: {
          ...localSplit,
          asaas_split_data: splitResult
        },
        user_id: affiliateId,
        created_at: new Date().toISOString()
      }

      await supabase
        .from('audit_logs')
        .insert([auditData])

      console.log('Log de auditoria registrado')
    } catch (error) {
      console.error('Erro ao registrar auditoria:', error)
      // Não falha o processo principal
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Split configurado com sucesso',
        data: {
          splitId: localSplit.id,
          asaasSplitId: splitResult.id,
          affiliateId: affiliateId,
          affiliateName: affiliate.nome_completo,
          commissionPercentage: commissionPercentage,
          commissionValue: commissionValue,
          totalValue: totalValue,
          serviceType: serviceType,
          status: 'PENDING',
          walletId: affiliateCustomerId
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