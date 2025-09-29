import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { z } from 'zod';
import { toast } from 'sonner';

// Zod schema for validation
const MemberTypeSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, 'Nome é obrigatório').max(255, 'Nome muito longo'),
  description: z.string().optional(),
  order_of_exhibition: z.number().int().min(0, 'Ordem deve ser positiva').optional(),
  is_active: z.boolean().default(true),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
  created_by: z.string().uuid().optional(),
});

export type MemberType = z.infer<typeof MemberTypeSchema>;

export type CreateMemberTypeData = Omit<MemberType, 'id' | 'created_at' | 'updated_at'>;
export type UpdateMemberTypeData = Partial<CreateMemberTypeData> & { id: string };

// Query keys for cache management
const QUERY_KEYS = {
  memberTypes: ['member-types'] as const,
  memberType: (id: string) => ['member-types', id] as const,
} as const;

/**
 * Hook para buscar todos os tipos de membro
 */
export function useMemberTypes(options?: { includeInactive?: boolean }) {
  return useQuery({
    queryKey: [...QUERY_KEYS.memberTypes, { includeInactive: options?.includeInactive }],
    queryFn: async () => {
      let query = supabase
        .from('member_types')
        .select('*')
        .order('order_of_exhibition', { ascending: true });

      if (!options?.includeInactive) {
        query = query.eq('is_active', true);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Erro ao buscar tipos de membro:', error);
        throw new Error(`Erro ao carregar tipos de membro: ${error.message}`);
      }

      // Validar dados retornados
      try {
        return data.map(item => MemberTypeSchema.parse(item));
      } catch (validationError) {
        console.error('Erro de validação nos dados:', validationError);
        // Fallback: retornar dados sem validação em caso de erro
        return data as MemberType[];
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
  });
}

/**
 * Hook para buscar um tipo de membro específico
 */
export function useMemberType(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.memberType(id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('member_types')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          throw new Error('Tipo de membro não encontrado');
        }
        throw new Error(`Erro ao carregar tipo de membro: ${error.message}`);
      }

      return MemberTypeSchema.parse(data);
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook para criar um novo tipo de membro
 */
export function useCreateMemberType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateMemberTypeData) => {
      // Validar dados de entrada
      const validatedData = MemberTypeSchema.omit({ 
        id: true, 
        created_at: true, 
        updated_at: true 
      }).parse(data);

      const { data: result, error } = await supabase
        .from('member_types')
        .insert([validatedData])
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          throw new Error('Já existe um tipo de membro com este nome');
        }
        throw new Error(`Erro ao criar tipo de membro: ${error.message}`);
      }

      return MemberTypeSchema.parse(result);
    },
    onSuccess: (data) => {
      // Invalidar cache para recarregar listas
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.memberTypes });
      
      // Adicionar ao cache individual
      queryClient.setQueryData(QUERY_KEYS.memberType(data.id!), data);
      
      toast.success('Tipo de membro criado com sucesso!');
    },
    onError: (error: Error) => {
      console.error('Erro ao criar tipo de membro:', error);
      toast.error(error.message);
    },
  });
}

/**
 * Hook para atualizar um tipo de membro
 */
export function useUpdateMemberType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateMemberTypeData) => {
      const { id, ...updateData } = data;
      
      // Validar dados de entrada
      const validatedData = MemberTypeSchema.omit({ 
        id: true, 
        created_at: true, 
        updated_at: true 
      }).partial().parse(updateData);

      const { data: result, error } = await supabase
        .from('member_types')
        .update(validatedData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          throw new Error('Já existe um tipo de membro com este nome');
        }
        if (error.code === 'PGRST116') {
          throw new Error('Tipo de membro não encontrado');
        }
        throw new Error(`Erro ao atualizar tipo de membro: ${error.message}`);
      }

      return MemberTypeSchema.parse(result);
    },
    onSuccess: (data) => {
      // Invalidar cache para recarregar listas
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.memberTypes });
      
      // Atualizar cache individual
      queryClient.setQueryData(QUERY_KEYS.memberType(data.id!), data);
      
      toast.success('Tipo de membro atualizado com sucesso!');
    },
    onError: (error: Error) => {
      console.error('Erro ao atualizar tipo de membro:', error);
      toast.error(error.message);
    },
  });
}

/**
 * Hook para deletar um tipo de membro
 */
export function useDeleteMemberType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('member_types')
        .delete()
        .eq('id', id);

      if (error) {
        if (error.code === '23503') {
          throw new Error('Não é possível excluir este tipo de membro pois ele está sendo usado');
        }
        if (error.code === 'PGRST116') {
          throw new Error('Tipo de membro não encontrado');
        }
        throw new Error(`Erro ao excluir tipo de membro: ${error.message}`);
      }

      return id;
    },
    onSuccess: (deletedId) => {
      // Invalidar cache para recarregar listas
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.memberTypes });
      
      // Remover do cache individual
      queryClient.removeQueries({ queryKey: QUERY_KEYS.memberType(deletedId) });
      
      toast.success('Tipo de membro excluído com sucesso!');
    },
    onError: (error: Error) => {
      console.error('Erro ao excluir tipo de membro:', error);
      toast.error(error.message);
    },
  });
}

/**
 * Hook para desativar/ativar um tipo de membro (soft delete)
 */
export function useToggleMemberTypeStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { data: result, error } = await supabase
        .from('member_types')
        .update({ is_active })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          throw new Error('Tipo de membro não encontrado');
        }
        throw new Error(`Erro ao alterar status: ${error.message}`);
      }

      return MemberTypeSchema.parse(result);
    },
    onSuccess: (data) => {
      // Invalidar cache para recarregar listas
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.memberTypes });
      
      // Atualizar cache individual
      queryClient.setQueryData(QUERY_KEYS.memberType(data.id!), data);
      
      const action = data.is_active ? 'ativado' : 'desativado';
      toast.success(`Tipo de membro ${action} com sucesso!`);
    },
    onError: (error: Error) => {
      console.error('Erro ao alterar status:', error);
      toast.error(error.message);
    },
  });
}