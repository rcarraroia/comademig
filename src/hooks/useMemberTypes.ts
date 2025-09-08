import { useSupabaseQuery, useSupabaseMutation } from './useSupabaseQuery';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';
import { z } from 'zod';

// Schema de validação
const memberTypeSchema = z.object({
  name: z.string()
    .min(2, "Nome deve ter pelo menos 2 caracteres")
    .max(100, "Nome não pode exceder 100 caracteres")
    .regex(/^[a-zA-ZÀ-ÿ\s]+$/, "Nome deve conter apenas letras e espaços"),
  description: z.string()
    .max(500, "Descrição não pode exceder 500 caracteres")
    .optional()
});

export interface MemberType {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  _count?: {
    users: number;
    subscriptions: number;
  };
}

export interface CreateMemberTypeData {
  name: string;
  description?: string;
  is_active?: boolean;
  sort_order?: number;
}

export interface UpdateMemberTypeData extends CreateMemberTypeData {
  id: string;
}

export const useMemberTypes = () => {
  const { toast } = useToast();

  // Query simples para buscar tipos de membro (SEM LOGS PARA EVITAR LOOP)
  const { data: memberTypes = [], isLoading, error, refetch } = useSupabaseQuery(
    ['member-types'],
    async (): Promise<MemberType[]> => {
      const { data: types, error: typesError } = await supabase
        .from('member_types')
        .select('*')
        .eq('is_active', true)
        .neq('name', 'Administrador') // Excluir administrador - não é tipo de membro da convenção
        .order('sort_order', { ascending: true });
      
      if (typesError) throw typesError;
      
      return (types || []).map(type => ({
        ...type,
        _count: { users: 0, subscriptions: 0 }
      }));
    },
    {
      staleTime: 10 * 60 * 1000, // 10 minutos
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchInterval: false
    }
  ); 
 // Mutation para criar tipo de membro
  const createMemberType = useSupabaseMutation(
    async (data: CreateMemberTypeData) => {
      // Validar dados
      const validatedData = memberTypeSchema.parse(data);
      
      const { data: result, error } = await supabase
        .from('member_types')
        .insert({
          ...validatedData,
          is_active: data.is_active ?? true,
          sort_order: data.sort_order ?? 0
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          throw new Error('Já existe um tipo de membro com este nome');
        }
        throw new Error(`Erro ao criar tipo de membro: ${error.message}`);
      }

      return result;
    },
    {
      onSuccess: (data) => {
        toast({
          title: "Tipo de membro criado",
          description: `${data.name} foi criado com sucesso`,
        });
        refetch();
      },
      onError: (error) => {
        toast({
          title: "Erro ao criar tipo de membro",
          description: error.message,
          variant: "destructive",
        });
      }
    }
  );

  // Mutation para atualizar tipo de membro
  const updateMemberType = useSupabaseMutation(
    async (data: UpdateMemberTypeData) => {
      const { id, ...updateData } = data;
      const validatedData = memberTypeSchema.parse(updateData);
      
      const { data: result, error } = await supabase
        .from('member_types')
        .update({
          ...validatedData,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          throw new Error('Já existe um tipo de membro com este nome');
        }
        throw new Error(`Erro ao atualizar tipo de membro: ${error.message}`);
      }

      return result;
    },
    {
      onSuccess: (data) => {
        toast({
          title: "Tipo de membro atualizado",
          description: `${data.name} foi atualizado com sucesso`,
        });
        refetch();
      }
    }
  );

  // Mutation para deletar tipo de membro
  const deleteMemberType = useSupabaseMutation(
    async (id: string) => {
      // Buscar o tipo para verificar o nome
      const { data: memberType } = await supabase
        .from('member_types')
        .select('name')
        .eq('id', id)
        .single();

      if (!memberType) {
        throw new Error('Tipo de membro não encontrado');
      }

      // Verificar se há usuários associados usando o campo tipo_membro
      const { count: usersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('tipo_membro', memberType.name.toLowerCase());

      if (usersCount && usersCount > 0) {
        throw new Error(`Não é possível excluir este tipo pois há ${usersCount} usuário(s) associado(s)`);
      }

      // Verificar se há assinaturas associadas
      const { count: subscriptionsCount } = await supabase
        .from('user_subscriptions')
        .select('*', { count: 'exact', head: true })
        .eq('member_type_id', id);

      if (subscriptionsCount && subscriptionsCount > 0) {
        throw new Error(`Não é possível excluir este tipo pois há ${subscriptionsCount} assinatura(s) associada(s)`);
      }

      const { error } = await supabase
        .from('member_types')
        .delete()
        .eq('id', id);

      if (error) {
        throw new Error(`Erro ao excluir tipo de membro: ${error.message}`);
      }

      return id;
    },
    {
      onSuccess: () => {
        toast({
          title: "Tipo de membro excluído",
          description: "Tipo de membro foi excluído com sucesso",
        });
        refetch();
      }
    }
  );

  // Função para obter tipos ativos para dropdowns
  const getActiveTypes = () => {
    return memberTypes.filter(type => type.is_active);
  };

  // Função para fallback com tipos hardcoded (compatibilidade)
  const getTypesWithFallback = () => {
    if (memberTypes.length > 0) {
      return memberTypes;
    }
    
    // Fallback para tipos hardcoded existentes (SEM ADMINISTRADOR - não é tipo de membro da convenção)
    return [
      { id: 'pastor', name: 'Pastor', description: 'Pastor titular ou auxiliar', is_active: true },
      { id: 'evangelista', name: 'Evangelista', description: 'Ministro evangelista', is_active: true },
      { id: 'presbitero', name: 'Presbítero', description: 'Presbítero da igreja', is_active: true },
      { id: 'diacono', name: 'Diácono', description: 'Diácono da igreja', is_active: true },
      { id: 'membro', name: 'Membro', description: 'Membro regular da convenção', is_active: true }
    ] as MemberType[];
  };

  return {
    memberTypes,
    isLoading,
    error,
    refetch,
    createMemberType,
    updateMemberType,
    deleteMemberType,
    getActiveTypes,
    getTypesWithFallback
  };
};