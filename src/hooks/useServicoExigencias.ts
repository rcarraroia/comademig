import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// ============================================================================
// TYPES
// ============================================================================

export interface ServicoExigencia {
  id: string;
  servico_id: string;
  tipo: 'documento' | 'campo_texto' | 'campo_numero' | 'campo_data' | 'selecao' | 'checkbox';
  nome: string;
  descricao: string | null;
  obrigatorio: boolean;
  opcoes: string[] | null;
  ordem: number;
  created_at: string;
  updated_at: string;
}

export interface CreateExigenciaInput {
  servico_id: string;
  tipo: 'documento' | 'campo_texto' | 'campo_numero' | 'campo_data' | 'selecao' | 'checkbox';
  nome: string;
  descricao?: string;
  obrigatorio?: boolean;
  opcoes?: string[];
  ordem?: number;
}

export interface UpdateExigenciaInput extends Partial<CreateExigenciaInput> {
  id: string;
}

// ============================================================================
// QUERY KEYS
// ============================================================================

const QUERY_KEYS = {
  all: ['servico_exigencias'] as const,
  byServico: (servicoId: string) => ['servico_exigencias', 'servico', servicoId] as const,
  byId: (id: string) => ['servico_exigencias', 'id', id] as const,
};

// ============================================================================
// HOOK: useServicoExigencias
// ============================================================================

export function useServicoExigencias(servicoId: string | undefined) {
  const queryClient = useQueryClient();

  // Query: Buscar exigências por servico_id
  const { data: exigencias = [], isLoading, error } = useQuery({
    queryKey: QUERY_KEYS.byServico(servicoId || ''),
    queryFn: async () => {
      if (!servicoId) throw new Error('ID do serviço não fornecido');

      const { data, error } = await supabase
        .from('servico_exigencias')
        .select('*')
        .eq('servico_id', servicoId)
        .order('ordem');

      if (error) throw error;
      return data as ServicoExigencia[];
    },
    enabled: !!servicoId,
  });

  // Mutation: Adicionar exigência
  const adicionarExigencia = useMutation({
    mutationFn: async (input: CreateExigenciaInput) => {
      const { data, error } = await supabase
        .from('servico_exigencias')
        .insert({
          servico_id: input.servico_id,
          tipo: input.tipo,
          nome: input.nome,
          descricao: input.descricao || null,
          obrigatorio: input.obrigatorio ?? true,
          opcoes: input.opcoes || null,
          ordem: input.ordem ?? 0,
        })
        .select()
        .single();

      if (error) throw error;
      return data as ServicoExigencia;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.byServico(data.servico_id) });
      toast.success('Exigência adicionada com sucesso!');
    },
    onError: (error: Error) => {
      console.error('Erro ao adicionar exigência:', error);
      toast.error('Erro ao adicionar exigência. Tente novamente.');
    },
  });

  // Mutation: Atualizar exigência
  const atualizarExigencia = useMutation({
    mutationFn: async (input: UpdateExigenciaInput) => {
      const { id, ...updateData } = input;

      const { data, error } = await supabase
        .from('servico_exigencias')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as ServicoExigencia;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.byServico(data.servico_id) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.byId(data.id) });
      toast.success('Exigência atualizada com sucesso!');
    },
    onError: (error: Error) => {
      console.error('Erro ao atualizar exigência:', error);
      toast.error('Erro ao atualizar exigência. Tente novamente.');
    },
  });

  // Mutation: Remover exigência
  const removerExigencia = useMutation({
    mutationFn: async (id: string) => {
      // Buscar servico_id antes de deletar para invalidar cache
      const { data: exigencia } = await supabase
        .from('servico_exigencias')
        .select('servico_id')
        .eq('id', id)
        .single();

      const { error } = await supabase
        .from('servico_exigencias')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return exigencia?.servico_id;
    },
    onSuccess: (servicoId) => {
      if (servicoId) {
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.byServico(servicoId) });
      }
      toast.success('Exigência removida com sucesso!');
    },
    onError: (error: Error) => {
      console.error('Erro ao remover exigência:', error);
      toast.error('Erro ao remover exigência. Tente novamente.');
    },
  });

  // Mutation: Reordenar exigências
  const reordenarExigencias = useMutation({
    mutationFn: async (exigencias: { id: string; ordem: number }[]) => {
      const updates = exigencias.map((exig) =>
        supabase
          .from('servico_exigencias')
          .update({ ordem: exig.ordem })
          .eq('id', exig.id)
      );

      const results = await Promise.all(updates);
      const errors = results.filter((r) => r.error);

      if (errors.length > 0) {
        throw new Error('Erro ao reordenar exigências');
      }

      return true;
    },
    onSuccess: (_, variables) => {
      // Invalidar cache do serviço (pegar servico_id da primeira exigência)
      if (servicoId) {
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.byServico(servicoId) });
      }
      toast.success('Ordem atualizada com sucesso!');
    },
    onError: (error: Error) => {
      console.error('Erro ao reordenar exigências:', error);
      toast.error('Erro ao reordenar exigências. Tente novamente.');
    },
  });

  return {
    // Data
    exigencias,
    isLoading,
    error,

    // Mutations
    adicionarExigencia: adicionarExigencia.mutate,
    adicionarExigenciaAsync: adicionarExigencia.mutateAsync,
    isAdicionando: adicionarExigencia.isPending,

    atualizarExigencia: atualizarExigencia.mutate,
    atualizarExigenciaAsync: atualizarExigencia.mutateAsync,
    isAtualizando: atualizarExigencia.isPending,

    removerExigencia: removerExigencia.mutate,
    removerExigenciaAsync: removerExigencia.mutateAsync,
    isRemovendo: removerExigencia.isPending,

    reordenarExigencias: reordenarExigencias.mutate,
    reordenarExigenciasAsync: reordenarExigencias.mutateAsync,
    isReordenando: reordenarExigencias.isPending,
  };
}

