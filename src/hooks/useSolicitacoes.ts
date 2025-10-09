import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// ============================================================================
// TYPES
// ============================================================================

export interface Solicitacao {
  id: string;
  protocolo: string;
  user_id: string;
  servico_id: string;
  dados_enviados: Record<string, any>;
  observacoes_admin: string | null;
  arquivo_entrega: string | null;
  status: 'pago' | 'em_analise' | 'aprovada' | 'rejeitada' | 'entregue' | 'cancelada';
  payment_reference: string | null;
  valor_pago: number;
  forma_pagamento: 'pix' | 'cartao' | 'boleto' | null;
  created_at: string;
  updated_at: string;
  data_pagamento: string | null;
  data_analise: string | null;
  data_conclusao: string | null;
}

export interface SolicitacaoComServico extends Solicitacao {
  servico: {
    nome: string;
    categoria: string;
  };
}

export interface SolicitacaoComUsuario extends Solicitacao {
  usuario: {
    nome_completo: string;
    email: string;
  };
}

export interface AtualizarStatusInput {
  id: string;
  status: Solicitacao['status'];
  observacoes?: string;
}

// ============================================================================
// QUERY KEYS
// ============================================================================

const QUERY_KEYS = {
  all: ['solicitacoes'] as const,
  minhas: (userId: string) => ['solicitacoes', 'user', userId] as const,
  admin: (filters?: AdminFilters) => ['solicitacoes', 'admin', filters] as const,
  byId: (id: string) => ['solicitacoes', 'id', id] as const,
};

export interface AdminFilters {
  status?: string;
  categoria?: string;
  dataInicio?: string;
  dataFim?: string;
}

// ============================================================================
// HOOK: useSolicitacoes (para usuário comum)
// ============================================================================

