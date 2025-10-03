import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ProcessRegularizacaoRequest {
  paymentId: string;
  status: 'RECEIVED' | 'CONFIRMED';
  serviceData: {
    servicos_selecionados: Array<{
      id: string;
      nome: string;
      valor: number;
    }>;
    observacoes?: string;
    valor_bruto: number;
    desconto_combo?: number;
    desconto_pix?: number;
    valor_final: number;
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
    }: ProcessRegularizacaoRequest = await req.json()

    console.log('Processando regularização após pagamento:', { 
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
      .from('solicitacoes_regularizacao')
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
    const numeroProtocolo = `REG-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`

    // 3. Preparar dados da solicitação
    const servicosNomes = serviceData.servicos_selecionados.map(s => s.nome).join(', ')
    const isComboCompleto = serviceData.desconto_combo && serviceData.desconto_combo > 0
    const temDescontoPix = serviceData.desconto_pix && serviceData.desconto_pix > 0

    // 4. Criar solicitação de regularização
    const { data: solicitacao, error: insertError } = await supabase
      .from('solicitacoes_regularizacao')
      .insert({
        user_id: userId,
        servicos_selecionados: serviceData.servicos_selecionados,
        valor_total: valor,
        numero_protocolo: numeroProtocolo,
        status: 'pago', // Status inicial após pagamento confirmado
        payment_reference: paymentId,
        observacoes: serviceData.observacoes,
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

    console.log('Solicitação de regularização criada:', {
      id: solicitacao.id,
      protocolo: numeroProtocolo,
      servicos: servicosNomes,
      isCombo: isComboCompleto
    })

    // 5. Criar notificação para o usuário
    try {
      let mensagemDesconto = ''
      if (isComboCompleto && temDescontoPix) {
        mensagemDesconto = ` com desconto combo (15%) + PIX (5%)`
      } else if (isComboCompleto) {
        mensagemDesconto = ` com desconto combo (15%)`
      } else if (temDescontoPix) {
        mensagemDesconto = ` com desconto PIX (5%)`
      }

      const notificationData = {
        user_id: userId,
        type: 'regularizacao_solicitada',
        title: 'Regularização Solicitada com Sucesso',
        message: `Sua solicitação de regularização foi registrada${mensagemDesconto}. Protocolo: ${numeroProtocolo}`,
        data: {
          solicitacao_id: solicitacao.id,
          protocolo: numeroProtocolo,
          servicos: serviceData.servicos_selecionados,
          valor_total: valor,
          is_combo: isComboCompleto,
          desconto_combo: serviceData.desconto_combo || 0,
          desconto_pix: serviceData.desconto_pix || 0
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

    // 6. Criar notificação para administradores
    try {
      // Buscar usuários administradores
      const { data: admins } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'admin')

      if (admins && admins.length > 0) {
        const adminNotifications = admins.map(admin => ({
          user_id: admin.id,
          type: 'nova_solicitacao_regularizacao',
          title: 'Nova Solicitação de Regularização',
          message: `Nova solicitação de regularização recebida${isComboCompleto ? ' (Combo Completo)' : ''}. Protocolo: ${numeroProtocolo}`,
          data: {
            solicitacao_id: solicitacao.id,
            protocolo: numeroProtocolo,
            servicos: serviceData.servicos_selecionados,
            solicitante: solicitacao.profiles?.nome_completo,
            valor_total: valor,
            is_combo: isComboCompleto,
            servicos_count: serviceData.servicos_selecionados.length
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

    // 7. Registrar log de auditoria
    try {
      const auditData = {
        table_name: 'solicitacoes_regularizacao',
        record_id: solicitacao.id,
        action: 'INSERT',
        old_values: null,
        new_values: {
          ...solicitacao,
          summary: {
            servicos_count: serviceData.servicos_selecionados.length,
            valor_bruto: serviceData.valor_bruto,
            desconto_combo: serviceData.desconto_combo || 0,
            desconto_pix: serviceData.desconto_pix || 0,
            valor_final: valor,
            is_combo_completo: isComboCompleto
          }
        },
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

    // 8. Criar tarefas individuais para cada serviço (opcional)
    try {
      const tarefas = serviceData.servicos_selecionados.map(servico => ({
        solicitacao_id: solicitacao.id,
        servico_id: servico.id,
        servico_nome: servico.nome,
        status: 'pendente',
        created_at: new Date().toISOString()
      }))

      await supabase
        .from('regularizacao_tarefas')
        .insert(tarefas)

      console.log(`${tarefas.length} tarefas criadas para a regularização`)
    } catch (error) {
      console.error('Erro ao criar tarefas:', error)
      // Não falha o processo principal - tabela pode não existir
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Regularização processada com sucesso',
        data: {
          solicitacaoId: solicitacao.id,
          protocolo: numeroProtocolo,
          servicosCount: serviceData.servicos_selecionados.length,
          isComboCompleto: isComboCompleto,
          valorTotal: valor,
          descontoCombo: serviceData.desconto_combo || 0,
          descontoPix: serviceData.desconto_pix || 0,
          status: 'pago',
          createdAt: solicitacao.created_at
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('Erro ao processar regularização:', error)
    
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