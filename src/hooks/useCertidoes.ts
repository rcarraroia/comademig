
import { useSupabaseQuery, useSupabaseMutation } from '@/hooks/useSupabaseQuery';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface SolicitacaoCertidao {
  id: string;
  user_id: string;
  tipo_certidao: string;
  justificativa: string;
  status: 'pendente' | 'em_analise' | 'aprovada' | 'rejeitada' | 'entregue';
  observacoes_admin?: string;
  numero_protocolo: string;
  data_solicitacao: string;
  data_aprovacao?: string;
  data_entrega?: string;
  arquivo_pdf?: string;
  created_at: string;
  updated_at: string;
  profiles?: {
    nome_completo: string;
    cpf: string;
    cargo: string;
    igreja: string;
  } | null;
}

export const useCertidoes = () => {
  const { user } = useAuth();

  const { data: minhasSolicitacoes, isLoading, refetch } = useSupabaseQuery(
    ['certidoes', user?.id],
    async (): Promise<SolicitacaoCertidao[]> => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('solicitacoes_certidoes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return (data || []) as SolicitacaoCertidao[];
    },
    { enabled: !!user }
  );

  const { data: todasSolicitacoes } = useSupabaseQuery(
    ['certidoes-admin'],
    async (): Promise<SolicitacaoCertidao[]> => {
      const { data, error } = await supabase
        .from('solicitacoes_certidoes')
        .select(`
          *,
          profiles (
            nome_completo,
            cpf,
            cargo,
            igreja
          )
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Transform the data to handle the profiles relation properly
      const transformedData = (data || []).map(item => ({
        ...item,
        profiles: Array.isArray(item.profiles) ? item.profiles[0] : item.profiles
      }));
      
      return transformedData as SolicitacaoCertidao[];
    },
    { enabled: !!user }
  );

  const solicitarCertidao = useSupabaseMutation(
    async ({ tipo, justificativa }: { tipo: string; justificativa: string }) => {
      if (!user) throw new Error('Usuário não autenticado');
      
      const numeroProtocolo = `CERT-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
      
      const { data, error } = await supabase
        .from('solicitacoes_certidoes')
        .insert({
          user_id: user.id,
          tipo_certidao: tipo,
          justificativa,
          numero_protocolo: numeroProtocolo,
          status: 'pendente'
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    {
      successMessage: 'Solicitação enviada com sucesso!',
      errorMessage: 'Erro ao enviar solicitação',
      onSuccess: () => {
        refetch();
      }
    }
  );

  const atualizarStatusCertidao = useSupabaseMutation(
    async ({ 
      id, 
      status, 
      observacoes, 
      arquivoPdf 
    }: { 
      id: string; 
      status: string; 
      observacoes?: string; 
      arquivoPdf?: string; 
    }) => {
      const updateData: any = {
        status,
        updated_at: new Date().toISOString()
      };

      if (observacoes) {
        updateData.observacoes_admin = observacoes;
      }

      if (arquivoPdf) {
        updateData.arquivo_pdf = arquivoPdf;
      }

      if (status === 'aprovada') {
        updateData.data_aprovacao = new Date().toISOString();
      }

      if (status === 'entregue') {
        updateData.data_entrega = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('solicitacoes_certidoes')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    {
      successMessage: 'Status atualizado com sucesso!',
      errorMessage: 'Erro ao atualizar status',
      onSuccess: () => {
        refetch();
      }
    }
  );

  return {
    minhasSolicitacoes: (minhasSolicitacoes || []) as SolicitacaoCertidao[],
    todasSolicitacoes: (todasSolicitacoes || []) as SolicitacaoCertidao[],
    isLoading,
    solicitarCertidao,
    atualizarStatusCertidao,
    refetch
  };
};
