
import { useSupabaseQuery, useSupabaseMutation } from '@/hooks/useSupabaseQuery';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const useMensagens = () => {
  const { user } = useAuth();

  const { data: mensagens, isLoading, error, refetch } = useSupabaseQuery(
    ['mensagens', user?.id],
    async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('mensagens')
        .select(`
          *,
          remetente:profiles!mensagens_remetente_id_fkey (
            nome_completo,
            cargo,
            igreja
          ),
          destinatario:profiles!mensagens_destinatario_id_fkey (
            nome_completo,
            cargo,
            igreja
          )
        `)
        .or(`remetente_id.eq.${user.id},destinatario_id.eq.${user.id}`)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    { enabled: !!user }
  );

  const { data: mensagensNaoLidas } = useSupabaseQuery(
    ['mensagens-nao-lidas', user?.id],
    async () => {
      if (!user) return 0;
      
      const { count, error } = await supabase
        .from('mensagens')
        .select('id', { count: 'exact' })
        .eq('destinatario_id', user.id)
        .eq('lida', false);
      
      if (error) throw error;
      return count || 0;
    },
    { enabled: !!user }
  );

  const enviarMensagem = useSupabaseMutation(
    async ({ destinatarioId, assunto, conteudo }: {
      destinatarioId: string;
      assunto: string;
      conteudo: string;
    }) => {
      if (!user) throw new Error('Usuário não autenticado');
      
      const { data, error } = await supabase
        .from('mensagens')
        .insert({
          remetente_id: user.id,
          destinatario_id: destinatarioId,
          assunto,
          conteudo
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    {
      successMessage: 'Mensagem enviada com sucesso!',
      errorMessage: 'Erro ao enviar mensagem',
      onSuccess: () => {
        refetch();
      }
    }
  );

  const marcarComoLida = useSupabaseMutation(
    async (mensagemId: string) => {
      const { error } = await supabase
        .from('mensagens')
        .update({ lida: true })
        .eq('id', mensagemId)
        .eq('destinatario_id', user?.id);
      
      if (error) throw error;
    },
    {
      onSuccess: () => {
        refetch();
      }
    }
  );

  return {
    mensagens,
    mensagensNaoLidas,
    isLoading,
    error,
    enviarMensagem,
    marcarComoLida,
    refetch
  };
};
