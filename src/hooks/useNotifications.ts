
import { useSupabaseQuery, useSupabaseMutation } from '@/hooks/useSupabaseQuery';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Notification {
  id: string;
  user_id: string;
  type: 'info' | 'warning' | 'success' | 'error';
  title: string;
  message: string;
  read: boolean;
  created_at: string;
  action_url?: string;
}

export const useNotifications = () => {
  const { user } = useAuth();

  const { data: notifications = [], isLoading, error, refetch } = useSupabaseQuery(
    ['notifications', user?.id],
    async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Notification[];
    },
    { enabled: !!user }
  );

  const { data: unreadCount = 0 } = useSupabaseQuery(
    ['notifications-unread', user?.id],
    async () => {
      if (!user) return 0;
      
      const { count, error } = await supabase
        .from('notifications')
        .select('id', { count: 'exact' })
        .eq('user_id', user.id)
        .eq('read', false);
      
      if (error) throw error;
      return count || 0;
    },
    { enabled: !!user }
  );

  const markAsRead = useSupabaseMutation(
    async (notificationId: string) => {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);
      
      if (error) throw error;
    },
    {
      onSuccess: () => {
        refetch();
      }
    }
  );

  const markAllAsRead = useSupabaseMutation(
    async () => {
      if (!user) throw new Error('Usuário não autenticado');
      
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false);
      
      if (error) throw error;
    },
    {
      onSuccess: () => {
        refetch();
      }
    }
  );

  const createNotification = useSupabaseMutation(
    async (notificationData: Omit<Notification, 'id' | 'read' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('notifications')
        .insert({
          ...notificationData,
          read: false
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    {
      successMessage: 'Notificação enviada com sucesso!',
      errorMessage: 'Erro ao enviar notificação'
    }
  );

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
    createNotification,
    refetch
  };
};
