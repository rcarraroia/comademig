import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ProcessCertidaoRequest {
  paymentId: string;
  status: 'RECEIVED' | 'CONFIRMED';
  serviceData: {
    tipo_certidao: string;
    justificativa: string;
  };
  userId: string;
  valor: number;
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

    const { 
      paymentId, 
      status, 
      serviceData, 
      userId, 
      valor 
    }: ProcessCertidaoRequest = await req.json()

    console.log('Processando certidão após pagamento:', { 
      paymentId, 
      status, 
      serviceData, 
      userId, 
      valor 
    })

    if (!paymentId || !serviceData || !userId) {
      throw new Error('Dados obrigatórios não fornecidos')
    }

    if (!['RECEIVED', 'CONFIRMED'].includes(status)) {
      throw new Error('Status inválido para processamento')
    }

    // 1. Verificar se já existe solicitação para este pagamento
    const { data: existingSolicitacao, error: checkError } = await supabase
      .from('solicitacoes_certidoes')
      .select('id')
      .eq('payment_reference', paymentId)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Erro ao verificar solicitação existente:', checkError)
      throw new Error(`Erro ao verificar solicitação: ${checkError.message}`)
    }

    if (existingSolicitacao) {
      console.log('Solicitação já existe para este pagamento:', existingSolicitacao.id)
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Solicitação já processada',
          solicitacaoId: existingSolicitacao.id 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      )
    }

    // 2. Gerar número de protocolo único
    const numeroProtocolo = `CERT-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`

    // 3. Criar solicitação de certidão
    const { data: solicitacao, error: insertError } = await supabase
      .from('solicitacoes_certidoes')
      .insert({
        user_id: userId,
        tipo_certidao: serviceData.tipo_certidao,
        justificativa: serviceData.justificativa,
        numero_protocolo: numeroProtocolo,
        status: 'pago', // Status inicial após pagamento confirmado
        payment_reference: paymentId,
        valor: valor,
        data_solicitacao: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select(`
        *,
        profiles(
          nome_completo,
          cpf,
          cargo,
          igreja,
          email
        )
      `)
      .single()

    if (insertError) {
      console.error('Erro ao criar solicitação:', insertError)
      throw new Error(`Erro ao criar solicitação: ${insertError.message}`)
    }

    console.log('Solicitação de certidão criada:', {
      id: solicitacao.id,
      protocolo: numeroProtocolo,
      tipo: serviceData.tipo_certidao
    })

    // 4. Criar notificação para o usuário
    try {
      const notificationData = {
        user_id: userId,
        type: 'certidao_solicitada',
        title: 'Certidão Solicitada com Sucesso',
        message: `Sua solicitação de certidão de ${getCertidaoDisplayName(serviceData.tipo_certidao)} foi registrada. Protocolo: ${numeroProtocolo}`,
        data: {
          solicitacao_id: solicitacao.id,
          protocolo: numeroProtocolo,
          tipo_certidao: serviceData.tipo_certidao,
          valor: valor
        },
        created_at: new Date().toISOString()
      }

      await supabase
        .from('notifications')
        .insert([notificationData])

      console.log('Notificação criada para usuário:', userId)
    } catch (error) {
      console.error('Erro ao criar notificação:', error)
      // Não falha o processo principal
    }

    // 5. Criar notificação para administradores
    try {
      // Buscar usuários administradores
      const { data: admins } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'admin')

      if (admins && admins.length > 0) {
        const adminNotifications = admins.map(admin => ({
          user_id: admin.id,
          type: 'nova_solicitacao_certidao',
          title: 'Nova Solicitação de Certidão',
          message: `Nova solicitação de certidão de ${getCertidaoDisplayName(serviceData.tipo_certidao)} recebida. Protocolo: ${numeroProtocolo}`,
          data: {
            solicitacao_id: solicitacao.id,
            protocolo: numeroProtocolo,
            tipo_certidao: serviceData.tipo_certidao,
            solicitante: solicitacao.profiles?.nome_completo,
            valor: valor
          },
          created_at: new Date().toISOString()
        }))

        await supabase
          .from('notifications')
          .insert(adminNotifications)

        console.log(`Notificações criadas para ${admins.length} administradores`)
      }
    } catch (error) {
      console.error('Erro ao notificar administradores:', error)
      // Não falha o processo principal
    }

    // 6. Registrar log de auditoria
    try {
      const auditData = {
        table_name: 'solicitacoes_certidoes',
        record_id: solicitacao.id,
        action: 'INSERT',
        old_values: null,
        new_values: solicitacao,
        user_id: userId,
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
        message: 'Certidão processada com sucesso',
        data: {
          solicitacaoId: solicitacao.id,
          protocolo: numeroProtocolo,
          tipoCertidao: serviceData.tipo_certidao,
          status: 'pago',
          valor: valor,
          createdAt: solicitacao.created_at
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('Erro ao processar certidão:', error)
    
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

// Função auxiliar para nomes amigáveis das certidões
function getCertidaoDisplayName(tipo: string): string {
  const nomes: Record<string, string> = {
    'ministerio': 'Ministério',
    'vinculo': 'Vínculo',
    'atuacao': 'Atuação',
    'historico': 'Histórico Ministerial',
    'ordenacao': 'Ordenação'
  }
  
  return nomes[tipo] || tipo
}