import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

export const useSubscriptionRetry = () => {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const retrySubscriptionCreation = async (paymentId: string, memberTypeId: string, planId: string) => {
    if (!user) {
      toast.error('Usuário não autenticado');
      return false;
    }

    setLoading(true);
    
    try {
      console.log('Tentando recriar assinatura:', { paymentId, memberTypeId, planId, userId: user.id });

      // Verificar se já existe uma assinatura para este pagamento
      const { data: existingSubscription, error: checkError } = await supabase
        .from('user_subscriptions')
        .select('id, status')
        .eq('user_id', user.id)
        .eq('payment_reference', paymentId)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Erro ao verificar assinatura existente:', checkError);
        throw checkError;
      }

      if (existingSubscription) {
        if (existingSubscription.status === 'active') {
          toast.info('Você já possui uma assinatura ativa para este pagamento.');
          return true;
        } else if (existingSubscription.status === 'pending') {
          toast.info('Sua assinatura está pendente de ativação. Aguarde a confirmação do pagamento.');
          return true;
        }
      }

      // Criar nova assinatura
      const { data: newSubscription, error: createError } = await supabase
        .from('user_subscriptions')
        .insert({
          user_id: user.id,
          subscription_plan_id: planId,
          member_type_id: memberTypeId,
          status: 'pending',
          payment_reference: paymentId,
          start_date: new Date().toISOString()
        })
        .select()
        .single();

      if (createError) {
        console.error('Erro ao criar assinatura:', createError);
        throw createError;
      }

      console.log('Assinatura criada com sucesso:', newSubscription);
      toast.success('Assinatura reprocessada com sucesso! Será ativada após confirmação do pagamento.');
      
      return true;

    } catch (error: any) {
      console.error('Erro ao reprocessar assinatura:', error);
      
      let errorMessage = 'Erro ao reprocessar assinatura. ';
      
      if (error?.message?.includes('duplicate')) {
        errorMessage = 'Você já possui uma assinatura para este pagamento.';
      } else if (error?.message?.includes('foreign key')) {
        errorMessage = 'Dados de plano ou cargo ministerial inválidos.';
      } else {
        errorMessage += 'Tente novamente ou entre em contato com o suporte.';
      }
      
      toast.error(errorMessage);
      return false;
      
    } finally {
      setLoading(false);
    }
  };

  const checkSubscriptionStatus = async (paymentId: string) => {
    if (!user) return null;

    try {
      const { data: subscription, error } = await supabase
        .from('user_subscriptions')
        .select(`
          id,
          status,
          start_date,
          subscription_plans(name, price, recurrence),
          member_types(name)
        `)
        .eq('user_id', user.id)
        .eq('payment_reference', paymentId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Erro ao verificar status da assinatura:', error);
        return null;
      }

      return subscription;

    } catch (error) {
      console.error('Erro ao verificar assinatura:', error);
      return null;
    }
  };

  const getUserPendingSubscriptions = async () => {
    if (!user) return [];

    try {
      const { data: subscriptions, error } = await supabase
        .from('user_subscriptions')
        .select(`
          id,
          payment_reference,
          created_at,
          subscription_plans(name, price, recurrence),
          member_types(name)
        `)
        .eq('user_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao buscar assinaturas pendentes:', error);
        return [];
      }

      return subscriptions || [];

    } catch (error) {
      console.error('Erro ao buscar assinaturas pendentes:', error);
      return [];
    }
  };

  return {
    retrySubscriptionCreation,
    checkSubscriptionStatus,
    getUserPendingSubscriptions,
    loading
  };
};