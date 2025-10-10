import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Tipos
export interface SplitConfiguration {
  id: string;
  category: string;
  category_label: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SplitRecipient {
  id: string;
  configuration_id: string;
  recipient_type: 'fixed' | 'dynamic';
  recipient_name: string;
  recipient_identifier: string;
  wallet_id: string | null;
  percentage: number;
  sort_order: number;
  created_at: string;
}

export interface SplitConfigurationWithRecipients extends SplitConfiguration {
  recipients: SplitRecipient[];
}

export interface CreateConfigurationData {
  category: string;
  category_label: string;
  description?: string;
  is_active?: boolean;
}

export interface CreateRecipientData {
  configuration_id: string;
  recipient_type: 'fixed' | 'dynamic';
  recipient_name: string;
  recipient_identifier: string;
  wallet_id?: string;
  percentage: number;
  sort_order?: number;
}

/**
 * Hook para gerenciar configurações de split de pagamentos
 */
export function useSplitConfiguration() {
  const queryClient = useQueryClient();

  // Buscar todas as configurações
  const { data: configurations, isLoading: isLoadingConfigurations } = useQuery({
    queryKey: ['split-configurations'],
    queryFn: async (): Promise<SplitConfiguration[]> => {
      const { data, error } = await supabase
        .from('split_configurations')
        .select('*')
        .order('category');

      if (error) {
        console.error('Error fetching split configurations:', error);
        throw new Error('Erro ao buscar configurações de split');
      }

      return data || [];
    },
  });

  // Buscar configuração por categoria
  const getConfigurationByCategory = (category: string) => {
    return useQuery({
      queryKey: ['split-configuration', category],
      queryFn: async (): Promise<SplitConfigurationWithRecipients | null> => {
        // Buscar configuração
        const { data: config, error: configError } = await supabase
          .from('split_configurations')
          .select('*')
          .eq('category', category)
          .single();

        if (configError) {
          if (configError.code === 'PGRST116') {
            return null; // Não encontrado
          }
          console.error('Error fetching configuration:', configError);
          throw new Error('Erro ao buscar configuração');
        }

        // Buscar beneficiários
        const { data: recipients, error: recipientsError } = await supabase
          .from('split_recipients')
          .select('*')
          .eq('configuration_id', config.id)
          .order('sort_order');

        if (recipientsError) {
          console.error('Error fetching recipients:', recipientsError);
          throw new Error('Erro ao buscar beneficiários');
        }

        return {
          ...config,
          recipients: (recipients || []) as SplitRecipient[],
        };
      },
      enabled: !!category,
    });
  };

  // Buscar beneficiários de uma configuração
  const getRecipientsByConfiguration = (configurationId: string) => {
    return useQuery({
      queryKey: ['split-recipients', configurationId],
      queryFn: async (): Promise<SplitRecipient[]> => {
        const { data, error } = await supabase
          .from('split_recipients')
          .select('*')
          .eq('configuration_id', configurationId)
          .order('sort_order');

        if (error) {
          console.error('Error fetching recipients:', error);
          throw new Error('Erro ao buscar beneficiários');
        }

        return (data || []) as SplitRecipient[];
      },
      enabled: !!configurationId,
    });
  };

  // Criar nova configuração
  const createConfiguration = useMutation({
    mutationFn: async (data: CreateConfigurationData) => {
      const { data: result, error } = await supabase
        .from('split_configurations')
        .insert({
          category: data.category,
          category_label: data.category_label,
          description: data.description || null,
          is_active: data.is_active ?? true,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating configuration:', error);
        throw new Error(error.message || 'Erro ao criar configuração');
      }

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['split-configurations'] });
      toast.success('Configuração criada com sucesso!');
    },
    onError: (error: any) => {
      console.error('Create configuration error:', error);
      toast.error(error.message || 'Erro ao criar configuração');
    },
  });

