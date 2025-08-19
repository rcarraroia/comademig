
import { useSupabaseQuery, useSupabaseMutation } from '@/hooks/useSupabaseQuery';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface SuporteTicket {
  id: string;
  user_id: string;
  assunto: string;
  descricao: string;
  status: 'aberto' | 'em_andamento' | 'resolvido' | 'fechado';
  prioridade: 'baixa' | 'normal' | 'alta' | 'urgente';
  created_at: string;
  updated_at: string;
}

export interface SuporteMensagem {
  id: string;
  suporte_id: string;
  user_id: string;
  mensagem: string;
  created_at: string;
}

export const useSuporteTickets = () => {
  const { user } = useAuth();

  const { data: tickets, isLoading, refetch } = useSupabaseQuery(
    ['suporte-tickets', user?.id],
    async (): Promise<SuporteTicket[]> => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('suporte')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return (data || []) as SuporteTicket[];
    },
    { enabled: !!user }
  );

  const getMensagens = async (ticketId: string): Promise<SuporteMensagem[]> => {
    const { data, error } = await supabase
      .from('suporte_mensagens')
      .select('*')
      .eq('suporte_id', ticketId)
      .order('created_at', { ascending: true });
    
    if (error) throw error;
    return (data || []) as SuporteMensagem[];
  };

  const criarTicket = useSupabaseMutation(
    async ({ assunto, descricao, prioridade }: {
      assunto: string;
      descricao: string;
      prioridade: string;
    }) => {
      if (!user) throw new Error('Usuário não autenticado');
      
      const { data, error } = await supabase
        .from('suporte')
        .insert({
          user_id: user.id,
          assunto,
          descricao,
          prioridade,
          status: 'aberto'
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    {
      successMessage: 'Ticket criado com sucesso!',
      errorMessage: 'Erro ao criar ticket',
      onSuccess: () => {
        refetch();
      }
    }
  );

  const enviarMensagem = useSupabaseMutation(
    async ({ ticketId, mensagem }: {
      ticketId: string;
      mensagem: string;
    }) => {
      if (!user) throw new Error('Usuário não autenticado');
      
      const { data, error } = await supabase
        .from('suporte_mensagens')
        .insert({
          suporte_id: ticketId,
          user_id: user.id,
          mensagem
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    {
      successMessage: 'Mensagem enviada com sucesso!',
      errorMessage: 'Erro ao enviar mensagem'
    }
  );

  return {
    tickets: tickets || [],
    isLoading,
    criarTicket,
    getMensagens,
    enviarMensagem,
    refetch
  };
};
