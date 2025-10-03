import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ActivateSubscriptionRequest {
  paymentId: string;
  status: 'RECEIVED' | 'CONFIRMED';
  userId?: string;
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

    const { paymentId, status, userId }: ActivateSubscriptionRequest = await req.json()

    console.log('Ativando assinatura para pagamento:', { paymentId, status, userId })

    if (!paymentId) {
      throw new Error('Payment ID é obrigatório')
    }

    if (!['RECEIVED', 'CONFIRMED'].includes(status)) {
      throw new Error('Status inválido para ativação')
    }

    // 1. Buscar assinatura pelo payment_id
    const { data: subscription, error: subscriptionError } = await supabase
      .from('user_subscriptions')
      .select(`
        *,
        subscription_plans(
          id,
          name,
          price,
          recurrence,
          permissions
        ),
        member_types(
          id,
          name
        ),
        profiles(
          id,
          nome_completo,
          email
        )
      `)
      .eq('payment_id', paymentId)
      .eq('status', 'pending')
      .single()

    if (subscriptionError || !subscription) {
      console.log('Assinatura não encontrada ou já ativada:', subscriptionError)
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Assinatura não encontrada ou já ativada',
          paymentId 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404
        }
      )
    }

    // 2. Ativar assinatura
    const { error: updateError } = await supabase
      .from('user_subscriptions')
      .update({
        status: 'active',
        activated_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', subscription.id)

    if (updateError) {
      console.error('Erro ao ativar assinatura:', updateError)
      throw new Error(`Erro ao ativar assinatura: ${updateError.message}`)
    }

    // 3. Atualizar status do perfil para ativo
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        subscription_status: 'active',
        updated_at: new Date().toISOString()
      })
      .eq('id', subscription.user_id)

    if (profileError) {
      console.error('Erro ao atualizar perfil:', profileError)
      // Não falha a operação, apenas loga o erro
    }

    // 4. Processar comissão de afiliado se houver
    try {
      const { data: referral } = await supabase
        .from('affiliate_referrals')
        .select('*')
        .eq('subscription_id', subscription.id)
        .single()

      if (referral) {
        // Calcular comissão (exemplo: 10% do valor do plano)
        const commissionRate = 0.10 // 10%
        const commissionValue = (subscription.subscription_plans?.price || 0) * commissionRate

        // Registrar comissão
        const { error: commissionError } = await supabase
          .from('asaas_splits')
          .insert({
            payment_id: paymentId,
            affiliate_id: referral.referral_code,
            user_id: subscription.user_id,
            commission_value: commissionValue,
            commission_rate: commissionRate,
            status: 'pending',
            created_at: new Date().toISOString()
          })

        if (commissionError) {
          console.error('Erro ao registrar comissão:', commissionError)
        } else {
          console.log('Comissão registrada:', { paymentId, commissionValue })
        }
      }
    } catch (error) {
      console.log('Nenhum afiliado encontrado ou erro ao processar comissão:', error)
    }

    // 5. Enviar notificação de ativação (simulado)
    try {
      console.log('Enviando notificação de ativação para:', subscription.profiles?.email)
      
      // Aqui você pode integrar com um serviço de email real
      // Por exemplo: SendGrid, Resend, etc.
      
      const notificationData = {
        user_id: subscription.user_id,
        type: 'subscription_activated',
        title: 'Filiação Ativada com Sucesso!',
        message: `Sua filiação como ${subscription.member_types?.name} foi ativada com sucesso.`,
        data: {
          subscription_id: subscription.id,
          member_type: subscription.member_types?.name,
          plan_name: subscription.subscription_plans?.name,
          activated_at: new Date().toISOString()
        },
        created_at: new Date().toISOString()
      }

      // Salvar notificação no banco
      await supabase
        .from('notifications')
        .insert([notificationData])

    } catch (error) {
      console.error('Erro ao enviar notificação:', error)
      // Não falha a operação principal
    }

    console.log('Assinatura ativada com sucesso:', {
      subscriptionId: subscription.id,
      userId: subscription.user_id,
      memberType: subscription.member_types?.name,
      paymentId
    })

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Assinatura ativada com sucesso',
        data: {
          subscriptionId: subscription.id,
          userId: subscription.user_id,
          memberType: subscription.member_types?.name,
          status: 'active',
          activatedAt: new Date().toISOString()
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('Erro ao ativar assinatura:', error)
    
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