export function useSolicitacoes(userId: string | undefined) {
  const queryClient = useQueryClient();

  // Query: Minhas solicitações
  const { data: solicitacoes = [], isLoading, error } = useQuery({
    queryKey: QUERY_KEYS.minhas(userId || ''),
    queryFn: async () => {
      if (!userId) throw new Error('ID do usuário não fornecido');

      const { data, error } = await supabase
        .from('solicitacoes_servicos')
        .select(`
          *,
          servico:servicos(nome, categoria)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as unknown as SolicitacaoComServico[];
    },
    enabled: !!userId,
  });

  return {
    solicitacoes,
    isLoading,
    error,
  };
}

// ============================================================================
// HOOK: useSolicitacoesAdmin (para administradores)
// ============================================================================

export function useSolicitacoesAdmin(filters?: AdminFilters) {
  const queryClient = useQueryClient();

  // Query: Todas as solicitações (admin)
  const { data: solicitacoes = [], isLoading, error } = useQuery({
    queryKey: QUERY_KEYS.admin(filters),
    queryFn: async () => {
      let query = supabase
        .from('solicitacoes_servicos')
        .select(`
          *,
          servico:servicos(nome, categoria),
          usuario:profiles(nome_completo)
        `)
        .order('created_at', { ascending: false });

      // Aplicar filtros
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      if (filters?.categoria) {
        query = query.eq('servicos.categoria', filters.categoria);
      }

      if (filters?.dataInicio) {
        query = query.gte('created_at', filters.dataInicio);
      }

      if (filters?.dataFim) {
        query = query.lte('created_at', filters.dataFim);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as unknown as (Solicitacao & {
        servico: { nome: string; categoria: string };
        usuario: { nome_completo: string };
      })[];
    },
  });

  // Mutation: Atualizar status
  const atualizarStatus = useMutation({
    mutationFn: async (input: AtualizarStatusInput) => {
      const updateData: any = {
        status: input.status,
      };

      if (input.observacoes) {
        updateData.observacoes_admin = input.observacoes;
      }

      const { data, error } = await supabase
        .from('solicitacoes_servicos')
        .update(updateData)
        .eq('id', input.id)
        .select()
        .single();

      if (error) throw error;
      return data as Solicitacao;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.admin() });
      toast.success('Status atualizado com sucesso!');
    },
    onError: (error: Error) => {
      console.error('Erro ao atualizar status:', error);
      toast.error('Erro ao atualizar status. Tente novamente.');
    },
  });

  // Mutation: Adicionar observação
  const adicionarObservacao = useMutation({
    mutationFn: async ({ id, observacao }: { id: string; observacao: string }) => {
      const { data, error } = await supabase
        .from('solicitacoes_servicos')
        .update({ observacoes_admin: observacao })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Solicitacao;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.admin() });
      toast.success('Observação adicionada com sucesso!');
    },
    onError: (error: Error) => {
      console.error('Erro ao adicionar observação:', error);
      toast.error('Erro ao adicionar observação. Tente novamente.');
    },
  });

  // Mutation: Anexar arquivo de entrega
  const anexarArquivo = useMutation({
    mutationFn: async ({ id, arquivoUrl }: { id: string; arquivoUrl: string }) => {
      const { data, error } = await supabase
        .from('solicitacoes_servicos')
        .update({ arquivo_entrega: arquivoUrl })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Solicitacao;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.admin() });
      toast.success('Arquivo anexado com sucesso!');
    },
    onError: (error: Error) => {
      console.error('Erro ao anexar arquivo:', error);
      toast.error('Erro ao anexar arquivo. Tente novamente.');
    },
  });

  return {
    // Data
    solicitacoes,
    isLoading,
    error,

    // Mutations
    atualizarStatus: atualizarStatus.mutate,
    atualizarStatusAsync: atualizarStatus.mutateAsync,
    isAtualizandoStatus: atualizarStatus.isPending,

    adicionarObservacao: adicionarObservacao.mutate,
    adicionarObservacaoAsync: adicionarObservacao.mutateAsync,
    isAdicionandoObservacao: adicionarObservacao.isPending,

    anexarArquivo: anexarArquivo.mutate,
    anexarArquivoAsync: anexarArquivo.mutateAsync,
    isAnexandoArquivo: anexarArquivo.isPending,
  };
}

// ============================================================================
// HOOK: useSolicitacao (buscar por ID)
// ============================================================================

export function useSolicitacao(id: string | undefined) {
  return useQuery({
    queryKey: QUERY_KEYS.byId(id || ''),
    queryFn: async () => {
      if (!id) throw new Error('ID da solicitação não fornecido');

      const { data, error } = await supabase
        .from('solicitacoes_servicos')
        .select(`
          *,
          servico:servicos(*),
          usuario:profiles(*)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as unknown as Solicitacao & {
        servico: any;
        usuario: any;
      };
    },
    enabled: !!id,
  });
}

// ============================================================================
// HELPER: Obter cor do status
// ============================================================================

export function getStatusColor(status: Solicitacao['status']): string {
  const colors: Record<Solicitacao['status'], string> = {
    pago: 'bg-blue-100 text-blue-800',
    em_analise: 'bg-yellow-100 text-yellow-800',
    aprovada: 'bg-green-100 text-green-800',
    rejeitada: 'bg-red-100 text-red-800',
    entregue: 'bg-purple-100 text-purple-800',
    cancelada: 'bg-gray-100 text-gray-800',
  };

  return colors[status] || 'bg-gray-100 text-gray-800';
}

// ============================================================================
// HELPER: Obter label do status
// ============================================================================

export function getStatusLabel(status: Solicitacao['status']): string {
  const labels: Record<Solicitacao['status'], string> = {
    pago: 'Pago',
    em_analise: 'Em Análise',
    aprovada: 'Aprovada',
    rejeitada: 'Rejeitada',
    entregue: 'Entregue',
    cancelada: 'Cancelada',
  };

  return labels[status] || status;
}

// ============================================================================
// HELPER: Verificar se pode atualizar status
// ============================================================================

export function podeAtualizarStatus(
  statusAtual: Solicitacao['status'],
  novoStatus: Solicitacao['status']
): boolean {
  // Fluxo válido de status
  const fluxosValidos: Record<Solicitacao['status'], Solicitacao['status'][]> = {
    pago: ['em_analise', 'cancelada'],
    em_analise: ['aprovada', 'rejeitada', 'cancelada'],
    aprovada: ['entregue', 'cancelada'],
    rejeitada: ['em_analise'], // Pode reabrir
    entregue: [], // Status final
    cancelada: [], // Status final
  };

  return fluxosValidos[statusAtual]?.includes(novoStatus) || false;
}
