
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useSupabaseQuery = (
  queryKey: string[],
  queryFn: () => Promise<any>,
  options?: any
) => {
  return useQuery({
    queryKey,
    queryFn,
    ...options,
  });
};

export const useSupabaseMutation = (
  mutationFn: (variables: any) => Promise<any>,
  options?: {
    onSuccess?: (data: any, variables: any) => void;
    onError?: (error: any) => void;
    successMessage?: string;
    errorMessage?: string;
    invalidateQueries?: string[][];
  }
) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onSuccess: (data, variables) => {
      if (options?.successMessage) {
        toast({
          title: "Sucesso",
          description: options.successMessage,
        });
      }
      
      // Invalidar queries específicas se fornecidas
      if (options?.invalidateQueries) {
        options.invalidateQueries.forEach(queryKey => {
          queryClient.invalidateQueries({ queryKey });
        });
      } else {
        // Invalidar todas as queries como fallback
        queryClient.invalidateQueries();
      }
      
      options?.onSuccess?.(data, variables);
    },
    onError: (error: any) => {
      console.error('Mutation error:', error);
      toast({
        title: "Erro",
        description: options?.errorMessage || error.message || "Ocorreu um erro inesperado",
        variant: "destructive",
      });
      options?.onError?.(error);
    },
  });
};
