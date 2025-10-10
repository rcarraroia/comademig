import { supabase } from '@/integrations/supabase/client';

/**
 * Tipos de serviço para configuração de split
 */
export type ServiceType = 'filiacao' | 'servicos' | 'publicidade' | 'eventos' | 'outros';

/**
 * Verifica se um usuário foi indicado por um afiliado
 * 
 * @param userId - ID do usuário
 * @returns Dados do afiliado indicador ou null
 */
export async function checkUserReferral(userId: string) {
  try {
    const { data, error } = await supabase
      .from('affiliate_referrals')
      .select(`
        *,
        affiliate:affiliates!affiliate_id(
          id,
          display_name,
          asaas_wallet_id,
          status
        )
      `)
      .eq('referred_user_id', userId)
      .eq('status', 'pending')
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error checking user referral:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in checkUserReferral:', error);
    return null;
  }
}

/**
 * Configura split automaticamente após criar cobrança
 * 
 * @param cobrancaId - ID da cobrança criada
 * @param userId - ID do usuário que está pagando
 * @param serviceType - Tipo de serviço (filiacao, servicos, etc)
 * @param totalValue - Valor total da cobrança
 * @returns Resultado da configuração do split
 */
export async function autoConfigureSplit(
  cobrancaId: string,
  userId: string,
  serviceType: ServiceType,
  totalValue: number
) {
  try {
    console.log('Auto-configuring split:', { cobrancaId, userId, serviceType, totalValue });

    // 1. Verificar se usuário foi indicado
    const referral = await checkUserReferral(userId);
    
    if (!referral) {
      console.log('User was not referred by an affiliate, skipping split configuration');
      return {
        success: true,
        message: 'Usuário não foi indicado, split não configurado',
        hasAffiliate: false,
      };
    }

    // 2. Verificar se afiliado está ativo
    if (referral.affiliate?.status !== 'active') {
      console.warn('Affiliate is not active, skipping split configuration');
      return {
        success: false,
        message: 'Afiliado não está ativo',
        hasAffiliate: false,
      };
    }

    // 3. Chamar Edge Function para configurar split
    const { data, error } = await supabase.functions.invoke('asaas-configure-split', {
      body: {
        cobrancaId,
        serviceType,
        totalValue,
        affiliateId: referral.affiliate_id,
      },
    });

    if (error) {
      console.error('Error calling asaas-configure-split:', error);
      return {
        success: false,
        message: `Erro ao configurar split: ${error.message}`,
        hasAffiliate: true,
        error,
      };
    }

    if (!data.success) {
      console.error('Split configuration failed:', data);
      return {
        success: false,
        message: data.error || 'Erro ao configurar split',
        hasAffiliate: true,
      };
    }

    console.log('Split configured successfully:', data);

    return {
      success: true,
      message: 'Split configurado com sucesso',
      hasAffiliate: true,
      data: data.data,
    };
  } catch (error: any) {
    console.error('Error in autoConfigureSplit:', error);
    return {
      success: false,
      message: error.message || 'Erro ao configurar split',
      hasAffiliate: false,
      error,
    };
  }
}

/**
 * Processa splits automaticamente após confirmação de pagamento
 * 
 * @param cobrancaId - ID da cobrança paga
 * @param paymentValue - Valor pago
 * @param serviceType - Tipo de serviço
 * @returns Resultado do processamento
 */
export async function autoProcessSplits(
  cobrancaId: string,
  paymentValue: number,
  serviceType: ServiceType
) {
  try {
    console.log('Auto-processing splits:', { cobrancaId, paymentValue, serviceType });

    // Chamar Edge Function para processar splits
    const { data, error } = await supabase.functions.invoke('asaas-process-splits', {
      body: {
        cobrancaId,
        paymentValue,
        serviceType,
      },
    });

    if (error) {
      console.error('Error calling asaas-process-splits:', error);
      return {
        success: false,
        message: `Erro ao processar splits: ${error.message}`,
        error,
      };
    }

    if (!data.success) {
      console.error('Split processing failed:', data);
      return {
        success: false,
        message: data.error || 'Erro ao processar splits',
      };
    }

    console.log('Splits processed successfully:', data);

    // Atualizar status da indicação para 'converted' se houver afiliado
    if (data.processed && data.data?.processedSplits) {
      const affiliateSplit = data.data.processedSplits.find(
        (s: any) => s.recipientType === 'affiliate'
      );

      if (affiliateSplit) {
        await updateReferralStatus(cobrancaId, paymentValue);
      }
    }

    return {
      success: true,
      message: 'Splits processados com sucesso',
      data: data.data,
    };
  } catch (error: any) {
    console.error('Error in autoProcessSplits:', error);
    return {
      success: false,
      message: error.message || 'Erro ao processar splits',
      error,
    };
  }
}

/**
 * Atualiza status da indicação para 'converted' após pagamento confirmado
 * 
 * @param cobrancaId - ID da cobrança
 * @param conversionValue - Valor da conversão
 */
async function updateReferralStatus(cobrancaId: string, conversionValue: number) {
  try {
    // Buscar split do afiliado para esta cobrança
    const { data: split } = await supabase
      .from('asaas_splits')
      .select('affiliate_id')
      .eq('cobranca_id', cobrancaId)
      .eq('recipient_type', 'affiliate')
      .single();

    if (!split || !split.affiliate_id) {
      return;
    }

    // Buscar indicação
    const { data: referral } = await supabase
      .from('affiliate_referrals')
      .select('id, referred_user_id')
      .eq('affiliate_id', split.affiliate_id)
      .eq('status', 'pending')
      .single();

    if (!referral) {
      return;
    }

    // Atualizar status para 'converted'
    await supabase
      .from('affiliate_referrals')
      .update({
        status: 'converted',
        conversion_date: new Date().toISOString(),
        conversion_value: conversionValue,
      })
      .eq('id', referral.id);

    console.log('Referral status updated to converted:', referral.id);
  } catch (error) {
    console.error('Error updating referral status:', error);
    // Não falha o processo principal
  }
}

/**
 * Envia notificação de comissão para o afiliado
 * 
 * @param affiliateId - ID do afiliado
 * @param commissionAmount - Valor da comissão
 * @param paymentReference - Referência do pagamento
 */
export async function notifyAffiliateCommission(
  affiliateId: string,
  commissionAmount: number,
  paymentReference: string
) {
  try {
    // Buscar user_id do afiliado
    const { data: affiliate } = await supabase
      .from('affiliates')
      .select('user_id, display_name')
      .eq('id', affiliateId)
      .single();

    if (!affiliate) {
      console.warn('Affiliate not found for notification:', affiliateId);
      return;
    }

    // Criar notificação
    await supabase.from('notifications').insert({
      user_id: affiliate.user_id,
      type: 'comissao_recebida',
      title: 'Nova Comissão Recebida!',
      message: `Você recebeu uma comissão de ${new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }).format(commissionAmount)} referente ao pagamento ${paymentReference}.`,
      action_url: '/dashboard/afiliados',
    });

    console.log('Commission notification sent to affiliate:', affiliateId);
  } catch (error) {
    console.error('Error sending affiliate notification:', error);
    // Não falha o processo principal
  }
}
