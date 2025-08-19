
import { useSupabaseQuery, useSupabaseMutation } from '@/hooks/useSupabaseQuery';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const usePresencaEventos = () => {
  const { user } = useAuth();

  const { data: minhaPresenca, refetch } = useSupabaseQuery(
    ['presenca', user?.id],
    async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('presenca_eventos')
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
        .order('data_presenca', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    { enabled: !!user }
  );

  const registrarPresenca = useSupabaseMutation(
    async ({ eventoId, tipoPresenca }: { eventoId: string; tipoPresenca: 'entrada' | 'saida' }) => {
      if (!user) throw new Error('Usuário não autenticado');
      
      const { data, error } = await supabase
        .from('presenca_eventos')
        .insert({
          user_id: user.id,
          evento_id: eventoId,
          tipo_presenca: tipoPresenca,
          data_presenca: new Date().toISOString()
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    {
      successMessage: 'Presença registrada com sucesso!',
      errorMessage: 'Erro ao registrar presença',
      onSuccess: () => {
        refetch();
      }
    }
  );

  return {
    minhaPresenca: minhaPresenca || [],
    registrarPresenca,
    refetch
  };
};
