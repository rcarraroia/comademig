import { useSupabaseQuery, useSupabaseMutation } from './useSupabaseQuery';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface AdminNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  category: 'payment' | 'subscription' | 'system' | 'user_action';
  service_type?: 'filiacao' | 'certidao' | 'regularizacao';
  reference_id?: string;
  user_id?: string;
  read: boolean;
  created_at: string;
  metadata?: any;
}

interface PendingRequest {
  id: string;
  service_type: string;
  user_name: string;
  user_email: string;
  value: number;
  status: string;
  payment_status: string;
  created_at: string;
  data_pagamento?: string;
}

export const useAdminNotifications = () => {
  const { user, isAdmin } = useAuth();

  // Query para buscar notificações administrativas
  const { 
    data: adminNotifications = [], 
    isLoading: loadingNotifications, 
    refetch: refetchNotifications 
  } = useSupabaseQuery<AdminNotification[]>(
    ['admin-notifications'],
    async (): Promise<AdminNotification[]> => {
      if (!user || !isAdmin()) {
        return [];
      }

      const { data, error } = await supabase
        .from('admin_notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Erro ao buscar notificações administrativas:', error);
        throw error;
      }

      return data || [];
    },
    {
      enabled: !!user && isAdmin(),
      staleTime: 30 * 1000, // Cache por 30 segundos
      cacheTime: 5 * 60 * 1000 // Manter em cache por 5 minutos
    }
  );

  // Query para contar notificações não lidas
  const { 
    data: unreadCount = 0, 
    isLoading: loadingUnreadCount 
  } = useSupabaseQuery<number>(
    ['admin-notifications-unread'],
    async (): Promise<number> => {
      if (!user || !isAdmin()) {
        return 0;
      }

      const { count, error } = await supabase
        .from('admin_notifications')
        .select('id', { count: 'exact' })
        .eq('read', false);

      if (error) {
        console.error('Erro ao contar notificações não lidas:', error);
        return 0;
      }

      return count || 0;
    },
    {
      enabled: !!user && isAdmin(),
      staleTime: 30 * 1000
    }
  );

  // Query para buscar solicitações pendentes (dashboard)
  const { 
    data: pendingRequests = [], 
    isLoading: loadingPendingRequests 
  } = useSupabaseQuery<PendingRequest[]>(
    ['admin-pending-requests'],
    async (): Promise<PendingRequest[]> => {
      if (!user || !isAdmin()) {
        return [];
      }

      // Buscar cobranças pagas que precisam de processamento administrativo
      const { data, error } = await supabase
        .from('asaas_cobrancas')
        .select(`
          id,
          tipo_cobranca,
          status,
          valor,
          data_pagamento,
          created_at,
          profiles!inner(
            nome_completo,
            email
          )
        `)
        .not('data_pagamento', 'is', null) // Apenas pagamentos confirmados
        .in('status', ['pending', 'processing']) // Que ainda precisam de ação administrativa
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        console.error('Erro ao buscar solicitações pendentes:', error);
        return [];
      }

      return (data || []).map(item => ({
        id: item.id,
        service_type: item.tipo_cobranca,
        user_name: item.profiles?.nome_completo || 'Usuário não encontrado',
        user_email: item.profiles?.email || 'Email não encontrado',
        value: item.valor,
        status: item.status,
        payment_status: 'paid',
        data_pagamento: item.data_pagamento,
        created_at: item.created_at
      }));
    },
    {
      enabled: !!user && isAdmin(),
      staleTime: 60 * 1000, // Cache por 1 minuto
      cacheTime: 5 * 60 * 1000
    }
  );

  // Mutation para marcar notificação como lida
  const markAsRead = useSupabaseMutation<string, string>(
    async (notificationId: string): Promise<string> => {
      const { error } = await supabase
        .from('admin_notifications')
        .update({ read: true })
        .eq('id', notificationId);

      if (error) throw error;
      return notificationId;
    },
    {
      onSuccess: () => {
        refetchNotifications();
      }
    }
  );

  // Mutation para marcar todas como lidas
  const markAllAsRead = useSupabaseMutation<void, void>(
    async (): Promise<void> => {
      const { error } = await supabase
        .from('admin_notifications')
        .update({ read: true })
        .eq('read', false);

      if (error) throw error;
    },
    {
      onSuccess: () => {
        toast.success('Todas as notificações foram marcadas como lidas');
        refetchNotifications();
      }
    }
  );

  // Mutation para criar notificação administrativa
  const createAdminNotification = useSupabaseMutation<AdminNotification, Omit<AdminNotification, 'id' | 'read' | 'created_at'>>(
    async (notificationData): Promise<AdminNotification> => {
      const { data, error } = await supabase
        .from('admin_notifications')
        .insert({
          ...notificationData,
          read: false,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    {
      onSuccess: () => {
        refetchNotifications();
      }
    }
  );

  // Função utilitária para criar notificação de novo pagamento
  const notifyNewPayment = async (serviceType: string, userId: string, value: number, referenceId: string) => {
    if (!isAdmin()) return;

    const serviceNames = {
      'filiacao': 'Filiação',
      'certidao': 'Certidão',
      'regularizacao': 'Regularização'
    };

    const serviceName = serviceNames[serviceType as keyof typeof serviceNames] || serviceType;

    await createAdminNotification.mutateAsync({
      title: `Novo Pagamento - ${serviceName}`,
      message: `Pagamento de R$ ${value.toFixed(2)} confirmado para ${serviceName.toLowerCase()}. Aguardando processamento administrativo.`,
      type: 'info',
      category: 'payment',
      service_type: serviceType as any,
      reference_id: referenceId,
      user_id: userId,
      metadata: {
        value,
        service_type: serviceType,
        timestamp: new Date().toISOString()
      }
    });
  };

  // Função utilitária para criar notificação de problema
  const notifyPaymentIssue = async (serviceType: string, userId: string, issue: string, referenceId: string) => {
    if (!isAdmin()) return;

    await createAdminNotification.mutateAsync({
      title: `Problema no Pagamento`,
      message: `Problema identificado: ${issue}`,
      type: 'error',
      category: 'payment',
      service_type: serviceType as any,
      reference_id: referenceId,
      user_id: userId,
      metadata: {
        issue,
        service_type: serviceType,
        timestamp: new Date().toISOString()
      }
    });
  };

  // Função utilitária para obter estatísticas
  const getNotificationStats = () => {
    const total = adminNotifications.length;
    const unread = unreadCount;
    const byType = adminNotifications.reduce((acc, notif) => {
      acc[notif.type] = (acc[notif.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const byCategory = adminNotifications.reduce((acc, notif) => {
      acc[notif.category] = (acc[notif.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total,
      unread,
      byType,
      byCategory,
      pendingRequestsCount: pendingRequests.length
    };
  };

  return {
    // Data
    adminNotifications,
    unreadCount,
    pendingRequests,
    
    // Loading states
    loadingNotifications,
    loadingUnreadCount,
    loadingPendingRequests,
    
    // Actions
    markAsRead,
    markAllAsRead,
    createAdminNotification,
    notifyNewPayment,
    notifyPaymentIssue,
    
    // Utilities
    getNotificationStats,
    refetchNotifications,
    
    // Computed
    hasUnreadNotifications: unreadCount > 0,
    hasPendingRequests: pendingRequests.length > 0
  };
};