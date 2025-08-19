
import { useSupabaseQuery, useSupabaseMutation } from '@/hooks/useSupabaseQuery';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const useEventos = () => {
  const { user } = useAuth();

  const { data: eventos, isLoading, error, refetch } = useSupabaseQuery(
    ['eventos'],
    async () => {
      const { data, error } = await supabase
        .from('eventos')
        .select('*')
        .eq('status', 'ativo')
        .order('data_inicio', { ascending: true });
      
      if (error) throw error;
      return data;
    }
  );

  const { data: minhasInscricoes } = useSupabaseQuery(
    ['inscricoes', user?.id],
    async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('inscricoes_eventos')
        .select(`
          *,
          eventos (
            titulo,
            data_inicio,
            data_fim,
            local
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    { enabled: !!user }
  );

  const inscreverEvento = useSupabaseMutation(
    async ({ eventoId, valor }: { eventoId: string; valor?: number }) => {
      if (!user) throw new Error('Usuário não autenticado');
      
      const { data, error } = await supabase
        .from('inscricoes_eventos')
        .insert({
          user_id: user.id,
          evento_id: eventoId,
          valor_pago: valor || 0,
          status: valor && valor > 0 ? 'pendente' : 'confirmado'
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    {
      successMessage: 'Inscrição realizada com sucesso!',
      errorMessage: 'Erro ao realizar inscrição',
      onSuccess: () => {
        refetch();
      }
    }
  );

  const cancelarInscricao = useSupabaseMutation(
    async (inscricaoId: string) => {
      const { error } = await supabase
        .from('inscricoes_eventos')
        .delete()
        .eq('id', inscricaoId);
      
      if (error) throw error;
    },
    {
      successMessage: 'Inscrição cancelada com sucesso!',
      errorMessage: 'Erro ao cancelar inscrição'
    }
  );

  return {
    eventos,
    minhasInscricoes,
    isLoading,
    error,
    inscreverEvento,
    cancelarInscricao,
    refetch
  };
};
