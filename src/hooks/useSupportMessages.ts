import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useEffect } from 'react';
import type { SupportMessage } from './useSupport';

// Hook para buscar mensagens de um ticket
export function useTicketMessages(ticketId: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['ticket-messages', ticketId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('support_messages')
        .select(`
          *,
          user:profiles(id, nome_completo, cargo)
        `)
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Erro ao buscar mensagens:', error);
        throw error;
      }

      return data as SupportMessage[];
    },
    enabled: !!ticketId,
  });

  // Configurar real-time subscription para mensagens
  useEffect(() => {
    if (!ticketId) return;

    const channel = supabase
      .channel(`ticket-messages-${ticketId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'support_messages',
          filter: `ticket_id=eq.${ticketId}`,
        },
        (payload) => {
          console.log('Nova mensagem recebida:', payload);
          
          // Invalidar e refetch das mensagens
          queryClient.invalidateQueries({ 
            queryKey: ['ticket-messages', ticketId] 
          });
          
          // Também invalidar o ticket para atualizar contadores
          queryClient.invalidateQueries({ 
            queryKey: ['ticket', ticketId] 
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [ticketId, queryClient]);

  return query;
}

// Hook para criar mensagem
export function useCreateMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      ticket_id: string;
      message: string;
      is_staff_reply?: boolean;
      is_internal_note?: boolean;
      attachments?: string[];
    }) => {
      const { data: result, error } = await supabase
        .from('support_messages')
        .insert({
          ...data,
          is_staff_reply: data.is_staff_reply || false,
          is_internal_note: data.is_internal_note || false,
          attachments: data.attachments || [],
        })
        .select(`
          *,
          user:profiles(id, nome_completo, cargo)
        `)
        .single();

      if (error) {
        console.error('Erro ao criar mensagem:', error);
        throw error;
      }

      return result;
    },
    onSuccess: (result) => {
      // Invalidar mensagens do ticket
      queryClient.invalidateQueries({ 
        queryKey: ['ticket-messages', result.ticket_id] 
      });
      
      // Invalidar ticket para atualizar status
      queryClient.invalidateQueries({ 
        queryKey: ['ticket', result.ticket_id] 
      });
      
      // Invalidar listas de tickets
      queryClient.invalidateQueries({ queryKey: ['my-tickets'] });
      queryClient.invalidateQueries({ queryKey: ['all-tickets'] });

      toast.success('Mensagem enviada com sucesso!');
    },
    onError: (error: any) => {
      console.error('Erro ao enviar mensagem:', error);
      toast.error('Erro ao enviar mensagem: ' + error.message);
    },
  });
}

// Hook para marcar mensagens como lidas (futuro)
export function useMarkMessagesAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      ticket_id: string;
      message_ids: string[];
    }) => {
      // Por enquanto, apenas simular
      // No futuro, podemos adicionar uma tabela de leitura de mensagens
      return { success: true };
    },
    onSuccess: () => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['ticket-messages'] });
    },
  });
}

// Hook para buscar estatísticas de mensagens
export function useMessageStats(ticketId: string) {
  return useQuery({
    queryKey: ['message-stats', ticketId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('support_messages')
        .select('is_staff_reply, created_at')
        .eq('ticket_id', ticketId);

      if (error) {
        console.error('Erro ao buscar estatísticas:', error);
        throw error;
      }

      const stats = {
        total: data.length,
        user_messages: data.filter(m => !m.is_staff_reply).length,
        staff_messages: data.filter(m => m.is_staff_reply).length,
        last_message_at: data.length > 0 
          ? new Date(Math.max(...data.map(m => new Date(m.created_at).getTime())))
          : null,
      };

      return stats;
    },
    enabled: !!ticketId,
  });
}

// Hook para configurar notificações real-time globais
export function useSupportNotifications() {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Subscription para novos tickets (para admins)
    const ticketsChannel = supabase
      .channel('new-tickets')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'support_tickets',
        },
        (payload) => {
          console.log('Novo ticket criado:', payload);
          
          // Invalidar lista de tickets
          queryClient.invalidateQueries({ queryKey: ['all-tickets'] });
          
          // Mostrar notificação para admins
          // TODO: Verificar se o usuário é admin antes de mostrar
          toast.info('Novo ticket de suporte criado!');
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ticketsChannel);
    };
  }, [queryClient]);
}

// Utilitários para formatação
export const formatMessageTime = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

  if (diffInHours < 1) {
    const diffInMinutes = Math.floor(diffInHours * 60);
    return `${diffInMinutes} min atrás`;
  } else if (diffInHours < 24) {
    return `${Math.floor(diffInHours)}h atrás`;
  } else {
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
};

export const getStatusColor = (status: string) => {
  switch (status) {
    case 'open':
      return 'bg-blue-100 text-blue-800';
    case 'in_progress':
      return 'bg-yellow-100 text-yellow-800';
    case 'waiting_user':
      return 'bg-orange-100 text-orange-800';
    case 'resolved':
      return 'bg-green-100 text-green-800';
    case 'closed':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export const getStatusLabel = (status: string) => {
  switch (status) {
    case 'open':
      return 'Aberto';
    case 'in_progress':
      return 'Em Andamento';
    case 'waiting_user':
      return 'Aguardando Usuário';
    case 'resolved':
      return 'Resolvido';
    case 'closed':
      return 'Fechado';
    default:
      return status;
  }
};

export const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'low':
      return 'bg-gray-100 text-gray-800';
    case 'medium':
      return 'bg-blue-100 text-blue-800';
    case 'high':
      return 'bg-orange-100 text-orange-800';
    case 'urgent':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export const getPriorityLabel = (priority: string) => {
  switch (priority) {
    case 'low':
      return 'Baixa';
    case 'medium':
      return 'Média';
    case 'high':
      return 'Alta';
    case 'urgent':
      return 'Urgente';
    default:
      return priority;
  }
};