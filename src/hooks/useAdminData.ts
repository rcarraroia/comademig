
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUserRoles } from './useUserRoles';

export interface AdminProfile {
  id: string;
  nome_completo: string;
  cpf: string;
  telefone: string;
  igreja: string;
  cargo: string;
  status: string;
  tipo_membro: string;
  created_at: string;
}

export interface AdminTicket {
  id: string;
  user_id: string;
  assunto: string;
  descricao: string;
  status: string;
  prioridade: string;
  created_at: string;
  updated_at: string;
  profiles?: {
    nome_completo: string;
  };
}

export const useAdminData = () => {
  const { isAdmin } = useUserRoles();

  // Buscar todos os perfis para admins
  const { data: profiles = [], isLoading: loadingProfiles, refetch: refetchProfiles } = useQuery({
    queryKey: ['admin-profiles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: isAdmin(),
  });

  // Buscar todos os tickets para admins
  const { data: tickets = [], isLoading: loadingTickets, refetch: refetchTickets } = useQuery({
    queryKey: ['admin-tickets'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('suporte')
        .select(`
          *,
          profiles:user_id (nome_completo)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: isAdmin(),
  });

  // Estatísticas gerais
  const { data: stats, isLoading: loadingStats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const [profilesCount, ticketsCount, activeEvents] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('suporte').select('*', { count: 'exact', head: true }),
        supabase.from('eventos').select('*', { count: 'exact', head: true }).eq('status', 'ativo')
      ]);

      return {
        totalUsers: profilesCount.count || 0,
        totalTickets: ticketsCount.count || 0,
        activeEvents: activeEvents.count || 0,
      };
    },
    enabled: isAdmin(),
  });

  return {
    profiles,
    tickets,
    stats,
    isLoading: loadingProfiles || loadingTickets || loadingStats,
    refetchProfiles,
    refetchTickets,
  };
};