// ============================================================================
// HOOK: useExigencia (buscar por ID)
// ============================================================================

export function useExigencia(id: string | undefined) {
  return useQuery({
    queryKey: QUERY_KEYS.byId(id || ''),
    queryFn: async () => {
      if (!id) throw new Error('ID da exigência não fornecido');

      const { data, error } = await supabase
        .from('servico_exigencias')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as ServicoExigencia;
    },
    enabled: !!id,
  });
}

// ============================================================================
// HELPER: Validar dados da exigência
// ============================================================================

export function validarDadosExigencia(
  exigencia: ServicoExigencia,
  valor: any
): { valido: boolean; erro?: string } {
  // Se não é obrigatório e está vazio, é válido
  if (!exigencia.obrigatorio && !valor) {
    return { valido: true };
  }

  // Se é obrigatório e está vazio, é inválido
  if (exigencia.obrigatorio && !valor) {
    return { valido: false, erro: `${exigencia.nome} é obrigatório` };
  }

  // Validações específicas por tipo
  switch (exigencia.tipo) {
    case 'campo_numero':
      if (isNaN(Number(valor))) {
        return { valido: false, erro: `${exigencia.nome} deve ser um número` };
      }
      break;

    case 'campo_data':
      if (isNaN(Date.parse(valor))) {
        return { valido: false, erro: `${exigencia.nome} deve ser uma data válida` };
      }
      break;

    case 'selecao':
      if (exigencia.opcoes && !exigencia.opcoes.includes(valor)) {
        return { valido: false, erro: `${exigencia.nome} deve ser uma das opções válidas` };
      }
      break;

    case 'documento':
      // Validar se é um arquivo ou URL
      if (typeof valor !== 'string' || valor.length === 0) {
        return { valido: false, erro: `${exigencia.nome} deve ser um arquivo válido` };
      }
      break;
  }

  return { valido: true };
}
