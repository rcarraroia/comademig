/**
 * Edge Function: poll-payment-status-frontend
 * 
 * Endpoint público para polling de status de pagamento pelo frontend
 * Usado pelo componente PaymentProcessingStatus
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PollRequest {
  paymentId: string;
}

interface PollResponse {
  status: 'processing' | 'completed' | 'failed';
  step?: 'payment' | 'account' | 'complete';
  userId?: string;
  error?: string;
  progress?: {
    current: number;
    total: number;
    message: string;
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Verificar método
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { 
          status: 405, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Parse do body
    const { paymentId }: PollRequest = await req.json()

    if (!paymentId) {
      return new Response(
        JSON.stringify({ error: 'paymentId é obrigatório' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Criar cliente Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    console.log(`🔍 Verificando status do pagamento: ${paymentId}`)

    // 1. Buscar informações do pagamento
    const { data: paymentData, error: paymentError } = await supabase
      .from('asaas_cobrancas')
      .select('*')
      .eq('id', paymentId)
      .single()

    if (paymentError || !paymentData) {
      console.error('❌ Pagamento não encontrado:', paymentError)
      return new Response(
        JSON.stringify({ 
          status: 'failed',
          error: 'Pagamento não encontrado'
        } as PollResponse),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // 2. Verificar status do pagamento no Asaas
    let asaasStatus = paymentData.status
    
    // Se ainda está pendente, verificar no Asaas
    if (asaasStatus === 'PENDING') {
      try {
        const asaasResponse = await fetch(
          `https://sandbox.asaas.com/api/v3/payments/${paymentData.asaas_id}`,
          {
            headers: {
              'access_token': Deno.env.get('ASAAS_API_KEY')!,
              'Content-Type': 'application/json'
            }
          }
        )

        if (asaasResponse.ok) {
          const asaasData = await asaasResponse.json()
          asaasStatus = asaasData.status

          // Atualizar status local se mudou
          if (asaasStatus !== paymentData.status) {
            await supabase
              .from('asaas_cobrancas')
              .update({ status: asaasStatus })
              .eq('id', paymentId)
          }
        }
      } catch (error) {
        console.warn('⚠️ Erro ao verificar status no Asaas:', error)
        // Continuar com status local
      }
    }

    // 3. Determinar status e step baseado no pagamento
    let response: PollResponse

    switch (asaasStatus) {
      case 'PENDING':
        response = {
          status: 'processing',
          step: 'payment',
          progress: {
            current: 1,
            total: 3,
            message: 'Processando pagamento...'
          }
        }
        break

      case 'RECEIVED':
      case 'CONFIRMED':
        // Pagamento aprovado, verificar se conta foi criada
        const { data: userData, error: userError } = await supabase
          .from('profiles')
          .select('id, user_id')
          .eq('email', paymentData.customer_email)
          .single()

        if (userError || !userData) {
          // Conta ainda não foi criada
          response = {
            status: 'processing',
            step: 'account',
            progress: {
              current: 2,
              total: 3,
              message: 'Criando sua conta...'
            }
          }
        } else {
          // Processo concluído
          response = {
            status: 'completed',
            step: 'complete',
            userId: userData.user_id,
            progress: {
              current: 3,
              total: 3,
              message: 'Filiação concluída!'
            }
          }
        }
        break

      case 'OVERDUE':
      case 'REFUNDED':
      case 'RECEIVED_IN_CASH_UNDONE':
      case 'CHARGEBACK_REQUESTED':
      case 'CHARGEBACK_DISPUTE':
      case 'AWAITING_CHARGEBACK_REVERSAL':
      case 'DUNNING_REQUESTED':
      case 'DUNNING_RECEIVED':
      case 'AWAITING_RISK_ANALYSIS':
        response = {
          status: 'failed',
          error: `Pagamento ${asaasStatus.toLowerCase()}`
        }
        break

      default:
        response = {
          status: 'processing',
          step: 'payment',
          progress: {
            current: 1,
            total: 3,
            message: 'Verificando status...'
          }
        }
    }

    console.log(`✅ Status retornado:`, response)

    return new Response(
      JSON.stringify(response),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('❌ Erro no polling de status:', error)
    
    return new Response(
      JSON.stringify({ 
        status: 'failed',
        error: 'Erro interno do servidor'
      } as PollResponse),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

/* 
EXEMPLO DE USO:

POST /functions/v1/poll-payment-status-frontend
{
  "paymentId": "uuid-do-pagamento"
}

RESPOSTA:
{
  "status": "processing",
  "step": "payment",
  "progress": {
    "current": 1,
    "total": 3,
    "message": "Processando pagamento..."
  }
}

POSSÍVEIS STATUS:
- processing: Ainda processando
- completed: Processo concluído
- failed: Erro no processo

POSSÍVEIS STEPS:
- payment: Processando pagamento
- account: Criando conta
- complete: Processo finalizado
*/