  // Atualizar configuração
  const updateConfiguration = useMutation({
    mutationFn: async (data: { id: string; updates: Partial<CreateConfigurationData> }) => {
      const { data: result, error } = await supabase
        .from('split_configurations')
        .update(data.updates)
        .eq('id', data.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating configuration:', error);
        throw new Error(error.message || 'Erro ao atualizar configuração');
      }

      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['split-configurations'] });
      queryClient.invalidateQueries({ queryKey: ['split-configuration'] });
      toast.success('Configuração atualizada com sucesso!');
    },
    onError: (error: any) => {
      console.error('Update configuration error:', error);
      toast.error(error.message || 'Erro ao atualizar configuração');
    },
  });

  // Deletar configuração
  const deleteConfiguration = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('split_configurations')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting configuration:', error);
        throw new Error(error.message || 'Erro ao deletar configuração');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['split-configurations'] });
      toast.success('Configuração deletada com sucesso!');
    },
    onError: (error: any) => {
      console.error('Delete configuration error:', error);
      toast.error(error.message || 'Erro ao deletar configuração');
    },
  });

  // Criar beneficiário
  const createRecipient = useMutation({
    mutationFn: async (data: CreateRecipientData) => {
      const { data: result, error } = await supabase
        .from('split_recipients')
        .insert({
          configuration_id: data.configuration_id,
          recipient_type: data.recipient_type,
          recipient_name: data.recipient_name,
          recipient_identifier: data.recipient_identifier,
          wallet_id: data.wallet_id || null,
          percentage: data.percentage,
          sort_order: data.sort_order ?? 0,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating recipient:', error);
        throw new Error(error.message || 'Erro ao criar beneficiário');
      }

      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['split-recipients', variables.configuration_id] });
      queryClient.invalidateQueries({ queryKey: ['split-configuration'] });
      toast.success('Beneficiário adicionado com sucesso!');
    },
    onError: (error: any) => {
      console.error('Create recipient error:', error);
      toast.error(error.message || 'Erro ao adicionar beneficiário');
    },
  });

  // Atualizar beneficiário
  const updateRecipient = useMutation({
    mutationFn: async (data: { id: string; updates: Partial<CreateRecipientData> }) => {
      const { data: result, error } = await supabase
        .from('split_recipients')
        .update(data.updates)
        .eq('id', data.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating recipient:', error);
        throw new Error(error.message || 'Erro ao atualizar beneficiário');
      }

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['split-recipients'] });
      queryClient.invalidateQueries({ queryKey: ['split-configuration'] });
      toast.success('Beneficiário atualizado com sucesso!');
    },
    onError: (error: any) => {
      console.error('Update recipient error:', error);
      toast.error(error.message || 'Erro ao atualizar beneficiário');
    },
  });

  // Deletar beneficiário
  const deleteRecipient = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('split_recipients')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting recipient:', error);
        throw new Error(error.message || 'Erro ao deletar beneficiário');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['split-recipients'] });
      queryClient.invalidateQueries({ queryKey: ['split-configuration'] });
      toast.success('Beneficiário removido com sucesso!');
    },
    onError: (error: any) => {
      console.error('Delete recipient error:', error);
      toast.error(error.message || 'Erro ao remover beneficiário');
    },
  });

  // Validar percentuais de uma configuração
  const validatePercentages = (recipients: SplitRecipient[]): boolean => {
    const total = recipients.reduce((sum, r) => sum + r.percentage, 0);
    return Math.abs(total - 100) < 0.01; // Tolerância para erros de ponto flutuante
  };

  // Calcular valores de split baseado na configuração
  const calculateSplitValues = (
    totalValue: number,
    recipients: SplitRecipient[]
  ): Array<{ recipient: SplitRecipient; amount: number }> => {
    return recipients.map((recipient) => ({
      recipient,
      amount: (totalValue * recipient.percentage) / 100,
    }));
  };

  return {
    // Queries
    configurations,
    isLoadingConfigurations,
    getConfigurationByCategory,
    getRecipientsByConfiguration,

    // Mutations - Configurações
    createConfiguration,
    updateConfiguration,
    deleteConfiguration,

    // Mutations - Beneficiários
    createRecipient,
    updateRecipient,
    deleteRecipient,

    // Utilities
    validatePercentages,
    calculateSplitValues,

    // Loading states
    isCreatingConfiguration: createConfiguration.isPending,
    isUpdatingConfiguration: updateConfiguration.isPending,
    isDeletingConfiguration: deleteConfiguration.isPending,
    isCreatingRecipient: createRecipient.isPending,
    isUpdatingRecipient: updateRecipient.isPending,
    isDeletingRecipient: deleteRecipient.isPending,
  };
}
