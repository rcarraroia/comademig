import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface SupportCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface SupportTicket {
  id: string;
  user_id: string;
  category_id: string;
  subject: string;
  description: string;
  status: 'open' | 'in_progress' | 'waiting_user' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assigned_to?: string;
  resolved_at?: string;
  closed_at?: string;
  created_at: string;
  updated_at: string;
  // Relacionamentos
  category?: SupportCategory;
  user?: {
    id: string;
    nome_completo: string;
    cargo?: string;
  };
  assigned_user?: {
    id: string;
    nome_completo: string;
  };
  messages?: SupportMessage[];
}

export interface SupportMessage {
  id: string;
  ticket_id: string;
  user_id: string;
  message: string;
  is_staff_reply: boolean;
  is_internal_note: boolean;
  attachments: string[];
  created_at: string;
  // Relacionamentos
  user?: {
    id: string;
    nome_completo: string;
    cargo?: string;
  };
}

// Hook para buscar categorias de suporte
export function useSupportCategories() {
  return useQuery({
    queryKey: ['support-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('support_categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) {
        console.error('Erro ao buscar categorias:', error);
        throw error;
      }

      return data as SupportCategory[];
    },
  });
}

// Hook para buscar tickets do usuário atual
export function useMyTickets() {
  return useQuery({
    queryKey: ['my-tickets'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('support_tickets')
        .select(`
          *,
          category:support_categories(*),
          messages:support_messages(
            *,
            user:profiles(id, nome_completo, cargo)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao buscar tickets:', error);
        throw error;
      }

      return data as SupportTicket[];
    },
  });
}

// Hook para buscar todos os tickets (admin)
export function useAllTickets(filters?: {
  status?: string;
  category_id?: string;
  priority?: string;
  assigned_to?: string;
}) {
  return useQuery({
    queryKey: ['all-tickets', filters],
    queryFn: async () => {
      let query = supabase
        .from('support_tickets')
        .select(`
          *,
          category:support_categories(*),
          user:profiles!support_tickets_user_id_fkey(id, nome_completo, cargo),
          assigned_user:profiles!support_tickets_assigned_to_fkey(id, nome_completo),
          messages:support_messages(count)
        `);

      // Aplicar filtros
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.category_id) {
        query = query.eq('category_id', filters.category_id);
      }
      if (filters?.priority) {
        query = query.eq('priority', filters.priority);
      }
      if (filters?.assigned_to) {
        query = query.eq('assigned_to', filters.assigned_to);
      }

      query = query.order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) {
        console.error('Erro ao buscar todos os tickets:', error);
        throw error;
      }

      return data as SupportTicket[];
    },
  });
}

// Hook para buscar um ticket específico com mensagens
export function useTicket(ticketId: string) {
  return useQuery({
    queryKey: ['ticket', ticketId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('support_tickets')
        .select(`
          *,
          category:support_categories(*),
          user:profiles!support_tickets_user_id_fkey(id, nome_completo, cargo),
          assigned_user:profiles!support_tickets_assigned_to_fkey(id, nome_completo),
          messages:support_messages(
            *,
            user:profiles(id, nome_completo, cargo)
          )
        `)
        .eq('id', ticketId)
        .single();

      if (error) {
        console.error('Erro ao buscar ticket:', error);
        throw error;
      }

      // Ordenar mensagens por data
      if (data.messages) {
        data.messages.sort((a: any, b: any) => 
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
      }

      return data as SupportTicket;
    },
    enabled: !!ticketId,
  });
}

// Hook para criar ticket
export function useCreateTicket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      category_id: string;
      subject: string;
      description: string;
      priority?: 'low' | 'medium' | 'high' | 'urgent';
    }) => {
      const { data: result, error } = await supabase
        .from('support_tickets')
        .insert({
          ...data,
          priority: data.priority || 'medium',
          status: 'open',
        })
        .select()
        .single();

      if (error) {
        console.error('Erro ao criar ticket:', error);
        throw error;
      }

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-tickets'] });
      queryClient.invalidateQueries({ queryKey: ['all-tickets'] });
      toast.success('Ticket criado com sucesso!');
    },
    onError: (error: any) => {
      console.error('Erro na criação do ticket:', error);
      toast.error('Erro ao criar ticket: ' + error.message);
    },
  });
}

// Hook para atualizar ticket
export function useUpdateTicket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      id: string;
      updates: Partial<SupportTicket>;
    }) => {
      const { data: result, error } = await supabase
        .from('support_tickets')
        .update(data.updates)
        .eq('id', data.id)
        .select()
        .single();

      if (error) {
        console.error('Erro ao atualizar ticket:', error);
        throw error;
      }

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-tickets'] });
      queryClient.invalidateQueries({ queryKey: ['all-tickets'] });
      queryClient.invalidateQueries({ queryKey: ['ticket'] });
      toast.success('Ticket atualizado com sucesso!');
    },
    onError: (error: any) => {
      console.error('Erro na atualização do ticket:', error);
      toast.error('Erro ao atualizar ticket: ' + error.message);
    },
  });
}

// Hook para atribuir ticket
export function useAssignTicket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      ticketId: string;
      assignedTo: string | null;
    }) => {
      const updates: any = {
        assigned_to: data.assignedTo,
      };

      // Se está atribuindo, mudar status para in_progress
      if (data.assignedTo) {
        updates.status = 'in_progress';
      }

      const { data: result, error } = await supabase
        .from('support_tickets')
        .update(updates)
        .eq('id', data.ticketId)
        .select()
        .single();

      if (error) {
        console.error('Erro ao atribuir ticket:', error);
        throw error;
      }

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-tickets'] });
      queryClient.invalidateQueries({ queryKey: ['ticket'] });
      toast.success('Ticket atribuído com sucesso!');
    },
    onError: (error: any) => {
      console.error('Erro na atribuição do ticket:', error);
      toast.error('Erro ao atribuir ticket: ' + error.message);
    },
  });
}

// Hook para resolver/fechar ticket
export function useResolveTicket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      ticketId: string;
      status: 'resolved' | 'closed';
    }) => {
      const updates: any = {
        status: data.status,
      };

      if (data.status === 'resolved') {
        updates.resolved_at = new Date().toISOString();
      } else if (data.status === 'closed') {
        updates.closed_at = new Date().toISOString();
      }

      const { data: result, error } = await supabase
        .from('support_tickets')
        .update(updates)
        .eq('id', data.ticketId)
        .select()
        .single();

      if (error) {
        console.error('Erro ao resolver ticket:', error);
        throw error;
      }

      return result;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['all-tickets'] });
      queryClient.invalidateQueries({ queryKey: ['ticket'] });
      queryClient.invalidateQueries({ queryKey: ['my-tickets'] });
      
      const action = result.status === 'resolved' ? 'resolvido' : 'fechado';
      toast.success(`Ticket ${action} com sucesso!`);
    },
    onError: (error: any) => {
      console.error('Erro ao resolver ticket:', error);
      toast.error('Erro ao resolver ticket: ' + error.message);
    },
  });
}