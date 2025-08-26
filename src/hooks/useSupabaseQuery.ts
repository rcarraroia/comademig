
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useCallback } from 'react';

export const useSupabaseQuery = (
  queryKey: string[],
  queryFn: () => Promise<any>,
  options?: any
) => {
  return useQuery({
    queryKey,
    queryFn,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (renamed from cacheTime)
    refetchOnWindowFocus: false,
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
  }
) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleSuccess = useCallback((data: any, variables: any) => {
    if (options?.successMessage) {
      toast({
        title: "Sucesso",
        description: options.successMessage,
      });
    }
    options?.onSuccess?.(data, variables);
    queryClient.invalidateQueries();
  }, [options, toast, queryClient]);

  const handleError = useCallback((error: any) => {
    console.error('Mutation error:', error);
    toast({
      title: "Erro",
      description: options?.errorMessage || error.message || "Ocorreu um erro inesperado",
      variant: "destructive",
    });
    options?.onError?.(error);
  }, [options, toast]);

  return useMutation({
    mutationFn,
    onSuccess: handleSuccess,
    onError: handleError,
  });
};
