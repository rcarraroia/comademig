
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useSupabaseMutation } from './useSupabaseQuery';
import { useToast } from '@/hooks/use-toast';

interface SuporteTicket {
  id: string;
  user_id: string;
  assunto: string;
  descricao: string;
  status: string;
  prioridade: string;
  created_at: string;
  updated_at: string;
}

interface SuporteMensagem {
  id: string;
  suporte_id: string;
  user_id: string;
  mensagem: string;
  created_at: string;
}

interface UseSuporteTicketsReturn {
  tickets: SuporteTicket[];
  isLoading: boolean;
  criarTicket: any;
  getMensagens: (ticketId: string) => Promise<SuporteMensagem[]>;
  enviarMensagem: any;
  refetch: () => void;
}

export const useSuporteTickets = (): UseSuporteTicketsReturn => {
  const { user } = useAuth();

  const { data: tickets = [], isLoading, refetch } = useQuery({
    queryKey: ['suporte-tickets', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('suporte')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  const criarTicket = useSupabaseMutation(
    async (ticket: { assunto: string; descricao: string; prioridade: string }) => {
      if (!user) throw new Error('Usuário não autenticado');
      
      const { data, error } = await supabase
        .from('suporte')
        .insert({
          user_id: user.id,
          ...ticket,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    {
      successMessage: 'Ticket criado com sucesso!',
      onSuccess: () => refetch(),
    }
  );

  const getMensagens = async (ticketId: string): Promise<SuporteMensagem[]> => {
    const { data, error } = await supabase
      .from('suporte_mensagens')
      .select('*')
      .eq('suporte_id', ticketId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  };

  const enviarMensagem = useSupabaseMutation(
    async ({ ticketId, mensagem }: { ticketId: string; mensagem: string }) => {
      if (!user) throw new Error('Usuário não autenticado');
      
      const { data, error } = await supabase
        .from('suporte_mensagens')
        .insert({
          suporte_id: ticketId,
          user_id: user.id,
          mensagem,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    {
      successMessage: 'Mensagem enviada com sucesso!',
    }
  );

  return {
    tickets,
    isLoading,
    criarTicket,
    getMensagens,
    enviarMensagem,
    refetch,
  };
};
