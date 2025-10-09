import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// ============================================================================
// TYPES
// ============================================================================

export interface Servico {
  id: string;
  nome: string;
  descricao: string;
  categoria: 'certidao' | 'regularizacao' | 'outros';
  prazo: string;
  valor: number;
  is_active: boolean;
  sort_order: number;
  aceita_pix: boolean;
  aceita_cartao: boolean;
  max_parcelas: number;
  created_at: string;
  updated_at: string;
}

export interface CreateServicoInput {
  nome: string;
  descricao: string;
  categoria: 'certidao' | 'regularizacao' | 'outros';
  prazo: string;
  valor: number;
  aceita_pix?: boolean;
  aceita_cartao?: boolean;
  max_parcelas?: number;
  sort_order?: number;
}

export interface UpdateServicoInput extends Partial<CreateServicoInput> {
  id: string;
  is_active?: boolean;
}

// ============================================================================
// QUERY KEYS
// ============================================================================

const QUERY_KEYS = {
  all: ['servicos'] as const,
  byCategoria: (categoria: string) => ['servicos', 'categoria', categoria] as const,
  byId: (id: string) => ['servicos', 'id', id] as const,
};

// ============================================================================
// HOOK: useServicos
// ============================================================================

export function useServicos() {
  const queryClient = useQueryClient();

  // Query: Buscar todos os serviços
  const { data: servicos = [], isLoading, error } = useQuery({
    queryKey: QUERY_KEYS.all,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('servicos')
        .select('*')
        .order('categoria, sort_order');

      if (error) throw error;
      return data as Servico[];
    },
  });

  // Query: Buscar serviços por categoria
  const buscarPorCategoria = (categoria: 'certidao' | 'regularizacao' | 'outros') => {
    return useQuery({
      queryKey: QUERY_KEYS.byCategoria(categoria),
      queryFn: async () => {
        const { data, error } = await supabase
          .from('servicos')
          .select('*')
          .eq('categoria', categoria)
          .eq('is_active', true)
          .order('sort_order');

        if (error) throw error;
        return data as Servico[];
      },
    });
  };

  // Mutation: Criar serviço
  const criarServico = useMutation({
    mutationFn: async (input: CreateServicoInput) => {
      const { data, error } = await supabase
        .from('servicos')
        .insert({
          nome: input.nome,
          descricao: input.descricao,
          categoria: input.categoria,
          prazo: input.prazo,
          valor: input.valor,
          aceita_pix: input.aceita_pix ?? true,
          aceita_cartao: input.aceita_cartao ?? true,
          max_parcelas: input.max_parcelas ?? 1,
          sort_order: input.sort_order ?? 0,
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;
      return data as Servico;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.byCategoria(data.categoria) });
      toast.success('Serviço criado com sucesso!');
    },
    onError: (error: Error) => {
      console.error('Erro ao criar serviço:', error);
      toast.error('Erro ao criar serviço. Tente novamente.');
    },
  });

  // Mutation: Atualizar serviço
  const atualizarServico = useMutation({
    mutationFn: async (input: UpdateServicoInput) => {
      const { id, ...updateData } = input;
      
      const { data, error } = await supabase
        .from('servicos')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Servico;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.byCategoria(data.categoria) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.byId(data.id) });
      toast.success('Serviço atualizado com sucesso!');
    },
    onError: (error: Error) => {
      console.error('Erro ao atualizar serviço:', error);
      toast.error('Erro ao atualizar serviço. Tente novamente.');
    },
  });

  // Mutation: Desativar serviço (soft delete)
  const desativarServico = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('servicos')
        .update({ is_active: false })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Servico;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.byCategoria(data.categoria) });
      toast.success('Serviço desativado com sucesso!');
    },
    onError: (error: Error) => {
      console.error('Erro ao desativar serviço:', error);
      toast.error('Erro ao desativar serviço. Tente novamente.');
    },
  });

  // Mutation: Ativar serviço
  const ativarServico = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('servicos')
        .update({ is_active: true })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Servico;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.byCategoria(data.categoria) });
      toast.success('Serviço ativado com sucesso!');
    },
    onError: (error: Error) => {
      console.error('Erro ao ativar serviço:', error);
      toast.error('Erro ao ativar serviço. Tente novamente.');
    },
  });

  return {
    // Data
    servicos,
    isLoading,
    error,
    
    // Queries
    buscarPorCategoria,
    
    // Mutations
    criarServico: criarServico.mutate,
    criarServicoAsync: criarServico.mutateAsync,
    isCriando: criarServico.isPending,
    
    atualizarServico: atualizarServico.mutate,
    atualizarServicoAsync: atualizarServico.mutateAsync,
    isAtualizando: atualizarServico.isPending,
    
    desativarServico: desativarServico.mutate,
    desativarServicoAsync: desativarServico.mutateAsync,
    isDesativando: desativarServico.isPending,
    
    ativarServico: ativarServico.mutate,
    ativarServicoAsync: ativarServico.mutateAsync,
    isAtivando: ativarServico.isPending,
  };
}

// ============================================================================
// HOOK: useServico (buscar por ID)
// ============================================================================

export function useServico(id: string | undefined) {
  return useQuery({
    queryKey: QUERY_KEYS.byId(id || ''),
    queryFn: async () => {
      if (!id) throw new Error('ID do serviço não fornecido');
      
      const { data, error } = await supabase
        .from('servicos')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as Servico;
    },
    enabled: !!id,
  });
}

// ============================================================================
// HOOK: useServicosPorCategoria (wrapper conveniente)
// ============================================================================

export function useServicosPorCategoria(categoria: 'certidao' | 'regularizacao' | 'outros') {
  return useQuery({
    queryKey: QUERY_KEYS.byCategoria(categoria),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('servicos')
        .select('*')
        .eq('categoria', categoria)
        .eq('is_active', true)
        .order('sort_order');

      if (error) throw error;
      return data as Servico[];
    },
  });
}
